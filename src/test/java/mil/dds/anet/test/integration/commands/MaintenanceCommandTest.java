package mil.dds.anet.test.integration.commands;

import static mil.dds.anet.threads.PendingAssessmentsNotificationWorker.NOTE_PERIOD_START;
import static mil.dds.anet.threads.PendingAssessmentsNotificationWorker.NOTE_RECURRENCE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.dropwizard.Application;
import io.dropwizard.cli.Cli;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.util.JarLocation;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.MaintenanceCommand;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Note.NoteType;
import mil.dds.anet.beans.NoteRelatedObject;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.PersonDao;
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
  private static List<Note> testAssessments;

  @BeforeAll
  public static void setUpClass() throws Exception {
    noteDao = AnetObjectEngine.getInstance().getNoteDao();
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

  private static List<Note> createTestAssessments() {
    final List<Note> partnerAssessments = new ArrayList<>();
    // null
    partnerAssessments.add(createTestAssessment(null));
    // no JSON
    partnerAssessments.add(createTestAssessment("text"));
    // not a JSON object
    partnerAssessments.add(createTestAssessment("\"test\": }"));
    // invalid but parsed into a JSON object
    partnerAssessments.add(createTestAssessment("{ \"test\":"));
    // valid JSON object
    partnerAssessments.add(createTestAssessment(
        "{ \"test1\":\"3\", \"test2\":\"3\", \"test3\":\"3\", \"text\": \"sample text\" }"));
    return partnerAssessments;
  }

  private static Note createTestAssessment(String text) {
    final Note testNote = new Note();
    testNote.setAuthor(admin);
    testNote.setType(NoteType.PARTNER_ASSESSMENT);
    testNote.setText(text);
    final NoteRelatedObject testNro = new NoteRelatedObject();
    testNro.setRelatedObjectType(PersonDao.TABLE_NAME);
    testNro.setRelatedObjectUuid(admin.getUuid());
    testNote.setNoteRelatedObjects(Collections.singletonList(testNro));
    final Note partnerAssessment = noteDao.insert(testNote);
    assertThat(partnerAssessment.getUuid()).isNotNull();
    return partnerAssessment;
  }

  private static void deleteTestAssessments(List<Note> partnerAssessments) {
    for (final Note note : partnerAssessments) {
      assertThat(noteDao.delete(note.getUuid())).isEqualTo(1);
    }
  }
}
