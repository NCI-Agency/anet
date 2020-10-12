package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.inject.Injector;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.NoteRelatedObject;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.test.beans.PersonTest;
import mil.dds.anet.test.integration.utils.TestApp;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import org.assertj.core.util.Lists;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.Query;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import ru.vyarus.dropwizard.guice.injector.lookup.InjectorLookup;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class NoteResourceTest extends AbstractResourceTest {

  private static final String NOTE_FIELDS = "uuid type text author { uuid }"
      + " noteRelatedObjects { noteUuid relatedObjectType relatedObjectUuid }";
  private static final String NOTES_FIELDS = "notes { " + NOTE_FIELDS + " }";
  private static final String POSITION_FIELDS = "uuid name type status " + NOTES_FIELDS;
  private static final String REPORT_FIELDS = "uuid intent state " + NOTES_FIELDS;

  private static NoteCounterDao noteCounterDao;

  @BeforeAll
  public static void setUpDao() {
    final Injector injector = InjectorLookup.getInjector(TestApp.app.getApplication()).get();
    noteCounterDao = injector.getInstance(NoteCounterDao.class);
  }

  @Test
  public void testDeleteDanglingPositionNote() {
    // Create test position
    final Position testPosition = new Position();
    testPosition.setName("a test position created by testDeleteDanglingPositionNote");
    testPosition.setType(PositionType.ADVISOR);
    testPosition.setStatus(Position.Status.INACTIVE);
    testPosition.setOrganization(admin.getPosition().getOrganization());
    final String testPositionUuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", testPosition, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(testPositionUuid).isNotNull();

    final Position createdPosition = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS,
        testPositionUuid, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(createdPosition.getName()).isEqualTo(testPosition.getName());
    assertThat(createdPosition.getNotes()).isEmpty();

    // Attach note to test position
    final Note testNote = new Note();
    testNote.setType(Note.NoteType.FREE_TEXT);
    testNote.setText("a position test note created by testDeleteDanglingPositionNote");
    final NoteRelatedObject testNro = new NoteRelatedObject();
    testNro.setRelatedObjectType(PositionDao.TABLE_NAME);
    testNro.setRelatedObjectUuid(testPositionUuid);
    testNote.setNoteRelatedObjects(Collections.singletonList(testNro));
    final String createdNoteUuid = graphQLHelper.createObject(admin, "createNote", "note",
        "NoteInput", testNote, new TypeReference<GraphQlResponse<Note>>() {});
    assertThat(createdNoteUuid).isNotNull();

    final Position updatedPosition = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS,
        testPositionUuid, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(updatedPosition.getNotes()).hasSize(1);
    final Note createdNote = updatedPosition.getNotes().get(0);
    assertThat(createdNote.getText()).isEqualTo(testNote.getText());
    assertThat(createdNote.getNoteRelatedObjects()).hasSize(1);

    // Delete test position
    final int nrNotes = countNotes();
    final Integer nrDeleted = graphQLHelper.deleteObject(admin, "deletePosition", testPositionUuid);
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes());

    // The note should still be there, try to update it
    createdNote.setText("a position est note updated by testDeleteDanglingPositionNote");
    final Note updatedNote = graphQLHelper.updateObject(admin, "updateNote", "note", NOTE_FIELDS,
        "NoteInput", createdNote, new TypeReference<GraphQlResponse<Note>>() {});
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
      graphQLHelper.updateObject(admin, "updateNote", "note", NOTE_FIELDS, "NoteInput", updatedNote,
          new TypeReference<GraphQlResponse<Note>>() {});
      fail("Expected exception updating deleted note");
    } catch (Exception expected) {
      // OK
    }
  }

  @Test
  public void testDeleteDanglingReportNote() {
    // Create test report
    final Report testReport = new Report();
    testReport.setIntent("a test report created by testDeleteDanglingReportNote");
    testReport.setAttendees(Collections.singletonList(PersonTest.personToReportAuthor(admin)));
    final String testReportUuid = graphQLHelper.createObject(admin, "createReport", "report",
        "ReportInput", testReport, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(testReportUuid).isNotNull();

    final Report createdReport = graphQLHelper.getObjectById(admin, "report", REPORT_FIELDS,
        testReportUuid, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(createdReport.getIntent()).isEqualTo(testReport.getIntent());
    assertThat(createdReport.getNotes()).isEmpty();

    // Attach note to test report
    final Note testNote = new Note();
    testNote.setType(Note.NoteType.FREE_TEXT);
    testNote.setText("a report test note created by testDeleteDanglingReportNote");
    final NoteRelatedObject testNro = new NoteRelatedObject();
    testNro.setRelatedObjectType(ReportDao.TABLE_NAME);
    testNro.setRelatedObjectUuid(testReportUuid);
    testNote.setNoteRelatedObjects(Collections.singletonList(testNro));
    final String createdNoteUuid = graphQLHelper.createObject(admin, "createNote", "note",
        "NoteInput", testNote, new TypeReference<GraphQlResponse<Note>>() {});
    assertThat(createdNoteUuid).isNotNull();

    final Report updatedReport = graphQLHelper.getObjectById(admin, "report", REPORT_FIELDS,
        testReportUuid, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note createdNote = updatedReport.getNotes().get(0);
    assertThat(createdNote.getText()).isEqualTo(testNote.getText());
    assertThat(createdNote.getNoteRelatedObjects()).hasSize(1);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted = graphQLHelper.deleteObject(admin, "deleteReport", testReportUuid);
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes());

    // The note should still be there, try to update it
    createdNote.setText("a report test note updated by testDeleteDanglingReportNote");
    final Note updatedNote = graphQLHelper.updateObject(admin, "updateNote", "note", NOTE_FIELDS,
        "NoteInput", createdNote, new TypeReference<GraphQlResponse<Note>>() {});
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
      graphQLHelper.updateObject(admin, "updateNote", "note", NOTE_FIELDS, "NoteInput", updatedNote,
          new TypeReference<GraphQlResponse<Note>>() {});
      fail("Expected exception updating deleted note");
    } catch (Exception expected) {
      // OK
    }
  }

  @Test
  public void testDeleteDanglingReportTaskAssessment() {
    // Create test report
    final Report testReport = new Report();
    testReport.setIntent("a test report created by testDeleteDanglingReportTaskAssessment");
    testReport.setAttendees(Collections.singletonList(PersonTest.personToReportAuthor(admin)));
    final String testReportUuid = graphQLHelper.createObject(admin, "createReport", "report",
        "ReportInput", testReport, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(testReportUuid).isNotNull();

    final Report createdReport = graphQLHelper.getObjectById(admin, "report", REPORT_FIELDS,
        testReportUuid, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(createdReport.getIntent()).isEqualTo(testReport.getIntent());
    assertThat(createdReport.getNotes()).isEmpty();

    // Attach task assessment to test report
    final TaskSearchQuery query = new TaskSearchQuery();
    query.setText("Budget");
    final AnetBeanList<Task> tasks =
        graphQLHelper.searchObjects(admin, "taskList", "query", "TaskSearchQueryInput", "uuid",
            query, new TypeReference<GraphQlResponse<AnetBeanList<Task>>>() {});
    assertThat(tasks).isNotNull();
    assertThat(tasks.getList()).isNotEmpty();
    final Task task = tasks.getList().get(0);

    final Note testNote = new Note();
    testNote.setType(Note.NoteType.ASSESSMENT);
    testNote.setText("{\"text\":"
        + "\"a report test task assessment created by testDeleteDanglingReportTaskAssessment\"}");
    final NoteRelatedObject testNroReport = new NoteRelatedObject();
    testNroReport.setRelatedObjectType(ReportDao.TABLE_NAME);
    testNroReport.setRelatedObjectUuid(testReportUuid);
    final NoteRelatedObject testNroTask = new NoteRelatedObject();
    testNroTask.setRelatedObjectType(TaskDao.TABLE_NAME);
    testNroTask.setRelatedObjectUuid(task.getUuid());
    testNote.setNoteRelatedObjects(Lists.newArrayList(testNroReport, testNroTask));
    final String createdNoteUuid = graphQLHelper.createObject(admin, "createNote", "note",
        "NoteInput", testNote, new TypeReference<GraphQlResponse<Note>>() {});
    assertThat(createdNoteUuid).isNotNull();

    final Report updatedReport = graphQLHelper.getObjectById(admin, "report", REPORT_FIELDS,
        testReportUuid, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note createdNote = updatedReport.getNotes().get(0);
    assertThat(createdNote.getText()).isEqualTo(testNote.getText());
    assertThat(createdNote.getNoteRelatedObjects()).hasSize(2);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted = graphQLHelper.deleteObject(admin, "deleteReport", testReportUuid);
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes());

    // The note should still be there, try to update it
    createdNote.setText("{\"text\":"
        + "\"a report test task assessment updated by testDeleteDanglingReportTaskAssessment\"}");
    final Note updatedNote = graphQLHelper.updateObject(admin, "updateNote", "note", NOTE_FIELDS,
        "NoteInput", createdNote, new TypeReference<GraphQlResponse<Note>>() {});
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
      graphQLHelper.updateObject(admin, "updateNote", "note", NOTE_FIELDS, "NoteInput", updatedNote,
          new TypeReference<GraphQlResponse<Note>>() {});
      fail("Expected exception updating deleted note");
    } catch (Exception expected) {
      // OK
    }
  }

  @Test
  public void testDeleteDanglingReportAttendeeAssessment() {
    // Create test report
    final Report testReport = new Report();
    testReport.setIntent("a test report created by testDeleteDanglingReportAttendeeAssessment");
    testReport.setAttendees(Collections.singletonList(PersonTest.personToReportAuthor(admin)));
    final String testReportUuid = graphQLHelper.createObject(admin, "createReport", "report",
        "ReportInput", testReport, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(testReportUuid).isNotNull();

    final Report createdReport = graphQLHelper.getObjectById(admin, "report", REPORT_FIELDS,
        testReportUuid, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(createdReport.getIntent()).isEqualTo(testReport.getIntent());
    assertThat(createdReport.getNotes()).isEmpty();

    // Attach attendee assessment to test report
    final Person attendee = getRogerRogwell();

    final Note testNote = new Note();
    testNote.setType(Note.NoteType.ASSESSMENT);
    testNote.setText("{\"text\":"
        + "\"a report test attendee assessment created by testDeleteDanglingReportAttendeeAssessment\"}");
    final NoteRelatedObject testNroReport = new NoteRelatedObject();
    testNroReport.setRelatedObjectType(ReportDao.TABLE_NAME);
    testNroReport.setRelatedObjectUuid(testReportUuid);
    final NoteRelatedObject testNroTask = new NoteRelatedObject();
    testNroTask.setRelatedObjectType(PersonDao.TABLE_NAME);
    testNroTask.setRelatedObjectUuid(attendee.getUuid());
    testNote.setNoteRelatedObjects(Lists.newArrayList(testNroReport, testNroTask));
    final String createdNoteUuid = graphQLHelper.createObject(admin, "createNote", "note",
        "NoteInput", testNote, new TypeReference<GraphQlResponse<Note>>() {});
    assertThat(createdNoteUuid).isNotNull();

    final Report updatedReport = graphQLHelper.getObjectById(admin, "report", REPORT_FIELDS,
        testReportUuid, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note createdNote = updatedReport.getNotes().get(0);
    assertThat(createdNote.getText()).isEqualTo(testNote.getText());
    assertThat(createdNote.getNoteRelatedObjects()).hasSize(2);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted = graphQLHelper.deleteObject(admin, "deleteReport", testReportUuid);
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes());

    // The note should still be there, try to update it
    createdNote.setText("{\"text\":"
        + "\"a report test attendee assessment updated by testDeleteDanglingReportAttendeeAssessment\"}");
    final Note updatedNote = graphQLHelper.updateObject(admin, "updateNote", "note", NOTE_FIELDS,
        "NoteInput", createdNote, new TypeReference<GraphQlResponse<Note>>() {});
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
      graphQLHelper.updateObject(admin, "updateNote", "note", NOTE_FIELDS, "NoteInput", updatedNote,
          new TypeReference<GraphQlResponse<Note>>() {});
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
