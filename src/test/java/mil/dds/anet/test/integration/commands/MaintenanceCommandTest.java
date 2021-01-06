package mil.dds.anet.test.integration.commands;

import static mil.dds.anet.threads.PendingAssessmentsNotificationWorker.NOTE_PERIOD_START;
import static mil.dds.anet.threads.PendingAssessmentsNotificationWorker.NOTE_RECURRENCE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.ImmutableSet;
import io.dropwizard.Application;
import io.dropwizard.cli.Cli;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.util.JarLocation;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.MaintenanceCommand;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Note.NoteType;
import mil.dds.anet.beans.NoteRelatedObject;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.test.integration.utils.TestApp;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.utils.Utils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(TestApp.class)
public class MaintenanceCommandTest extends AbstractResourceTest {
  private static NoteDao noteDao;
  private static PositionDao positionDao;
  private static List<Note> testAssessments;

  @BeforeAll
  public static void setUpClass() throws Exception {
    noteDao = AnetObjectEngine.getInstance().getNoteDao();
    positionDao = AnetObjectEngine.getInstance().getPositionDao();
    testAssessments = createTestAssessments();
    final Application<AnetConfiguration> newApplication = TestApp.app.newApplication();
    final Bootstrap<AnetConfiguration> bootstrap = new Bootstrap<>(newApplication);
    newApplication.initialize(bootstrap);
    final Cli cli =
        new Cli(new JarLocation(newApplication.getClass()), bootstrap, System.out, System.err);
    cli.run("maintenance", "-mpa", "anet.yml");
  }

  @AfterAll
  public static void tearDownClass() throws Exception {
    deleteTestAssessments(testAssessments);
    // Delete Andrew's counterparts added by the tests
    deleteCounterparts(getAndrewAnderson());
  }

  @Test
  public void testPartnerAssessments() throws Exception {
    final List<Note> remainingPartnerAssessments =
        noteDao.getNotesByType(NoteType.PARTNER_ASSESSMENT);
    checkPartnerAssessment(testAssessments.get(0), remainingPartnerAssessments);
    checkPartnerAssessment(testAssessments.get(1), remainingPartnerAssessments);
    checkPartnerAssessment(testAssessments.get(2), remainingPartnerAssessments);
  }

  @Test
  public void testPeriodicAssessments() throws Exception {
    final List<Note> periodicAssessments = noteDao.getNotesByType(NoteType.ASSESSMENT);
    checkPeriodicAssessment(testAssessments.get(3), periodicAssessments);
    checkPeriodicAssessment(testAssessments.get(4), periodicAssessments);
    checkPeriodicAssessment(testAssessments.get(5), periodicAssessments);
    checkPeriodicAssessment(testAssessments.get(6), periodicAssessments);
    checkPeriodicAssessment(testAssessments.get(7), periodicAssessments);
    checkPeriodicAssessment(testAssessments.get(8), periodicAssessments);
    checkPeriodicAssessment(testAssessments.get(9), periodicAssessments);
    checkPeriodicAssessment(testAssessments.get(10), periodicAssessments);
    checkPeriodicAssessment(testAssessments.get(11), periodicAssessments);
  }

  @Test
  public void testCounterparts() throws Exception {
    checkCounterparts(getChristopfTopferness(),
        ImmutableSet.of(getRegularUser(), getAndrewAnderson()));
    checkCounterparts(getRogerRogwell(), ImmutableSet.of(getJackJackson(), getAndrewAnderson()));
    checkCounterparts(getSteveSteveson(),
        ImmutableSet.of(getElizabethElizawell(), getAndrewAnderson()));
    checkCounterparts(getHunterHuntman(), ImmutableSet.of());
    checkCounterparts(getShardulSharton(), ImmutableSet.of());
  }

  private void checkPartnerAssessment(Note note, List<Note> remainingPartnerAssessments) {
    final Optional<Note> found = remainingPartnerAssessments.stream()
        .filter(pa -> pa.getUuid().equals(note.getUuid())).findFirst();
    assertThat(found).isPresent();
    // Note should be unchanged
    assertThat(found.get()).isEqualTo(note);
  }

  private void checkPeriodicAssessment(Note note, List<Note> periodicAssessments) {
    final Optional<Note> found =
        periodicAssessments.stream().filter(pa -> pa.getUuid().equals(note.getUuid())).findFirst();
    assertThat(found).isPresent();
    final Note periodicAssessment = found.get();
    assertThat(periodicAssessment.getType()).isEqualTo(NoteType.ASSESSMENT);
    try {
      final JsonNode jsonNode = Utils.parseJsonSafe(periodicAssessment.getText());
      assertThat(jsonNode).isNotNull();
      assertThat(jsonNode.isObject()).isTrue();
      final ObjectNode objectNode = (ObjectNode) jsonNode;
      assertThat(objectNode.has(NOTE_RECURRENCE)).isTrue();
      final JsonNode recurrence = objectNode.get(NOTE_RECURRENCE);
      assertThat(recurrence.isTextual()).isTrue();
      assertThat(recurrence.asText()).isNotEmpty();
      assertThat(objectNode.has(NOTE_PERIOD_START)).isTrue();
      final JsonNode periodStart = objectNode.get(NOTE_PERIOD_START);
      assertThat(periodStart.isTextual()).isTrue();
      assertThat(periodStart.asText()).isNotEmpty();
      assertThat(periodStart.asText()).isEqualTo(MaintenanceCommand
          .getPeriodStart(recurrence.asText(), periodicAssessment.getCreatedAt()));
      // Unknown prop should be removed
      assertThat(objectNode.has("test")).isFalse();
    } catch (JsonProcessingException e) {
      fail("Invalid JSON in periodic assessment {}", periodicAssessment);
    }
  }

  private void checkCounterparts(Person principal, ImmutableSet<Person> advisors) {
    final Position principalPosition = principal.loadPosition();
    final Set<Position> advisorPositions =
        advisors.stream().map(a -> a.loadPosition()).collect(Collectors.toSet());
    if (principalPosition == null) {
      assertThat(advisorPositions).isEmpty();
    } else {
      final List<Position> associatedPositions =
          principalPosition.loadAssociatedPositions(context).join();
      assertThat(associatedPositions).containsExactlyInAnyOrderElementsOf(advisorPositions);
    }
  }

  private static List<Note> createTestAssessments() {
    final List<Note> partnerAssessments = new ArrayList<>();
    // First, some invalid JSON objects
    // null
    partnerAssessments.add(createTestAssessment(getBobBobtown(), getChristopfTopferness(), null));
    // no JSON
    partnerAssessments.add(createTestAssessment(getNickNicholson(), getRogerRogwell(), "text"));
    // not a JSON object
    partnerAssessments.add(createTestAssessment(getSuperUser(), getSteveSteveson(), "\"test\": }"));
    // This gets parsed into a valid JSON object
    partnerAssessments
        .add(createTestAssessment(getRegularUser(), getChristopfTopferness(), "{ \"test\":"));
    // Finally, some valid JSON objects
    // these should add new counterparts for Andrew Anderson
    partnerAssessments.add(createTestAssessment(getAndrewAnderson(), getChristopfTopferness(),
        "{ \"test1\":\"1\", \"test2\":\"1\", \"test3\":\"1\", \"text\": \"sample text #1\" }"));
    partnerAssessments.add(createTestAssessment(getAndrewAnderson(), getRogerRogwell(),
        "{ \"test1\":\"2\", \"test2\":\"2\", \"test3\":\"2\", \"text\": \"sample text #2\" }"));
    partnerAssessments.add(createTestAssessment(getAndrewAnderson(), getSteveSteveson(),
        "{ \"test1\":\"3\", \"test2\":\"3\", \"test3\":\"3\", \"text\": \"sample text #3\" }"));
    // these should not add new counterparts as the principal they're assessing is already
    // their counterpart
    partnerAssessments.add(createTestAssessment(getRegularUser(), getChristopfTopferness(),
        "{ \"test1\":\"3\", \"test2\":\"1\", \"test3\":\"2\", \"text\": \"sample text #6\" }"));
    partnerAssessments.add(createTestAssessment(getJackJackson(), getRogerRogwell(),
        "{ \"test1\":\"2\", \"test2\":\"3\", \"test3\":\"1\", \"text\": \"sample text #5\" }"));
    partnerAssessments.add(createTestAssessment(getElizabethElizawell(), getSteveSteveson(),
        "{ \"test1\":\"1\", \"test2\":\"2\", \"test3\":\"3\", \"text\": \"sample text #4\" }"));
    // these should not add new counterparts as the principal they're assessing has no position
    partnerAssessments.add(createTestAssessment(getRegularUser(), getHunterHuntman(),
        "{ \"test1\":\"3\", \"test2\":\"2\", \"test3\":\"1\", \"text\": \"sample text #7\" }"));
    partnerAssessments.add(createTestAssessment(getJackJackson(), getShardulSharton(),
        "{ \"test1\":\"2\", \"test2\":\"1\", \"test3\":\"3\", \"text\": \"sample text #8\" }"));
    return partnerAssessments;
  }

  private static Note createTestAssessment(final Person author, final Person principal,
      final String text) {
    final Note testNote = new Note();
    testNote.setAuthor(author);
    testNote.setType(NoteType.PARTNER_ASSESSMENT);
    testNote.setText(text);
    final NoteRelatedObject testNro = new NoteRelatedObject();
    testNro.setRelatedObjectType(PersonDao.TABLE_NAME);
    testNro.setRelatedObjectUuid(principal.getUuid());
    testNote.setNoteRelatedObjects(Collections.singletonList(testNro));
    final Note partnerAssessment = noteDao.insert(testNote);
    assertThat(partnerAssessment.getUuid()).isNotNull();
    return partnerAssessment;
  }

  private static void deleteTestAssessments(final List<Note> partnerAssessments) {
    for (final Note note : partnerAssessments) {
      assertThat(noteDao.delete(note.getUuid())).isEqualTo(1);
    }
  }

  private static void deleteCounterparts(Person advisor) {
    final Position advisorPosition = advisor.loadPosition();
    final List<Position> counterparts = advisorPosition.loadAssociatedPositions(context).join();
    for (final Position principalPosition : counterparts) {
      positionDao.deletePositionAssociation(advisorPosition.getUuid(), principalPosition.getUuid());
    }
  }
}
