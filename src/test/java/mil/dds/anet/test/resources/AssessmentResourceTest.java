package mil.dds.anet.test.resources;

import static mil.dds.anet.utils.PendingAssessmentsHelper.JSON_ASSESSMENT_RECURRENCE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.Lists;
import graphql.com.google.common.collect.Iterables;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.test.AssessmentCounterDao;
import mil.dds.anet.test.client.AnetBeanList_Task;
import mil.dds.anet.test.client.Assessment;
import mil.dds.anet.test.client.AssessmentInput;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.ReportPerson;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.client.TaskSearchQueryInput;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class AssessmentResourceTest extends AbstractResourceTest {

  protected static final String ASSESSMENT_FIELDS =
      "{ uuid assessmentKey assessmentValues author { uuid }"
          + " assessmentRelatedObjects { objectUuid relatedObjectType relatedObjectUuid } }";
  private static final String _ASSESSMENTS_FIELDS =
      String.format("assessments %1$s", ASSESSMENT_FIELDS);
  private static final String PERSON_FIELDS =
      String.format("{ uuid name %1$s }", _ASSESSMENTS_FIELDS);
  private static final String REPORT_FIELDS = String
      .format("{ uuid intent state reportPeople { uuid name author attendee primary interlocutor }"
          + " tasks { uuid shortName } %1$s }", _ASSESSMENTS_FIELDS);
  private static final String TASK_FIELDS =
      String.format("{ uuid shortName %1$s }", _ASSESSMENTS_FIELDS);

  // The communities defined in the dictionary give Erin read access and Jack write access;
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

  @Autowired
  private AssessmentCounterDao assessmentCounterDao;

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
    assertThat(createdReport.getAssessments()).isEmpty();

    // Attach task assessment to test report
    final TaskSearchQueryInput query = TaskSearchQueryInput.builder().withText("Budget").build();
    final AnetBeanList_Task tasks =
        withCredentials(adminUser, t -> queryExecutor.taskList(getListFields("{ uuid }"), query));
    assertThat(tasks).isNotNull();
    assertThat(tasks.getList()).isNotEmpty();
    final Task task = tasks.getList().get(0);

    final GenericRelatedObjectInput testNroReportInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());
    final GenericRelatedObjectInput testNroTaskInput =
        createAssessmentRelatedObject(TaskDao.TABLE_NAME, task.getUuid());
    final AssessmentInput testAssessmentInput =
        createAssessment("testDeleteDanglingReportTaskAssessment",
            "a report test task assessment created by testDeleteDanglingReportTaskAssessment",
            "once", testNroReportInput, testNroTaskInput);
    final Assessment createdAssessment = succeedAssessmentCreate(adminUser, testAssessmentInput);

    final Report updatedReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, testReport.getUuid()));
    assertThat(updatedReport.getAssessments()).hasSize(1);
    final Assessment reportAssessment = updatedReport.getAssessments().get(0);
    assertThat(reportAssessment.getAssessmentValues())
        .isEqualTo(testAssessmentInput.getAssessmentValues());
    assertThat(reportAssessment.getAssessmentRelatedObjects()).hasSize(2);

    // Delete test report
    final int nrAssessments = countAssessments();
    final Integer nrDeleted =
        withCredentials(adminUser, t -> mutationExecutor.deleteReport("", testReport.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrAssessments).isEqualTo(countAssessments() + 1);

    // The assessment should not be there, try to update it
    createdAssessment.setAssessmentValues("{\"text\":"
        + "\"a report test task assessment updated by testDeleteDanglingReportTaskAssessment\"}");
    failAssessmentUpdate(adminUser, getAssessmentInput(createdAssessment));
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
    assertThat(createdReport.getAssessments()).isEmpty();

    // Attach attendee assessment to test report
    final Person attendee = getRogerRogwell();

    final GenericRelatedObjectInput testNroReportInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());
    final GenericRelatedObjectInput testNroTaskInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, attendee.getUuid());
    final AssessmentInput testAssessmentInput = createAssessment(
        "testDeleteDanglingReportAttendeeAssessment",
        "a report test attendee assessment created by testDeleteDanglingReportAttendeeAssessment",
        "once", testNroReportInput, testNroTaskInput);
    final Assessment createdAssessment = succeedAssessmentCreate(adminUser, testAssessmentInput);

    final Report updatedReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, testReport.getUuid()));
    assertThat(updatedReport.getAssessments()).hasSize(1);
    final Assessment reportAssessment = updatedReport.getAssessments().get(0);
    assertThat(reportAssessment.getAssessmentValues())
        .isEqualTo(testAssessmentInput.getAssessmentValues());
    assertThat(reportAssessment.getAssessmentRelatedObjects()).hasSize(2);

    // Delete test report
    final int nrAssessments = countAssessments();
    final Integer nrDeleted =
        withCredentials(adminUser, t -> mutationExecutor.deleteReport("", testReport.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrAssessments).isEqualTo(countAssessments() + 1);

    // The assessment should not be there, try to update it
    createdAssessment.setAssessmentValues("{\"text\":"
        + "\"a report test attendee assessment updated by testDeleteDanglingReportAttendeeAssessment\"}");
    failAssessmentUpdate(adminUser, getAssessmentInput(createdAssessment));
  }

  @Test
  void testInvalidAssessments() {
    // Completely empty assessment
    final AssessmentInput invalidAssessmentInput = AssessmentInput.builder().build();
    failAssessmentCreate(jackUser, invalidAssessmentInput);
    // Assessment with invalid key
    invalidAssessmentInput.setAssessmentKey("unknown");
    failAssessmentCreate(jackUser, invalidAssessmentInput);
    // Assessment without text
    invalidAssessmentInput.setAssessmentKey("fields.task.assessments.taskOnceReport");
    failAssessmentCreate(jackUser, invalidAssessmentInput);
    // Assessment with different recurrence from dictionary key
    invalidAssessmentInput.setAssessmentValues(createAssessmentValues("test", "ondemand"));
    failAssessmentCreate(jackUser, invalidAssessmentInput);
  }

  @Test
  void testInstantPersonAssessments() {
    // Instant ('once') assessment tests for person through the AssessmentResource
    // methods
    testInstantAssessments("testInstantPersonAssessments",
        "fields.regular.person.assessments.personOnceReportLinguist", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantPersonAssessmentsEmptyWriteAuthGroups() {
    // Instant ('once') assessment tests for person through the AssessmentResource
    // methods, with
    // empty write communities defined in the dictionary
    testInstantAssessmentsEmptyWriteAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.regular.person.assessments.advisorOnceReportNoWrite", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantPersonAssessmentsNoAuthGroups() {
    // Instant ('once') assessment tests for person through the AssessmentResource
    // methods, with no
    // communities defined in the dictionary
    testInstantAssessmentsNoAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.regular.person.assessments.interlocutorOnceReport", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantPersonAssessmentsViaReport() {
    // Instant ('once') assessment tests for person through
    // ReportResource::updateReportAssessments
    testInstantAssessmentsViaReport("testInstantPersonAssessmentsViaReport",
        "fields.regular.person.assessments.personOnceReportLinguist", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantPersonAssessmentsViaReportEmptyWriteAuthGroups() {
    // Instant ('once') assessment tests for person through
    // ReportResource::updateReportAssessments, with empty write communities defined in the
    // dictionary
    testInstantAssessmentsViaReportEmptyWriteAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.regular.person.assessments.advisorOnceReportNoWrite", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantPersonAssessmentsViaReportNoAuthGroups() {
    // Instant ('once') assessment tests for person through
    // ReportResource::updateReportAssessments, with no communities defined in the
    // dictionary
    testInstantAssessmentsViaReportNoAuthGroups("testInstantPersonAssessmentsNoAuthGroups",
        "fields.regular.person.assessments.interlocutorOnceReport", true, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantTaskAssessments() {
    // Instant ('once') assessment tests for task through the AssessmentResource methods
    testInstantAssessments("testInstantTaskAssessments",
        "fields.task.assessments.taskOnceReportRestricted", false, TEST_TASK_EF2_UUID);
  }

  @Test
  void testInstantTaskAssessmentsEmptyWriteAuthGroups() {
    // Instant ('once') assessment tests for task through the AssessmentResource methods,
    // with empty
    // write communities defined in the dictionary
    testInstantAssessmentsEmptyWriteAuthGroups("testInstantTaskAssessmentsNoAuthGroups",
        "fields.task.assessments.taskOnceReportNoWrite", false, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantTaskAssessmentsNoAuthGroups() {
    // Instant ('once') assessment tests for task through the AssessmentResource methods,
    // with no
    // communities defined in the dictionary
    testInstantAssessmentsNoAuthGroups("testInstantTaskAssessmentsNoAuthGroups",
        "fields.task.assessments.taskOnceReport", false, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantTaskAssessmentsViaReport() {
    // Instant ('once') assessment tests for task through
    // ReportResource::updateReportAssessments
    testInstantAssessmentsViaReport("testInstantTaskAssessmentsViaReport",
        "fields.task.assessments.taskOnceReportRestricted", false, TEST_TASK_EF2_UUID);
  }

  @Test
  void testInstantTaskAssessmentsViaReportEmptyWriteAuthGroups() {
    // Instant ('once') assessment tests for task through
    // ReportResource::updateReportAssessments, with empty write communities defined in the
    // dictionary
    testInstantAssessmentsViaReportEmptyWriteAuthGroups(
        "testInstantTaskAssessmentsViaReportNoAuthGroups",
        "fields.task.assessments.taskOnceReportNoWrite", false, TEST_TASK_2B_UUID);
  }

  @Test
  void testInstantTaskAssessmentsViaReportNoAuthGroups() {
    // Instant ('once') assessment tests for task through
    // ReportResource::updateReportAssessments, with no communities defined in the
    // dictionary
    testInstantAssessmentsViaReportNoAuthGroups("testInstantTaskAssessmentsViaReportNoAuthGroups",
        "fields.task.assessments.taskOnceReport", false, TEST_TASK_2B_UUID);
  }

  @Test
  void testOndemandAssessments() {
    // On-demand assessment tests
    final String assessmentKey =
        "fields.regular.person.assessments.interlocutorOndemandScreeningAndVetting";
    final String recurrence = "ondemand";

    // - F: create without relatedObjects
    AssessmentInput testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence);
    failAssessmentCreate(jackUser, testAssessmentInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, TEST_REPORT_UUID);
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failAssessmentCreate(jackUser, testAssessmentInputFail);

    // - F: create for a task
    final GenericRelatedObjectInput testTaskNroInput =
        createAssessmentRelatedObject(TaskDao.TABLE_NAME, TEST_TASK_2B_UUID);
    testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence, testTaskNroInput);
    failAssessmentCreate(jackUser, testAssessmentInputFail);

    // - F: create for a report and a person
    final Person interlocutorPerson = getSteveSteveson();
    final String interlocutorPersonUuid = interlocutorPerson.getUuid();
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, interlocutorPersonUuid);
    testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence,
        testReportNroInput, testInterlocutorNroInput);
    failAssessmentCreate(jackUser, testAssessmentInputFail);

    // - F: create for a person as someone not in the write auth.groups
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testInterlocutorNroInput);
    failAssessmentCreate("erin", testAssessmentInputFail);

    // - S: create for a person as someone in the write auth.groups
    final AssessmentInput testAssessmentInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testInterlocutorNroInput);
    final List<AssessmentInput> testAssessmentInputs = Lists.newArrayList(testAssessmentInputJack);
    final Assessment createdAssessmentJack =
        succeedAssessmentCreate(jackUser, testAssessmentInputJack);

    // - S: create for a person as admin
    final AssessmentInput testAssessmentInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testInterlocutorNroInput);
    testAssessmentInputs.add(testAssessmentInputAdmin);
    final Assessment createdAssessmentAdmin =
        succeedAssessmentCreate(adminUser, testAssessmentInputAdmin);

    // - F: read it as someone not in the read and write auth.groups
    final Person bobPerson = withCredentials(getDomainUsername(getBobBobtown()),
        t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertAssessments(bobPerson.getAssessments(), Collections.emptyList(), assessmentKey, 1);

    // - S: read it as someone in the read auth.groups
    final Person erinPerson = withCredentials(getDomainUsername(getRegularUser()),
        t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    final List<Assessment> testAssessments = erinPerson.getAssessments();
    assertAssessments(testAssessments, testAssessmentInputs, assessmentKey, 1);

    // - S: read it as admin
    final Person adminPerson = withCredentials(adminUser,
        t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertAssessments(adminPerson.getAssessments(), testAssessmentInputs, assessmentKey, 1);

    // - F: update it as someone not in the write auth.groups
    final AssessmentInput updatedAssessmentInputErin = getAssessmentInput(createdAssessmentJack);
    updatedAssessmentInputErin
        .setAssessmentValues(createAssessmentValues("updated by erin", recurrence));
    failAssessmentUpdate("erin", updatedAssessmentInputErin);

    // - S: update it as someone in the write auth.groups
    // assessment author shouldn't matter
    final AssessmentInput updatedAssessmentInputJack = getAssessmentInput(createdAssessmentAdmin);
    updatedAssessmentInputJack
        .setAssessmentValues(createAssessmentValues("updated by jack", recurrence));
    final List<AssessmentInput> updatedAssessmentsInput =
        Lists.newArrayList(updatedAssessmentInputJack);
    final Assessment updatedAssessmentJack =
        succeedAssessmentUpdate(jackUser, updatedAssessmentInputJack);

    // - S: update it as admin
    final AssessmentInput updatedAssessmentInputAdmin = getAssessmentInput(createdAssessmentJack);
    updatedAssessmentInputAdmin
        .setAssessmentValues(createAssessmentValues("updated by admin", recurrence));
    updatedAssessmentsInput.add(updatedAssessmentInputAdmin);
    final Assessment updatedAssessmentAdmin =
        succeedAssessmentUpdate(jackUser, updatedAssessmentInputAdmin);

    // - S: delete it as someone in the write auth.groups
    // assessment author shouldn't matter
    succeedAssessmentDelete(jackUser, updatedAssessmentAdmin);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInputAdmin)).isTrue();
    assertAssessments(
        withCredentials(getDomainUsername(getRegularUser()),
            t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);

    // - S: delete it as admin
    succeedAssessmentDelete(adminUser, updatedAssessmentJack);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInputJack)).isTrue();
    assertAssessments(
        withCredentials(getDomainUsername(getRegularUser()),
            t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);
  }

  @Test
  void testOndemandAssessmentsEmptyWriteAuthGroups() {
    // On-demand assessment tests, with empty write communities defined in the
    // dictionary
    final String assessmentKey = "fields.regular.person.assessments.advisorOndemandNoWrite";
    final String recurrence = "ondemand";

    // - F: create for a person with empty write auth.groups defined in the dictionary
    final Person interlocutorPerson = getSteveSteveson();
    final String interlocutorPersonUuid = interlocutorPerson.getUuid();
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, interlocutorPersonUuid);
    final AssessmentInput testAssessmentInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testInterlocutorNroInput);
    failAssessmentCreate(jackUser, testAssessmentInputJack);

    // - S: create for a person as admin
    final AssessmentInput testAssessmentInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testInterlocutorNroInput);
    final List<AssessmentInput> testAssessmentInputs = Lists.newArrayList(testAssessmentInputAdmin);
    final Assessment createdAssessmentAdmin =
        succeedAssessmentCreate(adminUser, testAssessmentInputAdmin);

    // - S: read it with no read auth.groups defined in the dictionary
    final Person jackPerson =
        withCredentials(jackUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertAssessments(jackPerson.getAssessments(), testAssessmentInputs, assessmentKey, 1);

    // - F: update it with empty write auth.groups defined in the dictionary
    final AssessmentInput updatedAssessmentInputJack = getAssessmentInput(createdAssessmentAdmin);
    updatedAssessmentInputJack
        .setAssessmentValues(createAssessmentValues("updated by jack", recurrence));
    failAssessmentUpdate(jackUser, updatedAssessmentInputJack);

    // - F: delete it with empty write auth.groups defined in the dictionary
    failAssessmentDelete(jackUser, createdAssessmentAdmin);

    // - S: delete it as admin
    succeedAssessmentDelete(adminUser, createdAssessmentAdmin);
    testAssessmentInputs.remove(testAssessmentInputAdmin);
    assertAssessments(
        withCredentials(adminUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getAssessments(),
        testAssessmentInputs, assessmentKey, 1);
  }

  @Test
  void testOndemandAssessmentsNoAuthGroups() {
    // On-demand assessment tests, with no communities defined in the dictionary
    final String assessmentKey = "fields.regular.person.assessments.advisorOndemand";
    final String recurrence = "ondemand";

    // - S: create for a person with no auth.groups defined in the dictionary
    final Person interlocutorPerson = getSteveSteveson();
    final String interlocutorPersonUuid = interlocutorPerson.getUuid();
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, interlocutorPersonUuid);
    final AssessmentInput testAssessmentInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testInterlocutorNroInput);
    final List<AssessmentInput> testAssessmentInputs = Lists.newArrayList(testAssessmentInputJack);
    final Assessment createdAssessmentJack =
        succeedAssessmentCreate(jackUser, testAssessmentInputJack);

    // - S: read it with no auth.groups defined in the dictionary
    final Person jackPerson =
        withCredentials(jackUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertAssessments(jackPerson.getAssessments(), testAssessmentInputs, assessmentKey, 1);

    // - S: update it with no auth.groups defined in the dictionary
    final AssessmentInput updatedAssessmentInputJack = getAssessmentInput(createdAssessmentJack);
    updatedAssessmentInputJack
        .setAssessmentValues(createAssessmentValues("updated by jack", recurrence));
    succeedAssessmentUpdate(jackUser, updatedAssessmentInputJack);

    // - S: delete it with no auth.groups defined in the dictionary
    succeedAssessmentDelete(jackUser, createdAssessmentJack);
    testAssessmentInputs.remove(testAssessmentInputJack);
    assertAssessments(
        withCredentials(adminUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getAssessments(),
        testAssessmentInputs, assessmentKey, 1);
  }

  @Test
  void testPeriodicPersonAssessments() {
    // Periodic assessment tests for person
    final String assessmentKey = "fields.regular.person.assessments.interlocutorMonthly";
    final String recurrence = "monthly";

    // - F: create without relatedObjects
    AssessmentInput testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence);
    failAssessmentCreate(getDomainUsername(getRegularUser()), testAssessmentInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, TEST_REPORT_UUID);
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failAssessmentCreate(getDomainUsername(getRegularUser()), testAssessmentInputFail);

    // - F: create for a report and a person
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, TEST_COUNTERPART_PERSON_UUID);
    testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence,
        testReportNroInput, testInterlocutorNroInput);
    failAssessmentCreate(getDomainUsername(getRegularUser()), testAssessmentInputFail);

    // - S: create for a person as someone with counterpart not in the write auth.groups
    final AssessmentInput testAssessmentInput =
        createAssessment(assessmentKey, "erin", recurrence, testInterlocutorNroInput);
    final List<AssessmentInput> testAssessmentInputs = Lists.newArrayList(testAssessmentInput);
    final Assessment createdAssessment =
        succeedAssessmentCreate(getDomainUsername(getRegularUser()), testAssessmentInput);

    // - F: create for a person as someone without counterpart not in the write auth.groups
    testAssessmentInputFail =
        createAssessment(assessmentKey, "reina", recurrence, testInterlocutorNroInput);
    failAssessmentCreate("reina", testAssessmentInputFail);

    // - S: create for a person as someone without counterpart in the write auth.groups
    final AssessmentInput testAssessmentInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testInterlocutorNroInput);
    testAssessmentInputs.add(testAssessmentInputJack);
    final Assessment createdAssessmentJack =
        succeedAssessmentCreate(jackUser, testAssessmentInputJack);

    // - S: create for a person as admin
    final AssessmentInput testAssessmentInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testInterlocutorNroInput);
    testAssessmentInputs.add(testAssessmentInputAdmin);
    final Assessment createdAssessmentAdmin =
        succeedAssessmentCreate(adminUser, testAssessmentInputAdmin);

    // - F: read it as someone not in the read and write auth.groups
    final Person bobPerson = withCredentials(getDomainUsername(getBobBobtown()),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID));
    assertAssessments(bobPerson.getAssessments(), Collections.emptyList(), assessmentKey, 1);

    // - S: read it as someone in the read auth.groups
    final Person reinaPerson = withCredentials(getDomainUsername(getReinaReinton()),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID));
    assertAssessments(reinaPerson.getAssessments(), testAssessmentInputs, assessmentKey, 1);

    // - S: read it as admin
    final Person adminPerson = withCredentials(adminUser,
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID));
    assertAssessments(adminPerson.getAssessments(), testAssessmentInputs, assessmentKey, 1);

    // - S: update it as someone with counterpart not in the write auth.groups
    final AssessmentInput updatedAssessmentInput = getAssessmentInput(createdAssessment);
    updatedAssessmentInput
        .setAssessmentValues(createAssessmentValues("updated by erin", recurrence));
    final List<AssessmentInput> updatedAssessmentsInput =
        Lists.newArrayList(updatedAssessmentInput);
    final Assessment updatedAssessment =
        succeedAssessmentUpdate(getDomainUsername(getRegularUser()), updatedAssessmentInput);

    // - F: update it as someone without counterpart not in the write auth.groups
    final AssessmentInput updatedAssessmentInputReina = getAssessmentInput(createdAssessment);
    updatedAssessmentInputReina
        .setAssessmentValues(createAssessmentValues("updated by reina", recurrence));
    failAssessmentUpdate("reina", updatedAssessmentInputReina);

    // - S: update it as someone without counterpart in the write auth.groups
    // assessment author shouldn't matter
    final AssessmentInput updatedAssessmentInputJack = getAssessmentInput(createdAssessmentAdmin);
    updatedAssessmentInputJack
        .setAssessmentValues(createAssessmentValues("updated by jack", recurrence));
    updatedAssessmentsInput.add(updatedAssessmentInputJack);
    final Assessment updatedAssessmentJack =
        succeedAssessmentUpdate(jackUser, updatedAssessmentInputJack);

    // - S: update it as admin
    final AssessmentInput updatedAssessmentInputAdmin = getAssessmentInput(createdAssessmentJack);
    updatedAssessmentInputAdmin
        .setAssessmentValues(createAssessmentValues("updated by admin", recurrence));
    updatedAssessmentsInput.add(updatedAssessmentInputAdmin);
    final Assessment updatedAssessmentAdmin =
        succeedAssessmentUpdate(adminUser, updatedAssessmentInputAdmin);

    // - F: delete it as someone without counterpart not in the write auth.groups
    failAssessmentDelete("reina", updatedAssessment);

    // - S: delete it as someone with counterpart not in the write auth.groups
    succeedAssessmentDelete(getDomainUsername(getRegularUser()), updatedAssessment);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInput)).isTrue();
    assertAssessments(withCredentials(getDomainUsername(getReinaReinton()),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);

    // - S: delete it as someone without counterpart in the write auth.groups
    // assessment author shouldn't matter
    succeedAssessmentDelete(jackUser, updatedAssessmentAdmin);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInputAdmin)).isTrue();
    assertAssessments(withCredentials(getDomainUsername(getReinaReinton()),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);

    // - S: delete it as admin
    succeedAssessmentDelete(adminUser, updatedAssessmentJack);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInputJack)).isTrue();
    assertAssessments(withCredentials(getDomainUsername(getReinaReinton()),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicPersonAssessmentsEmptyWriteAuthGroups() {
    // Periodic assessment tests for person, with empty write communities
    // defined in
    // the dictionary
    final String assessmentKey = "fields.regular.person.assessments.advisorQuarterlyNoWrite";
    final String recurrence = "quarterly";

    // - F: create for a person as someone without counterpart and empty write auth.groups defined
    // in the dictionary
    final GenericRelatedObjectInput testPersonNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, TEST_COUNTERPART_PERSON_UUID);
    final AssessmentInput testAssessmentInputFail =
        createAssessment(assessmentKey, "andrew", recurrence, testPersonNroInput);
    failAssessmentCreate("andrew", testAssessmentInputFail);

    // - S: create for a person as someone with counterpart and empty write auth.groups defined in
    // the dictionary
    final AssessmentInput testAssessmentInput =
        createAssessment(assessmentKey, "erin", recurrence, testPersonNroInput);
    final List<AssessmentInput> testAssessmentInputs = Lists.newArrayList(testAssessmentInput);
    final Assessment createdAssessment =
        succeedAssessmentCreate(getDomainUsername(getRegularUser()), testAssessmentInput);

    // - S: read it with no read auth.groups defined in the dictionary
    final Person andrewPerson = withCredentials(getDomainUsername(getAndrewAnderson()),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID));
    assertAssessments(andrewPerson.getAssessments(), testAssessmentInputs, assessmentKey, 1);

    // - F: update it as someone without counterpart and with empty write auth.groups defined in the
    // dictionary
    final AssessmentInput updatedAssessmentInputAndrew = getAssessmentInput(createdAssessment);
    updatedAssessmentInputAndrew
        .setAssessmentValues(createAssessmentValues("updated by andrew", recurrence));
    failAssessmentUpdate("andrew", updatedAssessmentInputAndrew);

    // - S: update it as someone with counterpart and with empty write auth.groups defined in the
    // dictionary
    final AssessmentInput updatedAssessmentInput = getAssessmentInput(createdAssessment);
    updatedAssessmentInput
        .setAssessmentValues(createAssessmentValues("updated by erin", recurrence));
    final List<AssessmentInput> updatedAssessmentsInput =
        Lists.newArrayList(updatedAssessmentInput);
    final Assessment updatedAssessment =
        succeedAssessmentUpdate(getDomainUsername(getRegularUser()), updatedAssessmentInput);

    // - F: delete it as someone without counterpart and with empty write auth.groups defined in the
    // dictionary
    failAssessmentDelete("andrew", createdAssessment);

    // - S: delete it as someone with counterpart and with empty write auth.groups defined in the
    // dictionary
    succeedAssessmentDelete(getDomainUsername(getRegularUser()), updatedAssessment);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInput)).isTrue();
    assertAssessments(withCredentials(getDomainUsername(getAndrewAnderson()),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicPersonAssessmentsNoAuthGroups() {
    // Periodic assessment tests for person, with no communities defined in the
    // dictionary
    final String assessmentKey = "fields.regular.person.assessments.interlocutorQuarterly";
    final String recurrence = "quarterly";

    // - S: create for a person as someone without counterpart and no auth.groups defined in
    // the dictionary
    final GenericRelatedObjectInput testPersonNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, TEST_COUNTERPART_PERSON_UUID);
    final AssessmentInput testAssessmentInput =
        createAssessment(assessmentKey, "andrew", recurrence, testPersonNroInput);
    final List<AssessmentInput> testAssessmentInputs = Lists.newArrayList(testAssessmentInput);
    final Assessment createdAssessment =
        succeedAssessmentCreate(getDomainUsername(getRegularUser()), testAssessmentInput);

    // - S: read it with no auth.groups defined in the dictionary
    final Person andrewPerson = withCredentials(getDomainUsername(getAndrewAnderson()),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID));
    assertAssessments(andrewPerson.getAssessments(), testAssessmentInputs, assessmentKey, 1);

    // - S: update it as someone without counterpart and with no auth.groups defined in the
    // dictionary
    final AssessmentInput updatedAssessmentInput = getAssessmentInput(createdAssessment);
    updatedAssessmentInput
        .setAssessmentValues(createAssessmentValues("updated by andrew", recurrence));
    succeedAssessmentUpdate("andrew", updatedAssessmentInput);
    final List<AssessmentInput> updatedAssessmentsInput =
        Lists.newArrayList(updatedAssessmentInput);
    final Assessment updatedAssessment =
        succeedAssessmentUpdate(getDomainUsername(getRegularUser()), updatedAssessmentInput);

    // - S: delete it as someone without counterpart and with no auth.groups defined in the
    // dictionary
    succeedAssessmentDelete("andrew", updatedAssessment);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInput)).isTrue();
    assertAssessments(withCredentials(getDomainUsername(getAndrewAnderson()),
        t -> queryExecutor.person(PERSON_FIELDS, TEST_COUNTERPART_PERSON_UUID)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicTaskAssessments() {
    // Periodic assessment tests for task
    final String assessmentKey = "fields.task.assessments.taskSemiannuallyRestricted";
    final String recurrence = "semiannually";
    final Person taskResponsible = getAndrewAnderson();

    // - F: create without relatedObjects
    AssessmentInput testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence);
    failAssessmentCreate(getDomainUsername(taskResponsible), testAssessmentInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, TEST_REPORT_UUID);
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failAssessmentCreate(getDomainUsername(taskResponsible), testAssessmentInputFail);

    // - F: create for a report and a task
    final GenericRelatedObjectInput testTaskNroInput =
        createAssessmentRelatedObject(TaskDao.TABLE_NAME, TEST_TASK_12A_UUID);
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput, testTaskNroInput);
    failAssessmentCreate(getDomainUsername(taskResponsible), testAssessmentInputFail);

    // - S: create for a task as someone with task permission not in the write auth.groups
    final AssessmentInput testAssessmentInput =
        createAssessment(assessmentKey, "andrew", recurrence, testTaskNroInput);
    final List<AssessmentInput> testAssessmentInputs = Lists.newArrayList(testAssessmentInput);
    final Assessment createdAssessment =
        succeedAssessmentCreate(getDomainUsername(taskResponsible), testAssessmentInput);

    // - F: create for a task as someone without task permission not in the write auth.groups
    testAssessmentInputFail = createAssessment(assessmentKey, "erin", recurrence, testTaskNroInput);
    failAssessmentCreate("erin", testAssessmentInputFail);

    // - S: create for a task as someone without task permission in the write auth.groups
    final AssessmentInput testAssessmentInputJack =
        createAssessment(assessmentKey, "jack", recurrence, testTaskNroInput);
    testAssessmentInputs.add(testAssessmentInputJack);
    final Assessment createdAssessmentJack =
        succeedAssessmentCreate(jackUser, testAssessmentInputJack);

    // - S: create for a task as admin
    final AssessmentInput testAssessmentInputAdmin =
        createAssessment(assessmentKey, "admin", recurrence, testTaskNroInput);
    testAssessmentInputs.add(testAssessmentInputAdmin);
    final Assessment createdAssessmentAdmin =
        succeedAssessmentCreate(adminUser, testAssessmentInputAdmin);

    // - F: read it as someone not in the read and write auth.groups
    final Task bobTask = withCredentials(getDomainUsername(getBobBobtown()),
        t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID));
    assertAssessments(bobTask.getAssessments(), Collections.emptyList(), assessmentKey, 1);

    // - S: read it as someone in the read auth.groups
    final Task erinTask = withCredentials(getDomainUsername(getRegularUser()),
        t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID));
    assertAssessments(erinTask.getAssessments(), testAssessmentInputs, assessmentKey, 1);

    // - S: read it as admin
    final Task adminTask =
        withCredentials(adminUser, t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID));
    assertAssessments(adminTask.getAssessments(), testAssessmentInputs, assessmentKey, 1);

    // - S: update it as someone with task permission not in the write auth.groups
    final AssessmentInput updatedAssessmentInput = getAssessmentInput(createdAssessment);
    updatedAssessmentInput
        .setAssessmentValues(createAssessmentValues("updated by andrew", recurrence));
    final List<AssessmentInput> updatedAssessmentsInput =
        Lists.newArrayList(updatedAssessmentInput);
    final Assessment updatedAssessment =
        succeedAssessmentUpdate(getDomainUsername(taskResponsible), updatedAssessmentInput);

    // - F: update it as someone without task permission not in the write auth.groups
    final AssessmentInput updatedAssessmentInputErin = getAssessmentInput(createdAssessment);
    updatedAssessmentInputErin
        .setAssessmentValues(createAssessmentValues("updated by erin", recurrence));
    failAssessmentUpdate("erin", updatedAssessmentInputErin);

    // - S: update it as someone without task permission in the write auth.groups
    // assessment author shouldn't matter
    final AssessmentInput updatedAssessmentInputJack = getAssessmentInput(createdAssessmentAdmin);
    updatedAssessmentInputJack
        .setAssessmentValues(createAssessmentValues("updated by jack", recurrence));
    updatedAssessmentsInput.add(updatedAssessmentInputJack);
    final Assessment updatedAssessmentJack =
        succeedAssessmentUpdate(jackUser, updatedAssessmentInputJack);

    // - S: update it as admin
    final AssessmentInput updatedAssessmentInputAdmin = getAssessmentInput(createdAssessmentJack);
    updatedAssessmentInputAdmin
        .setAssessmentValues(createAssessmentValues("updated by admin", recurrence));
    updatedAssessmentsInput.add(updatedAssessmentInputAdmin);
    final Assessment updatedAssessmentAdmin =
        succeedAssessmentUpdate(adminUser, updatedAssessmentInputAdmin);

    // - F: delete it as someone without task permission not in the write auth.groups
    failAssessmentDelete("erin", createdAssessment);

    // - S: delete it as someone with task permission not in the write auth.groups
    succeedAssessmentDelete(getDomainUsername(taskResponsible), updatedAssessment);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInput)).isTrue();
    assertAssessments(
        withCredentials(getDomainUsername(getRegularUser()),
            t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);

    // - S: delete it as someone without task permission in the write auth.groups
    // assessment author shouldn't matter
    succeedAssessmentDelete(jackUser, updatedAssessmentAdmin);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInputAdmin)).isTrue();
    assertAssessments(
        withCredentials(getDomainUsername(getRegularUser()),
            t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);

    // - S: delete it as admin
    succeedAssessmentDelete(adminUser, updatedAssessmentJack);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInputJack)).isTrue();
    assertAssessments(
        withCredentials(getDomainUsername(getRegularUser()),
            t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicTaskAssessmentsEmptyWriteAuthGroups() {
    // Periodic assessment tests for task, with empty write communities defined
    // in the
    // dictionary
    final String assessmentKey = "fields.task.assessments.taskSemiannuallyNoWrite";
    final String recurrence = "semiannually";
    final Person taskResponsible = getAndrewAnderson();

    // - F: create for a task as someone without task permission and empty write auth.groups defined
    // in the dictionary
    final GenericRelatedObjectInput testTaskNroInput =
        createAssessmentRelatedObject(TaskDao.TABLE_NAME, TEST_TASK_12A_UUID);
    final AssessmentInput testAssessmentInputFail =
        createAssessment(assessmentKey, "erin", recurrence, testTaskNroInput);
    failAssessmentCreate("erin", testAssessmentInputFail);

    // - S: create for a task as someone with task permission and empty write auth.groups defined in
    // the dictionary
    final AssessmentInput testAssessmentInput =
        createAssessment(assessmentKey, "andrew", recurrence, testTaskNroInput);
    final List<AssessmentInput> testAssessmentInputs = Lists.newArrayList(testAssessmentInput);
    final Assessment createdAssessment =
        succeedAssessmentCreate(getDomainUsername(taskResponsible), testAssessmentInput);

    // - S: read it with no read auth.groups defined in the dictionary
    final Task erinTask = withCredentials(getDomainUsername(getRegularUser()),
        t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID));
    assertAssessments(erinTask.getAssessments(), testAssessmentInputs, assessmentKey, 1);

    // - F: update it as someone without task permission and with empty write auth.groups defined in
    // the dictionary
    final AssessmentInput updatedAssessmentInputErin = getAssessmentInput(createdAssessment);
    updatedAssessmentInputErin
        .setAssessmentValues(createAssessmentValues("updated by erin", recurrence));
    failAssessmentUpdate("erin", updatedAssessmentInputErin);

    // - S: update it as someone with task permission and with empty write auth.groups defined in
    // the dictionary
    final AssessmentInput updatedAssessmentInput = getAssessmentInput(createdAssessment);
    updatedAssessmentInput
        .setAssessmentValues(createAssessmentValues("updated by andrew", recurrence));
    final List<AssessmentInput> updatedAssessmentsInput =
        Lists.newArrayList(updatedAssessmentInput);
    final Assessment updatedAssessment =
        succeedAssessmentUpdate(getDomainUsername(taskResponsible), updatedAssessmentInput);

    // - F: delete it as someone without task permission and with empty write auth.groups defined in
    // the dictionary
    failAssessmentDelete("erin", createdAssessment);

    // - S: delete it as someone with task permission and with empty write auth.groups defined in
    // the dictionary
    succeedAssessmentDelete(getDomainUsername(taskResponsible), updatedAssessment);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInput)).isTrue();
    assertAssessments(
        withCredentials(getDomainUsername(getRegularUser()),
            t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);
  }

  @Test
  void testPeriodicTaskAssessmentsNoAuthGroups() {
    // Periodic assessment tests for task, with no communities defined in the
    // dictionary
    final String assessmentKey = "fields.task.assessments.taskMonthly";
    final String recurrence = "monthly";

    // - S: create for a task as someone without task permission and no auth.groups defined in
    // the dictionary
    final GenericRelatedObjectInput testTaskNroInput =
        createAssessmentRelatedObject(TaskDao.TABLE_NAME, TEST_TASK_12A_UUID);
    final AssessmentInput testAssessmentInput =
        createAssessment(assessmentKey, "erin", recurrence, testTaskNroInput);
    final List<AssessmentInput> testAssessmentInputs = Lists.newArrayList(testAssessmentInput);
    final Assessment createdAssessment = succeedAssessmentCreate("erin", testAssessmentInput);

    // - S: read it with no auth.groups defined in the dictionary
    final Task erinTask = withCredentials(getDomainUsername(getRegularUser()),
        t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID));
    assertAssessments(erinTask.getAssessments(), testAssessmentInputs, assessmentKey, 1);

    // - S: update it as someone without task permission and with no auth.groups defined in
    // the dictionary
    final AssessmentInput updatedAssessmentInput = getAssessmentInput(createdAssessment);
    updatedAssessmentInput
        .setAssessmentValues(createAssessmentValues("updated by erin", recurrence));
    succeedAssessmentUpdate("erin", updatedAssessmentInput);
    final List<AssessmentInput> updatedAssessmentsInput =
        Lists.newArrayList(updatedAssessmentInput);
    final Assessment updatedAssessment = succeedAssessmentUpdate("erin", updatedAssessmentInput);

    // - S: delete it as someone without task permission and with no auth.groups defined in
    // the dictionary
    succeedAssessmentDelete("erin", updatedAssessment);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInput)).isTrue();
    assertAssessments(
        withCredentials(getDomainUsername(getRegularUser()),
            t -> queryExecutor.task(TASK_FIELDS, TEST_TASK_12A_UUID)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 1);
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
    final Report createdReport = withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));
    final String reportUuid = createdReport.getUuid();

    // - F: create without relatedObjects
    AssessmentInput testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence);
    failAssessmentCreate(getDomainUsername(reportAuthor), testAssessmentInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failAssessmentCreate(getDomainUsername(reportAuthor), testAssessmentInputFail);

    // - F: create for a person
    final GenericRelatedObjectInput testAdvisorNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, reportAuthor.getUuid());
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput);
    failAssessmentCreate(getDomainUsername(reportAuthor), testAssessmentInputFail);

    // - F: create for a task
    final GenericRelatedObjectInput testTaskNroInput =
        createAssessmentRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence, testTaskNroInput);
    failAssessmentCreate(getDomainUsername(reportAuthor), testAssessmentInputFail);

    // - F: create for two reports
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput, testReportNroInput);
    failAssessmentCreate(getDomainUsername(reportAuthor), testAssessmentInputFail);

    // - F: create for a person and a task
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput, testTaskNroInput);
    failAssessmentCreate(getDomainUsername(reportAuthor), testAssessmentInputFail);

    // - F: create for a report, a person and a task
    testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence,
        testReportNroInput, testAdvisorNroInput, testTaskNroInput);
    failAssessmentCreate(getDomainUsername(reportAuthor), testAssessmentInputFail);

    // - F: create as non-author for a report and a person
    testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence,
        testReportNroInput, testAdvisorNroInput);
    failAssessmentCreate("erin", testAssessmentInputFail);

    // - F: create for a non-existing report and a person/task
    final GenericRelatedObjectInput testInvalidReportNroInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, "non-existing");
    testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence,
        testInvalidReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    failAssessmentCreate(getDomainUsername(reportAuthor), testAssessmentInputFail);

    // - S: create as author for a report and a person/task
    final AssessmentInput testAssessmentInputAuthor = createAssessment(assessmentKey, "author",
        recurrence, testReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    final List<AssessmentInput> testAssessmentInputs =
        Lists.newArrayList(testAssessmentInputAuthor);
    final Assessment createdAssessmentAuthor =
        succeedAssessmentCreate(getDomainUsername(reportAuthor), testAssessmentInputAuthor);

    // - S: create as someone else in the write auth.groups
    final AssessmentInput testAssessmentInputJack = createAssessment(assessmentKey, "jack",
        recurrence, testReportNroInput, testAdvisorNroInput);
    testAssessmentInputs.add(testAssessmentInputJack);
    final Assessment createdAssessmentJack =
        succeedAssessmentCreate(jackUser, testAssessmentInputJack);

    // - S: create as admin
    final AssessmentInput testAssessmentInputAdmin = createAssessment(assessmentKey, "admin",
        recurrence, testReportNroInput, testAdvisorNroInput);
    testAssessmentInputs.add(testAssessmentInputAdmin);
    final Assessment createdAssessmentAdmin =
        succeedAssessmentCreate(adminUser, testAssessmentInputAdmin);

    // - S: read it as author
    final Report updatedReport = withCredentials(getDomainUsername(reportAuthor),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    final List<Assessment> testAssessments = updatedReport.getAssessments();
    assertAssessments(testAssessments, testAssessmentInputs, assessmentKey, 2);

    // - S: read it as someone else in the read auth.groups
    final Report erinReport = withCredentials(getDomainUsername(getRegularUser()),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertAssessments(erinReport.getAssessments(), testAssessmentInputs, assessmentKey, 2);

    // - F: read it as someone else not in the read and write auth.groups
    final Report bobReport = withCredentials(getDomainUsername(getBobBobtown()),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertAssessments(bobReport.getAssessments(), Collections.emptyList(), assessmentKey, 2);

    // - S: read it as admin
    final Report adminReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertAssessments(adminReport.getAssessments(), testAssessmentInputs, assessmentKey, 2);

    // - F: update it as someone else not in the write auth.groups
    final AssessmentInput updatedAssessmentInputErin = getAssessmentInput(createdAssessmentAuthor);
    updatedAssessmentInputErin
        .setAssessmentValues(createAssessmentValues("updated by erin", recurrence));
    failAssessmentUpdate("erin", updatedAssessmentInputErin);

    // - S: update it as author
    final AssessmentInput updatedAssessmentInputAuthor =
        getAssessmentInput(createdAssessmentAuthor);
    updatedAssessmentInputAuthor
        .setAssessmentValues(createAssessmentValues("updated by author", recurrence));
    final List<AssessmentInput> updatedAssessmentsInput =
        Lists.newArrayList(updatedAssessmentInputAuthor);
    final Assessment updatedAssessmentAuthor =
        succeedAssessmentUpdate(getDomainUsername(reportAuthor), updatedAssessmentInputAuthor);

    // - S: update it as someone else in the write auth.groups
    // assessment author shouldn't matter
    final AssessmentInput updatedAssessmentInputJack = getAssessmentInput(createdAssessmentAdmin);
    updatedAssessmentInputJack
        .setAssessmentValues(createAssessmentValues("updated by jack", recurrence));
    updatedAssessmentsInput.add(updatedAssessmentInputJack);
    final Assessment updatedAssessmentJack =
        succeedAssessmentUpdate(jackUser, updatedAssessmentInputJack);

    // - S: update it as admin
    final AssessmentInput updatedAssessmentInputAdmin = getAssessmentInput(createdAssessmentJack);
    updatedAssessmentInputAdmin
        .setAssessmentValues(createAssessmentValues("updated by admin", recurrence));
    updatedAssessmentsInput.add(updatedAssessmentInputAdmin);
    final Assessment updatedAssessmentAdmin =
        succeedAssessmentUpdate(jackUser, updatedAssessmentInputAdmin);

    // - F: delete it as someone else not in the write auth.groups
    failAssessmentDelete("erin", updatedAssessmentAuthor);

    // - S: delete it as author
    succeedAssessmentDelete(getDomainUsername(reportAuthor), updatedAssessmentAuthor);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInputAuthor)).isTrue();
    assertAssessments(
        withCredentials(getDomainUsername(getRegularUser()),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 2);

    // - S: delete it as someone else in the write auth.groups
    // assessment author shouldn't matter
    succeedAssessmentDelete(jackUser, updatedAssessmentAdmin);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInputAdmin)).isTrue();
    assertAssessments(
        withCredentials(getDomainUsername(getRegularUser()),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 2);

    // - S: delete it as admin
    succeedAssessmentDelete(adminUser, updatedAssessmentJack);
    assertThat(updatedAssessmentsInput.remove(updatedAssessmentInputJack)).isTrue();
    assertAssessments(
        withCredentials(getDomainUsername(getRegularUser()),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 2);

    // Delete the test report
    withCredentials(getDomainUsername(reportAuthor),
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
    final Report createdReport = withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, createdReport.getUuid());
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, interlocutorPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createAssessmentRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final AssessmentInput testAssessmentInputAuthor = createAssessment(assessmentKey, "author",
        recurrence, testReportNroInput, forPerson ? testInterlocutorNroInput : testTaskNroInput);
    final List<AssessmentInput> testAssessmentInputs =
        Lists.newArrayList(testAssessmentInputAuthor);
    final Assessment createdAssessmentAuthor =
        succeedAssessmentCreate(getDomainUsername(reportAuthor), testAssessmentInputAuthor);
    assertAssessments(
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, createdReport.getUuid()))
            .getAssessments(),
        testAssessmentInputs, assessmentKey, 2);

    // - F: update it as someone else with empty write auth.groups defined in the dictionary
    final AssessmentInput updatedAssessmentInputJack = getAssessmentInput(createdAssessmentAuthor);
    updatedAssessmentInputJack
        .setAssessmentValues(createAssessmentValues("updated by jack", recurrence));
    failAssessmentUpdate(jackUser, updatedAssessmentInputJack);

    // - F: delete it as someone else with empty write auth.groups defined in the dictionary
    failAssessmentDelete(jackUser, createdAssessmentAuthor);

    // - S: delete it as author
    succeedAssessmentDelete(getDomainUsername(reportAuthor), createdAssessmentAuthor);
    testAssessmentInputs.remove(testAssessmentInputAuthor);
    assertAssessments(
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, createdReport.getUuid()))
            .getAssessments(),
        testAssessmentInputs, assessmentKey, 2);

    // Delete the test report
    withCredentials(getDomainUsername(reportAuthor),
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
    final Report createdReport = withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, createdReport.getUuid());
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, interlocutorPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createAssessmentRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final AssessmentInput testAssessmentInputAuthor = createAssessment(assessmentKey, "author",
        recurrence, testReportNroInput, forPerson ? testInterlocutorNroInput : testTaskNroInput);
    final List<AssessmentInput> testAssessmentInputs =
        Lists.newArrayList(testAssessmentInputAuthor);
    final Assessment createdAssessmentAuthor =
        succeedAssessmentCreate(getDomainUsername(reportAuthor), testAssessmentInputAuthor);
    assertAssessments(
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, createdReport.getUuid()))
            .getAssessments(),
        testAssessmentInputs, assessmentKey, 2);

    // - S: update it as someone else with no auth.groups defined in the dictionary
    final AssessmentInput updatedAssessmentInputJack = getAssessmentInput(createdAssessmentAuthor);
    updatedAssessmentInputJack
        .setAssessmentValues(createAssessmentValues("updated by jack", recurrence));
    succeedAssessmentUpdate(jackUser, updatedAssessmentInputJack);

    // - S: delete it as someone else with no auth.groups defined in the dictionary
    succeedAssessmentDelete(jackUser, createdAssessmentAuthor);

    // Delete the test report
    withCredentials(getDomainUsername(reportAuthor),
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
    final Report createdReport = withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));
    final String reportUuid = createdReport.getUuid();
    final int nrSubmitted = withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.submitReport("", reportUuid));
    assertThat(nrSubmitted).isOne();

    // - F: create without relatedObjects
    AssessmentInput testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence);
    failUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        testAssessmentInputFail);

    // - F: create for a report
    final GenericRelatedObjectInput testReportNroInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput);
    failUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        testAssessmentInputFail);

    // - F: create for a person
    final GenericRelatedObjectInput testAdvisorNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, reportAuthor.getUuid());
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput);
    failUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        testAssessmentInputFail);

    // - F: create for a task
    final GenericRelatedObjectInput testTaskNroInput =
        createAssessmentRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence, testTaskNroInput);
    failUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        testAssessmentInputFail);

    // - F: create for two reports
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testReportNroInput, testReportNroInput);
    failUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        testAssessmentInputFail);

    // - F: create for a person and a task
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testAdvisorNroInput, testTaskNroInput);
    failUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        testAssessmentInputFail);

    // - F: create for a report, a person and a task
    testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence,
        testReportNroInput, testAdvisorNroInput, testTaskNroInput);
    failUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        testAssessmentInputFail);

    // - F: create as non-author for a report and a person
    testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence,
        testReportNroInput, testAdvisorNroInput);
    failUpdateReportAssessments("erin", reportUuid, testAssessmentInputFail);

    // - F: create for a non-existing report and a person/task
    final GenericRelatedObjectInput testInvalidReportNroInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, "non-existing");
    testAssessmentInputFail = createAssessment(assessmentKey, "test", recurrence,
        testInvalidReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    failUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        testAssessmentInputFail);

    // - F: create for a report and a person/task, against a non-existing report
    final AssessmentInput testAssessmentInputAuthor = createAssessment(assessmentKey, "author",
        recurrence, testReportNroInput, forPerson ? testAdvisorNroInput : testTaskNroInput);
    testAssessmentInputFail =
        createAssessment(assessmentKey, "test", recurrence, testInvalidReportNroInput);
    failUpdateReportAssessments(getDomainUsername(reportAuthor), "non-existing",
        testAssessmentInputFail);

    // - S: create as author for a report and a person
    final List<AssessmentInput> testAssessmentInputs =
        Lists.newArrayList(testAssessmentInputAuthor);
    succeedUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        testAssessmentInputAuthor);

    // - S: create as approver
    final AssessmentInput testAssessmentInputApprover = createAssessment(assessmentKey, "approver",
        recurrence, testReportNroInput, testAdvisorNroInput);
    testAssessmentInputs.add(testAssessmentInputApprover);
    succeedUpdateReportAssessments(getDomainUsername(reportApprover), reportUuid,
        testAssessmentInputAuthor, testAssessmentInputApprover);

    // - S: create as someone else in the write auth.groups
    final AssessmentInput testAssessmentInputJack = createAssessment(assessmentKey, "jack",
        recurrence, testReportNroInput, testAdvisorNroInput);
    testAssessmentInputs.add(testAssessmentInputJack);
    succeedUpdateReportAssessments(jackUser, reportUuid, testAssessmentInputAuthor,
        testAssessmentInputApprover, testAssessmentInputJack);

    // - S: create as admin
    final AssessmentInput testAssessmentInputAdmin = createAssessment(assessmentKey, "admin",
        recurrence, testReportNroInput, testAdvisorNroInput);
    testAssessmentInputs.add(testAssessmentInputAdmin);
    succeedUpdateReportAssessments(adminUser, reportUuid, testAssessmentInputAuthor,
        testAssessmentInputApprover, testAssessmentInputJack, testAssessmentInputAdmin);

    // - S: read it as author
    final Report updatedReport = withCredentials(getDomainUsername(reportAuthor),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    final List<Assessment> testAssessments = updatedReport.getAssessments();
    assertAssessments(testAssessments, testAssessmentInputs, assessmentKey, 2);

    // - S: read it as approver
    final Report approverReport = withCredentials(getDomainUsername(reportApprover),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertAssessments(approverReport.getAssessments(), testAssessmentInputs, assessmentKey, 2);

    // - S: read it as someone else in the read auth.groups
    final Report erinReport = withCredentials(getDomainUsername(getRegularUser()),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertAssessments(erinReport.getAssessments(), testAssessmentInputs, assessmentKey, 2);

    // - F: read it as someone else not in the read and write auth.groups
    final Report bobReport = withCredentials(getDomainUsername(getBobBobtown()),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertAssessments(bobReport.getAssessments(), Collections.emptyList(), assessmentKey, 2);

    // - S: read it as admin
    final Report adminReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertAssessments(adminReport.getAssessments(), testAssessmentInputs, assessmentKey, 2);

    // - F: update it as someone else not in the write auth.groups
    final List<AssessmentInput> createdAssessmentsInput = getAssessmentsInput(testAssessments);
    failUpdateReportAssessments("erin", reportUuid,
        Iterables.toArray(createdAssessmentsInput, AssessmentInput.class));

    // - S: update it as author
    final AssessmentInput updatedAssessmentInputAuthor = createdAssessmentsInput.get(0);
    updatedAssessmentInputAuthor
        .setAssessmentValues(createAssessmentValues("updated by author", recurrence));
    succeedUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        Iterables.toArray(createdAssessmentsInput, AssessmentInput.class));

    // - S: update it as approver
    // assessment author shouldn't matter
    final AssessmentInput updatedAssessmentInputApprover = createdAssessmentsInput.get(2);
    updatedAssessmentInputApprover
        .setAssessmentValues(createAssessmentValues("updated by approver", recurrence));
    succeedUpdateReportAssessments(getDomainUsername(reportApprover), reportUuid,
        Iterables.toArray(createdAssessmentsInput, AssessmentInput.class));

    // - S: update it as someone else in the write auth.groups
    final AssessmentInput updatedAssessmentInputJack = createdAssessmentsInput.get(3);
    updatedAssessmentInputJack
        .setAssessmentValues(createAssessmentValues("updated by jack", recurrence));
    succeedUpdateReportAssessments(jackUser, reportUuid,
        Iterables.toArray(createdAssessmentsInput, AssessmentInput.class));

    // - S: update it as admin
    final AssessmentInput updatedAssessmentInputAdmin = createdAssessmentsInput.get(1);
    updatedAssessmentInputAdmin
        .setAssessmentValues(createAssessmentValues("updated by admin", recurrence));
    succeedUpdateReportAssessments(jackUser, reportUuid,
        Iterables.toArray(createdAssessmentsInput, AssessmentInput.class));

    // - F: delete it as someone else not in the write auth.groups
    failUpdateReportAssessments("erin", reportUuid);

    // - S: delete it as author
    final List<Assessment> updatedAssessments = withCredentials(getDomainUsername(reportAuthor),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getAssessments();
    final List<AssessmentInput> updatedAssessmentsInput = getAssessmentsInput(updatedAssessments);
    Collections.reverse(updatedAssessmentsInput);
    assertThat(updatedAssessmentsInput.remove(0)).isNotNull();
    succeedUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        Iterables.toArray(updatedAssessmentsInput, AssessmentInput.class));
    assertAssessments(
        withCredentials(getDomainUsername(reportAuthor),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 2);

    // - S: delete it as approver
    // assessment author shouldn't matter
    assertThat(updatedAssessmentsInput.remove(2)).isNotNull();
    succeedUpdateReportAssessments(getDomainUsername(reportApprover), reportUuid,
        Iterables.toArray(updatedAssessmentsInput, AssessmentInput.class));
    assertAssessments(
        withCredentials(getDomainUsername(reportAuthor),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 2);

    // - S: delete it as someone else in the write auth.groups
    assertThat(updatedAssessmentsInput.remove(1)).isNotNull();
    succeedUpdateReportAssessments(jackUser, reportUuid,
        Iterables.toArray(updatedAssessmentsInput, AssessmentInput.class));
    assertAssessments(
        withCredentials(getDomainUsername(reportAuthor),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 2);

    // - S: delete it as admin
    assertThat(updatedAssessmentsInput.remove(0)).isNotNull();
    succeedUpdateReportAssessments(adminUser, reportUuid,
        Iterables.toArray(updatedAssessmentsInput, AssessmentInput.class));
    assertAssessments(
        withCredentials(getDomainUsername(reportAuthor),
            t -> queryExecutor.report(REPORT_FIELDS, reportUuid)).getAssessments(),
        updatedAssessmentsInput, assessmentKey, 2);

    // Get the test report
    final Report report = withCredentials(getDomainUsername(reportAuthor),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    // Update it as author so it goes back to draft
    withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.updateReport(REPORT_FIELDS, getReportInput(report), false));
    // Then delete it
    final int nrDeleted = withCredentials(getDomainUsername(reportAuthor),
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
    final Report createdReport = withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));
    final String reportUuid = createdReport.getUuid();
    final int nrSubmitted = withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.submitReport("", reportUuid));
    assertThat(nrSubmitted).isOne();

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, interlocutorPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createAssessmentRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final AssessmentInput testAssessmentInputAuthor = createAssessment(assessmentKey, "author",
        recurrence, testReportNroInput, forPerson ? testInterlocutorNroInput : testTaskNroInput);
    final List<AssessmentInput> testAssessmentInputs =
        Lists.newArrayList(testAssessmentInputAuthor);
    succeedUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        testAssessmentInputAuthor);

    // - S: read it as someone else with no read auth.groups defined in the dictionary
    final Report jackReport =
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertAssessments(jackReport.getAssessments(), testAssessmentInputs, assessmentKey, 2);

    // - F: update it as someone else with empty write auth.groups defined in the dictionary
    final List<AssessmentInput> updatedAssessmentsInput =
        getAssessmentsInput(jackReport.getAssessments());
    final AssessmentInput updatedAssessmentInputJack = updatedAssessmentsInput.get(0);
    updatedAssessmentInputJack
        .setAssessmentValues(createAssessmentValues("updated by jack", recurrence));
    failUpdateReportAssessments(jackUser, reportUuid,
        Iterables.toArray(updatedAssessmentsInput, AssessmentInput.class));

    // - F: delete it as someone else with empty write auth.groups defined in the dictionary
    failUpdateReportAssessments(jackUser, reportUuid);

    // - S: delete it as author
    succeedUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid);
    testAssessmentInputs.remove(testAssessmentInputAuthor);
    assertAssessments(
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid))
            .getAssessments(),
        testAssessmentInputs, assessmentKey, 2);

    // Get the test report
    final Report report = withCredentials(getDomainUsername(reportAuthor),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    // Update it as author so it goes back to draft
    withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.updateReport(REPORT_FIELDS, getReportInput(report), false));
    // Then delete it
    final int nrDeleted = withCredentials(getDomainUsername(reportAuthor),
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
    final Report createdReport = withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.createReport(REPORT_FIELDS, reportInput));
    final String reportUuid = createdReport.getUuid();
    final int nrSubmitted = withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.submitReport("", reportUuid));
    assertThat(nrSubmitted).isOne();

    // - S: create as author for a report and a person
    final GenericRelatedObjectInput testReportNroInput =
        createAssessmentRelatedObject(ReportDao.TABLE_NAME, reportUuid);
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createAssessmentRelatedObject(PersonDao.TABLE_NAME, interlocutorPerson.getUuid());
    final GenericRelatedObjectInput testTaskNroInput =
        createAssessmentRelatedObject(TaskDao.TABLE_NAME, taskUuid);
    final AssessmentInput testAssessmentInputAuthor = createAssessment(assessmentKey, "author",
        recurrence, testReportNroInput, forPerson ? testInterlocutorNroInput : testTaskNroInput);
    final List<AssessmentInput> testAssessmentInputs =
        Lists.newArrayList(testAssessmentInputAuthor);
    succeedUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid,
        testAssessmentInputAuthor);

    // - S: read it as someone else with no auth.groups defined in the dictionary
    final Report jackReport =
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertAssessments(jackReport.getAssessments(), testAssessmentInputs, assessmentKey, 2);

    // - S: update it as someone else with no auth.groups defined in the dictionary
    final List<AssessmentInput> updatedAssessmentsInput =
        getAssessmentsInput(jackReport.getAssessments());
    final AssessmentInput updatedAssessmentInputJack = updatedAssessmentsInput.get(0);
    updatedAssessmentInputJack
        .setAssessmentValues(createAssessmentValues("updated by jack", recurrence));
    succeedUpdateReportAssessments(jackUser, reportUuid,
        Iterables.toArray(updatedAssessmentsInput, AssessmentInput.class));

    // - S: delete it as someone else with no auth.groups defined in the dictionary
    succeedUpdateReportAssessments(getDomainUsername(reportAuthor), reportUuid);
    testAssessmentInputs.remove(testAssessmentInputAuthor);
    assertAssessments(
        withCredentials(jackUser, t -> queryExecutor.report(REPORT_FIELDS, reportUuid))
            .getAssessments(),
        testAssessmentInputs, assessmentKey, 2);

    // Get the test report
    final Report report = withCredentials(getDomainUsername(reportAuthor),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    // Update it as author so it goes back to draft
    withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.updateReport(REPORT_FIELDS, getReportInput(report), false));
    // Then delete it
    final int nrDeleted = withCredentials(getDomainUsername(reportAuthor),
        t -> mutationExecutor.deleteReport("", reportUuid));
    assertThat(nrDeleted).isOne();
  }

  private AssessmentInput createAssessment(final String assessmentKey, final String text,
      final String recurrence, GenericRelatedObjectInput... assessmentRelatedObjects) {
    return AssessmentInput.builder().withAssessmentKey(assessmentKey)
        .withAssessmentValues(createAssessmentValues(text, recurrence))
        .withAssessmentRelatedObjects(Lists.newArrayList(assessmentRelatedObjects)).build();
  }

  private String createAssessmentValues(final String text, final String recurrence) {
    return String.format("{\"text\":\"%s\",\"%s\":\"%s\"}", text, JSON_ASSESSMENT_RECURRENCE,
        recurrence);
  }

  private GenericRelatedObjectInput createAssessmentRelatedObject(final String tableName,
      final String uuid) {
    return GenericRelatedObjectInput.builder().withRelatedObjectType(tableName)
        .withRelatedObjectUuid(uuid).build();
  }

  private void failAssessmentCreate(final String username, final AssessmentInput assessmentInput) {
    try {
      withCredentials(username,
          t -> mutationExecutor.createAssessment(ASSESSMENT_FIELDS, assessmentInput));
      fail("Expected exception creating instant assessment");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void failAssessmentUpdate(final String username, final AssessmentInput assessmentInput) {
    try {
      withCredentials(username,
          t -> mutationExecutor.updateAssessment(ASSESSMENT_FIELDS, assessmentInput));
      fail("Expected exception updating assessment");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void failAssessmentDelete(final String username, final Assessment assessment) {
    try {
      withCredentials(username, t -> mutationExecutor.deleteAssessment("", assessment.getUuid()));
      fail("Expected exception deleting assessment");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private Assessment succeedAssessmentCreate(final String username,
      final AssessmentInput assessmentInput) {
    final Assessment createdAssessment = withCredentials(username,
        t -> mutationExecutor.createAssessment(ASSESSMENT_FIELDS, assessmentInput));
    assertThat(createdAssessment).isNotNull();
    assertThat(createdAssessment.getUuid()).isNotNull();
    return createdAssessment;
  }

  private Assessment succeedAssessmentUpdate(final String username,
      final AssessmentInput assessmentInput) {
    final Assessment updatedAssessment = withCredentials(username,
        t -> mutationExecutor.updateAssessment(ASSESSMENT_FIELDS, assessmentInput));
    assertThat(updatedAssessment).isNotNull();
    assertThat(updatedAssessment.getAssessmentValues())
        .isEqualTo(assessmentInput.getAssessmentValues());
    return updatedAssessment;
  }

  private Integer succeedAssessmentDelete(final String username, final Assessment assessment) {
    final Integer nrDeleted =
        withCredentials(username, t -> mutationExecutor.deleteAssessment("", assessment.getUuid()));
    assertThat(nrDeleted).isOne();
    return nrDeleted;
  }

  private void failUpdateReportAssessments(final String username, final String reportUuid,
      final AssessmentInput... assessmentInputs) {
    try {
      withCredentials(username, t -> mutationExecutor.updateReportAssessments("",
          Lists.newArrayList(assessmentInputs), reportUuid));
      fail("Expected exception creating instant assessment");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private Integer succeedUpdateReportAssessments(final String username, final String reportUuid,
      final AssessmentInput... assessmentInputs) {
    final Integer nrUpdated = withCredentials(username, t -> mutationExecutor
        .updateReportAssessments("", Lists.newArrayList(assessmentInputs), reportUuid));
    assertThat(nrUpdated).isEqualTo(assessmentInputs.length);
    return nrUpdated;
  }

  private void assertAssessments(final List<Assessment> testAssessments,
      final List<AssessmentInput> testAssessmentInputs, final String assessmentKey,
      final int nrRelatedObjects) {
    final List<Assessment> filteredAssessments = testAssessments.stream()
        .filter(n -> assessmentKey.equals(n.getAssessmentKey())).collect(Collectors.toList());
    assertThat(filteredAssessments).hasSameSizeAs(testAssessmentInputs);
    // Filtered assessments are in reverse chronological order
    Collections.reverse(filteredAssessments);
    for (int i = 0; i < filteredAssessments.size(); i++) {
      final AssessmentInput ni = testAssessmentInputs.get(i);
      assertThat(filteredAssessments.get(i))
          .matches(n -> n.getAssessmentValues().equals(ni.getAssessmentValues()),
              "has correct text")
          .matches(n -> n.getAssessmentRelatedObjects().size() == nrRelatedObjects,
              "has correct related objects");
    }
  }

  private int countAssessments() {
    return assessmentCounterDao.countAssessments();
  }

}
