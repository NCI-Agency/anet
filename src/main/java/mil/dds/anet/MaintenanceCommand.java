package mil.dds.anet;

import static mil.dds.anet.utils.PendingAssessmentsHelper.NOTE_PERIOD_START;
import static mil.dds.anet.utils.PendingAssessmentsHelper.NOTE_RECURRENCE;
import static mil.dds.anet.utils.PendingAssessmentsHelper.PRINCIPAL_PERSON_ASSESSMENTS;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.dropwizard.Application;
import io.dropwizard.cli.EnvironmentCommand;
import io.dropwizard.setup.Environment;
import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Note.NoteType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.PendingAssessmentsHelper.AssessmentDates;
import mil.dds.anet.utils.PendingAssessmentsHelper.Recurrence;
import mil.dds.anet.utils.Utils;
import net.sourceforge.argparse4j.impl.Arguments;
import net.sourceforge.argparse4j.inf.Namespace;
import net.sourceforge.argparse4j.inf.Subparser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MaintenanceCommand extends EnvironmentCommand<AnetConfiguration> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final ObjectMapper mapper = MapperUtils.getDefaultMapper();

  public MaintenanceCommand(Application<AnetConfiguration> application) {
    super(application, "maintenance", "Various helpful maintenance commands for the ANET Database");
  }

  @Override
  public void configure(Subparser subparser) {
    subparser.addArgument("-ceb", "--clearEmptyBiographies").action(Arguments.storeTrue())
        .required(false).help(
            "Clears empty biographies (blank or empty HTML tags) by replacing them with a NULL value");
    subparser.addArgument("-ddn", "--deleteDanglingNotes").action(Arguments.storeTrue())
        .required(false)
        .help("Delete dangling notes (either report assessments for reports that have been deleted,"
            + " or notes pointing to objects that no longer exist)");
    subparser.addArgument("-mpa", "--migratePartnerAssessments").action(Arguments.storeTrue())
        .required(false)
        .help("Migrate old-style partner assessments to new-style periodic assessments");

    super.configure(subparser);
  }

  @Override
  protected void run(Environment environment, Namespace namespace, AnetConfiguration configuration)
      throws Exception {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();

    if (Boolean.TRUE.equals(namespace.getBoolean("clearEmptyBiographies"))) {
      clearEmptyBiographies(engine);
    }

    if (Boolean.TRUE.equals(namespace.getBoolean("deleteDanglingNotes"))) {
      deleteDanglingNotes(engine);
    }

    if (Boolean.TRUE.equals(namespace.getBoolean("migratePartnerAssessments"))) {
      migratePartnerAssessments(engine, configuration);
    }

    if (!configuration.isTestMode()) {
      // Only exit when not in testMode, or the Command tests won't run
      System.exit(0);
    }
  }

  private void clearEmptyBiographies(AnetObjectEngine engine) {
    logger.info("Clearing empty biographies");
    engine.getPersonDao().clearEmptyBiographies();
  }

  private void deleteDanglingNotes(AnetObjectEngine engine) {
    logger.info("Deleting dangling assessments and notes");
    engine.getNoteDao().deleteDanglingNotes();
  }

  private void migratePartnerAssessments(final AnetObjectEngine engine,
      final AnetConfiguration configuration) {
    logger.info("Migrating old-style partner assessments");
    final Map<String, Object> assessmentConfig = getAssessmentConfig(configuration);
    final String recurrence = getAssessmentRecurrence(assessmentConfig);
    final Set<String> questions = getAssessmentQuestions(assessmentConfig);
    // Cache the people we've already seen to reduce the number of database loads
    final Map<String, Person> seenPeople = new HashMap<>();
    final Map<Position, Set<Position>> advisorCounterparts = new HashMap<>();
    final Map<String, Object> context = engine.getContext();

    final NoteDao noteDao = engine.getNoteDao();
    for (final Note note : getPartnerAssessmentNotes(noteDao)) {
      final JsonNode partnerAssessment;
      try {
        partnerAssessment = Utils.parseJsonSafe(note.getText());
      } catch (JsonProcessingException e) {
        logger.error("Invalid JSON in note {}, leaving note as-is for later inspection", note);
        continue;
      }

      if (partnerAssessment == null || !partnerAssessment.isObject()) {
        logger.error("Can't handle note {}, leaving note as-is for later inspection", note);
        continue;
      }

      final ObjectNode objectNode = (ObjectNode) partnerAssessment;
      for (final Iterator<Map.Entry<String, JsonNode>> entryIter = objectNode.fields(); entryIter
          .hasNext();) {
        final Map.Entry<String, JsonNode> entry = entryIter.next();
        if (!entry.getValue().isValueNode() || !questions.contains(entry.getKey())) {
          // Unknown prop, remove
          logger.warn("Removing unknown prop {} from note {}", entry.getKey(), note);
          entryIter.remove();
        }
      }

      try {
        // Update the note with the new data
        objectNode.put(NOTE_RECURRENCE, recurrence);
        objectNode.put(NOTE_PERIOD_START, getPeriodStart(recurrence, note.getCreatedAt()));
        note.setText(mapper.writeValueAsString(objectNode));
        note.setType(NoteType.ASSESSMENT);
        noteDao.updateNoteTypeAndText(note);

        // Update the list of position associations
        final Person author =
            seenPeople.computeIfAbsent(note.getAuthorUuid(), k -> note.loadAuthor(context).join());
        final Position authorPosition =
            findHistoricalPosition(context, author, note.getCreatedAt());
        if (authorPosition != null) {
          final Set<Person> assessedPeople =
              note.loadNoteRelatedObjects(context).join().stream()
                  .filter(nro -> PersonDao.TABLE_NAME.equals(nro.getRelatedObjectType()))
                  .map(nro -> seenPeople.computeIfAbsent(nro.getRelatedObjectUuid(),
                      k -> (Person) nro.loadRelatedObject(context).join()))
                  .collect(Collectors.toSet());
          for (final Person assessedPerson : assessedPeople) {
            final Position assessedPosition =
                findHistoricalPosition(context, assessedPerson, note.getCreatedAt());
            if (assessedPosition != null) {
              advisorCounterparts.compute(authorPosition, (k, v) -> {
                if (v == null) {
                  v = new HashSet<>();
                }
                v.add(assessedPosition);
                return v;
              });
            }
          }
        }
      } catch (JsonProcessingException e) {
        logger.error("Can't update JSON of note {}, leaving note as-is for later inspection", note);
      }
    }

    final PositionDao positionDao = engine.getPositionDao();
    for (final Map.Entry<Position, Set<Position>> entry : advisorCounterparts.entrySet()) {
      final Position advisorPosition = entry.getKey();
      final Set<Position> principalPositions = entry.getValue();
      final Set<String> existingUuids = advisorPosition.loadAssociatedPositions(context).join()
          .stream().map(p -> p.getUuid()).collect(Collectors.toSet());
      for (final Position principalPosition : principalPositions) {
        if (!existingUuids.contains(DaoUtils.getUuid(principalPosition))) {
          positionDao.associatePosition(DaoUtils.getUuid(advisorPosition),
              DaoUtils.getUuid(principalPosition));
          AnetAuditLogger.log(
              "Position {} has new association {},"
                  + " added by maintenance command migratePartnerAssessments",
              advisorPosition, principalPosition);
        }
      }
    }

    final List<Note> remainingPartnerAssessmentNotes = getPartnerAssessmentNotes(noteDao);
    if (remainingPartnerAssessmentNotes.isEmpty()) {
      logger.info("Migrated all old-style partner assessments");
    } else {
      final int nr = remainingPartnerAssessmentNotes.size();
      logger.warn(nr == 1 ? "The following old-style partner assessment was not migrated:"
          : "The following {} old-style partner assessments were not migrated:", nr);
      for (final Note note : remainingPartnerAssessmentNotes) {
        logger.warn("- note {}", note);
      }
    }
  }

  private Position findHistoricalPosition(final Map<String, Object> context, final Person person,
      final Instant assessmentTime) {
    final List<PersonPositionHistory> positionHistory =
        person.loadPreviousPositions(context).join();
    for (final PersonPositionHistory pph : positionHistory) {
      if (pph.getStartTime() != null && !assessmentTime.isBefore(pph.getStartTime())
          && (pph.getEndTime() == null || !assessmentTime.isAfter(pph.getEndTime()))) {
        // Person's position at the time of assessment
        final Position position = pph.loadPosition(context).join();
        // If still active, return it, else return null
        return Position.Status.ACTIVE.equals(position.getStatus()) ? position : null;
      }
    }
    return null;
  }

  private List<Note> getPartnerAssessmentNotes(final NoteDao noteDao) {
    return noteDao.getNotesByType(NoteType.PARTNER_ASSESSMENT);
  }

  private Map<String, Object> getAssessmentConfig(final AnetConfiguration configuration) {
    @SuppressWarnings("unchecked")
    final List<Map<String, Object>> assessmentsConfig =
        (List<Map<String, Object>>) configuration.getDictionaryEntry(PRINCIPAL_PERSON_ASSESSMENTS);
    if (assessmentsConfig != null) {
      for (final Map<String, Object> assessmentConfig : assessmentsConfig) {
        // Find the first recurring assessment definition
        final String recurrence = getAssessmentRecurrence(assessmentConfig);
        if (!"once".equals(recurrence)) {
          logger.info("Will change partner assessments to {} periodic assessments", recurrence);
          return assessmentConfig;
        }
      }
    }
    throw new IllegalArgumentException(
        "No recurring assessment definition found in the dictionary under \""
            + PRINCIPAL_PERSON_ASSESSMENTS + "\"");
  }

  private String getAssessmentRecurrence(final Map<String, Object> assessmentConfig) {
    return (String) assessmentConfig.get("recurrence");
  }

  private Set<String> getAssessmentQuestions(final Map<String, Object> assessmentConfig) {
    @SuppressWarnings("unchecked")
    final Map<String, Object> questions = (Map<String, Object>) assessmentConfig.get("questions");
    return new HashSet<>(questions.keySet());
  }

  public static String getPeriodStart(final String recurrence, final Instant instant) {
    final AssessmentDates assessmentDates =
        new AssessmentDates(instant, Recurrence.valueOfRecurrence(recurrence));
    return DateTimeFormatter.ISO_LOCAL_DATE
        .format(assessmentDates.getNotificationDate().atZone(DaoUtils.getServerNativeZoneId()));
  }
}
