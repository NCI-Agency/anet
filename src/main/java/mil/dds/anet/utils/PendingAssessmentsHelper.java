package mil.dds.anet.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import graphql.GraphQLContext;
import java.lang.invoke.MethodHandles;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoField;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjuster;
import java.time.temporal.TemporalAdjusters;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Note.NoteType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.emails.PendingAssessmentsNotificationEmail;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PendingAssessmentsHelper {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // Recurrence types that we support
  public enum Recurrence {
    DAILY("daily"), WEEKLY("weekly"), BIWEEKLY("biweekly"), SEMIMONTHLY("semimonthly"),
    MONTHLY("monthly"), QUARTERLY("quarterly"), SEMIANNUALLY("semiannually"), ANNUALLY("annually");

    private final String recurrence;

    Recurrence(final String recurrence) {
      this.recurrence = recurrence;
    }

    @Override
    public String toString() {
      return recurrence;
    }

    public static Recurrence valueOfRecurrence(final String recurrence) {
      for (final Recurrence v : values()) {
        if (v.recurrence.equalsIgnoreCase(recurrence)) {
          return v;
        }
      }
      return null;
    }
  }

  /**
   * Given a reference date and a recurrence, compute: the assessment date of the most recent
   * completed assessment period, the date a notification should be sent, and the date a reminder
   * should be sent.
   */
  public static class AssessmentDates {
    private final ZonedDateTime assessmentDate;
    private final ZonedDateTime notificationDate;
    private final ZonedDateTime reminderDate;

    public AssessmentDates(final Instant referenceDate, final Recurrence recurrence) {
      // Compute some period boundaries
      final ZonedDateTime zonefulReferenceDate =
          referenceDate.atZone(DaoUtils.getServerNativeZoneId());
      final ZonedDateTime bod = zonefulReferenceDate.truncatedTo(ChronoUnit.DAYS);
      // Monday is the first day of the week
      final TemporalAdjuster firstDayOfWeek = TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY);
      final ZonedDateTime bow =
          zonefulReferenceDate.with(firstDayOfWeek).truncatedTo(ChronoUnit.DAYS);
      // Bi-weekly reference date is first Monday of 2021
      final ZonedDateTime biWeeklyReferenceDate = LocalDate.of(2021, 1, 4).with(firstDayOfWeek)
          .atStartOfDay(DaoUtils.getServerNativeZoneId()).toInstant()
          .atZone(DaoUtils.getServerNativeZoneId());
      final ZonedDateTime bom = zonefulReferenceDate.with(TemporalAdjusters.firstDayOfMonth())
          .truncatedTo(ChronoUnit.DAYS);
      final ZonedDateTime boy = zonefulReferenceDate.with(TemporalAdjusters.firstDayOfYear())
          .truncatedTo(ChronoUnit.DAYS);
      final int moyLessOne = zonefulReferenceDate.get(ChronoField.MONTH_OF_YEAR) - 1;

      switch (recurrence) {
        case DAILY -> {
          notificationDate = bod;
          assessmentDate = notificationDate.minus(1, ChronoUnit.DAYS);
          reminderDate = null; // no reminders
        }
        case WEEKLY -> {
          notificationDate = bow;
          assessmentDate = notificationDate.minus(1, ChronoUnit.WEEKS);
          reminderDate = notificationDate.plus(3, ChronoUnit.DAYS);
        }
        case BIWEEKLY -> {
          notificationDate = bow.minus(
              Math.abs(ChronoUnit.WEEKS.between(biWeeklyReferenceDate, bow)) % 2, ChronoUnit.WEEKS);
          assessmentDate = notificationDate.minus(2, ChronoUnit.WEEKS);
          reminderDate = notificationDate.plus(5, ChronoUnit.DAYS);
        }
        case SEMIMONTHLY -> { // two per month: [1 - 14] and [15 - end-of-month]
          final int daysInFirstPeriod = 14;
          if (zonefulReferenceDate.get(ChronoField.DAY_OF_MONTH) <= daysInFirstPeriod) {
            notificationDate = bom;
            assessmentDate =
                bom.minus(1, ChronoUnit.MONTHS).plus(daysInFirstPeriod, ChronoUnit.DAYS);
          } else {
            notificationDate = bom.plus(daysInFirstPeriod, ChronoUnit.DAYS);
            assessmentDate = bom;
          }
          reminderDate = notificationDate.plus(5, ChronoUnit.DAYS);
        }
        case MONTHLY -> {
          notificationDate = bom;
          assessmentDate = notificationDate.minus(1, ChronoUnit.MONTHS);
          reminderDate = notificationDate.plus(1, ChronoUnit.WEEKS);
        }
        case QUARTERLY -> {
          final long monthsInQuarter = 3;
          final long q = moyLessOne / monthsInQuarter;
          notificationDate = boy.plus(q * monthsInQuarter, ChronoUnit.MONTHS);
          assessmentDate = notificationDate.minus(monthsInQuarter, ChronoUnit.MONTHS);
          reminderDate = notificationDate.plus(4, ChronoUnit.WEEKS);
        }
        case SEMIANNUALLY -> { // two per year: [Jan 1 - Jun 30] and [Jul 1 - Dec 31]
          final long monthsInHalfYear = 6;
          final long sa = moyLessOne / monthsInHalfYear;
          notificationDate = boy.plus(sa * monthsInHalfYear, ChronoUnit.MONTHS);
          assessmentDate = notificationDate.minus(monthsInHalfYear, ChronoUnit.MONTHS);
          reminderDate = notificationDate.plus(1, ChronoUnit.MONTHS);
        }
        case ANNUALLY -> {
          notificationDate = boy;
          assessmentDate = notificationDate.minus(1, ChronoUnit.YEARS);
          reminderDate = notificationDate.plus(1, ChronoUnit.MONTHS);
        }
        default -> {
          // Unknown recurrence
          logger.error("Unknown recurrence encountered: {}", recurrence);
          assessmentDate = null;
          notificationDate = null;
          reminderDate = null;
        }
      }
    }

    /**
     * @return the date of the most recent completed assessment period of the given recurrence
     *         before the given reference date
     */
    public Instant getAssessmentDate() {
      return getInstant(assessmentDate);
    }

    /**
     * @return the notification date for the assessment period of the given recurrence and the given
     *         reference date; may be <code>null</code> meaning: don't send notifications
     */
    public Instant getNotificationDate() {
      return getInstant(notificationDate);
    }

    /**
     * @return the reminder date for the assessment period of the given recurrence and the given
     *         reference date; may be <code>null</code> meaning: don't send reminders
     */
    public Instant getReminderDate() {
      return getInstant(reminderDate);
    }

    private Instant getInstant(final ZonedDateTime zonedDateTime) {
      return zonedDateTime == null ? null : zonedDateTime.toInstant();
    }

    @Override
    public String toString() {
      return "AssessmentDates [assessmentDate=" + assessmentDate + ", notificationDate="
          + notificationDate + ", reminderDate=" + reminderDate + "]";
    }
  }

  public record ObjectsToAssess(Set<Position> positionsToAssess, Set<Task> tasksToAssess) {
    public ObjectsToAssess(final Set<Position> positionsToAssess, final Set<Task> tasksToAssess) {
      this.positionsToAssess =
          new HashSet<>(positionsToAssess == null ? Collections.emptySet() : positionsToAssess);
      this.tasksToAssess =
          new HashSet<>(tasksToAssess == null ? Collections.emptySet() : tasksToAssess);
    }
  }

  // Dictionary lookup keys we use
  public static final String PERSON_ASSESSMENTS = "fields.regular.person.assessments";
  public static final String TASK_ASSESSMENTS = "fields.task.assessments";
  public static final String ASSESSMENT_RECURRENCE = "recurrence";
  // JSON fields in note.text we use
  public static final String NOTE_RECURRENCE = "__recurrence";
  public static final String NOTE_PERIOD_START = "__periodStart";

  private final AnetDictionary dict;
  private final PositionDao positionDao;
  private final TaskDao taskDao;

  public PendingAssessmentsHelper(final AnetDictionary dict) {
    this.dict = dict;
    this.positionDao = ApplicationContextProvider.getEngine().getPositionDao();
    this.taskDao = ApplicationContextProvider.getEngine().getTaskDao();
  }

  public CompletableFuture<Map<Position, ObjectsToAssess>> loadAll(final GraphQLContext context,
      final Instant now, final Instant lastRun, final boolean sendEmail) {
    final Set<Recurrence> recurrenceSet = getRecurrenceSet(now, lastRun);
    if (recurrenceSet.isEmpty()) {
      logger.debug("Nothing to do, now new recurrences since last run");
      return CompletableFuture.completedFuture(new HashMap<>());
    }

    // Look up periodic assessment definitions for people in the dictionary
    final Set<Recurrence> positionAssessmentRecurrence =
        getAssessmentRecurrence(recurrenceSet, PERSON_ASSESSMENTS);
    logger.trace("positionAssessmentRecurrence={}", positionAssessmentRecurrence);

    // Look up periodic assessment definitions for all tasks
    final Map<Task, Set<Recurrence>> taskAssessmentRecurrence = new HashMap<>();
    addTaskDefinitions(recurrenceSet, taskAssessmentRecurrence);
    logger.trace("taskAssessmentRecurrence={}", taskAssessmentRecurrence);

    // Prepare maps of positions and tasks linked to active advisor positions
    final Map<Position, ObjectsToAssess> objectsToAssessByPosition = new HashMap<>();
    return preparePositionAssessmentMap(context, positionAssessmentRecurrence,
        objectsToAssessByPosition).thenCompose(allPositionsToAssess -> {
          logger.trace("the following positions need to be checked for missing assessments: {}",
              allPositionsToAssess);
          return prepareTaskAssessmentMap(context, taskAssessmentRecurrence,
              objectsToAssessByPosition).thenCompose(allTasksToAssess -> {
                logger.trace("the following tasks need to be checked for missing assessments: {}",
                    allTasksToAssess);

                // First load person for each position, and filter out the inactive ones
                return filterPositionsToAssessOnPerson(context, allPositionsToAssess)
                    .thenCompose(b1 ->
                // Process the existing assessments for positions to assess
                processExistingAssessments(context, now, recurrenceSet, allPositionsToAssess)
                    .thenCompose(b2 ->
                // Process the existing assessments for tasks to assess
                processExistingAssessments(context, now, recurrenceSet, allTasksToAssess)
                    .thenCompose(b3 -> {
                      // Now filter out the ones that don't need assessments
                      filterObjectsToAssess(objectsToAssessByPosition, allPositionsToAssess,
                          allTasksToAssess);
                      // Load the people who should be included,
                      // and optionally receive a notification email
                      return loadPeopleToBeIncluded(context, objectsToAssessByPosition,
                          allPositionsToAssess, allTasksToAssess, sendEmail);
                    })));
              });
        });
  }

  private Set<Recurrence> getRecurrenceSet(final Instant now, final Instant lastRun) {
    final Set<Recurrence> recurrenceSet =
        Stream.of(Recurrence.values()).collect(Collectors.toSet());
    for (final Iterator<Recurrence> iter = recurrenceSet.iterator(); iter.hasNext();) {
      final Recurrence recurrence = iter.next();
      final AssessmentDates assessmentDates = new AssessmentDates(now, recurrence);
      // Note that if someone gets assigned a new counterpart or a new task, or the recurrence of
      // assessment definitions is changed, this means they may not be notified until the *next*
      // period.
      if (!shouldAssess(now, lastRun, assessmentDates)) {
        logger.debug("recurrence {} does not need checking since last run {}", recurrence, lastRun);
        iter.remove();
      }
    }
    return recurrenceSet;
  }

  private boolean shouldAssess(final Instant now, final Instant lastRun,
      final AssessmentDates assessmentDates) {
    return assessmentDates.getAssessmentDate() != null // no assessment
        && (shouldAssess(now, lastRun, assessmentDates.getNotificationDate())
            || shouldAssess(now, lastRun, assessmentDates.getReminderDate()));
  }

  private boolean shouldAssess(final Instant now, final Instant lastRun, final Instant date) {
    return date != null && (lastRun == null || date.isAfter(lastRun) && !date.isAfter(now));
  }

  private Set<Recurrence> getAssessmentRecurrence(final Set<Recurrence> recurrenceSet,
      final String keyPath) {
    final Set<Recurrence> assessmentRecurrence = new HashSet<>();
    @SuppressWarnings("unchecked")
    final Map<String, Map<String, Object>> assessmentDefinitions =
        (Map<String, Map<String, Object>>) dict.getDictionaryEntry(keyPath);
    if (assessmentDefinitions != null) {
      assessmentDefinitions.values().forEach(pad -> {
        // TODO: in principle, there can be more than one assessment definition for each recurrence,
        // so we should distinguish them here by key when we add that to the database.
        final Recurrence recurrence =
            Recurrence.valueOfRecurrence((String) pad.get(ASSESSMENT_RECURRENCE));
        if (shouldAddRecurrence(recurrenceSet, recurrence)) {
          assessmentRecurrence.add(recurrence);
        }
      });
    }
    return assessmentRecurrence;
  }

  private boolean shouldAddRecurrence(final Set<Recurrence> recurrenceSet,
      final Recurrence recurrence) {
    return recurrenceSet.contains(recurrence);
  }

  private void addTaskDefinitions(final Set<Recurrence> recurrenceSet,
      final Map<Task, Set<Recurrence>> taskAssessmentRecurrence) {
    // Look up periodic assessment definitions for all tasks in the dictionary
    final Set<Recurrence> assessmentRecurrence =
        getAssessmentRecurrence(recurrenceSet, TASK_ASSESSMENTS);

    if (!assessmentRecurrence.isEmpty()) {
      // Look up periodic assessment definitions for each active task
      final List<Task> tasks = getActiveTasks();
      tasks.forEach(t ->
      // Add all recurrence definitions for this task
      taskAssessmentRecurrence.computeIfAbsent(t, task -> new HashSet<>(assessmentRecurrence)));
    }
  }

  private CompletableFuture<Map<Position, Set<Recurrence>>> preparePositionAssessmentMap(
      final GraphQLContext context, final Set<Recurrence> positionAssessmentRecurrence,
      final Map<Position, ObjectsToAssess> objectsToAssessByPosition) {
    final Map<Position, Set<Recurrence>> allPositionsToAssess = new HashMap<>();
    final CompletableFuture<?>[] allFutures = getActivePositions(true).stream()
        .map(p -> getPositionsToAssess(context, p, positionAssessmentRecurrence)
            .thenApply(positionsToAssess -> {
              if (!positionsToAssess.isEmpty()) {
                positionsToAssess.forEach(pta -> allPositionsToAssess.put(pta,
                    new HashSet<>(positionAssessmentRecurrence)));
                objectsToAssessByPosition.put(p, new ObjectsToAssess(positionsToAssess, null));
              }
              return null;
            }))
        .toArray(CompletableFuture<?>[]::new);
    // Wait for our futures to complete before returning
    return CompletableFuture.allOf(allFutures)
        .thenCompose(v -> CompletableFuture.completedFuture(allPositionsToAssess));
  }

  private CompletableFuture<Map<Task, Set<Recurrence>>> prepareTaskAssessmentMap(
      final GraphQLContext context, final Map<Task, Set<Recurrence>> taskAssessmentRecurrence,
      final Map<Position, ObjectsToAssess> objectsToAssessByPosition) {
    final List<Position> activeAdvisors = getActivePositions(false);
    final Map<Task, Set<Recurrence>> allTasksToAssess = new HashMap<>();
    final CompletableFuture<?>[] allFutures =
        taskAssessmentRecurrence.entrySet().stream().map(e -> {
          final Task taskToAssess = e.getKey();
          final Set<Recurrence> recurrenceSet = e.getValue();
          return taskToAssess.loadResponsiblePositions(context).thenApply(positions -> {
            // Only active advisors can assess
            final Set<Position> positionsToAssess =
                positions.stream().filter(activeAdvisors::contains).collect(Collectors.toSet());
            if (!positionsToAssess.isEmpty()) {
              allTasksToAssess.put(taskToAssess, recurrenceSet);
              positionsToAssess
                  .forEach(pta -> objectsToAssessByPosition.compute(pta, (pos, currentValue) -> {
                    if (currentValue == null) {
                      return new ObjectsToAssess(null, Collections.singleton(taskToAssess));
                    } else {
                      currentValue.tasksToAssess().add(taskToAssess);
                      return currentValue;
                    }
                  }));
            }
            return null;
          });
        }).toArray(CompletableFuture<?>[]::new);
    // Wait for our futures to complete before returning
    return CompletableFuture.allOf(allFutures)
        .thenCompose(v -> CompletableFuture.completedFuture(allTasksToAssess));
  }

  private List<Position> getActivePositions(final boolean withCounterparts) {
    // Get all active, filled positions, possibly with counterparts
    final PositionSearchQuery psq = new PositionSearchQuery();
    psq.setPageSize(0);
    psq.setStatus(Position.Status.ACTIVE);
    psq.setIsFilled(Boolean.TRUE);
    if (withCounterparts) {
      psq.setHasCounterparts(Boolean.TRUE);
    }
    return positionDao.search(psq).getList();
  }

  private List<Task> getActiveTasks() {
    // Get all active tasks with a non-empty customFields
    final TaskSearchQuery tsq = new TaskSearchQuery();
    tsq.setPageSize(0);
    tsq.setStatus(Position.Status.ACTIVE);
    return taskDao.search(tsq).getList();
  }

  private CompletableFuture<Set<Position>> getPositionsToAssess(final GraphQLContext context,
      final Position position, final Set<Recurrence> personAssessmentRecurrence) {
    if (position == null || personAssessmentRecurrence.isEmpty()) {
      return CompletableFuture.completedFuture(Collections.emptySet());
    } else {
      return position.loadAssociatedPositions(context).thenApply(ap -> ap.stream()
          .filter(pp -> Position.Status.ACTIVE.equals(pp.getStatus())).collect(Collectors.toSet()));
    }
  }

  private CompletableFuture<Boolean> filterPositionsToAssessOnPerson(final GraphQLContext context,
      final Map<Position, Set<Recurrence>> allPositionsToAssess) {
    // Load person for each position
    final CompletableFuture<?>[] allFutures = allPositionsToAssess.keySet().stream()
        .map(p -> p.loadPerson(context)).toArray(CompletableFuture<?>[]::new);
    // Wait for our futures to complete before returning
    return CompletableFuture.allOf(allFutures).thenCompose(v -> {
      // Remove inactive people
      allPositionsToAssess.keySet().removeIf(
          p -> p.getPerson() == null || !Person.Status.ACTIVE.equals(p.getPerson().getStatus()));
      return CompletableFuture.completedFuture(true);
    });
  }

  private CompletableFuture<Boolean> processExistingAssessments(final GraphQLContext context,
      final Instant now, final Set<Recurrence> recurrenceSet,
      final Map<? extends AbstractCustomizableAnetBean, Set<Recurrence>> objectsToAssess) {
    final CompletableFuture<?>[] allFutures = objectsToAssess.entrySet().stream().map(e -> {
      final AbstractCustomizableAnetBean entryKey = e.getKey();
      final Set<Recurrence> periods = e.getValue();
      // For positions, the current person holding it gets assessed (otherwise the object itself)
      final AbstractCustomizableAnetBean ota =
          entryKey instanceof Position pos ? pos.getPerson() : entryKey;
      return ota.loadNotes(context).thenApply(notes -> {
        final Map<Recurrence, Instant> assessmentsByRecurrence = new EnumMap<>(Recurrence.class);
        notes.stream().filter(note -> NoteType.ASSESSMENT.equals(note.getType())).forEach(note -> {
          try {
            final JsonNode noteJson = Utils.parseJsonSafe(note.getText());
            final JsonNode recurrence = noteJson.get(NOTE_RECURRENCE);
            final JsonNode periodStart = noteJson.get(NOTE_PERIOD_START);
            if (periodStart != null && recurrence != null && shouldAddRecurrence(recurrenceSet,
                Recurrence.valueOfRecurrence(recurrence.asText()))) {
              // __periodStart is stored in the database as a zone-agnostic date string yyyy-mm-dd
              final LocalDate periodStartDate =
                  DateTimeFormatter.ISO_LOCAL_DATE.parse(periodStart.asText(), LocalDate::from);
              final Instant periodStartInstant =
                  periodStartDate.atStartOfDay(DaoUtils.getServerNativeZoneId()).toInstant();
              assessmentsByRecurrence.compute(Recurrence.valueOfRecurrence(recurrence.asText()),
                  (r, currentValue) -> currentValue == null ? periodStartInstant
                      : periodStartInstant.isAfter(currentValue) ? periodStartInstant
                          : currentValue);
            }
          } catch (JsonProcessingException ignored) {
            // Invalid JSON, skip it
          }
        });
        assessmentsByRecurrence.forEach((recurrence, lastAssessment) -> {
          final AssessmentDates assessmentDates = new AssessmentDates(now, recurrence);
          if (assessmentDates.getAssessmentDate() == null
              || !lastAssessment.isBefore(assessmentDates.getAssessmentDate())) {
            // Assessment already done
            logger.trace("{} assessment for {} already done on {}", recurrence, ota,
                lastAssessment);
            periods.remove(recurrence);
          }
        });
        return null;
      });
    }).toArray(CompletableFuture<?>[]::new);
    // Wait for our futures to complete before returning
    return CompletableFuture.allOf(allFutures)
        .thenCompose(v -> CompletableFuture.completedFuture(true));
  }

  private void filterObjectsToAssess(final Map<Position, ObjectsToAssess> objectsToAssessByPosition,
      final Map<Position, Set<Recurrence>> allPositionsToAssess,
      final Map<Task, Set<Recurrence>> allTasksToAssess) {
    for (final Iterator<Entry<Position, ObjectsToAssess>> otabpi =
        objectsToAssessByPosition.entrySet().iterator(); otabpi.hasNext();) {
      final Entry<Position, ObjectsToAssess> otabp = otabpi.next();
      final ObjectsToAssess ota = otabp.getValue();
      final Set<Position> positionsToAssess = ota.positionsToAssess();
      for (final Iterator<Position> ptai = positionsToAssess.iterator(); ptai.hasNext();) {
        final Position pta = ptai.next();
        if (!allPositionsToAssess.containsKey(pta) || allPositionsToAssess.get(pta).isEmpty()) {
          // Position/person does not need assessment
          logger.trace("person {} does not need assessments", pta.getPerson());
          ptai.remove();
        }
      }

      final Set<Task> tasksToAssess = ota.tasksToAssess();
      for (final Iterator<Task> ttai = tasksToAssess.iterator(); ttai.hasNext();) {
        final Task tta = ttai.next();
        if (!allTasksToAssess.containsKey(tta) || allTasksToAssess.get(tta).isEmpty()) {
          // Task does not need assessment
          logger.trace("task {} does not need assessments", tta);
          ttai.remove();
        }
      }

      if (positionsToAssess.isEmpty() && tasksToAssess.isEmpty()) {
        // Nothing to assess by this position
        logger.trace("position {} has no pending assessments", otabp.getKey());
        otabpi.remove();
      }
    }
  }

  private CompletableFuture<Map<Position, ObjectsToAssess>> loadPeopleToBeIncluded(
      final GraphQLContext context, final Map<Position, ObjectsToAssess> objectsToAssessByPosition,
      final Map<Position, Set<Recurrence>> allPositionsToAssess,
      final Map<Task, Set<Recurrence>> allTasksToAssess, final boolean sendEmail) {
    final Map<Position, ObjectsToAssess> includedObjectsToAssessByPosition = new HashMap<>();
    final CompletableFuture<?>[] allFutures =
        objectsToAssessByPosition.entrySet().stream().map(otabp -> {
          final Position pos = otabp.getKey();
          // Get the person to be notified
          return pos.loadPerson(context)
              .thenCompose(advisor -> advisor.loadEmailAddresses(context, null).thenCompose(l -> {
                if (!Boolean.TRUE.equals(advisor.getUser())) {
                  return CompletableFuture.completedFuture(null);
                }
                final ObjectsToAssess ota = otabp.getValue();
                includedObjectsToAssessByPosition.put(pos, ota);
                final Set<Position> positionsToAssess = ota.positionsToAssess();
                final Set<Task> tasksToAssess = ota.tasksToAssess();
                logger.info("advisor {} should do assessments:", advisor);
                positionsToAssess
                    .forEach(pta -> logger.info(" - {} for position {} held by person {}",
                        allPositionsToAssess.get(pta), pta, pta.getPerson()));
                tasksToAssess.forEach(
                    tta -> logger.info(" - {} for task {}", allTasksToAssess.get(tta), tta));
                if (sendEmail) {
                  sendEmail(advisor, positionsToAssess, tasksToAssess);
                }
                return CompletableFuture.completedFuture(null);
              }));
        }).toArray(CompletableFuture<?>[]::new);
    // Wait for our futures to complete before returning
    return CompletableFuture.allOf(allFutures)
        .thenCompose(v -> CompletableFuture.completedFuture(includedObjectsToAssessByPosition));
  }

  private void sendEmail(Person advisor, final Set<Position> positionsToAssess,
      final Set<Task> tasksToAssess) {
    final String address =
        advisor.getNotificationEmailAddress().map(EmailAddress::getAddress).orElse(null);
    if (Utils.isEmptyOrNull(address)) {
      logger.info("Person {} does not have an email address, not sending pending assessments email",
          advisor);
      return;
    }
    final AnetEmail email = new AnetEmail();
    final PendingAssessmentsNotificationEmail action = new PendingAssessmentsNotificationEmail();
    action.setAdvisor(advisor);
    action.setPositionsToAssess(positionsToAssess);
    action.setTasksToAssess(tasksToAssess);
    email.setAction(action);
    email.setToAddresses(List.of(address));
    AnetEmailWorker.sendEmailAsync(email);
  }

}
