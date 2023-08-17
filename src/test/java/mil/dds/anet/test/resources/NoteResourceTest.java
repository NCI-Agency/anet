package mil.dds.anet.test.resources;

import static mil.dds.anet.utils.PendingAssessmentsHelper.NOTE_RECURRENCE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.Lists;
import com.google.inject.Injector;
import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import graphql.com.google.common.collect.Iterables;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import javax.inject.Inject;
import javax.inject.Provider;
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
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.client.util.QueryExecutor;
import mil.dds.anet.test.integration.utils.TestApp;
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
  private static final String REPORT_FIELDS =
      String.format("{ uuid intent state reportPeople { uuid name author attendee primary }"
          + " tasks { uuid shortName } %1$s }", _NOTES_FIELDS);
  private static final String TASK_FIELDS = String.format("{ uuid shortName %1$s }", _NOTES_FIELDS);

  // The authorization groups defined in the dictionary give Erin read access and Jack write access;
  // these test objects can be used for the assessments authorization tests
  // Top-level task EF 2
  private static final String TEST_TOPTASK_UUID = "cd35abe7-a5c9-4b3e-885b-4c72bf564ed7";
  // Sub-level task 2.B
  private static final String TEST_SUBTASK_UUID = "2200a820-c4c7-4c9c-946c-f0c9c9e045c5";
  // Sub-level task 1.2.A, Andrew is responsible
  private static final String TEST_RESPONSIBLE_TASK_UUID = "953e0b0b-25e6-44b6-bc77-ef98251d046a";
  // Person Christopf, Erin is counterpart
  private static final String TEST_COUNTERPART_PERSON_UUID = "237e8bf7-2ae4-4d49-b7c8-eca6a92d4767";
  // Report "Discuss improvements in Annual Budgeting process"
  private static final String TEST_REPORT_UUID = "9bb1861c-1f55-4a1b-bd3d-3c1f56d739b5";

  private static NoteCounterDao noteCounterDao;

  @BeforeAll
  public static void setUpDao() {
    final Injector injector = InjectorLookup.getInjector(TestApp.app.getApplication()).get();
    noteCounterDao = injector.getInstance(NoteCounterDao.class);
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
    final GenericRelatedObjectInput testNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());
    final NoteInput testNoteInput = NoteInput.builder().withType(NoteType.FREE_TEXT)
        .withText("a report test note created by testDeleteDanglingReportNote")
        .withNoteRelatedObjects(Collections.singletonList(testNroInput)).build();
    final Note createdNote = succeedNoteCreate(adminMutationExecutor, testNoteInput);

    final Report updatedReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note reportNote = updatedReport.getNotes().get(0);
    assertThat(reportNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(reportNote.getNoteRelatedObjects()).hasSize(1);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted = adminMutationExecutor.deleteReport("", testReport.getUuid());
    assertThat(nrDeleted).isEqualTo(1);
    // Note is deleted thus needs to be less than before
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should not be there, try to update it
    createdNote.setText("a report test note updated by testDeleteDanglingReportNote");
    failNoteUpdate(adminMutationExecutor, getNoteInput(createdNote));
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

    final GenericRelatedObjectInput testNroReportInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());
    final GenericRelatedObjectInput testNroTaskInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, task.getUuid());
    final NoteInput testNoteInput = createAssessment("testDeleteDanglingReportTaskAssessment",
        "a report test task assessment created by testDeleteDanglingReportTaskAssessment", "once",
        testNroReportInput, testNroTaskInput);
    final Note createdNote = succeedNoteCreate(adminMutationExecutor, testNoteInput);

    final Report updatedReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note reportNote = updatedReport.getNotes().get(0);
    assertThat(reportNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(reportNote.getNoteRelatedObjects()).hasSize(2);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted = adminMutationExecutor.deleteReport("", testReport.getUuid());
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should not be there, try to update it
    createdNote.setText("{\"text\":"
        + "\"a report test task assessment updated by testDeleteDanglingReportTaskAssessment\"}");
    failNoteUpdate(adminMutationExecutor, getNoteInput(createdNote));
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

    final GenericRelatedObjectInput testNroReportInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());
    final GenericRelatedObjectInput testNroTaskInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, attendee.getUuid());
    final NoteInput testNoteInput = createAssessment("testDeleteDanglingReportAttendeeAssessment",
        "a report test attendee assessment created by testDeleteDanglingReportAttendeeAssessment",
        "once", testNroReportInput, testNroTaskInput);
    final Note createdNote = succeedNoteCreate(adminMutationExecutor, testNoteInput);

    final Report updatedReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note reportNote = updatedReport.getNotes().get(0);
    assertThat(reportNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(reportNote.getNoteRelatedObjects()).hasSize(2);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted = adminMutationExecutor.deleteReport("", testReport.getUuid());
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should not be there, try to update it
    createdNote.setText("{\"text\":"
        + "\"a report test attendee assessment updated by testDeleteDanglingReportAttendeeAssessment\"}");
    failNoteUpdate(adminMutationExecutor, getNoteInput(createdNote));
  }

  @Test
  public void testDeleteDanglingPositionNote()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create test position
    final PositionInput testPositionInput = PositionInput.builder()
        .withName("a test position created by testDeleteDanglingPositionNote")
        .withType(PositionType.ADVISOR).withStatus(Status.INACTIVE).withRole(PositionRole.MEMBER)
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
    final GenericRelatedObjectInput testNroInput =
        createNoteRelatedObject(PositionDao.TABLE_NAME, testPosition.getUuid());
    final NoteInput testNoteInput = NoteInput.builder().withType(NoteType.FREE_TEXT)
        .withText("a position test note created by testDeleteDanglingPositionNote")
        .withNoteRelatedObjects(Collections.singletonList(testNroInput)).build();
    final Note createdNote = succeedNoteCreate(adminMutationExecutor, testNoteInput);

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
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should not be there, try to update it
    createdNote.setText("a position test note updated by testDeleteDanglingPositionNote");
    failNoteUpdate(adminMutationExecutor, getNoteInput(createdNote));
  }

  @Test
  public void testInvalidNotes()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Completely empty note
    final NoteInput invalidNoteInput = NoteInput.builder().build();
    failNoteCreate(jackMutationExecutor, invalidNoteInput);
    // Free text without text
    invalidNoteInput.setType(NoteType.FREE_TEXT);
    failNoteCreate(jackMutationExecutor, invalidNoteInput);
    // Assessment without key
    invalidNoteInput.setType(NoteType.ASSESSMENT);
    failNoteCreate(jackMutationExecutor, invalidNoteInput);
    // Assessment with invalid key
    invalidNoteInput.setAssessmentKey("unknown");
    failNoteCreate(jackMutationExecutor, invalidNoteInput);
    // Assessment without text
    invalidNoteInput.setAssessmentKey("fields.task.subLevel.assessments.subTaskOnceReport");
    failNoteCreate(jackMutationExecutor, invalidNoteInput);
    // Assessment with different recurrence from dictionary key
    invalidNoteInput.setText(createAssessmentText("test", "ondemand"));
    failNoteCreate(jackMutationExecutor, invalidNoteInput);
  }

  @Test
  public void testFreeTextNotes()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Note: future DIAGRAM note tests can be the same as these
    final Person principalPerson = getSteveSteveson();
    final String principalPersonUuid = principalPerson.getUuid();

    final NoteInput freeTextNoteInput =
        NoteInput.builder().withType(NoteType.FREE_TEXT).withText("Free text test").build();
    // - F: create without relatedObjects
    failNoteCreate(jackMutationExecutor, freeTextNoteInput);

    // - S: create with self
    final GenericRelatedObjectInput testPrincipalNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, principalPersonUuid);
    freeTextNoteInput.setNoteRelatedObjects(Collections.singletonList(testPrincipalNroInput));

    final Note freeTextNote = succeedNoteCreate(jackMutationExecutor, freeTextNoteInput);
    final List<Note> principalNotes = Lists.newArrayList(freeTextNote);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(freeTextNoteInput);

    // - S: create as admin
    final NoteInput freeTextNoteInputAdmin = NoteInput.builder().withType(NoteType.FREE_TEXT)
        .withText("Free text test as admin").build();
    freeTextNoteInputAdmin.setNoteRelatedObjects(Collections.singletonList(testPrincipalNroInput));
    final Note freeTextNoteAdmin = succeedNoteCreate(adminMutationExecutor, freeTextNoteInputAdmin);
    principalNotes.add(freeTextNoteAdmin);
    principalPerson.setNotes(principalNotes);
    testNoteInputs.add(freeTextNoteInputAdmin);

    // - S: read it
    Collections.reverse(principalPerson.getNotes());
    assertFreeTextNotes(principalPerson.getNotes(), testNoteInputs, 1);

    // - S: read it as someone else
    final QueryExecutor bobQueryExecutor = getQueryExecutor(getBobBobtown().getDomainUsername());
    final Person bobPerson = bobQueryExecutor.person(PERSON_FIELDS, principalPersonUuid);
    assertFreeTextNotes(bobPerson.getNotes(), testNoteInputs, 1);

    // - S: read it as admin
    final Person adminPerson = adminQueryExecutor.person(PERSON_FIELDS, principalPersonUuid);
    assertFreeTextNotes(adminPerson.getNotes(), testNoteInputs, 1);

    // - S: update it
    final NoteInput updatedNoteInputJack = getNoteInput(freeTextNote);
    updatedNoteInputJack.setText("Updated by jack");
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInputJack);
    final Note updatedNoteJack = succeedNoteUpdate(jackMutationExecutor, updatedNoteInputJack);

    // - F: update it as someone else
    final MutationExecutor erinMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());
    final NoteInput failedUpdateNoteInput = getNoteInput(freeTextNote);
    failedUpdateNoteInput.setText("Updated by erin");
    failNoteUpdate(erinMutationExecutor, failedUpdateNoteInput);

    // - F: update it as someone else by faking the note author
    final NoteInput failedFakeAuthorNoteInput = getNoteInput(freeTextNote);
    failedFakeAuthorNoteInput.setAuthor(getPersonInput(getRegularUser()));
    failNoteUpdate(erinMutationExecutor, failedFakeAuthorNoteInput);

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = getNoteInput(freeTextNoteAdmin);
    updatedNoteInputAdmin.setText("Updated by admin");
    updatedNotesInput.add(updatedNoteInputAdmin);
    final Note updatedNoteAdmin = succeedNoteUpdate(adminMutationExecutor, updatedNoteInputAdmin);

    // - F: delete it as someone else
    failNoteDelete(erinMutationExecutor, updatedNoteJack);

    // - S: delete it
    succeedNoteDelete(jackMutationExecutor, updatedNoteJack);
    assertThat(updatedNotesInput.remove(updatedNoteInputJack)).isTrue();
    Collections.reverse(jackQueryExecutor.person(PERSON_FIELDS, principalPersonUuid).getNotes());
    assertFreeTextNotes(jackQueryExecutor.person(PERSON_FIELDS, principalPersonUuid).getNotes(),
        updatedNotesInput, 1);

    // - S: delete it as admin
    succeedNoteDelete(adminMutationExecutor, updatedNoteAdmin);
    assertThat(updatedNotesInput.remove(updatedNoteInputAdmin)).isTrue();
    Collections.reverse(adminQueryExecutor.person(PERSON_FIELDS, principalPersonUuid).getNotes());
    assertFreeTextNotes(adminQueryExecutor.person(PERSON_FIELDS, principalPersonUuid).getNotes(),
        updatedNotesInput, 1);
  }

  @Test
  public void testInstantPersonAssessments()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for person through the NoteResource methods
    testInstantAssessments("testInstantPersonAssessments",
        "fields.advisor.person.assessments.advisorOnceReportLinguist", true, TEST_SUBTASK_UUID);
  }

  @Test
  void testInstantPersonAssessmentsEmptyWriteAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for person through the NoteResource methods, with
    // empty write authorization groups defined in the dictionary
    testInstantAssessmentsEmptyWriteAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.advisor.person.assessments.advisorOnceReportNoWrite", true, TEST_SUBTASK_UUID);
  }

  @Test
  public void testInstantPersonAssessmentsNoAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for person through the NoteResource methods, with no
    // authorization groups defined in the dictionary
    testInstantAssessmentsNoAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.principal.person.assessments.principalOnceReport", true, TEST_SUBTASK_UUID);
  }

  @Test
  public void testInstantPersonAssessmentsViaReport()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for person through
    // ReportResource::updateReportAssessments
    testInstantAssessmentsViaReport("testInstantPersonAssessmentsViaReport",
        "fields.advisor.person.assessments.advisorOnceReportLinguist", true, TEST_SUBTASK_UUID);
  }

  @Test
  void testInstantPersonAssessmentsViaReportEmptyWriteAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for person through
    // ReportResource::updateReportAssessments, with empty write authorization groups defined in the
    // dictionary
    testInstantAssessmentsViaReportEmptyWriteAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.advisor.person.assessments.advisorOnceReportNoWrite", true, TEST_SUBTASK_UUID);
  }

  @Test
  public void testInstantPersonAssessmentsViaReportNoAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for person through
    // ReportResource::updateReportAssessments, with no authorization groups defined in the
    // dictionary
    testInstantAssessmentsViaReportNoAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.principal.person.assessments.principalOnceReport", true, TEST_SUBTASK_UUID);
  }

  @Test
  public void testInstantTaskAssessments()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for task through the NoteResource methods
    testInstantAssessments("testInstantTaskAssessments",
        "fields.task.topLevel.assessments.topTaskOnceReport", false, TEST_TOPTASK_UUID);
  }

  @Test
  void testInstantTaskAssessmentsEmptyWriteAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for task through the NoteResource methods, with empty
    // write authorization groups defined in the dictionary
    testInstantAssessmentsEmptyWriteAuthGroups("testInstantTaskAssessmentsNoAuthGroups",
        "fields.task.topLevel.assessments.topTaskOnceReportNoWrite", false, TEST_SUBTASK_UUID);
  }

  @Test
  public void testInstantTaskAssessmentsNoAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for task through the NoteResource methods, with no
    // authorization groups defined in the dictionary
    testInstantAssessmentsNoAuthGroups("testInstantTaskAssessmentsNoAuthGroups",
        "fields.task.subLevel.assessments.subTaskOnceReport", false, TEST_SUBTASK_UUID);
  }

  @Test
  public void testInstantTaskAssessmentsViaReport()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for task through
    // ReportResource::updateReportAssessments
    testInstantAssessmentsViaReport("testInstantTaskAssessmentsViaReport",
        "fields.task.topLevel.assessments.topTaskOnceReport", false, TEST_TOPTASK_UUID);
  }

  @Test
  void testInstantTaskAssessmentsViaReportEmptyWriteAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for task through
    // ReportResource::updateReportAssessments, with empty write authorization groups defined in the
    // dictionary
    testInstantAssessmentsViaReportEmptyWriteAuthGroups(
        "testInstantTaskAssessmentsViaReportNoAuthGroups",
        "fields.task.topLevel.assessments.topTaskOnceReportNoWrite", false, TEST_SUBTASK_UUID);
  }

  @Test
  public void testInstantTaskAssessmentsViaReportNoAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Instant ('once') ASSESSMENT note tests for task through
    // ReportResource::updateReportAssessments, with no authorization groups defined in the
    // dictionary
    testInstantAssessmentsViaReportNoAuthGroups("testInstantTaskAssessmentsViaReportNoAuthGroups",
        "fields.task.subLevel.assessments.subTaskOnceReport", false, TEST_SUBTASK_UUID);
  }

  @Test
  public void testOndemandAssessments()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // On-demand ASSESSMENT note tests
    final String assessmentKey =
        "fields.principal.person.assessments.principalOndemandScreeningAndVetting";
    final String recurrence = "ondemand";

    // - F: create without relatedObjects
    NoteInput testNoteInputFail = createAssessment(assessmentKey, "test", recurrence);
    failNoteCreate(jackMutationExecutor, testNoteInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, TEST_REPORT_UUID);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failNoteCreate(jackMutationExecutor, testNoteInputFail);

    // - F: create for a task
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, TEST_SUBTASK_UUID);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testTaskNroInput);
    failNoteCreate(jackMutationExecutor, testNoteInputFail);

    // - F: create for a report and a person
    final Person principalPerson = getSteveSteveson();
    final String principalPersonUuid = principalPerson.getUuid();
    final GenericRelatedObjectInput testPrincipalNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, principalPersonUuid);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testPrincipalNroInput);
    failNoteCreate(jackMutationExecutor, testNoteInputFail);

    // - F: create for a person as someone not in the write auth.groups
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testPrincipalNroInput);
    final MutationExecutor erinMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());
    failNoteCreate(erinMutationExecutor, testNoteInputFail);

    // - S: create for a person as someone in the write auth.groups
    final NoteInput testNoteInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testPrincipalNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputJack);
    final Note createdNoteJack = succeedNoteCreate(jackMutationExecutor, testNoteInputJack);

    // - S: create for a person as admin
    final NoteInput testNoteInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testPrincipalNroInput);
    testNoteInputs.add(testNoteInputAdmin);
    final Note createdNoteAdmin = succeedNoteCreate(adminMutationExecutor, testNoteInputAdmin);

    // - F: read it as someone not in the read and write auth.groups
    final QueryExecutor bobQueryExecutor = getQueryExecutor(getBobBobtown().getDomainUsername());
    final Person bobPerson = bobQueryExecutor.person(PERSON_FIELDS, principalPersonUuid);
    assertNotes(bobPerson.getNotes(), Collections.emptyList(), assessmentKey, 1);

    // - S: read it as someone in the read auth.groups
    final QueryExecutor erinQueryExecutor = getQueryExecutor(getRegularUser().getDomainUsername());
    final Person erinPerson = erinQueryExecutor.person(PERSON_FIELDS, principalPersonUuid);
    final List<Note> testNotes = erinPerson.getNotes();
    assertNotes(testNotes, testNoteInputs, assessmentKey, 1);

    // - S: read it as admin
    final Person adminPerson = adminQueryExecutor.person(PERSON_FIELDS, principalPersonUuid);
    assertNotes(adminPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - F: update it as someone not in the write auth.groups
    final NoteInput updatedNoteInputErin = getNoteInput(createdNoteJack);
    updatedNoteInputErin.setText(createAssessmentText("updated by erin", recurrence));
    failNoteUpdate(erinMutationExecutor, updatedNoteInputErin);

    // - S: update it as someone in the write auth.groups
    // note author shouldn't matter
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAdmin);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInputJack);
    final Note updatedNoteJack = succeedNoteUpdate(jackMutationExecutor, updatedNoteInputJack);

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = getNoteInput(createdNoteJack);
    updatedNoteInputAdmin.setText(createAssessmentText("updated by admin", recurrence));
    updatedNotesInput.add(updatedNoteInputAdmin);
    final Note updatedNoteAdmin = succeedNoteUpdate(jackMutationExecutor, updatedNoteInputAdmin);

    // - S: delete it as someone in the write auth.groups
    // note author shouldn't matter
    succeedNoteDelete(jackMutationExecutor, updatedNoteAdmin);
    assertThat(updatedNotesInput.remove(updatedNoteInputAdmin)).isTrue();
    assertNotes(erinQueryExecutor.person(PERSON_FIELDS, principalPersonUuid).getNotes(),
        updatedNotesInput, assessmentKey, 1);

    // - S: delete it as admin
    succeedNoteDelete(adminMutationExecutor, updatedNoteJack);
    assertThat(updatedNotesInput.remove(updatedNoteInputJack)).isTrue();
    assertNotes(erinQueryExecutor.person(PERSON_FIELDS, principalPersonUuid).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  void testOndemandAssessmentsEmptyWriteAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // On-demand ASSESSMENT note tests, with empty write authorization groups defined in the
    // dictionary
    final String assessmentKey = "fields.advisor.person.assessments.advisorOndemandNoWrite";
    final String recurrence = "ondemand";

    // - F: create for a person with empty write auth.groups defined in the dictionary
    final Person principalPerson = getSteveSteveson();
    final String principalPersonUuid = principalPerson.getUuid();
    final GenericRelatedObjectInput testPrincipalNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, principalPersonUuid);
    final NoteInput testNoteInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testPrincipalNroInput);
    failNoteCreate(jackMutationExecutor, testNoteInputJack);

    // - S: create for a person as admin
    final NoteInput testNoteInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testPrincipalNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAdmin);
    final Note createdNoteAdmin = succeedNoteCreate(adminMutationExecutor, testNoteInputAdmin);

    // - S: read it with no read auth.groups defined in the dictionary
    final Person jackPerson = jackQueryExecutor.person(PERSON_FIELDS, principalPersonUuid);
    assertNotes(jackPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - F: update it with empty write auth.groups defined in the dictionary
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAdmin);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    failNoteUpdate(jackMutationExecutor, updatedNoteInputJack);

    // - F: delete it with empty write auth.groups defined in the dictionary
    failNoteDelete(jackMutationExecutor, createdNoteAdmin);

    // - S: delete it as admin
    succeedNoteDelete(adminMutationExecutor, createdNoteAdmin);
    testNoteInputs.remove(testNoteInputAdmin);
    assertNotes(adminQueryExecutor.person(PERSON_FIELDS, principalPersonUuid).getNotes(),
        testNoteInputs, assessmentKey, 1);
  }

  @Test
  void testOndemandAssessmentsNoAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // On-demand ASSESSMENT note tests, with no authorization groups defined in the dictionary
    final String assessmentKey = "fields.advisor.person.assessments.advisorOndemand";
    final String recurrence = "ondemand";

    // - S: create for a person with no auth.groups defined in the dictionary
    final Person principalPerson = getSteveSteveson();
    final String principalPersonUuid = principalPerson.getUuid();
    final GenericRelatedObjectInput testPrincipalNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, principalPersonUuid);
    final NoteInput testNoteInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testPrincipalNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputJack);
    final Note createdNoteJack = succeedNoteCreate(jackMutationExecutor, testNoteInputJack);

    // - S: read it with no auth.groups defined in the dictionary
    final Person jackPerson = jackQueryExecutor.person(PERSON_FIELDS, principalPersonUuid);
    assertNotes(jackPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: update it with no auth.groups defined in the dictionary
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteJack);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    succeedNoteUpdate(jackMutationExecutor, updatedNoteInputJack);

    // - S: delete it with no auth.groups defined in the dictionary
    succeedNoteDelete(jackMutationExecutor, createdNoteJack);
    testNoteInputs.remove(testNoteInputJack);
    assertNotes(adminQueryExecutor.person(PERSON_FIELDS, principalPersonUuid).getNotes(),
        testNoteInputs, assessmentKey, 1);
  }

  @Test
  public void testPeriodicPersonAssessments()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Periodic ASSESSMENT note tests for person
    final String assessmentKey = "fields.principal.person.assessments.principalMonthly";
    final String recurrence = "monthly";
    final MutationExecutor personCounterpartMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());

    // - F: create without relatedObjects
    NoteInput testNoteInputFail = createAssessment(assessmentKey, "test", recurrence);
    failNoteCreate(personCounterpartMutationExecutor, testNoteInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, TEST_REPORT_UUID);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failNoteCreate(personCounterpartMutationExecutor, testNoteInputFail);

    // - F: create for a report and a person
    final GenericRelatedObjectInput testPrincipalNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, TEST_COUNTERPART_PERSON_UUID);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testPrincipalNroInput);
    failNoteCreate(personCounterpartMutationExecutor, testNoteInputFail);

    // - S: create for a person as someone with counterpart not in the write auth.groups
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "erin", recurrence, testPrincipalNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate(personCounterpartMutationExecutor, testNoteInput);

    // - F: create for a person as someone without counterpart not in the write auth.groups
    testNoteInputFail = createAssessment(assessmentKey, "reina", recurrence, testPrincipalNroInput);
    final MutationExecutor reinaMutationExecutor =
        getMutationExecutor(getReinaReinton().getDomainUsername());
    failNoteCreate(reinaMutationExecutor, testNoteInputFail);

    // - S: create for a person as someone without counterpart in the write auth.groups
    final NoteInput testNoteInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testPrincipalNroInput);
    testNoteInputs.add(testNoteInputJack);
    final Note createdNoteJack = succeedNoteCreate(jackMutationExecutor, testNoteInputJack);

    // - S: create for a person as admin
    final NoteInput testNoteInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testPrincipalNroInput);
    testNoteInputs.add(testNoteInputAdmin);
    final Note createdNoteAdmin = succeedNoteCreate(adminMutationExecutor, testNoteInputAdmin);

    // - F: read it as someone not in the read and write auth.groups
    final QueryExecutor bobQueryExecutor = getQueryExecutor(getBobBobtown().getDomainUsername());
    final Person bobPerson = bobQueryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID);
    assertNotes(bobPerson.getNotes(), Collections.emptyList(), assessmentKey, 1);

    // - S: read it as someone in the read auth.groups
    final QueryExecutor reinaQueryExecutor =
        getQueryExecutor(getReinaReinton().getDomainUsername());
    final Person reinaPerson =
        reinaQueryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID);
    assertNotes(reinaPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: read it as admin
    final Person adminPerson =
        adminQueryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID);
    assertNotes(adminPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: update it as someone with counterpart not in the write auth.groups
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by erin", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote = succeedNoteUpdate(personCounterpartMutationExecutor, updatedNoteInput);

    // - F: update it as someone without counterpart not in the write auth.groups
    final NoteInput updatedNoteInputReina = getNoteInput(createdNote);
    updatedNoteInputReina.setText(createAssessmentText("updated by reina", recurrence));
    failNoteUpdate(reinaMutationExecutor, updatedNoteInputReina);

    // - S: update it as someone without counterpart in the write auth.groups
    // note author shouldn't matter
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAdmin);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    updatedNotesInput.add(updatedNoteInputJack);
    final Note updatedNoteJack = succeedNoteUpdate(jackMutationExecutor, updatedNoteInputJack);

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = getNoteInput(createdNoteJack);
    updatedNoteInputAdmin.setText(createAssessmentText("updated by admin", recurrence));
    updatedNotesInput.add(updatedNoteInputAdmin);
    final Note updatedNoteAdmin = succeedNoteUpdate(adminMutationExecutor, updatedNoteInputAdmin);

    // - F: delete it as someone without counterpart not in the write auth.groups
    failNoteDelete(reinaMutationExecutor, updatedNote);

    // - S: delete it as someone with counterpart not in the write auth.groups
    succeedNoteDelete(personCounterpartMutationExecutor, updatedNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(reinaQueryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID).getNotes(),
        updatedNotesInput, assessmentKey, 1);

    // - S: delete it as someone without counterpart in the write auth.groups
    // note author shouldn't matter
    succeedNoteDelete(jackMutationExecutor, updatedNoteAdmin);
    assertThat(updatedNotesInput.remove(updatedNoteInputAdmin)).isTrue();
    assertNotes(reinaQueryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID).getNotes(),
        updatedNotesInput, assessmentKey, 1);

    // - S: delete it as admin
    succeedNoteDelete(adminMutationExecutor, updatedNoteJack);
    assertThat(updatedNotesInput.remove(updatedNoteInputJack)).isTrue();
    assertNotes(reinaQueryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicPersonAssessmentsEmptyWriteAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Periodic ASSESSMENT note tests for person, with empty write authorization groups defined in
    // the
    // dictionary
    final String assessmentKey = "fields.advisor.person.assessments.advisorQuarterlyNoWrite";
    final String recurrence = "quarterly";
    final MutationExecutor personCounterpartMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());

    // - F: create for a person as someone without counterpart and empty write auth.groups defined
    // in
    // the dictionary
    final GenericRelatedObjectInput testPersonNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, TEST_COUNTERPART_PERSON_UUID);
    final NoteInput testNoteInputFail =
        createAssessment(assessmentKey, "andrew", recurrence, testPersonNroInput);
    final MutationExecutor andrewMutationExecutor =
        getMutationExecutor(getAndrewAnderson().getDomainUsername());
    failNoteCreate(andrewMutationExecutor, testNoteInputFail);

    // - S: create for a person as someone with counterpart and empty write auth.groups defined in
    // the
    // dictionary
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "erin", recurrence, testPersonNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate(personCounterpartMutationExecutor, testNoteInput);

    // - S: read it with no read auth.groups defined in the dictionary
    final QueryExecutor andrewQueryExecutor =
        getQueryExecutor(getAndrewAnderson().getDomainUsername());
    final Person andrewPerson =
        andrewQueryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID);
    assertNotes(andrewPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - F: update it as someone without counterpart and with empty write auth.groups defined in the
    // dictionary
    final NoteInput updatedNoteInputAndrew = getNoteInput(createdNote);
    updatedNoteInputAndrew.setText(createAssessmentText("updated by andrew", recurrence));
    failNoteUpdate(andrewMutationExecutor, updatedNoteInputAndrew);

    // - S: update it as someone with counterpart and with empty write auth.groups defined in the
    // dictionary
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by erin", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote = succeedNoteUpdate(personCounterpartMutationExecutor, updatedNoteInput);

    // - F: delete it as someone without counterpart and with empty write auth.groups defined in the
    // dictionary
    failNoteDelete(andrewMutationExecutor, createdNote);

    // - S: delete it as someone with counterpart and with empty write auth.groups defined in the
    // dictionary
    succeedNoteDelete(personCounterpartMutationExecutor, updatedNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(andrewQueryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicPersonAssessmentsNoAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Periodic ASSESSMENT note tests for person, with no authorization groups defined in the
    // dictionary
    final String assessmentKey = "fields.principal.person.assessments.principalQuarterly";
    final String recurrence = "quarterly";
    final MutationExecutor personCounterpartMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());

    // - S: create for a person as someone without counterpart and no auth.groups defined in
    // the dictionary
    final GenericRelatedObjectInput testPersonNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, TEST_COUNTERPART_PERSON_UUID);
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "andrew", recurrence, testPersonNroInput);
    final MutationExecutor andrewMutationExecutor =
        getMutationExecutor(getAndrewAnderson().getDomainUsername());
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate(personCounterpartMutationExecutor, testNoteInput);

    // - S: read it with no auth.groups defined in the dictionary
    final QueryExecutor andrewQueryExecutor =
        getQueryExecutor(getAndrewAnderson().getDomainUsername());
    final Person andrewPerson =
        andrewQueryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID);
    assertNotes(andrewPerson.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: update it as someone without counterpart and with no auth.groups defined in the
    // dictionary
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by andrew", recurrence));
    succeedNoteUpdate(andrewMutationExecutor, updatedNoteInput);
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote = succeedNoteUpdate(personCounterpartMutationExecutor, updatedNoteInput);

    // - S: delete it as someone without counterpart and with no auth.groups defined in the
    // dictionary
    succeedNoteDelete(andrewMutationExecutor, updatedNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(andrewQueryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  public void testPeriodicTaskAssessments()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Periodic ASSESSMENT note tests for task
    final String assessmentKey = "fields.task.topLevel.assessments.topTaskSemiannually";
    final String recurrence = "semiannually";
    final Person taskResponsible = getAndrewAnderson();
    final MutationExecutor taskResponsibleMutationExecutor =
        getMutationExecutor(taskResponsible.getDomainUsername());

    // - F: create without relatedObjects
    NoteInput testNoteInputFail = createAssessment(assessmentKey, "test", recurrence);
    failNoteCreate(taskResponsibleMutationExecutor, testNoteInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, TEST_REPORT_UUID);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failNoteCreate(taskResponsibleMutationExecutor, testNoteInputFail);

    // - F: create for a report and a task
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, TEST_RESPONSIBLE_TASK_UUID);
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput, testTaskNroInput);
    failNoteCreate(taskResponsibleMutationExecutor, testNoteInputFail);

    // - S: create for a task as someone with task permission not in the write auth.groups
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "andrew", recurrence, testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate(taskResponsibleMutationExecutor, testNoteInput);

    // - F: create for a task as someone without task permission not in the write auth.groups
    testNoteInputFail = createAssessment(assessmentKey, "erin", recurrence, testTaskNroInput);
    final MutationExecutor erinMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());
    failNoteCreate(erinMutationExecutor, testNoteInputFail);

    // - S: create for a task as someone without task permission in the write auth.groups
    final NoteInput testNoteInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testTaskNroInput);
    testNoteInputs.add(testNoteInputJack);
    final Note createdNoteJack = succeedNoteCreate(jackMutationExecutor, testNoteInputJack);

    // - S: create for a task as admin
    final NoteInput testNoteInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testTaskNroInput);
    testNoteInputs.add(testNoteInputAdmin);
    final Note createdNoteAdmin = succeedNoteCreate(adminMutationExecutor, testNoteInputAdmin);

    // - F: read it as someone not in the read and write auth.groups
    final QueryExecutor bobQueryExecutor = getQueryExecutor(getBobBobtown().getDomainUsername());
    final Task bobTask = bobQueryExecutor.task(TASK_FIELDS, TEST_RESPONSIBLE_TASK_UUID);
    assertNotes(bobTask.getNotes(), Collections.emptyList(), assessmentKey, 1);

    // - S: read it as someone in the read auth.groups
    final QueryExecutor erinQueryExecutor = getQueryExecutor(getRegularUser().getDomainUsername());
    final Task erinTask = erinQueryExecutor.task(TASK_FIELDS, TEST_RESPONSIBLE_TASK_UUID);
    assertNotes(erinTask.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: read it as admin
    final Task adminTask = adminQueryExecutor.task(TASK_FIELDS, TEST_RESPONSIBLE_TASK_UUID);
    assertNotes(adminTask.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: update it as someone with task permission not in the write auth.groups
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by andrew", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote = succeedNoteUpdate(taskResponsibleMutationExecutor, updatedNoteInput);

    // - F: update it as someone without task permission not in the write auth.groups
    final NoteInput updatedNoteInputErin = getNoteInput(createdNote);
    updatedNoteInputErin.setText(createAssessmentText("updated by erin", recurrence));
    failNoteUpdate(erinMutationExecutor, updatedNoteInputErin);

    // - S: update it as someone without task permission in the write auth.groups
    // note author shouldn't matter
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAdmin);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    updatedNotesInput.add(updatedNoteInputJack);
    final Note updatedNoteJack = succeedNoteUpdate(jackMutationExecutor, updatedNoteInputJack);

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = getNoteInput(createdNoteJack);
    updatedNoteInputAdmin.setText(createAssessmentText("updated by admin", recurrence));
    updatedNotesInput.add(updatedNoteInputAdmin);
    final Note updatedNoteAdmin = succeedNoteUpdate(adminMutationExecutor, updatedNoteInputAdmin);

    // - F: delete it as someone without task permission not in the write auth.groups
    failNoteDelete(erinMutationExecutor, createdNote);

    // - S: delete it as someone with task permission not in the write auth.groups
    succeedNoteDelete(taskResponsibleMutationExecutor, updatedNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(erinQueryExecutor.task(TASK_FIELDS, TEST_RESPONSIBLE_TASK_UUID).getNotes(),
        updatedNotesInput, assessmentKey, 1);

    // - S: delete it as someone without task permission in the write auth.groups
    // note author shouldn't matter
    succeedNoteDelete(jackMutationExecutor, updatedNoteAdmin);
    assertThat(updatedNotesInput.remove(updatedNoteInputAdmin)).isTrue();
    assertNotes(erinQueryExecutor.task(TASK_FIELDS, TEST_RESPONSIBLE_TASK_UUID).getNotes(),
        updatedNotesInput, assessmentKey, 1);

    // - S: delete it as admin
    succeedNoteDelete(adminMutationExecutor, updatedNoteJack);
    assertThat(updatedNotesInput.remove(updatedNoteInputJack)).isTrue();
    assertNotes(erinQueryExecutor.task(TASK_FIELDS, TEST_RESPONSIBLE_TASK_UUID).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicTaskAssessmentsEmptyWriteAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Periodic ASSESSMENT note tests for task, with empty write authorization groups defined in the
    // dictionary
    final String assessmentKey = "fields.task.topLevel.assessments.topTaskSemiannuallyNoWrite";
    final String recurrence = "semiannually";
    final Person taskResponsible = getAndrewAnderson();
    final MutationExecutor taskResponsibleMutationExecutor =
        getMutationExecutor(taskResponsible.getDomainUsername());

    // - F: create for a task as someone without task permission and empty write auth.groups defined
    // in
    // the dictionary
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, TEST_RESPONSIBLE_TASK_UUID);
    final NoteInput testNoteInputFail =
        createAssessment(assessmentKey, "erin", recurrence, testTaskNroInput);
    final MutationExecutor erinMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());
    failNoteCreate(erinMutationExecutor, testNoteInputFail);

    // - S: create for a task as someone with task permission and empty write auth.groups defined in
    // the dictionary
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "andrew", recurrence, testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate(taskResponsibleMutationExecutor, testNoteInput);

    // - S: read it with no read auth.groups defined in the dictionary
    final QueryExecutor erinQueryExecutor = getQueryExecutor(getRegularUser().getDomainUsername());
    final Task erinTask = erinQueryExecutor.task(TASK_FIELDS, TEST_RESPONSIBLE_TASK_UUID);
    assertNotes(erinTask.getNotes(), testNoteInputs, assessmentKey, 1);

    // - F: update it as someone without task permission and with empty write auth.groups defined in
    // the dictionary
    final NoteInput updatedNoteInputErin = getNoteInput(createdNote);
    updatedNoteInputErin.setText(createAssessmentText("updated by erin", recurrence));
    failNoteUpdate(erinMutationExecutor, updatedNoteInputErin);

    // - S: update it as someone with task permission and with empty write auth.groups defined in
    // the
    // dictionary
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by andrew", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote = succeedNoteUpdate(taskResponsibleMutationExecutor, updatedNoteInput);

    // - F: delete it as someone without task permission and with empty write auth.groups defined in
    // the dictionary
    failNoteDelete(erinMutationExecutor, createdNote);

    // - S: delete it as someone with task permission and with empty write auth.groups defined in
    // the
    // dictionary
    succeedNoteDelete(taskResponsibleMutationExecutor, updatedNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(erinQueryExecutor.task(TASK_FIELDS, TEST_RESPONSIBLE_TASK_UUID).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicTaskAssessmentsNoAuthGroups()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Periodic ASSESSMENT note tests for task, with no authorization groups defined in the
    // dictionary
    final String assessmentKey = "fields.task.subLevel.assessments.subTaskMonthly";
    final String recurrence = "monthly";
    final Person taskResponsible = getAndrewAnderson();
    final MutationExecutor taskResponsibleMutationExecutor =
        getMutationExecutor(taskResponsible.getDomainUsername());

    // - S: create for a task as someone without task permission and no auth.groups defined in
    // the dictionary
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, TEST_RESPONSIBLE_TASK_UUID);
    final NoteInput testNoteInput =
        createAssessment(assessmentKey, "erin", recurrence, testTaskNroInput);
    final MutationExecutor erinMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInput);
    final Note createdNote = succeedNoteCreate(erinMutationExecutor, testNoteInput);

    // - S: read it with no auth.groups defined in the dictionary
    final QueryExecutor erinQueryExecutor = getQueryExecutor(getRegularUser().getDomainUsername());
    final Task erinTask = erinQueryExecutor.task(TASK_FIELDS, TEST_RESPONSIBLE_TASK_UUID);
    assertNotes(erinTask.getNotes(), testNoteInputs, assessmentKey, 1);

    // - S: update it as someone without task permission and with no auth.groups defined in
    // the dictionary
    final NoteInput updatedNoteInput = getNoteInput(createdNote);
    updatedNoteInput.setText(createAssessmentText("updated by erin", recurrence));
    succeedNoteUpdate(erinMutationExecutor, updatedNoteInput);
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInput);
    final Note updatedNote = succeedNoteUpdate(erinMutationExecutor, updatedNoteInput);

    // - S: delete it as someone without task permission and with no auth.groups defined in
    // the dictionary
    succeedNoteDelete(erinMutationExecutor, createdNote);
    assertThat(updatedNotesInput.remove(updatedNoteInput)).isTrue();
    assertNotes(erinQueryExecutor.task(TASK_FIELDS, TEST_RESPONSIBLE_TASK_UUID).getNotes(),
        updatedNotesInput, assessmentKey, 1);
  }

  private void testInstantAssessments(final String testName, final String assessmentKey,
      final boolean forPerson, final String taskUuid)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();
    final QueryExecutor reportAuthorQueryExecutor =
        getQueryExecutor(reportAuthor.getDomainUsername());
    final MutationExecutor reportAuthorMutationExecutor =
        getMutationExecutor(reportAuthor.getDomainUsername());

    // Create a test report
    final Person principalPerson = getSteveSteveson();
    final ReportPerson principal = personToPrimaryReportPerson(principalPerson);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput = ReportInput.builder().withEngagementDate(Instant.now())
        .withIntent(testName)
        .withReportPeople(
            getReportPeopleInput(Lists.newArrayList(principal, personToReportAuthor(reportAuthor))))
        .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport =
        reportAuthorMutationExecutor.createReport(REPORT_FIELDS, reportInput);
    final String reportUuid = createdReport.getUuid();

    // - F: create without relatedObjects
    NoteInput testNoteInputFail = createAssessment(assessmentKey, "test", recurrence);
    failNoteCreate(reportAuthorMutationExecutor, testNoteInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failNoteCreate(reportAuthorMutationExecutor, testNoteInputFail);

    // - F: create for a person
    final GenericRelatedObjectInput testAdvisorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, reportAuthor.getUuid());
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput);
    failNoteCreate(reportAuthorMutationExecutor, testNoteInputFail);

    // - F: create for a task
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testTaskNroInput);
    failNoteCreate(reportAuthorMutationExecutor, testNoteInputFail);

    // - F: create for two reports
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput, testReportNroInput);
    failNoteCreate(reportAuthorMutationExecutor, testNoteInputFail);

    // - F: create for a person and a task
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput, testTaskNroInput);
    failNoteCreate(reportAuthorMutationExecutor, testNoteInputFail);

    // - F: create for a report, a person and a task
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testAdvisorNroInput, testTaskNroInput);
    failNoteCreate(reportAuthorMutationExecutor, testNoteInputFail);

    // - F: create as non-author for a report and a person
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testAdvisorNroInput);
    final MutationExecutor erinMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());
    failNoteCreate(erinMutationExecutor, testNoteInputFail);

    // - F: create for a non-existing report and a person/task
    final GenericRelatedObjectInput testInvalidReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, "non-existing");
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence,
        testInvalidReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    failNoteCreate(reportAuthorMutationExecutor, testNoteInputFail);

    // - S: create as author for a report and a person/task
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    final Note createdNoteAuthor =
        succeedNoteCreate(reportAuthorMutationExecutor, testNoteInputAuthor);

    // - S: create as someone else in the write auth.groups
    final NoteInput testNoteInputJack = createAssessment(assessmentKey, "jack", recurrence,
        testReportNroInput, testAdvisorNroInput);
    testNoteInputs.add(testNoteInputJack);
    final Note createdNoteJack = succeedNoteCreate(jackMutationExecutor, testNoteInputJack);

    // - S: create as admin
    final NoteInput testNoteInputAdmin = createAssessment(assessmentKey, "admin", recurrence,
        testReportNroInput, testAdvisorNroInput);
    testNoteInputs.add(testNoteInputAdmin);
    final Note createdNoteAdmin = succeedNoteCreate(adminMutationExecutor, testNoteInputAdmin);

    // - S: read it as author
    final Report updatedReport = reportAuthorQueryExecutor.report(REPORT_FIELDS, reportUuid);
    final List<Note> testNotes = updatedReport.getNotes();
    assertNotes(testNotes, testNoteInputs, assessmentKey, 2);

    // - S: read it as someone else in the read auth.groups
    final QueryExecutor erinQueryExecutor = getQueryExecutor(getRegularUser().getDomainUsername());
    final Report erinReport = erinQueryExecutor.report(REPORT_FIELDS, reportUuid);
    assertNotes(erinReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - F: read it as someone else not in the read and write auth.groups
    final QueryExecutor bobQueryExecutor = getQueryExecutor(getBobBobtown().getDomainUsername());
    final Report bobReport = bobQueryExecutor.report(REPORT_FIELDS, reportUuid);
    assertNotes(bobReport.getNotes(), Collections.emptyList(), assessmentKey, 2);

    // - S: read it as admin
    final Report adminReport = adminQueryExecutor.report(REPORT_FIELDS, reportUuid);
    assertNotes(adminReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - F: update it as someone else not in the write auth.groups
    final NoteInput updatedNoteInputErin = getNoteInput(createdNoteAuthor);
    updatedNoteInputErin.setText(createAssessmentText("updated by erin", recurrence));
    failNoteUpdate(erinMutationExecutor, updatedNoteInputErin);

    // - S: update it as author
    final NoteInput updatedNoteInputAuthor = getNoteInput(createdNoteAuthor);
    updatedNoteInputAuthor.setText(createAssessmentText("updated by author", recurrence));
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInputAuthor);
    final Note updatedNoteAuthor =
        succeedNoteUpdate(reportAuthorMutationExecutor, updatedNoteInputAuthor);

    // - S: update it as someone else in the write auth.groups
    // note author shouldn't matter
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAdmin);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    updatedNotesInput.add(updatedNoteInputJack);
    final Note updatedNoteJack = succeedNoteUpdate(jackMutationExecutor, updatedNoteInputJack);

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = getNoteInput(createdNoteJack);
    updatedNoteInputAdmin.setText(createAssessmentText("updated by admin", recurrence));
    updatedNotesInput.add(updatedNoteInputAdmin);
    final Note updatedNoteAdmin = succeedNoteUpdate(jackMutationExecutor, updatedNoteInputAdmin);

    // - F: delete it as someone else not in the write auth.groups
    failNoteDelete(erinMutationExecutor, updatedNoteAuthor);

    // - S: delete it as author
    succeedNoteDelete(reportAuthorMutationExecutor, updatedNoteAuthor);
    assertThat(updatedNotesInput.remove(updatedNoteInputAuthor)).isTrue();
    assertNotes(erinQueryExecutor.report(REPORT_FIELDS, reportUuid).getNotes(), updatedNotesInput,
        assessmentKey, 2);

    // - S: delete it as someone else in the write auth.groups
    // note author shouldn't matter
    succeedNoteDelete(jackMutationExecutor, updatedNoteAdmin);
    assertThat(updatedNotesInput.remove(updatedNoteInputAdmin)).isTrue();
    assertNotes(erinQueryExecutor.report(REPORT_FIELDS, reportUuid).getNotes(), updatedNotesInput,
        assessmentKey, 2);

    // - S: delete it as admin
    succeedNoteDelete(adminMutationExecutor, updatedNoteJack);
    assertThat(updatedNotesInput.remove(updatedNoteInputJack)).isTrue();
    assertNotes(erinQueryExecutor.report(REPORT_FIELDS, reportUuid).getNotes(), updatedNotesInput,
        assessmentKey, 2);

    // Delete the test report
    reportAuthorMutationExecutor.deleteReport("", reportUuid);
  }

  private void testInstantAssessmentsEmptyWriteAuthGroups(final String testName,
      final String assessmentKey, final boolean forPerson, final String taskUuid)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();
    final MutationExecutor reportAuthorMutationExecutor =
        getMutationExecutor(reportAuthor.getDomainUsername());

    // Create a test report
    final Person principalPerson = getSteveSteveson();
    final ReportPerson principal = personToPrimaryReportPerson(principalPerson);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput = ReportInput.builder().withEngagementDate(Instant.now())
        .withIntent(testName)
        .withReportPeople(
            getReportPeopleInput(Lists.newArrayList(principal, personToReportAuthor(reportAuthor))))
        .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport =
        reportAuthorMutationExecutor.createReport(REPORT_FIELDS, reportInput);

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, createdReport.getUuid());
    final GenericRelatedObjectInput testPrincipalNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, principalPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testPrincipalNroInput : testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    final Note createdNoteAuthor =
        succeedNoteCreate(reportAuthorMutationExecutor, testNoteInputAuthor);
    assertNotes(jackQueryExecutor.report(REPORT_FIELDS, createdReport.getUuid()).getNotes(),
        testNoteInputs, assessmentKey, 2);

    // - F: update it as someone else with empty write auth.groups defined in the dictionary
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAuthor);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    failNoteUpdate(jackMutationExecutor, updatedNoteInputJack);

    // - F: delete it as someone else with empty write auth.groups defined in the dictionary
    failNoteDelete(jackMutationExecutor, createdNoteAuthor);

    // - S: delete it as author
    succeedNoteDelete(reportAuthorMutationExecutor, createdNoteAuthor);
    testNoteInputs.remove(testNoteInputAuthor);
    assertNotes(jackQueryExecutor.report(REPORT_FIELDS, createdReport.getUuid()).getNotes(),
        testNoteInputs, assessmentKey, 2);

    // Delete the test report
    reportAuthorMutationExecutor.deleteReport("", createdReport.getUuid());
  }

  private void testInstantAssessmentsNoAuthGroups(final String testName, final String assessmentKey,
      final boolean forPerson, final String taskUuid)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();
    final MutationExecutor reportAuthorMutationExecutor =
        getMutationExecutor(reportAuthor.getDomainUsername());

    // Create a test report
    final Person principalPerson = getSteveSteveson();
    final ReportPerson principal = personToPrimaryReportPerson(principalPerson);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput = ReportInput.builder().withEngagementDate(Instant.now())
        .withIntent(testName)
        .withReportPeople(
            getReportPeopleInput(Lists.newArrayList(principal, personToReportAuthor(reportAuthor))))
        .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport =
        reportAuthorMutationExecutor.createReport(REPORT_FIELDS, reportInput);

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, createdReport.getUuid());
    final GenericRelatedObjectInput testPrincipalNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, principalPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testPrincipalNroInput : testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    final Note createdNoteAuthor =
        succeedNoteCreate(reportAuthorMutationExecutor, testNoteInputAuthor);
    assertNotes(jackQueryExecutor.report(REPORT_FIELDS, createdReport.getUuid()).getNotes(),
        testNoteInputs, assessmentKey, 2);

    // - S: update it as someone else with no auth.groups defined in the dictionary
    final NoteInput updatedNoteInputJack = getNoteInput(createdNoteAuthor);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    succeedNoteUpdate(jackMutationExecutor, updatedNoteInputJack);

    // - S: delete it as someone else with no auth.groups defined in the dictionary
    succeedNoteDelete(jackMutationExecutor, createdNoteAuthor);

    // Delete the test report
    reportAuthorMutationExecutor.deleteReport("", createdReport.getUuid());
  }

  private void testInstantAssessmentsViaReport(final String testName, final String assessmentKey,
      final boolean forPerson, final String taskUuid)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();
    final QueryExecutor reportAuthorQueryExecutor =
        getQueryExecutor(reportAuthor.getDomainUsername());
    final MutationExecutor reportAuthorMutationExecutor =
        getMutationExecutor(reportAuthor.getDomainUsername());
    final Person reportApprover = getYoshieBeau();
    final QueryExecutor reportApproverQueryExecutor =
        getQueryExecutor(reportApprover.getDomainUsername());
    final MutationExecutor reportApproverMutationExecutor =
        getMutationExecutor(reportApprover.getDomainUsername());

    // Create a test report
    final Person principalPerson = getSteveSteveson();
    final ReportPerson principal = personToPrimaryReportPerson(principalPerson);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput =
        ReportInput.builder().withEngagementDate(Instant.now()).withIntent(testName)
            .withReportPeople(getReportPeopleInput(
                Lists.newArrayList(principal, personToPrimaryReportAuthor(reportAuthor))))
            .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport =
        reportAuthorMutationExecutor.createReport(REPORT_FIELDS, reportInput);
    final String reportUuid = createdReport.getUuid();
    assertThat(reportAuthorMutationExecutor.submitReport("", reportUuid)).isOne();

    // - F: create without relatedObjects
    NoteInput testNoteInputFail = createAssessment(assessmentKey, "test", recurrence);
    failUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputFail);

    // - F: create non-assessment for a report
    testNoteInputFail = NoteInput.builder().withType(NoteType.FREE_TEXT).withText("test")
        .withNoteRelatedObjects(Lists.newArrayList(testReportNroInput)).build();
    failUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputFail);

    // - F: create for a person
    final GenericRelatedObjectInput testAdvisorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, reportAuthor.getUuid());
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput);
    failUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputFail);

    // - F: create for a task
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testTaskNroInput);
    failUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputFail);

    // - F: create for two reports
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput, testReportNroInput);
    failUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputFail);

    // - F: create for a person and a task
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput, testTaskNroInput);
    failUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputFail);

    // - F: create for a report, a person and a task
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testAdvisorNroInput, testTaskNroInput);
    failUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputFail);

    // - F: create as non-author for a report and a person
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence, testReportNroInput,
        testAdvisorNroInput);
    final MutationExecutor erinMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());
    failUpdateReportAssessments(erinMutationExecutor, reportUuid, testNoteInputFail);

    // - F: create for a non-existing report and a person/task
    final GenericRelatedObjectInput testInvalidReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, "non-existing");
    testNoteInputFail = createAssessment(assessmentKey, "test", recurrence,
        testInvalidReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    failUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputFail);

    // - F: create for a report and a person/task, against a non-existing report
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    testNoteInputFail =
        createAssessment(assessmentKey, "test", recurrence, testInvalidReportNroInput);
    failUpdateReportAssessments(reportAuthorMutationExecutor, "non-existing", testNoteInputAuthor);

    // - S: create as author for a report and a person
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    succeedUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputAuthor);

    // - S: create as approver
    final NoteInput testNoteInputApprover = createAssessment(assessmentKey, "approver", recurrence,
        testReportNroInput, testAdvisorNroInput);
    testNoteInputs.add(testNoteInputApprover);
    succeedUpdateReportAssessments(reportApproverMutationExecutor, reportUuid, testNoteInputAuthor,
        testNoteInputApprover);

    // - S: create as someone else in the write auth.groups
    final NoteInput testNoteInputJack = createAssessment(assessmentKey, "jack", recurrence,
        testReportNroInput, testAdvisorNroInput);
    testNoteInputs.add(testNoteInputJack);
    succeedUpdateReportAssessments(jackMutationExecutor, reportUuid, testNoteInputAuthor,
        testNoteInputApprover, testNoteInputJack);

    // - S: create as admin
    final NoteInput testNoteInputAdmin = createAssessment(assessmentKey, "admin", recurrence,
        testReportNroInput, testAdvisorNroInput);
    testNoteInputs.add(testNoteInputAdmin);
    succeedUpdateReportAssessments(adminMutationExecutor, reportUuid, testNoteInputAuthor,
        testNoteInputApprover, testNoteInputJack, testNoteInputAdmin);

    // - S: read it as author
    final Report updatedReport = reportAuthorQueryExecutor.report(REPORT_FIELDS, reportUuid);
    final List<Note> testNotes = updatedReport.getNotes();
    assertNotes(testNotes, testNoteInputs, assessmentKey, 2);

    // - S: read it as approver
    final Report approverReport = reportApproverQueryExecutor.report(REPORT_FIELDS, reportUuid);
    assertNotes(approverReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - S: read it as someone else in the read auth.groups
    final QueryExecutor erinQueryExecutor = getQueryExecutor(getRegularUser().getDomainUsername());
    final Report erinReport = erinQueryExecutor.report(REPORT_FIELDS, reportUuid);
    assertNotes(erinReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - F: read it as someone else not in the read and write auth.groups
    final QueryExecutor bobQueryExecutor = getQueryExecutor(getBobBobtown().getDomainUsername());
    final Report bobReport = bobQueryExecutor.report(REPORT_FIELDS, reportUuid);
    assertNotes(bobReport.getNotes(), Collections.emptyList(), assessmentKey, 2);

    // - S: read it as admin
    final Report adminReport = adminQueryExecutor.report(REPORT_FIELDS, reportUuid);
    assertNotes(adminReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - F: update it as someone else not in the write auth.groups
    final List<NoteInput> createdNotesInput = getNotesInput(testNotes);
    failUpdateReportAssessments(erinMutationExecutor, reportUuid,
        Iterables.toArray(createdNotesInput, NoteInput.class));

    // - S: update it as author
    final NoteInput updatedNoteInputAuthor = createdNotesInput.get(0);
    updatedNoteInputAuthor.setText(createAssessmentText("updated by author", recurrence));
    succeedUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid,
        Iterables.toArray(createdNotesInput, NoteInput.class));

    // - S: update it as approver
    // note author shouldn't matter
    final NoteInput updatedNoteInputApprover = createdNotesInput.get(2);
    updatedNoteInputApprover.setText(createAssessmentText("updated by approver", recurrence));
    succeedUpdateReportAssessments(reportApproverMutationExecutor, reportUuid,
        Iterables.toArray(createdNotesInput, NoteInput.class));

    // - S: update it as someone else in the write auth.groups
    final NoteInput updatedNoteInputJack = createdNotesInput.get(3);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    succeedUpdateReportAssessments(jackMutationExecutor, reportUuid,
        Iterables.toArray(createdNotesInput, NoteInput.class));

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = createdNotesInput.get(1);
    updatedNoteInputAdmin.setText(createAssessmentText("updated by admin", recurrence));
    succeedUpdateReportAssessments(jackMutationExecutor, reportUuid,
        Iterables.toArray(createdNotesInput, NoteInput.class));

    // - F: delete it as someone else not in the write auth.groups
    failUpdateReportAssessments(erinMutationExecutor, reportUuid);

    // - S: delete it as author
    final List<Note> updatedNotes =
        reportAuthorQueryExecutor.report(REPORT_FIELDS, reportUuid).getNotes();
    final List<NoteInput> updatedNotesInput = getNotesInput(updatedNotes);
    Collections.reverse(updatedNotesInput);
    assertThat(updatedNotesInput.remove(0)).isNotNull();
    succeedUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));
    assertNotes(reportAuthorQueryExecutor.report(REPORT_FIELDS, reportUuid).getNotes(),
        updatedNotesInput, assessmentKey, 2);

    // - S: delete it as approver
    // note author shouldn't matter
    assertThat(updatedNotesInput.remove(2)).isNotNull();
    succeedUpdateReportAssessments(reportApproverMutationExecutor, reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));
    assertNotes(reportAuthorQueryExecutor.report(REPORT_FIELDS, reportUuid).getNotes(),
        updatedNotesInput, assessmentKey, 2);

    // - S: delete it as someone else in the write auth.groups
    assertThat(updatedNotesInput.remove(1)).isNotNull();
    succeedUpdateReportAssessments(jackMutationExecutor, reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));
    assertNotes(reportAuthorQueryExecutor.report(REPORT_FIELDS, reportUuid).getNotes(),
        updatedNotesInput, assessmentKey, 2);

    // - S: delete it as admin
    assertThat(updatedNotesInput.remove(0)).isNotNull();
    succeedUpdateReportAssessments(adminMutationExecutor, reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));
    assertNotes(reportAuthorQueryExecutor.report(REPORT_FIELDS, reportUuid).getNotes(),
        updatedNotesInput, assessmentKey, 2);

    // Get the test report
    final Report report = reportAuthorQueryExecutor.report(REPORT_FIELDS, reportUuid);
    // Update it as author so it goes back to draft
    reportAuthorMutationExecutor.updateReport(REPORT_FIELDS, getReportInput(report), false);
    // Then delete it
    assertThat(reportAuthorMutationExecutor.deleteReport("", reportUuid)).isOne();
  }

  private void testInstantAssessmentsViaReportEmptyWriteAuthGroups(final String testName,
      final String assessmentKey, final boolean forPerson, final String taskUuid)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();
    final QueryExecutor reportAuthorQueryExecutor =
        getQueryExecutor(reportAuthor.getDomainUsername());
    final MutationExecutor reportAuthorMutationExecutor =
        getMutationExecutor(reportAuthor.getDomainUsername());

    // Create a test report
    final Person principalPerson = getSteveSteveson();
    final ReportPerson principal = personToPrimaryReportPerson(principalPerson);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput =
        ReportInput.builder().withEngagementDate(Instant.now()).withIntent(testName)
            .withReportPeople(getReportPeopleInput(
                Lists.newArrayList(principal, personToPrimaryReportAuthor(reportAuthor))))
            .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport =
        reportAuthorMutationExecutor.createReport(REPORT_FIELDS, reportInput);
    final String reportUuid = createdReport.getUuid();
    assertThat(reportAuthorMutationExecutor.submitReport("", reportUuid)).isOne();

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    final GenericRelatedObjectInput testPrincipalNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, principalPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testPrincipalNroInput : testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    succeedUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputAuthor);

    // - S: read it as someone else with no read auth.groups defined in the dictionary
    final Report jackReport = jackQueryExecutor.report(REPORT_FIELDS, reportUuid);
    assertNotes(jackReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - F: update it as someone else with empty write auth.groups defined in the dictionary
    final List<NoteInput> updatedNotesInput = getNotesInput(jackReport.getNotes());
    final NoteInput updatedNoteInputJack = updatedNotesInput.get(0);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    failUpdateReportAssessments(jackMutationExecutor, reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));

    // - F: delete it as someone else with empty write auth.groups defined in the dictionary
    failUpdateReportAssessments(jackMutationExecutor, reportUuid);

    // - S: delete it as author
    succeedUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid);
    testNoteInputs.remove(testNoteInputAuthor);
    assertNotes(jackQueryExecutor.report(REPORT_FIELDS, reportUuid).getNotes(), testNoteInputs,
        assessmentKey, 2);

    // Get the test report
    final Report report = reportAuthorQueryExecutor.report(REPORT_FIELDS, reportUuid);
    // Update it as author so it goes back to draft
    reportAuthorMutationExecutor.updateReport(REPORT_FIELDS, getReportInput(report), false);
    // Then delete it
    assertThat(reportAuthorMutationExecutor.deleteReport("", reportUuid)).isOne();
  }

  private void testInstantAssessmentsViaReportNoAuthGroups(final String testName,
      final String assessmentKey, final boolean forPerson, final String taskUuid)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final String recurrence = "once";
    final Person reportAuthor = getNickNicholson();
    final QueryExecutor reportAuthorQueryExecutor =
        getQueryExecutor(reportAuthor.getDomainUsername());
    final MutationExecutor reportAuthorMutationExecutor =
        getMutationExecutor(reportAuthor.getDomainUsername());

    // Create a test report
    final Person principalPerson = getSteveSteveson();
    final ReportPerson principal = personToPrimaryReportPerson(principalPerson);
    final TaskInput taskInput = TaskInput.builder().withUuid(taskUuid).build();
    final ReportInput reportInput =
        ReportInput.builder().withEngagementDate(Instant.now()).withIntent(testName)
            .withReportPeople(getReportPeopleInput(
                Lists.newArrayList(principal, personToPrimaryReportAuthor(reportAuthor))))
            .withTasks(Lists.newArrayList(taskInput)).build();
    final Report createdReport =
        reportAuthorMutationExecutor.createReport(REPORT_FIELDS, reportInput);
    final String reportUuid = createdReport.getUuid();
    assertThat(reportAuthorMutationExecutor.submitReport("", reportUuid)).isOne();

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    final GenericRelatedObjectInput testPrincipalNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, principalPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createNoteRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final NoteInput testNoteInputAuthor = createAssessment(assessmentKey, "author", recurrence,
        testReportNroInput, forPerson ? testPrincipalNroInput : testTaskNroInput);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(testNoteInputAuthor);
    succeedUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid, testNoteInputAuthor);

    // - S: read it as someone else with no auth.groups defined in the dictionary
    final Report jackReport = jackQueryExecutor.report(REPORT_FIELDS, reportUuid);
    assertNotes(jackReport.getNotes(), testNoteInputs, assessmentKey, 2);

    // - S: update it as someone else with no auth.groups defined in the dictionary
    final List<NoteInput> updatedNotesInput = getNotesInput(jackReport.getNotes());
    final NoteInput updatedNoteInputJack = updatedNotesInput.get(0);
    updatedNoteInputJack.setText(createAssessmentText("updated by jack", recurrence));
    succeedUpdateReportAssessments(jackMutationExecutor, reportUuid,
        Iterables.toArray(updatedNotesInput, NoteInput.class));

    // - S: delete it as someone else with no auth.groups defined in the dictionary
    succeedUpdateReportAssessments(reportAuthorMutationExecutor, reportUuid);
    testNoteInputs.remove(testNoteInputAuthor);
    assertNotes(jackQueryExecutor.report(REPORT_FIELDS, reportUuid).getNotes(), testNoteInputs,
        assessmentKey, 2);

    // Get the test report
    final Report report = reportAuthorQueryExecutor.report(REPORT_FIELDS, reportUuid);
    // Update it as author so it goes back to draft
    reportAuthorMutationExecutor.updateReport(REPORT_FIELDS, getReportInput(report), false);
    // Then delete it
    assertThat(reportAuthorMutationExecutor.deleteReport("", reportUuid)).isOne();
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

  private void failNoteCreate(final MutationExecutor mutationExecutor, final NoteInput noteInput) {
    try {
      mutationExecutor.createNote(NOTE_FIELDS, noteInput);
      fail("Expected exception creating instant assessment");
    } catch (Exception expected) {
      // OK
    }
  }

  private void failNoteUpdate(final MutationExecutor mutationExecutor, final NoteInput noteInput) {
    try {
      mutationExecutor.updateNote(NOTE_FIELDS, noteInput);
      fail("Expected exception updating note");
    } catch (Exception expected) {
      // OK
    }
  }

  private void failNoteDelete(final MutationExecutor mutationExecutor, final Note note) {
    try {
      mutationExecutor.deleteNote("", note.getUuid());
      fail("Expected exception deleting note");
    } catch (Exception expected) {
      // OK
    }
  }

  private Note succeedNoteCreate(final MutationExecutor mutationExecutor, final NoteInput noteInput)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Note createdNote = mutationExecutor.createNote(NOTE_FIELDS, noteInput);
    assertThat(createdNote).isNotNull();
    assertThat(createdNote.getUuid()).isNotNull();
    return createdNote;
  }

  private Note succeedNoteUpdate(final MutationExecutor mutationExecutor, final NoteInput noteInput)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Note updatedNote = mutationExecutor.updateNote(NOTE_FIELDS, noteInput);
    assertThat(updatedNote).isNotNull();
    assertThat(updatedNote.getText()).isEqualTo(noteInput.getText());
    return updatedNote;
  }

  private Integer succeedNoteDelete(final MutationExecutor mutationExecutor, final Note note)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Integer nrDeleted = mutationExecutor.deleteNote("", note.getUuid());
    assertThat(nrDeleted).isOne();
    return nrDeleted;
  }

  private void failUpdateReportAssessments(final MutationExecutor mutationExecutor,
      final String reportUuid, final NoteInput... noteInputs) {
    try {
      mutationExecutor.updateReportAssessments("", Lists.newArrayList(noteInputs), reportUuid);
      fail("Expected exception creating instant assessment");
    } catch (Exception expected) {
      // OK
    }
  }

  private Integer succeedUpdateReportAssessments(final MutationExecutor mutationExecutor,
      final String reportUuid, final NoteInput... noteInputs)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Integer nrUpdated =
        mutationExecutor.updateReportAssessments("", Lists.newArrayList(noteInputs), reportUuid);
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
