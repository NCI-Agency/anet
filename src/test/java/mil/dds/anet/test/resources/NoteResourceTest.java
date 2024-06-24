package mil.dds.anet.test.resources;

import static mil.dds.anet.utils.PendingAssessmentsHelper.NOTE_RECURRENCE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.Lists;
import com.google.inject.Injector;
import graphql.com.google.common.collect.Iterables;
import jakarta.inject.Inject;
import jakarta.inject.Provider;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.test.client.AnetBeanList_Task;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Note;
import mil.dds.anet.test.client.NoteInput;
import mil.dds.anet.test.client.NoteType;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.ReportPerson;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.client.TaskSearchQueryInput;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.Query;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import ru.vyarus.dropwizard.guice.injector.lookup.InjectorLookup;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class NoteResourceTest extends AbstractResourceTest {

  protected static final String NOTE_FIELDS = "{ uuid type assessmentKey text author { uuid }"
      + " noteRelatedObjects { objectUuid relatedObjectType relatedObjectUuid } }";
  private static final String _NOTES_FIELDS = String.format("notes %1$s", NOTE_FIELDS);
  private static final String PERSON_FIELDS = String.format("{ uuid name %1$s }", _NOTES_FIELDS);
  private static final String POSITION_FIELDS = String.format(
      "{ uuid name type status organization { uuid } location { uuid } %1$s }", _NOTES_FIELDS);
  private static final String REPORT_FIELDS = String
      .format("{ uuid intent state reportPeople { uuid name author attendee primary interlocutor }"
          + " tasks { uuid shortName } %1$s }", _NOTES_FIELDS);
  private static final String TASK_FIELDS = String.format("{ uuid shortName %1$s }", _NOTES_FIELDS);

  // The authorization groups defined in the dictionary give Erin read access and Jack write access;
  // these test objects can be used for the assessments authorization tests
  // Task EF 2
  private static final String TEST_TASK_EF2_UUID = "cd35abe7-a5c9-4b3e-885b-4c72bf564ed7";
  // Task 2.B
  private static final String TEST_TASK_2B_UUID = "2200a820-c4c7-4c9c-946c-f0c9c9e045c5";
  // Task 1.2.A, Andrew is responsible
  private static final String TEST_TASK_12A_UUID = "953e0b0b-25e6-44b6-bc77-ef98251d046a";
  // Person Christopf, Erin is counterpart
  private static final String TEST_COUNTERPART_PERSON_UUID = "237e8bf7-2ae4-4d49-b7c8-eca6a92d4767";
  // Report "Discuss improvements in Annual Budgeting process"
  private static final String TEST_REPORT_UUID = "9bb1861c-1f55-4a1b-bd3d-3c1f56d739b5";

  private static NoteCounterDao noteCounterDao;

  @BeforeAll
  void setUpDao() {
    final Injector injector = InjectorLookup.getInjector(dropwizardApp.getApplication()).get();
    noteCounterDao = injector.getInstance(NoteCounterDao.class);
  }

  @Test
  void testDeleteDanglingReportNote() {
    // Create test report
    final ReportInput testReportInput =
        ReportInput.builder().withIntent("a test report created by testDeleteDanglingReportNote")
            .withReportPeople(
                getReportPeopleInput(Collections.singletonList(personToReportAuthor(admin))))
            .build();
    final Report testReport = withCredentials(adminUser,
        t -> mutationExecutor.createReport(REPORT_FIELDS, testReportInput));
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();

    final Report createdReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, testReport.getUuid()));
    assertThat(createdReport.getIntent()).isEqualTo(testReportInput.getIntent());
    assertThat(createdReport.getNotes()).isEmpty();

    // Attach note to test report
    final GenericRelatedObjectInput testNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());
    final NoteInput testNoteInput = NoteInput.builder().withType(NoteType.FREE_TEXT)
        .withText("a report test note created by testDeleteDanglingReportNote")
        .withNoteRelatedObjects(Collections.singletonList(testNroInput)).build();
    final Note createdNote = succeedNoteCreate(adminUser, testNoteInput);

    final Report updatedReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, testReport.getUuid()));
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note reportNote = updatedReport.getNotes().get(0);
    assertThat(reportNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(reportNote.getNoteRelatedObjects()).hasSize(1);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted =
        withCredentials(adminUser, t -> mutationExecutor.deleteReport("", testReport.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);
    // Note is deleted thus needs to be less than before
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should not be there, try to update it
    createdNote.setText("a report test note updated by testDeleteDanglingReportNote");
    failNoteUpdate(adminUser, getNoteInput(createdNote));
  }

  @Test
  void testDeleteDanglingReportTaskAssessment() {
    // Create test report
    final ReportInput testReportInput =
        ReportInput.builder()
            .withIntent("a test report created by testDeleteDanglingReportTaskAssessment")
            .withReportPeople(
                getReportPeopleInput(Collections.singletonList(personToReportAuthor(admin))))
            .build();
    final Report testReport = withCredentials(adminUser,
        t -> mutationExecutor.createReport(REPORT_FIELDS, testReportInput));
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();

    final Report createdReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, testReport.getUuid()));
    assertThat(createdReport.getIntent()).isEqualTo(testReportInput.getIntent());
    assertThat(createdReport.getNotes()).isEmpty();

    // Attach task assessment to test report
    final TaskSearchQueryInput query = TaskSearchQueryInput.builder().withText("Budget").build();
    final AnetBeanList_Task tasks =
        withCredentials(adminUser, t -> queryExecutor.taskList(getListFields("{ uuid }"), query));
    assertThat(tasks).isNotNull();
    assertThat(tasks.getList()).isNotEmpty();
    final Task task = tasks.getList().get(0);

    final GenericRelatedObjectInput testNroReportInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());
    final GenericRelatedObjectInput testNroTaskInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, task.getUuid());
    final NoteInput testNoteInput = createAssessment("testDeleteDanglingReportTaskAssessment",
        "a report test task assessment created by testDeleteDanglingReportTaskAssessment", "once",
        testNroReportInput, testNroTaskInput);
    final Note createdNote = succeedNoteCreate(adminUser, testNoteInput);

    final Report updatedReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, testReport.getUuid()));
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note reportNote = updatedReport.getNotes().get(0);
    assertThat(reportNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(reportNote.getNoteRelatedObjects()).hasSize(2);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted =
        withCredentials(adminUser, t -> mutationExecutor.deleteReport("", testReport.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should not be there, try to update it
    createdNote.setText("{\"text\":"
        + "\"a report test task assessment updated by testDeleteDanglingReportTaskAssessment\"}");
    failNoteUpdate(adminUser, getNoteInput(createdNote));
  }

  @Test
  void testDeleteDanglingReportAttendeeAssessment() {
    // Create test report
    final ReportInput testReportInput =
        ReportInput.builder()
            .withIntent("a test report created by testDeleteDanglingReportAttendeeAssessment")
            .withReportPeople(
                getReportPeopleInput(Collections.singletonList(personToReportAuthor(admin))))
            .build();
    final Report testReport = withCredentials(adminUser,
        t -> mutationExecutor.createReport(REPORT_FIELDS, testReportInput));
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();

    final Report createdReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, testReport.getUuid()));
    assertThat(createdReport.getIntent()).isEqualTo(testReportInput.getIntent());
    assertThat(createdReport.getNotes()).isEmpty();

    // Attach attendee assessment to test report
    final Person attendee = getRogerRogwell();

    final GenericRelatedObjectInput testNroReportInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());
    final GenericRelatedObjectInput testNroTaskInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, attendee.getUuid());
    final NoteInput testNoteInput = createAssessment("testDeleteDanglingReportAttendeeAssessment",
        "a report test attendee assessment created by testDeleteDanglingReportAttendeeAssessment",
        "once", testNroReportInput, testNroTaskInput);
    final Note createdNote = succeedNoteCreate(adminUser, testNoteInput);

    final Report updatedReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, testReport.getUuid()));
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note reportNote = updatedReport.getNotes().get(0);
    assertThat(reportNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(reportNote.getNoteRelatedObjects()).hasSize(2);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted =
        withCredentials(adminUser, t -> mutationExecutor.deleteReport("", testReport.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should not be there, try to update it
    createdNote.setText("{\"text\":"
        + "\"a report test attendee assessment updated by testDeleteDanglingReportAttendeeAssessment\"}");
    failNoteUpdate(adminUser, getNoteInput(createdNote));
  }

  @Test
  void testDeleteDanglingPositionNote() {
    // Create test position
    final PositionInput testPositionInput = PositionInput.builder()
        .withName("a test position created by testDeleteDanglingPositionNote")
        .withType(PositionType.REGULAR).withStatus(Status.INACTIVE).withRole(PositionRole.MEMBER)
        .withOrganization(getOrganizationInput(admin.getPosition().getOrganization()))
        .withLocation(getLocationInput(getGeneralHospital())).build();
    final Position testPosition = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, testPositionInput));
    assertThat(testPosition).isNotNull();
    assertThat(testPosition.getUuid()).isNotNull();

    final Position createdPosition = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, testPosition.getUuid()));
    assertThat(createdPosition.getName()).isEqualTo(testPositionInput.getName());
    assertThat(createdPosition.getNotes()).isEmpty();

    // Attach note to test position
    final GenericRelatedObjectInput testNroInput =
        createNoteRelatedObject(PositionDao.TABLE_NAME, testPosition.getUuid());
    final NoteInput testNoteInput = NoteInput.builder().withType(NoteType.FREE_TEXT)
        .withText("a position test note created by testDeleteDanglingPositionNote")
        .withNoteRelatedObjects(Collections.singletonList(testNroInput)).build();
    final Note createdNote = succeedNoteCreate(adminUser, testNoteInput);

    final Position updatedPosition = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, testPosition.getUuid()));
    assertThat(updatedPosition.getNotes()).hasSize(1);
    final Note positionNote = updatedPosition.getNotes().get(0);
    assertThat(positionNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(positionNote.getNoteRelatedObjects()).hasSize(1);

    // Delete test position
    final int nrNotes = countNotes();
    final Integer nrDeleted = withCredentials(adminUser,
        t -> mutationExecutor.deletePosition("", testPosition.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should not be there, try to update it
    createdNote.setText("a position test note updated by testDeleteDanglingPositionNote");
    failNoteUpdate(adminUser, getNoteInput(createdNote));
  }

  @Test
  void testInvalidNotes() {
    // Completely empty note
    final NoteInput invalidNoteInput = NoteInput.builder().build();
    failNoteCreate(jackUser, invalidNoteInput);
    // Free text without text
    invalidNoteInput.setType(NoteType.FREE_TEXT);
    failNoteCreate(jackUser, invalidNoteInput);
    // Assessment without key
    invalidNoteInput.setType(NoteType.ASSESSMENT);
    failNoteCreate(jackUser, invalidNoteInput);
    // Assessment with invalid key
    invalidNoteInput.setAssessmentKey("unknown");
    failNoteCreate(jackUser, invalidNoteInput);
    // Assessment without text
    invalidNoteInput.setAssessmentKey("fields.task.assessments.taskOnceReport");
    failNoteCreate(jackUser, invalidNoteInput);
    // Assessment with different recurrence from dictionary key
    invalidNoteInput.setText(createAssessmentText("test", "ondemand"));
    failNoteCreate(jackUser, invalidNoteInput);
  }

  @Test
  void testFreeTextNotes() {
    // Note: future DIAGRAM note tests can be the same as these
    final Person interlocutorPerson = getSteveSteveson();
    final String interlocutorPersonUuid = interlocutorPerson.getUuid();

    final NoteInput freeTextNoteInput =
        NoteInput.builder().withType(NoteType.FREE_TEXT).withText("Free text test").build();
    // - F: create without relatedObjects
    failNoteCreate(jackUser, freeTextNoteInput);

    // - S: create with self
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, interlocutorPersonUuid);
    freeTextNoteInput.setNoteRelatedObjects(Collections.singletonList(testInterlocutorNroInput));

    final Note freeTextNote = succeedNoteCreate(jackUser, freeTextNoteInput);
    final List<Note> interlocutorNotes = Lists.newArrayList(freeTextNote);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(freeTextNoteInput);

    // - S: create as admin
    final NoteInput freeTextNoteInputAdmin = NoteInput.builder().withType(NoteType.FREE_TEXT)
        .withText("Free text test as admin").build();
    freeTextNoteInputAdmin
        .setNoteRelatedObjects(Collections.singletonList(testInterlocutorNroInput));
    final Note freeTextNoteAdmin = succeedNoteCreate(adminUser, freeTextNoteInputAdmin);
    interlocutorNotes.add(freeTextNoteAdmin);
    interlocutorPerson.setNotes(interlocutorNotes);
    testNoteInputs.add(freeTextNoteInputAdmin);

    // - S: read it
    Collections.reverse(interlocutorPerson.getNotes());
    assertFreeTextNotes(interlocutorPerson.getNotes(), testNoteInputs, 1);

    // - S: read it as someone else
    final Person bobPerson = withCredentials(getBobBobtown().getDomainUsername(),
        t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertFreeTextNotes(bobPerson.getNotes(), testNoteInputs, 1);

    // - S: read it as admin
    final Person adminPerson = withCredentials(adminUser,
        t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertFreeTextNotes(adminPerson.getNotes(), testNoteInputs, 1);

    // - S: update it
    final NoteInput updatedNoteInputJack = getNoteInput(freeTextNote);
    updatedNoteInputJack.setText("Updated by jack");
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInputJack);
    final Note updatedNoteJack = succeedNoteUpdate(jackUser, updatedNoteInputJack);

    // - F: update it as someone else
    final NoteInput failedUpdateNoteInput = getNoteInput(freeTextNote);
    failedUpdateNoteInput.setText("Updated by erin");
    failNoteUpdate("erin", failedUpdateNoteInput);

    // - F: update it as someone else by faking the note author
    final NoteInput failedFakeAuthorNoteInput = getNoteInput(freeTextNote);
    failedFakeAuthorNoteInput.setAuthor(getPersonInput(getRegularUser()));
    failNoteUpdate("erin", failedFakeAuthorNoteInput);

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = getNoteInput(freeTextNoteAdmin);
    updatedNoteInputAdmin.setText("Updated by admin");
    updatedNotesInput.add(updatedNoteInputAdmin);
    final Note updatedNoteAdmin = succeedNoteUpdate(adminUser, updatedNoteInputAdmin);

    // - F: delete it as someone else
    failNoteDelete("erin", updatedNoteJack);

    // - S: delete it
    succeedNoteDelete(jackUser, updatedNoteJack);
    assertThat(updatedNotesInput.remove(updatedNoteInputJack)).isTrue();
    Collections.reverse(
        withCredentials(jackUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getNotes());
    assertFreeTextNotes(
        withCredentials(jackUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getNotes(),
        updatedNotesInput, 1);

    // - S: delete it as admin
    succeedNoteDelete(adminUser, updatedNoteAdmin);
    assertThat(updatedNotesInput.remove(updatedNoteInputAdmin)).isTrue();
    // FIXME: what does this actually do?
    Collections.reverse(
        withCredentials(adminUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getNotes());
    assertFreeTextNotes(
        withCredentials(adminUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getNotes(),
        updatedNotesInput, 1);
  }

  @Test
  void testInstantPersonAssessments() {
    // Instant ('once') ASSESSMENT note tests for person through the NoteResource methods
    testInstantAssessments("testInstantPersonAssessments",
        "fields.regular.person.assessments.personOnceReportLinguist", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantPersonAssessmentsEmptyWriteAuthGroups() {
    // Instant ('once') ASSESSMENT note tests for person through the NoteResource methods, with
    // empty write authorization groups defined in the dictionary
    testInstantAssessmentsEmptyWriteAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.regular.person.assessments.advisorOnceReportNoWrite", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantPersonAssessmentsNoAuthGroups() {
    // Instant ('once') ASSESSMENT note tests for person through the NoteResource methods, with no
    // authorization groups defined in the dictionary
    testInstantAssessmentsNoAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.regular.person.assessments.interlocutorOnceReport", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantPersonAssessmentsViaReport() {
    // Instant ('once') ASSESSMENT note tests for person through
    // ReportResource::updateReportAssessments
    testInstantAssessmentsViaReport("testInstantPersonAssessmentsViaReport",
        "fields.regular.person.assessments.personOnceReportLinguist", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantPersonAssessmentsViaReportEmptyWriteAuthGroups() {
    // Instant ('once') ASSESSMENT note tests for person through
    // ReportResource::updateReportAssessments, with empty write authorization groups defined in the
    // dictionary
    testInstantAssessmentsViaReportEmptyWriteAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.regular.person.assessments.advisorOnceReportNoWrite", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantPersonAssessmentsViaReportNoAuthGroups() {
    // Instant ('once') ASSESSMENT note tests for person through
    // ReportResource::updateReportAssessments, with no authorization groups defined in the
    // dictionary
    testInstantAssessmentsViaReportNoAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.regular.person.assessments.interlocutorOnceReport", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantTaskAssessments() {
    // Instant ('once') ASSESSMENT note tests for task through the NoteResource methods
    testInstantAssessments("testInstantTaskAssessments",
        "fields.task.assessments.taskOnceReportRestricted", false, TEST_TASK_EF2_UUID);
  }

  @Test
  void testInstantTaskAssessmentsEmptyWriteAuthGroups() {
    // Instant ('once') ASSESSMENT note tests for task through the NoteResource methods, with empty
    // write authorization groups defined in the dictionary
    testInstantAssessmentsEmptyWriteAuthGroups("testInstantTaskAssessmentsNoAuthGroups",
        "fields.task.assessments.taskOnceReportNoWrite", false, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantTaskAssessmentsNoAuthGroups() {
    // Instant ('once') ASSESSMENT note tests for task through the NoteResource methods, with no
    // authorization groups defined in the dictionary
    testInstantAssessmentsNoAuthGroups("testInstantTaskAssessmentsNoAuthGroups",
        "fields.task.assessments.taskOnceReport", false, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantTaskAssessmentsViaReport() {
    // Instant ('once') ASSESSMENT note tests for task through
    // ReportResource::updateReportAssessments
    testInstantAssessmentsViaReport("testInstantTaskAssessmentsViaReport",
        "fields.task.assessments.taskOnceReportRestricted", false, TEST_TASK_EF2_UUID);
  }

  @Test
  void testInstantTaskAssessmentsViaReportEmptyWriteAuthGroups() {
    // Instant ('once') ASSESSMENT note tests for task through
    // ReportResource::updateReportAssessments, with empty write authorization groups defined in the
    // dictionary
    testInstantAssessmentsViaReportEmptyWriteAuthGroups(
        "testInstantTaskAssessmentsViaReportNoAuthGroups",
        "fields.task.assessments.taskOnceReportNoWrite", false, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantTaskAssessmentsViaReportNoAuthGroups() {
    // Instant ('once') ASSESSMENT note tests for task through
    // ReportResource::updateReportAssessments, with no authorization groups defined in the
    // dictionary
    testInstantAssessmentsViaReportNoAuthGroups("testInstantTaskAssessmentsViaReportNoAuthGroups",
        "fields.task.assessments.taskOnceReport", false, TEST_TASK_2B_UUID);
  }

  @Test
  void testOndemandAssessments() {
    // On-demand ASSESSMENT note tests
    final String assessmentKey =
        "fields.regular.person.assessments.interlocutorOndemandScreeningAndVetting";
    final String recurrence = "ondemand";

    // - F: create without relatedObjects
    NoteInput testNoteInputFail = createAssessment(assessmentKey, "test", recurrence);
    failNoteCreate(jackUser, testNoteInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, TEST_REPORT_UUID);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failNoteCreate(jackUser, testNoteInputFail);

    // - F: create for a task
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, TEST_TASK_2B_UUID);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testTaskNroInput);
    failNoteCreate(jackUser, testNoteInputFail);

    // - F: create for a report and a person
    final Person interlocutorPerson = getSteveSteveson();
    final String interlocutorPersonUuid = interlocutorPerson.getUuid();
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, interlocutorPersonUuid);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testInterlocutorNroInput);
    failNoteCreate(jackUser, testNoteInputFail);

    // - F: create for a person as someone not in the write auth.groups
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testInterlocutorNroInput);
    failNoteCreate("erin", testNoteInputFail);

    // - S: create for a person as someone in the write auth.groups
    final NoteInput testNoteInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testInterlocutorNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputJack);
    final Note createdNoteJack = succeedNoteCreate(jackUser, testNoteInputJack);

    // - S: create for a person as admin
    final NoteInput testNoteInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testInterlocutorNroInput);
    testNoteInputs.add(testNoteInputAdmin);
    final Note createdNoteAdmin = succeedNoteCreate(adminUser, testNoteInputAdmin);

    // - F: read it as someone not in the read and write auth.groups
    final Person bobPerson = withCredentials(getBobBobtown().getDomainUsername(),
        t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertNotes(bobPerson.getNotes(), Collections.emptyList(), assessmentKey, 1);

    // - S: read it as someone in the read auth.groups
    final Person erinPerson = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    final List<Note> testNotes = erinPerson.getNotes();
    assertNotes(testNotes, testNoteInputs, assessmentKey, 1);

    // - S: read it as admin
    final Person adminPerson = withCredentials(adminUser,
        t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertNotes(adminPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - F: update it as someone not in the write auth.groups
    final NoteInput updatedNoteInputErin = getNoteInput(createdNoteJack);
    updatedNoteInputErin.setText(createAssessmentText("updated by erin", recurrence));
    failNoteUpdate("erin", updatedNoteInputErin);

    // - S: update it as someone in the write auth.groups
    // note author shouldn't matter
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAdmin);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInputJack);
    final Note updatedNoteJack = succeedNoteUpdate(jackUser, updatedNoteInputJack);

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = getNoteInput(createdNoteJack);
    updatedNoteInputAdmin.setText(createAssessmentText("updated by admin", recurrence));
    updatedNotesInput.add(updatedNoteInputAdmin);
    final Note updatedNoteAdmin = succeedNoteUpdate(jackUser, updatedNoteInputAdmin);

    // - S: delete it as someone in the write auth.groups
    // note author shouldn't matter
    succeedNoteDelete(jackUser, updatedNoteAdmin);
    assertThat(updatedNotesInput.remove(updatedNoteInputAdmin)).isTrue();
    assertNotes(
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid)).getNotes(),
        updatedNotesInput, assessmentKey, 1);

    // - S: delete it as admin
    succeedNoteDelete(adminUser, updatedNoteJack);
    assertThat(updatedNotesInput.remove(updatedNoteInputJack)).isTrue();
    assertNotes(
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid)).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  void testOndemandAssessmentsEmptyWriteAuthGroups() {
    // On-demand ASSESSMENT note tests, with empty write authorization groups defined in the
    // dictionary
    final String assessmentKey = "fields.regular.person.assessments.advisorOndemandNoWrite";
    final String recurrence = "ondemand";

    // - F: create for a person with empty write auth.groups defined in the dictionary
    final Person interlocutorPerson = getSteveSteveson();
    final String interlocutorPersonUuid = interlocutorPerson.getUuid();
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, interlocutorPersonUuid);
    final NoteInput testNoteInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testInterlocutorNroInput);
    failNoteCreate(jackUser, testNoteInputJack);

    // - S: create for a person as admin
    final NoteInput testNoteInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testInterlocutorNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAdmin);
    final Note createdNoteAdmin = succeedNoteCreate(adminUser, testNoteInputAdmin);

    // - S: read it with no read auth.groups defined in the dictionary
    final Person jackPerson =
        withCredentials(jackUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertNotes(jackPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - F: update it with empty write auth.groups defined in the dictionary
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAdmin);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    failNoteUpdate(jackUser, updatedNoteInputJack);

    // - F: delete it with empty write auth.groups defined in the dictionary
    failNoteDelete(jackUser, createdNoteAdmin);

    // - S: delete it as admin
    succeedNoteDelete(adminUser, createdNoteAdmin);
    testNoteInputs.remove(testNoteInputAdmin);
    assertNotes(
        withCredentials(adminUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getNotes(),
        testNoteInputs, assessmentKey, 1);
  }

  @Test
  void testOndemandAssessmentsNoAuthGroups() {
    // On-demand ASSESSMENT note tests, with no authorization groups defined in the dictionary
    final String assessmentKey = "fields.regular.person.assessments.advisorOndemand";
    final String recurrence = "ondemand";

    // - S: create for a person with no auth.groups defined in the dictionary
    final Person interlocutorPerson = getSteveSteveson();
    final String interlocutorPersonUuid = interlocutorPerson.getUuid();
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, interlocutorPersonUuid);
    final NoteInput testNoteInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testInterlocutorNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputJack);
    final Note createdNoteJack = succeedNoteCreate(jackUser, testNoteInputJack);

    // - S: read it with no auth.groups defined in the dictionary
    final Person jackPerson =
        withCredentials(jackUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertNotes(jackPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: update it with no auth.groups defined in the dictionary
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteJack);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    succeedNoteUpdate(jackUser, updatedNoteInputJack);

    // - S: delete it with no auth.groups defined in the dictionary
    succeedNoteDelete(jackUser, createdNoteJack);
    testNoteInputs.remove(testNoteInputJack);
    assertNotes(
        withCredentials(adminUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getNotes(),
        testNoteInputs, assessmentKey, 1);
  }

  @Test
  void testPeriodicPersonAssessments() {
    // Periodic ASSESSMENT note tests for person
    final String assessmentKey = "fields.regular.person.assessments.interlocutorMonthly";
    final String recurrence = "monthly";

    // - F: create without relatedObjects
    NoteInput testNoteInputFail = createAssessment(assessmentKey, "test", recurrence);
    failNoteCreate(getRegularUser().getDomainUsername(), testNoteInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, TEST_REPORT_UUID);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failNoteCreate(getRegularUser().getDomainUsername(), testNoteInputFail);

    // - F: create for a report and a person
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, TEST_COUNTERPART_PERSON_UUID);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testInterlocutorNroInput);
    failNoteCreate(getRegularUser().getDomainUsername(), testNoteInputFail);

    // - S: create for a person as someone with counterpart not in the write auth.groups
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "erin", recurrence, testInterlocutorNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate(getRegularUser().getDomainUsername(), testNoteInput);

    // - F: create for a person as someone without counterpart not in the write auth.groups
    testNoteInputFail =
        createAssessment(assessmentKey, "reina", recurrence, testInterlocutorNroInput);
    failNoteCreate("reina", testNoteInputFail);

    // - S: create for a person as someone without counterpart in the write auth.groups
    final NoteInput testNoteInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testInterlocutorNroInput);
    testNoteInputs.add(testNoteInputJack);
    final Note createdNoteJack = succeedNoteCreate(jackUser, testNoteInputJack);

    // - S: create for a person as admin
    final NoteInput testNoteInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testInterlocutorNroInput);
    testNoteInputs.add(testNoteInputAdmin);
    final Note createdNoteAdmin = succeedNoteCreate(adminUser, testNoteInputAdmin);

    // - F: read it as someone not in the read and write auth.groups
    final Person bobPerson = withCredentials(getBobBobtown().getDomainUsername(),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID));
    assertNotes(bobPerson.getNotes(), Collections.emptyList(), assessmentKey, 1);

    // - S: read it as someone in the read auth.groups
    final Person reinaPerson = withCredentials(getReinaReinton().getDomainUsername(),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID));
    assertNotes(reinaPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: read it as admin
    final Person adminPerson = withCredentials(adminUser,
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID));
    assertNotes(adminPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: update it as someone with counterpart not in the write auth.groups
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by erin", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote =
        succeedNoteUpdate(getRegularUser().getDomainUsername(), updatedNoteInput);

    // - F: update it as someone without counterpart not in the write auth.groups
    final NoteInput updatedNoteInputReina = getNoteInput(createdNote);
    updatedNoteInputReina.setText(createAssessmentText("updated by reina", recurrence));
    failNoteUpdate("reina", updatedNoteInputReina);

    // - S: update it as someone without counterpart in the write auth.groups
    // note author shouldn't matter
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAdmin);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    updatedNotesInput.add(updatedNoteInputJack);
    final Note updatedNoteJack = succeedNoteUpdate(jackUser, updatedNoteInputJack);

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = getNoteInput(createdNoteJack);
    updatedNoteInputAdmin.setText(createAssessmentText("updated by admin", recurrence));
    updatedNotesInput.add(updatedNoteInputAdmin);
    final Note updatedNoteAdmin = succeedNoteUpdate(adminUser, updatedNoteInputAdmin);

    // - F: delete it as someone without counterpart not in the write auth.groups
    failNoteDelete("reina", updatedNote);

    // - S: delete it as someone with counterpart not in the write auth.groups
    succeedNoteDelete(getRegularUser().getDomainUsername(), updatedNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(
        withCredentials(getReinaReinton().getDomainUsername(),
            t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID)).getNotes(),
        updatedNotesInput, assessmentKey, 1);

    // - S: delete it as someone without counterpart in the write auth.groups
    // note author shouldn't matter
    succeedNoteDelete(jackUser, updatedNoteAdmin);
    assertThat(updatedNotesInput.remove(updatedNoteInputAdmin)).isTrue();
    assertNotes(
        withCredentials(getReinaReinton().getDomainUsername(),
            t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID)).getNotes(),
        updatedNotesInput, assessmentKey, 1);

    // - S: delete it as admin
    succeedNoteDelete(adminUser, updatedNoteJack);
    assertThat(updatedNotesInput.remove(updatedNoteInputJack)).isTrue();
    assertNotes(
        withCredentials(getReinaReinton().getDomainUsername(),
            t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID)).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicPersonAssessmentsEmptyWriteAuthGroups() {
    // Periodic ASSESSMENT note tests for person, with empty write authorization groups defined in
    // the dictionary
    final String assessmentKey = "fields.regular.person.assessments.advisorQuarterlyNoWrite";
    final String recurrence = "quarterly";

    // - F: create for a person as someone without counterpart and empty write auth.groups defined
    // in the dictionary
    final GenericRelatedObjectInput testPersonNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, TEST_COUNTERPART_PERSON_UUID);
    final NoteInput testNoteInputFail =
        createAssessment(assessmentKey, "andrew", recurrence, testPersonNroInput);
    failNoteCreate("andrew", testNoteInputFail);

    // - S: create for a person as someone with counterpart and empty write auth.groups defined in
    // the dictionary
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "erin", recurrence, testPersonNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate(getRegularUser().getDomainUsername(), testNoteInput);

    // - S: read it with no read auth.groups defined in the dictionary
    final Person andrewPerson = withCredentials(getAndrewAnderson().getDomainUsername(),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID));
    assertNotes(andrewPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - F: update it as someone without counterpart and with empty write auth.groups defined in the
    // dictionary
    final NoteInput updatedNoteInputAndrew = getNoteInput(createdNote);
    updatedNoteInputAndrew.setText(createAssessmentText("updated by andrew", recurrence));
    failNoteUpdate("andrew", updatedNoteInputAndrew);

    // - S: update it as someone with counterpart and with empty write auth.groups defined in the
    // dictionary
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by erin", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote =
        succeedNoteUpdate(getRegularUser().getDomainUsername(), updatedNoteInput);

    // - F: delete it as someone without counterpart and with empty write auth.groups defined in the
    // dictionary
    failNoteDelete("andrew", createdNote);

    // - S: delete it as someone with counterpart and with empty write auth.groups defined in the
    // dictionary
    succeedNoteDelete(getRegularUser().getDomainUsername(), updatedNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(
        withCredentials(getAndrewAnderson().getDomainUsername(),
            t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID)).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicPersonAssessmentsNoAuthGroups() {
    // Periodic ASSESSMENT note tests for person, with no authorization groups defined in the
    // dictionary
    final String assessmentKey = "fields.regular.person.assessments.interlocutorQuarterly";
    final String recurrence = "quarterly";

    // - S: create for a person as someone without counterpart and no auth.groups defined in
    // the dictionary
    final GenericRelatedObjectInput testPersonNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, TEST_COUNTERPART_PERSON_UUID);
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "andrew", recurrence, testPersonNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate(getRegularUser().getDomainUsername(), testNoteInput);

    // - S: read it with no auth.groups defined in the dictionary
    final Person andrewPerson = withCredentials(getAndrewAnderson().getDomainUsername(),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID));
    assertNotes(andrewPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: update it as someone without counterpart and with no auth.groups defined in the
    // dictionary
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by andrew", recurrence));
    succeedNoteUpdate("andrew", updatedNoteInput);
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote =
        succeedNoteUpdate(getRegularUser().getDomainUsername(), updatedNoteInput);

    // - S: delete it as someone without counterpart and with no auth.groups defined in the
    // dictionary
    succeedNoteDelete("andrew", updatedNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(
        withCredentials(getAndrewAnderson().getDomainUsername(),
            t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID)).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicTaskAssessments() {
    // Periodic ASSESSMENT note tests for task
    final String assessmentKey = "fields.task.assessments.taskSemiannuallyRestricted";
    final String recurrence = "semiannually";
    final Person taskResponsible = getAndrewAnderson();

    // - F: create without relatedObjects
    NoteInput testNoteInputFail = createAssessment(assessmentKey, "test", recurrence);
    failNoteCreate(taskResponsible.getDomainUsername(), testNoteInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, TEST_REPORT_UUID);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failNoteCreate(taskResponsible.getDomainUsername(), testNoteInputFail);

    // - F: create for a report and a task
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, TEST_TASK_12A_UUID);
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput, testTaskNroInput);
    failNoteCreate(taskResponsible.getDomainUsername(), testNoteInputFail);

    // - S: create for a task as someone with task permission not in the write auth.groups
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "andrew", recurrence, testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate(taskResponsible.getDomainUsername(), testNoteInput);

    // - F: create for a task as someone without task permission not in the write auth.groups
    testNoteInputFail = createAssessment(assessmentKey, "erin", recurrence, testTaskNroInput);
    failNoteCreate("erin", testNoteInputFail);

    // - S: create for a task as someone without task permission in the write auth.groups
    final NoteInput testNoteInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testTaskNroInput);
    testNoteInputs.add(testNoteInputJack);
    final Note createdNoteJack = succeedNoteCreate(jackUser, testNoteInputJack);

    // - S: create for a task as admin
    final NoteInput testNoteInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testTaskNroInput);
    testNoteInputs.add(testNoteInputAdmin);
    final Note createdNoteAdmin = succeedNoteCreate(adminUser, testNoteInputAdmin);

    // - F: read it as someone not in the read and write auth.groups
    final Task bobTask = withCredentials(getBobBobtown().getDomainUsername(),
        t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID));
    assertNotes(bobTask.getNotes(), Collections.emptyList(), assessmentKey, 1);

    // - S: read it as someone in the read auth.groups
    final Task erinTask = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID));
    assertNotes(erinTask.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: read it as admin
    final Task adminTask =
        withCredentials(adminUser, t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID));
    assertNotes(adminTask.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: update it as someone with task permission not in the write auth.groups
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by andrew", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote =
        succeedNoteUpdate(taskResponsible.getDomainUsername(), updatedNoteInput);

    // - F: update it as someone without task permission not in the write auth.groups
    final NoteInput updatedNoteInputErin = getNoteInput(createdNote);
    updatedNoteInputErin.setText(createAssessmentText("updated by erin", recurrence));
    failNoteUpdate("erin", updatedNoteInputErin);

    // - S: update it as someone without task permission in the write auth.groups
    // note author shouldn't matter
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAdmin);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    updatedNotesInput.add(updatedNoteInputJack);
    final Note updatedNoteJack = succeedNoteUpdate(jackUser, updatedNoteInputJack);

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = getNoteInput(createdNoteJack);
    updatedNoteInputAdmin.setText(createAssessmentText("updated by admin", recurrence));
    updatedNotesInput.add(updatedNoteInputAdmin);
    final Note updatedNoteAdmin = succeedNoteUpdate(adminUser, updatedNoteInputAdmin);

    // - F: delete it as someone without task permission not in the write auth.groups
    failNoteDelete("erin", createdNote);

    // - S: delete it as someone with task permission not in the write auth.groups
    succeedNoteDelete(taskResponsible.getDomainUsername(), updatedNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID)).getNotes(),
        updatedNotesInput, assessmentKey, 1);

    // - S: delete it as someone without task permission in the write auth.groups
    // note author shouldn't matter
    succeedNoteDelete(jackUser, updatedNoteAdmin);
    assertThat(updatedNotesInput.remove(updatedNoteInputAdmin)).isTrue();
    assertNotes(
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID)).getNotes(),
        updatedNotesInput, assessmentKey, 1);

    // - S: delete it as admin
    succeedNoteDelete(adminUser, updatedNoteJack);
    assertThat(updatedNotesInput.remove(updatedNoteInputJack)).isTrue();
    assertNotes(
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID)).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicTaskAssessmentsEmptyWriteAuthGroups() {
    // Periodic ASSESSMENT note tests for task, with empty write authorization groups defined in the
    // dictionary
    final String assessmentKey = "fields.task.assessments.taskSemiannuallyNoWrite";
    final String recurrence = "semiannually";
    final Person taskResponsible = getAndrewAnderson();

    // - F: create for a task as someone without task permission and empty write auth.groups defined
    // in the dictionary
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, TEST_TASK_12A_UUID);
    final NoteInput testNoteInputFail =
        createAssessment(assessmentKey, "erin", recurrence, testTaskNroInput);
    failNoteCreate("erin", testNoteInputFail);

    // - S: create for a task as someone with task permission and empty write auth.groups defined in
    // the dictionary
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "andrew", recurrence, testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate(taskResponsible.getDomainUsername(), testNoteInput);

    // - S: read it with no read auth.groups defined in the dictionary
    final Task erinTask = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID));
    assertNotes(erinTask.getNotes(), testNoteInputs, assessmentKey, 1);

    // - F: update it as someone without task permission and with empty write auth.groups defined in
    // the dictionary
    final NoteInput updatedNoteInputErin = getNoteInput(createdNote);
    updatedNoteInputErin.setText(createAssessmentText("updated by erin", recurrence));
    failNoteUpdate("erin", updatedNoteInputErin);

    // - S: update it as someone with task permission and with empty write auth.groups defined in
    // the dictionary
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by andrew", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote =
        succeedNoteUpdate(taskResponsible.getDomainUsername(), updatedNoteInput);

    // - F: delete it as someone without task permission and with empty write auth.groups defined in
    // the dictionary
    failNoteDelete("erin", createdNote);

    // - S: delete it as someone with task permission and with empty write auth.groups defined in
    // the dictionary
    succeedNoteDelete(taskResponsible.getDomainUsername(), updatedNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID)).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicTaskAssessmentsNoAuthGroups() {
    // Periodic ASSESSMENT note tests for task, with no authorization groups defined in the
    // dictionary
    final String assessmentKey = "fields.task.assessments.taskMonthly";
    final String recurrence = "monthly";

    // - S: create for a task as someone without task permission and no auth.groups defined in
    // the dictionary
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, TEST_TASK_12A_UUID);
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "erin", recurrence, testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate("erin", testNoteInput);

    // - S: read it with no auth.groups defined in the dictionary
    final Task erinTask = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID));
    assertNotes(erinTask.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: update it as someone without task permission and with no auth.groups defined in
    // the dictionary
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by erin", recurrence));
    succeedNoteUpdate("erin", updatedNoteInput);
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote = succeedNoteUpdate("erin", updatedNoteInput);

    // - S: delete it as someone without task permission and with no auth.groups defined in
    // the dictionary
    succeedNoteDelete("erin", createdNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID)).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  private void testInstantAssessments(final String testName, final String assessmentKey,
      final boolean forPerson, final String taskUuid) {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();

    // Create a test report
    final Person interlocutorPerson = getSteveSteveson();
    final ReportPerson interlocutor = personToPrimaryReportPerson(interlocutorPerson, true);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput =
        ReportInput.builder().withEngagementDate(Instant.now()).withIntent(testName)
            .withReportPeople(getReportPeopleInput(
                Lists.newArrayList(interlocutor, personToReportAuthor(reportAuthor))))
            .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));
    final String reportUuid = createdReport.getUuid();

    // - F: create without relatedObjects
    NoteInput testNoteInputFail = createAssessment(assessmentKey, "test", recurrence);
    failNoteCreate(reportAuthor.getDomainUsername(), testNoteInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failNoteCreate(reportAuthor.getDomainUsername(), testNoteInputFail);

    // - F: create for a person
    final GenericRelatedObjectInput testAdvisorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, reportAuthor.getUuid());
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput);
    failNoteCreate(reportAuthor.getDomainUsername(), testNoteInputFail);

    // - F: create for a task
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testTaskNroInput);
    failNoteCreate(reportAuthor.getDomainUsername(), testNoteInputFail);

    // - F: create for two reports
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput, testReportNroInput);
    failNoteCreate(reportAuthor.getDomainUsername(), testNoteInputFail);

    // - F: create for a person and a task
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput, testTaskNroInput);
    failNoteCreate(reportAuthor.getDomainUsername(), testNoteInputFail);

    // - F: create for a report, a person and a task
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testAdvisorNroInput, testTaskNroInput);
    failNoteCreate(reportAuthor.getDomainUsername(), testNoteInputFail);

    // - F: create as non-author for a report and a person
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testAdvisorNroInput);
    failNoteCreate("erin", testNoteInputFail);

    // - F: create for a non-existing report and a person/task
    final GenericRelatedObjectInput testInvalidReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, "non-existing");
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence,
        testInvalidReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    failNoteCreate(reportAuthor.getDomainUsername(), testNoteInputFail);

    // - S: create as author for a report and a person/task
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    final Note createdNoteAuthor =
        succeedNoteCreate(reportAuthor.getDomainUsername(), testNoteInputAuthor);

    // - S: create as someone else in the write auth.groups
    final NoteInput testNoteInputJack = createAssessment(assessmentKey, "jack", recurrence,
        testReportNroInput, testAdvisorNroInput);
    testNoteInputs.add(testNoteInputJack);
    final Note createdNoteJack = succeedNoteCreate(jackUser, testNoteInputJack);

    // - S: create as admin
    final NoteInput testNoteInputAdmin = createAssessment(assessmentKey, "admin", recurrence,
        testReportNroInput, testAdvisorNroInput);
    testNoteInputs.add(testNoteInputAdmin);
    final Note createdNoteAdmin = succeedNoteCreate(adminUser, testNoteInputAdmin);

    // - S: read it as author
    final Report updatedReport = withCredentials(reportAuthor.getDomainUsername(),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    final List<Note> testNotes = updatedReport.getNotes();
    assertNotes(testNotes, testNoteInputs, assessmentKey, 2);

    // - S: read it as someone else in the read auth.groups
    final Report erinReport = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertNotes(erinReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - F: read it as someone else not in the read and write auth.groups
    final Report bobReport = withCredentials(getBobBobtown().getDomainUsername(),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertNotes(bobReport.getNotes(), Collections.emptyList(), assessmentKey, 2);

    // - S: read it as admin
    final Report adminReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertNotes(adminReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - F: update it as someone else not in the write auth.groups
    final NoteInput updatedNoteInputErin = getNoteInput(createdNoteAuthor);
    updatedNoteInputErin.setText(createAssessmentText("updated by erin", recurrence));
    failNoteUpdate("erin", updatedNoteInputErin);

    // - S: update it as author
    final NoteInput updatedNoteInputAuthor = getNoteInput(createdNoteAuthor);
    updatedNoteInputAuthor.setText(createAssessmentText("updated by author", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInputAuthor);
    final Note updatedNoteAuthor =
        succeedNoteUpdate(reportAuthor.getDomainUsername(), updatedNoteInputAuthor);

    // - S: update it as someone else in the write auth.groups
    // note author shouldn't matter
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAdmin);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    updatedNotesInput.add(updatedNoteInputJack);
    final Note updatedNoteJack = succeedNoteUpdate(jackUser, updatedNoteInputJack);

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = getNoteInput(createdNoteJack);
    updatedNoteInputAdmin.setText(createAssessmentText("updated by admin", recurrence));
    updatedNotesInput.add(updatedNoteInputAdmin);
    final Note updatedNoteAdmin = succeedNoteUpdate(jackUser, updatedNoteInputAdmin);

    // - F: delete it as someone else not in the write auth.groups
    failNoteDelete("erin", updatedNoteAuthor);

    // - S: delete it as author
    succeedNoteDelete(reportAuthor.getDomainUsername(), updatedNoteAuthor);
    assertThat(updatedNotesInput.remove(updatedNoteInputAuthor)).isTrue();
    assertNotes(
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getNotes(),
        updatedNotesInput, assessmentKey, 2);

    // - S: delete it as someone else in the write auth.groups
    // note author shouldn't matter
    succeedNoteDelete(jackUser, updatedNoteAdmin);
    assertThat(updatedNotesInput.remove(updatedNoteInputAdmin)).isTrue();
    assertNotes(
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getNotes(),
        updatedNotesInput, assessmentKey, 2);

    // - S: delete it as admin
    succeedNoteDelete(adminUser, updatedNoteJack);
    assertThat(updatedNotesInput.remove(updatedNoteInputJack)).isTrue();
    assertNotes(
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getNotes(),
        updatedNotesInput, assessmentKey, 2);

    // Delete the test report
    withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.deleteReport("", reportUuid));
  }

  private void testInstantAssessmentsEmptyWriteAuthGroups(final String testName,
      final String assessmentKey, final boolean forPerson, final String taskUuid) {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();

    // Create a test report
    final Person interlocutorPerson = getSteveSteveson();
    final ReportPerson interlocutor = personToPrimaryReportPerson(interlocutorPerson, true);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput =
        ReportInput.builder().withEngagementDate(Instant.now()).withIntent(testName)
            .withReportPeople(getReportPeopleInput(
                Lists.newArrayList(interlocutor, personToReportAuthor(reportAuthor))))
            .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, createdReport.getUuid());
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, interlocutorPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testInterlocutorNroInput : testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    final Note createdNoteAuthor =
        succeedNoteCreate(reportAuthor.getDomainUsername(), testNoteInputAuthor);
    assertNotes(
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, createdReport.getUuid()))
            .getNotes(),
        testNoteInputs, assessmentKey, 2);

    // - F: update it as someone else with empty write auth.groups defined in the dictionary
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAuthor);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    failNoteUpdate(jackUser, updatedNoteInputJack);

    // - F: delete it as someone else with empty write auth.groups defined in the dictionary
    failNoteDelete(jackUser, createdNoteAuthor);

    // - S: delete it as author
    succeedNoteDelete(reportAuthor.getDomainUsername(), createdNoteAuthor);
    testNoteInputs.remove(testNoteInputAuthor);
    assertNotes(
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, createdReport.getUuid()))
            .getNotes(),
        testNoteInputs, assessmentKey, 2);

    // Delete the test report
    withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.deleteReport("", createdReport.getUuid()));
  }

  private void testInstantAssessmentsNoAuthGroups(final String testName, final String assessmentKey,
      final boolean forPerson, final String taskUuid) {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();

    // Create a test report
    final Person interlocutorPerson = getSteveSteveson();
    final ReportPerson interlocutor = personToPrimaryReportPerson(interlocutorPerson, true);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput =
        ReportInput.builder().withEngagementDate(Instant.now()).withIntent(testName)
            .withReportPeople(getReportPeopleInput(
                Lists.newArrayList(interlocutor, personToReportAuthor(reportAuthor))))
            .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, createdReport.getUuid());
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, interlocutorPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testInterlocutorNroInput : testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    final Note createdNoteAuthor =
        succeedNoteCreate(reportAuthor.getDomainUsername(), testNoteInputAuthor);
    assertNotes(
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, createdReport.getUuid()))
            .getNotes(),
        testNoteInputs, assessmentKey, 2);

    // - S: update it as someone else with no auth.groups defined in the dictionary
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAuthor);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    succeedNoteUpdate(jackUser, updatedNoteInputJack);

    // - S: delete it as someone else with no auth.groups defined in the dictionary
    succeedNoteDelete(jackUser, createdNoteAuthor);

    // Delete the test report
    withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.deleteReport("", createdReport.getUuid()));
  }

  private void testInstantAssessmentsViaReport(final String testName, final String assessmentKey,
      final boolean forPerson, final String taskUuid) {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();
    final Person reportApprover = getYoshieBeau();

    // Create a test report
    final Person interlocutorPerson = getSteveSteveson();
    final ReportPerson interlocutor = personToPrimaryReportPerson(interlocutorPerson, true);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput =
        ReportInput.builder().withEngagementDate(Instant.now()).withIntent(testName)
            .withReportPeople(getReportPeopleInput(
                Lists.newArrayList(interlocutor, personToPrimaryReportAuthor(reportAuthor))))
            .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));
    final String reportUuid = createdReport.getUuid();
    final int nrSubmitted = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.submitReport("", reportUuid));
    assertThat(nrSubmitted).isOne();

    // - F: create without relatedObjects
    NoteInput testNoteInputFail = createAssessment(assessmentKey, "test", recurrence);
    failUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid, testNoteInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid, testNoteInputFail);

    // - F: create non-assessment for a report
    testNoteInputFail = NoteInput.builder().withType(NoteType.FREE_TEXT).withText("test")
        .withNoteRelatedObjects(Lists.newArrayList(testReportNroInput)).build();
    failUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid, testNoteInputFail);

    // - F: create for a person
    final GenericRelatedObjectInput testAdvisorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, reportAuthor.getUuid());
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput);
    failUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid, testNoteInputFail);

    // - F: create for a task
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testTaskNroInput);
    failUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid, testNoteInputFail);

    // - F: create for two reports
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput, testReportNroInput);
    failUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid, testNoteInputFail);

    // - F: create for a person and a task
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput, testTaskNroInput);
    failUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid, testNoteInputFail);

    // - F: create for a report, a person and a task
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testAdvisorNroInput, testTaskNroInput);
    failUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid, testNoteInputFail);

    // - F: create as non-author for a report and a person
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testAdvisorNroInput);
    failUpdateReportAssessments("erin", reportUuid, testNoteInputFail);

    // - F: create for a non-existing report and a person/task
    final GenericRelatedObjectInput testInvalidReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, "non-existing");
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence,
        testInvalidReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    failUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid, testNoteInputFail);

    // - F: create for a report and a person/task, against a non-existing report
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testInvalidReportNroInput);
    failUpdateReportAssessments(reportAuthor.getDomainUsername(), "non-existing",
        testNoteInputAuthor);

    // - S: create as author for a report and a person
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    succeedUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid,
        testNoteInputAuthor);

    // - S: create as approver
    final NoteInput testNoteInputApprover = createAssessment(assessmentKey, "approver", recurrence,
        testReportNroInput, testAdvisorNroInput);
    testNoteInputs.add(testNoteInputApprover);
    succeedUpdateReportAssessments(reportApprover.getDomainUsername(), reportUuid,
        testNoteInputAuthor, testNoteInputApprover);

    // - S: create as someone else in the write auth.groups
    final NoteInput testNoteInputJack = createAssessment(assessmentKey, "jack", recurrence,
        testReportNroInput, testAdvisorNroInput);
    testNoteInputs.add(testNoteInputJack);
    succeedUpdateReportAssessments(jackUser, reportUuid, testNoteInputAuthor, testNoteInputApprover,
        testNoteInputJack);

    // - S: create as admin
    final NoteInput testNoteInputAdmin = createAssessment(assessmentKey, "admin", recurrence,
        testReportNroInput, testAdvisorNroInput);
    testNoteInputs.add(testNoteInputAdmin);
    succeedUpdateReportAssessments(adminUser, reportUuid, testNoteInputAuthor,
        testNoteInputApprover, testNoteInputJack, testNoteInputAdmin);

    // - S: read it as author
    final Report updatedReport = withCredentials(reportAuthor.getDomainUsername(),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    final List<Note> testNotes = updatedReport.getNotes();
    assertNotes(testNotes, testNoteInputs, assessmentKey, 2);

    // - S: read it as approver
    final Report approverReport = withCredentials(reportApprover.getDomainUsername(),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertNotes(approverReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - S: read it as someone else in the read auth.groups
    final Report erinReport = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertNotes(erinReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - F: read it as someone else not in the read and write auth.groups
    final Report bobReport = withCredentials(getBobBobtown().getDomainUsername(),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertNotes(bobReport.getNotes(), Collections.emptyList(), assessmentKey, 2);

    // - S: read it as admin
    final Report adminReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertNotes(adminReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - F: update it as someone else not in the write auth.groups
    final List<NoteInput> createdNotesInput = getNotesInput(testNotes);
    failUpdateReportAssessments("erin", reportUuid,
        Iterables.toArray(createdNotesInput, NoteInput.class));

    // - S: update it as author
    final NoteInput updatedNoteInputAuthor = createdNotesInput.get(0);
    updatedNoteInputAuthor.setText(createAssessmentText("updated by author", recurrence));
    succeedUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid,
        Iterables.toArray(createdNotesInput, NoteInput.class));

    // - S: update it as approver
    // note author shouldn't matter
    final NoteInput updatedNoteInputApprover = createdNotesInput.get(2);
    updatedNoteInputApprover.setText(createAssessmentText("updated by approver", recurrence));
    succeedUpdateReportAssessments(reportApprover.getDomainUsername(), reportUuid,
        Iterables.toArray(createdNotesInput, NoteInput.class));

    // - S: update it as someone else in the write auth.groups
    final NoteInput updatedNoteInputJack = createdNotesInput.get(3);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    succeedUpdateReportAssessments(jackUser, reportUuid,
        Iterables.toArray(createdNotesInput, NoteInput.class));

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = createdNotesInput.get(1);
    updatedNoteInputAdmin.setText(createAssessmentText("updated by admin", recurrence));
    succeedUpdateReportAssessments(jackUser, reportUuid,
        Iterables.toArray(createdNotesInput, NoteInput.class));

    // - F: delete it as someone else not in the write auth.groups
    failUpdateReportAssessments("erin", reportUuid);

    // - S: delete it as author
    final List<Note> updatedNotes = withCredentials(reportAuthor.getDomainUsername(),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getNotes();
    final List<NoteInput> updatedNotesInput = getNotesInput(updatedNotes);
    Collections.reverse(updatedNotesInput);
    assertThat(updatedNotesInput.remove(0)).isNotNull();
    succeedUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));
    assertNotes(
        withCredentials(reportAuthor.getDomainUsername(),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getNotes(),
        updatedNotesInput, assessmentKey, 2);

    // - S: delete it as approver
    // note author shouldn't matter
    assertThat(updatedNotesInput.remove(2)).isNotNull();
    succeedUpdateReportAssessments(reportApprover.getDomainUsername(), reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));
    assertNotes(
        withCredentials(reportAuthor.getDomainUsername(),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getNotes(),
        updatedNotesInput, assessmentKey, 2);

    // - S: delete it as someone else in the write auth.groups
    assertThat(updatedNotesInput.remove(1)).isNotNull();
    succeedUpdateReportAssessments(jackUser, reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));
    assertNotes(
        withCredentials(reportAuthor.getDomainUsername(),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getNotes(),
        updatedNotesInput, assessmentKey, 2);

    // - S: delete it as admin
    assertThat(updatedNotesInput.remove(0)).isNotNull();
    succeedUpdateReportAssessments(adminUser, reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));
    assertNotes(
        withCredentials(reportAuthor.getDomainUsername(),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getNotes(),
        updatedNotesInput, assessmentKey, 2);

    // Get the test report
    final Report report = withCredentials(reportAuthor.getDomainUsername(),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    // Update it as author so it goes back to draft
    withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.updateReport(REPORT_FIELDS, getReportInput(report), false));
    // Then delete it
    final int nrDeleted = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.deleteReport("", reportUuid));
    assertThat(nrDeleted).isOne();
  }

  private void testInstantAssessmentsViaReportEmptyWriteAuthGroups(final String testName,
      final String assessmentKey, final boolean forPerson, final String taskUuid) {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();

    // Create a test report
    final Person interlocutorPerson = getSteveSteveson();
    final ReportPerson interlocutor = personToPrimaryReportPerson(interlocutorPerson, true);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput =
        ReportInput.builder().withEngagementDate(Instant.now()).withIntent(testName)
            .withReportPeople(getReportPeopleInput(
                Lists.newArrayList(interlocutor, personToPrimaryReportAuthor(reportAuthor))))
            .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));
    final String reportUuid = createdReport.getUuid();
    final int nrSubmitted = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.submitReport("", reportUuid));
    assertThat(nrSubmitted).isOne();

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, interlocutorPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testInterlocutorNroInput : testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    succeedUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid,
        testNoteInputAuthor);

    // - S: read it as someone else with no read auth.groups defined in the dictionary
    final Report jackReport =
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertNotes(jackReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - F: update it as someone else with empty write auth.groups defined in the dictionary
    final List<NoteInput> updatedNotesInput = getNotesInput(jackReport.getNotes());
    final NoteInput updatedNoteInputJack = updatedNotesInput.get(0);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    failUpdateReportAssessments(jackUser, reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));

    // - F: delete it as someone else with empty write auth.groups defined in the dictionary
    failUpdateReportAssessments(jackUser, reportUuid);

    // - S: delete it as author
    succeedUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid);
    testNoteInputs.remove(testNoteInputAuthor);
    assertNotes(
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getNotes(),
        testNoteInputs, assessmentKey, 2);

    // Get the test report
    final Report report = withCredentials(reportAuthor.getDomainUsername(),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    // Update it as author so it goes back to draft
    withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.updateReport(REPORT_FIELDS, getReportInput(report), false));
    // Then delete it
    final int nrDeleted = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.deleteReport("", reportUuid));
    assertThat(nrDeleted).isOne();
  }

  private void testInstantAssessmentsViaReportNoAuthGroups(final String testName,
      final String assessmentKey, final boolean forPerson, final String taskUuid) {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();

    // Create a test report
    final Person interlocutorPerson = getSteveSteveson();
    final ReportPerson interlocutor = personToPrimaryReportPerson(interlocutorPerson, true);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput =
        ReportInput.builder().withEngagementDate(Instant.now()).withIntent(testName)
            .withReportPeople(getReportPeopleInput(
                Lists.newArrayList(interlocutor, personToPrimaryReportAuthor(reportAuthor))))
            .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));
    final String reportUuid = createdReport.getUuid();
    final int nrSubmitted = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.submitReport("", reportUuid));
    assertThat(nrSubmitted).isOne();

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, interlocutorPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testInterlocutorNroInput : testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    succeedUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid,
        testNoteInputAuthor);

    // - S: read it as someone else with no auth.groups defined in the dictionary
    final Report jackReport =
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertNotes(jackReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - S: update it as someone else with no auth.groups defined in the dictionary
    final List<NoteInput> updatedNotesInput = getNotesInput(jackReport.getNotes());
    final NoteInput updatedNoteInputJack = updatedNotesInput.get(0);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    succeedUpdateReportAssessments(jackUser, reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));

    // - S: delete it as someone else with no auth.groups defined in the dictionary
    succeedUpdateReportAssessments(reportAuthor.getDomainUsername(), reportUuid);
    testNoteInputs.remove(testNoteInputAuthor);
    assertNotes(
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getNotes(),
        testNoteInputs, assessmentKey, 2);

    // Get the test report
    final Report report = withCredentials(reportAuthor.getDomainUsername(),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    // Update it as author so it goes back to draft
    withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.updateReport(REPORT_FIELDS, getReportInput(report), false));
    // Then delete it
    final int nrDeleted = withCredentials(reportAuthor.getDomainUsername(),
        t -> mutationExecutor.deleteReport("", reportUuid));
    assertThat(nrDeleted).isOne();
  }

  private NoteInput createAssessment(final String assessmentKey, final String text,
      final String recurrence, GenericRelatedObjectInput... noteRelatedObjects) {
    return NoteInput.builder().withType(NoteType.ASSESSMENT).withAssessmentKey(assessmentKey)
        .withText(createAssessmentText(text, recurrence))
        .withNoteRelatedObjects(Lists.newArrayList(noteRelatedObjects)).build();
  }

  private String createAssessmentText(final String text, final String recurrence) {
    return String.format("{\"text\":\"%s\",\"%s\":\"%s\"}", text, NOTE_RECURRENCE, recurrence);
  }

  private GenericRelatedObjectInput createNoteRelatedObject(final String tableName,
      final String uuid) {
    return GenericRelatedObjectInput.builder().withRelatedObjectType(tableName)
        .withRelatedObjectUuid(uuid).build();
  }

  private void failNoteCreate(final String username, final NoteInput noteInput) {
    try {
      withCredentials(username, t -> mutationExecutor.createNote(NOTE_FIELDS, noteInput));
      fail("Expected exception creating instant assessment");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void failNoteUpdate(final String username, final NoteInput noteInput) {
    try {
      withCredentials(username, t -> mutationExecutor.updateNote(NOTE_FIELDS, noteInput));
      fail("Expected exception updating note");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void failNoteDelete(final String username, final Note note) {
    try {
      withCredentials(username, t -> mutationExecutor.deleteNote("", note.getUuid()));
      fail("Expected exception deleting note");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private Note succeedNoteCreate(final String username, final NoteInput noteInput) {
    final Note createdNote =
        withCredentials(username, t -> mutationExecutor.createNote(NOTE_FIELDS, noteInput));
    assertThat(createdNote).isNotNull();
    assertThat(createdNote.getUuid()).isNotNull();
    return createdNote;
  }

  private Note succeedNoteUpdate(final String username, final NoteInput noteInput) {
    final Note updatedNote =
        withCredentials(username, t -> mutationExecutor.updateNote(NOTE_FIELDS, noteInput));
    assertThat(updatedNote).isNotNull();
    assertThat(updatedNote.getText()).isEqualTo(noteInput.getText());
    return updatedNote;
  }

  private Integer succeedNoteDelete(final String username, final Note note) {
    final Integer nrDeleted =
        withCredentials(username, t -> mutationExecutor.deleteNote("", note.getUuid()));
    assertThat(nrDeleted).isOne();
    return nrDeleted;
  }

  private void failUpdateReportAssessments(final String username, final String reportUuid,
      final NoteInput... noteInputs) {
    try {
      withCredentials(username, t -> mutationExecutor.updateReportAssessments("",
          Lists.newArrayList(noteInputs), reportUuid));
      fail("Expected exception creating instant assessment");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private Integer succeedUpdateReportAssessments(final String username, final String reportUuid,
      final NoteInput... noteInputs) {
    final Integer nrUpdated = withCredentials(username, t -> mutationExecutor
        .updateReportAssessments("", Lists.newArrayList(noteInputs), reportUuid));
    assertThat(nrUpdated).isEqualTo(noteInputs.length);
    return nrUpdated;
  }

  private void assertNotes(final List<Note> testNotes, final List<NoteInput> testNoteInputs,
      final String assessmentKey, final int nrRelatedObjects) {
    final List<Note> filteredNotes = testNotes.stream()
        .filter(n -> assessmentKey.equals(n.getAssessmentKey())).collect(Collectors.toList());
    assertThat(filteredNotes).hasSameSizeAs(testNoteInputs);
    // Filtered notes are in reverse chronological order
    Collections.reverse(filteredNotes);
    for (int i = 0; i < filteredNotes.size(); i++) {
      final NoteInput ni = testNoteInputs.get(i);
      assertThat(filteredNotes.get(i))
          .matches(n -> n.getText().equals(ni.getText()), "has correct text")
          .matches(n -> n.getNoteRelatedObjects().size() == nrRelatedObjects,
              "has correct related objects");
    }
  }

  private void assertFreeTextNotes(final List<Note> testNotes, final List<NoteInput> testNoteInputs,
      final int nrRelatedObjects) {
    assertThat(testNotes).isNotNull();
    assertThat(testNotes).hasSameSizeAs(testNoteInputs);
    Collections.reverse(testNotes);
    for (int i = 0; i < testNotes.size(); i++) {
      final NoteInput ni = testNoteInputs.get(i);
      assertThat(testNotes.get(i))
          .matches(n -> n.getText().equals(ni.getText()), "has correct text")
          .matches(n -> n.getNoteRelatedObjects().size() == nrRelatedObjects,
              "has correct related objects");
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
