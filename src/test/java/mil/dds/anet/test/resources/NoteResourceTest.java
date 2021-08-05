package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.inject.Injector;
import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.test.client.AnetBeanList_Task;
import mil.dds.anet.test.client.Note;
import mil.dds.anet.test.client.NoteInput;
import mil.dds.anet.test.client.NoteRelatedObjectInput;
import mil.dds.anet.test.client.NoteType;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskSearchQueryInput;
import mil.dds.anet.test.integration.utils.TestApp;
import org.assertj.core.util.Lists;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.Query;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import ru.vyarus.dropwizard.guice.injector.lookup.InjectorLookup;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class NoteResourceTest extends AbstractResourceTest {

  protected static final String NOTE_FIELDS = "{ uuid type text author { uuid }"
      + " noteRelatedObjects { noteUuid relatedObjectType relatedObjectUuid } }";
  private static final String _NOTES_FIELDS = String.format("notes %1$s", NOTE_FIELDS);
  private static final String POSITION_FIELDS = String.format(
      "{ uuid name type status organization { uuid } location { uuid } %1$s }", _NOTES_FIELDS);
  private static final String REPORT_FIELDS =
      String.format("{ uuid intent state %1$s }", _NOTES_FIELDS);

  private static NoteCounterDao noteCounterDao;

  @BeforeAll
  public static void setUpDao() {
    final Injector injector = InjectorLookup.getInjector(TestApp.app.getApplication()).get();
    noteCounterDao = injector.getInstance(NoteCounterDao.class);
  }

  @Test
  public void testDeleteDanglingPositionNote()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create test position
    final PositionInput testPositionInput = PositionInput.builder()
        .withName("a test position created by testDeleteDanglingPositionNote")
        .withType(PositionType.ADVISOR).withStatus(Status.INACTIVE)
        .withOrganization(getOrganizationInput(admin.getPosition().getOrganization()))
        .withLocation(getLocationInput(getGeneralHospital())).build();
    final Position testPosition =
        adminMutationExecutor.createPosition(POSITION_FIELDS, testPositionInput);
    assertThat(testPosition).isNotNull();
    assertThat(testPosition.getUuid()).isNotNull();

    final Position createdPosition =
        adminQueryExecutor.position(POSITION_FIELDS, testPosition.getUuid());
    assertThat(createdPosition.getName()).isEqualTo(testPositionInput.getName());
    assertThat(createdPosition.getNotes()).isEmpty();

    // Attach note to test position
    final NoteRelatedObjectInput testNroInput =
        NoteRelatedObjectInput.builder().withRelatedObjectType(PositionDao.TABLE_NAME)
            .withRelatedObjectUuid(testPosition.getUuid()).build();
    final NoteInput testNoteInput = NoteInput.builder().withType(NoteType.FREE_TEXT)
        .withText("a position test note created by testDeleteDanglingPositionNote")
        .withNoteRelatedObjects(Collections.singletonList(testNroInput)).build();
    final Note createdNote = adminMutationExecutor.createNote(NOTE_FIELDS, testNoteInput);
    assertThat(createdNote).isNotNull();
    assertThat(createdNote.getUuid()).isNotNull();

    final Position updatedPosition =
        adminQueryExecutor.position(POSITION_FIELDS, testPosition.getUuid());
    assertThat(updatedPosition.getNotes()).hasSize(1);
    final Note positionNote = updatedPosition.getNotes().get(0);
    assertThat(positionNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(positionNote.getNoteRelatedObjects()).hasSize(1);

    // Delete test position
    final int nrNotes = countNotes();
    final Integer nrDeleted = adminMutationExecutor.deletePosition("", testPosition.getUuid());
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes());

    // The note should still be there, try to update it
    createdNote.setText("a position test note updated by testDeleteDanglingPositionNote");
    final Note updatedNote =
        adminMutationExecutor.updateNote(NOTE_FIELDS, getNoteInput(createdNote));
    assertThat(updatedNote).isNotNull();
    assertThat(updatedNote.getText()).isEqualTo(createdNote.getText());
    assertThat(updatedNote.getNoteRelatedObjects()).hasSize(1);

    // Delete dangling notes
    final NoteDao noteDao = AnetObjectEngine.getInstance().getNoteDao();
    noteDao.deleteDanglingNotes();
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should no longer be there, updating it should fail
    updatedNote.setText("a position test note updated twice by testDeleteDanglingPositionNote");
    try {
      adminMutationExecutor.updateNote(NOTE_FIELDS, getNoteInput(updatedNote));
      fail("Expected exception updating deleted note");
    } catch (Exception expected) {
      // OK
    }
  }

  @Test
  public void testDeleteDanglingReportNote()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create test report
    final ReportInput testReportInput =
        ReportInput.builder().withIntent("a test report created by testDeleteDanglingReportNote")
            .withReportPeople(
                getReportPeopleInput(Collections.singletonList(personToReportAuthor(admin))))
            .build();
    final Report testReport = adminMutationExecutor.createReport(REPORT_FIELDS, testReportInput);
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();

    final Report createdReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(createdReport.getIntent()).isEqualTo(testReportInput.getIntent());
    assertThat(createdReport.getNotes()).isEmpty();

    // Attach note to test report
    final NoteRelatedObjectInput testNroInput =
        NoteRelatedObjectInput.builder().withRelatedObjectType(ReportDao.TABLE_NAME)
            .withRelatedObjectUuid(testReport.getUuid()).build();
    final NoteInput testNoteInput = NoteInput.builder().withType(NoteType.FREE_TEXT)
        .withText("a report test note created by testDeleteDanglingReportNote")
        .withNoteRelatedObjects(Collections.singletonList(testNroInput)).build();
    final Note createdNote = adminMutationExecutor.createNote(NOTE_FIELDS, testNoteInput);
    assertThat(createdNote).isNotNull();
    assertThat(createdNote.getUuid()).isNotNull();

    final Report updatedReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note reportNote = updatedReport.getNotes().get(0);
    assertThat(reportNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(reportNote.getNoteRelatedObjects()).hasSize(1);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted = adminMutationExecutor.deleteReport("", testReport.getUuid());
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes());

    // The note should still be there, try to update it
    createdNote.setText("a report test note updated by testDeleteDanglingReportNote");
    final Note updatedNote =
        adminMutationExecutor.updateNote(NOTE_FIELDS, getNoteInput(createdNote));
    assertThat(updatedNote).isNotNull();
    assertThat(updatedNote.getText()).isEqualTo(createdNote.getText());
    assertThat(updatedNote.getNoteRelatedObjects()).hasSize(1);

    // Delete dangling notes
    final NoteDao noteDao = AnetObjectEngine.getInstance().getNoteDao();
    noteDao.deleteDanglingNotes();
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should no longer be there, updating it should fail
    updatedNote.setText("a report test note updated twice by testDeleteDanglingReportNote");
    try {
      adminMutationExecutor.updateNote(NOTE_FIELDS, getNoteInput(updatedNote));
      fail("Expected exception updating deleted note");
    } catch (Exception expected) {
      // OK
    }
  }

  @Test
  public void testDeleteDanglingReportTaskAssessment()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create test report
    final ReportInput testReportInput =
        ReportInput.builder()
            .withIntent("a test report created by testDeleteDanglingReportTaskAssessment")
            .withReportPeople(
                getReportPeopleInput(Collections.singletonList(personToReportAuthor(admin))))
            .build();
    final Report testReport = adminMutationExecutor.createReport(REPORT_FIELDS, testReportInput);
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();

    final Report createdReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(createdReport.getIntent()).isEqualTo(testReportInput.getIntent());
    assertThat(createdReport.getNotes()).isEmpty();

    // Attach task assessment to test report
    final TaskSearchQueryInput query = TaskSearchQueryInput.builder().withText("Budget").build();
    final AnetBeanList_Task tasks = adminQueryExecutor.taskList(getListFields("{ uuid }"), query);
    assertThat(tasks).isNotNull();
    assertThat(tasks.getList()).isNotEmpty();
    final Task task = tasks.getList().get(0);

    final NoteRelatedObjectInput testNroReportInput =
        NoteRelatedObjectInput.builder().withRelatedObjectType(ReportDao.TABLE_NAME)
            .withRelatedObjectUuid(testReport.getUuid()).build();
    final NoteRelatedObjectInput testNroTaskInput = NoteRelatedObjectInput.builder()
        .withRelatedObjectType(TaskDao.TABLE_NAME).withRelatedObjectUuid(task.getUuid()).build();
    final NoteInput testNoteInput = NoteInput.builder().withType(NoteType.ASSESSMENT)
        .withText("{\"text\":"
            + "\"a report test task assessment created by testDeleteDanglingReportTaskAssessment\"}")
        .withNoteRelatedObjects(Lists.newArrayList(testNroReportInput, testNroTaskInput)).build();

    final Note createdNote = adminMutationExecutor.createNote(NOTE_FIELDS, testNoteInput);
    assertThat(createdNote).isNotNull();
    assertThat(createdNote.getUuid()).isNotNull();

    final Report updatedReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note reportNote = updatedReport.getNotes().get(0);
    assertThat(reportNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(reportNote.getNoteRelatedObjects()).hasSize(2);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted = adminMutationExecutor.deleteReport("", testReport.getUuid());
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes());

    // The note should still be there, try to update it
    createdNote.setText("{\"text\":"
        + "\"a report test task assessment updated by testDeleteDanglingReportTaskAssessment\"}");
    final Note updatedNote =
        adminMutationExecutor.updateNote(NOTE_FIELDS, getNoteInput(createdNote));
    assertThat(updatedNote).isNotNull();
    assertThat(updatedNote.getText()).isEqualTo(createdNote.getText());
    assertThat(updatedNote.getNoteRelatedObjects()).hasSize(2);

    // Delete dangling notes
    final NoteDao noteDao = AnetObjectEngine.getInstance().getNoteDao();
    noteDao.deleteDanglingNotes();
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should no longer be there, updating it should fail
    updatedNote.setText("{\"text\":"
        + "\"a report test task assessment updated twice by testDeleteDanglingReportTaskAssessment\"}");
    try {
      adminMutationExecutor.updateNote(NOTE_FIELDS, getNoteInput(updatedNote));
      fail("Expected exception updating deleted note");
    } catch (Exception expected) {
      // OK
    }
  }

  @Test
  public void testDeleteDanglingReportAttendeeAssessment()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create test report
    final ReportInput testReportInput =
        ReportInput.builder()
            .withIntent("a test report created by testDeleteDanglingReportAttendeeAssessment")
            .withReportPeople(
                getReportPeopleInput(Collections.singletonList(personToReportAuthor(admin))))
            .build();
    final Report testReport = adminMutationExecutor.createReport(REPORT_FIELDS, testReportInput);
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();

    final Report createdReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(createdReport.getIntent()).isEqualTo(testReportInput.getIntent());
    assertThat(createdReport.getNotes()).isEmpty();

    // Attach attendee assessment to test report
    final Person attendee = getRogerRogwell();

    final NoteRelatedObjectInput testNroReportInput =
        NoteRelatedObjectInput.builder().withRelatedObjectType(ReportDao.TABLE_NAME)
            .withRelatedObjectUuid(testReport.getUuid()).build();
    final NoteRelatedObjectInput testNroTaskInput =
        NoteRelatedObjectInput.builder().withRelatedObjectType(PersonDao.TABLE_NAME)
            .withRelatedObjectUuid(attendee.getUuid()).build();
    final NoteInput testNoteInput = NoteInput.builder().withType(NoteType.ASSESSMENT)
        .withText("{\"text\":"
            + "\"a report test attendee assessment created by testDeleteDanglingReportAttendeeAssessment\"}")
        .withNoteRelatedObjects(Lists.newArrayList(testNroReportInput, testNroTaskInput)).build();
    final Note createdNote = adminMutationExecutor.createNote(NOTE_FIELDS, testNoteInput);
    assertThat(createdNote).isNotNull();
    assertThat(createdNote.getUuid()).isNotNull();

    final Report updatedReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note reportNote = updatedReport.getNotes().get(0);
    assertThat(reportNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(reportNote.getNoteRelatedObjects()).hasSize(2);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted = adminMutationExecutor.deleteReport("", testReport.getUuid());
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes());

    // The note should still be there, try to update it
    createdNote.setText("{\"text\":"
        + "\"a report test attendee assessment updated by testDeleteDanglingReportAttendeeAssessment\"}");
    final Note updatedNote =
        adminMutationExecutor.updateNote(NOTE_FIELDS, getNoteInput(createdNote));
    assertThat(updatedNote).isNotNull();
    assertThat(updatedNote.getText()).isEqualTo(createdNote.getText());
    assertThat(updatedNote.getNoteRelatedObjects()).hasSize(2);

    // Delete dangling notes
    final NoteDao noteDao = AnetObjectEngine.getInstance().getNoteDao();
    noteDao.deleteDanglingNotes();
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should no longer be there, updating it should fail
    updatedNote.setText("{\"text\":"
        + "\"a report test attendee assessment updated twice by testDeleteDanglingReportAttendeeAssessment\"}");
    try {
      adminMutationExecutor.updateNote(NOTE_FIELDS, getNoteInput(updatedNote));
      fail("Expected exception updating deleted note");
    } catch (Exception expected) {
      // OK
    }
  }

  private int countNotes() {
    return noteCounterDao.countNotes();
  }

  static class NoteCounterDao {
    @Inject
    private Provider<Handle> handle;

    @InTransaction
    public int countNotes() {
      final Query q = handle.get().createQuery("SELECT COUNT(*) as ct FROM notes");
      final Optional<Map<String, Object>> result = q.map(new MapMapper(false)).findFirst();
      return ((Number) result.get().get("ct")).intValue();
    }
  }

}
