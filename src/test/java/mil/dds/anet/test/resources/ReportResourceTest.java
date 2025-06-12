package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AdminSettingInput;
import mil.dds.anet.test.client.AdvisorReportsEntry;
import mil.dds.anet.test.client.AnetBeanList_AuthorizationGroup;
import mil.dds.anet.test.client.AnetBeanList_Location;
import mil.dds.anet.test.client.AnetBeanList_Organization;
import mil.dds.anet.test.client.AnetBeanList_Person;
import mil.dds.anet.test.client.AnetBeanList_Report;
import mil.dds.anet.test.client.AnetBeanList_Task;
import mil.dds.anet.test.client.ApprovalStep;
import mil.dds.anet.test.client.ApprovalStepInput;
import mil.dds.anet.test.client.ApprovalStepType;
import mil.dds.anet.test.client.Atmosphere;
import mil.dds.anet.test.client.Attachment;
import mil.dds.anet.test.client.AttachmentInput;
import mil.dds.anet.test.client.AuthorizationGroup;
import mil.dds.anet.test.client.AuthorizationGroupSearchQueryInput;
import mil.dds.anet.test.client.Comment;
import mil.dds.anet.test.client.EmailAddress;
import mil.dds.anet.test.client.EmailAddressInput;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.LocationSearchQueryInput;
import mil.dds.anet.test.client.LocationSearchSortBy;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationInput;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonInput;
import mil.dds.anet.test.client.PersonSearchQueryInput;
import mil.dds.anet.test.client.PersonSearchSortBy;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.RecurseStrategy;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportAction;
import mil.dds.anet.test.client.ReportCancelledReason;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.ReportPerson;
import mil.dds.anet.test.client.ReportPersonInput;
import mil.dds.anet.test.client.ReportSearchQueryInput;
import mil.dds.anet.test.client.ReportSearchSortBy;
import mil.dds.anet.test.client.ReportSensitiveInformationInput;
import mil.dds.anet.test.client.ReportState;
import mil.dds.anet.test.client.RollupGraph;
import mil.dds.anet.test.client.SortOrder;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskSearchQueryInput;
import mil.dds.anet.test.client.TaskSearchSortBy;
import mil.dds.anet.test.client.User;
import mil.dds.anet.test.client.UserInput;
import mil.dds.anet.test.utils.UtilsTest;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReportResourceTest extends AbstractResourceTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String COMMENT_FIELDS = "{ uuid text author { uuid } }";
  private static final String LOCATION_FIELDS = "{ uuid name status lat lng }";
  private static final String _EMAIL_ADDRESSES_FIELDS = "emailAddresses { network address }";
  private static final String _ORGANIZATION_FIELDS =
      "uuid shortName longName status identificationCode";
  private static final String ORGANIZATION_FIELDS =
      String.format("{ %1$s approvalSteps { uuid name nextStepUuid relatedObjectUuid } %2$s }",
          _ORGANIZATION_FIELDS, _EMAIL_ADDRESSES_FIELDS);
  private static final String _PERSON_FIELDS =
      "uuid name status user phoneNumber rank biography obsoleteCountry country { uuid name }"
          + " gender endOfTourDate users { uuid domainUsername } pendingVerification createdAt updatedAt";
  private static final String PERSON_FIELDS =
      String.format("{ %1$s %2$s }", _PERSON_FIELDS, _EMAIL_ADDRESSES_FIELDS);
  private static final String REPORT_PEOPLE_FIELDS =
      String.format("{ %1$s primary author attendee interlocutor }", _PERSON_FIELDS);
  private static final String POSITION_FIELDS =
      String.format("{ uuid isApprover person { uuid } organization { %1$s } %2$s }",
          _ORGANIZATION_FIELDS, _EMAIL_ADDRESSES_FIELDS);
  private static final String REPORT_FIELDS =
      "uuid intent exsum state cancelledReason atmosphere atmosphereDetails"
          + " engagementDate duration engagementDayOfWeek keyOutcomes nextSteps reportText"
          + " createdAt updatedAt customFields classification";
  private static final String ROLLUP_FIELDS =
      String.format("{ org { %1$s } published cancelled }", _ORGANIZATION_FIELDS);
  private static final String _TASK_FIELDS = "uuid shortName longName category";
  private static final String TASK_FIELDS =
      String.format("{ %1$s parentTask { %1$s } }", _TASK_FIELDS);
  public static final String AUTHORIZATION_GROUP_FIELDS = "{ uuid name }";
  public static final String FIELDS = String.format(
      "{ %1$s advisorOrg %2$s interlocutorOrg %2$s authors %3$s attendees %3$s"
          + " reportPeople %3$s tasks %4$s approvalStep { uuid relatedObjectUuid } location %5$s"
          + " comments %6$s notes %7$s authorizationGroups %8$s"
          + " workflow { step { uuid relatedObjectUuid approvers { uuid person { uuid } } }"
          + " person { uuid } type createdAt } reportSensitiveInformation { uuid text } "
          + " attachments %9$s }",
      REPORT_FIELDS, ORGANIZATION_FIELDS, REPORT_PEOPLE_FIELDS, TASK_FIELDS, LOCATION_FIELDS,
      COMMENT_FIELDS, NoteResourceTest.NOTE_FIELDS, AUTHORIZATION_GROUP_FIELDS,
      AttachmentResourceTest.ATTACHMENT_FIELDS);

  @Test
  void createReport() {
    // Create a report writer
    final Person author = getNickNicholson();

    // Create an interlocutor for the report
    final Person interlocutorPerson = getSteveSteveson();
    final ReportPerson interlocutor = personToPrimaryReportPerson(interlocutorPerson, true);
    final Position interlocutorPosition = interlocutorPerson.getPosition();
    assertThat(interlocutorPosition).isNotNull();
    final Organization interlocutorOrg = interlocutorPosition.getOrganization();
    assertThat(interlocutorOrg).isNotNull();

    // Create an Advising Organization for the report writer
    final Organization advisorOrg = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    assertThat(advisorOrg).isNotNull();
    assertThat(advisorOrg.getUuid()).isNotNull();

    // Create leadership people in the AO who can approve this report
    final EmailAddress emailAddress1 =
        EmailAddress.builder().withNetwork(Utils.getEmailNetworkForNotifications())
            .withAddress("testApprover1@example.com").build();
    final User user1 = User.builder().withDomainUsername("testapprover1").build();
    final Person approver1tpl = Person.builder().withUser(true).withUsers(List.of(user1))
        .withEmailAddresses(List.of(emailAddress1)).withName("Test Approver 1")
        .withStatus(Status.ACTIVE).build();
    final Person approver1 = findOrPutPersonInDb(getDomainUsername(approver1tpl), approver1tpl);
    if (Boolean.TRUE.equals(approver1.getPendingVerification())) {
      // Approve newly created user
      withCredentials(adminUser, t -> mutationExecutor.approvePerson("", approver1.getUuid()));
    }
    final EmailAddress emailAddress2 =
        EmailAddress.builder().withNetwork(Utils.getEmailNetworkForNotifications())
            .withAddress("testApprover2@example.com").build();
    final User user2 = User.builder().withDomainUsername("testapprover2").build();
    final Person approver2tpl = Person.builder().withUser(true).withUsers(List.of(user2))
        .withEmailAddresses(List.of(emailAddress2)).withName("Test Approver 2")
        .withStatus(Status.ACTIVE).build();
    final Person approver2 = findOrPutPersonInDb(getDomainUsername(approver2tpl), approver2tpl);
    if (Boolean.TRUE.equals(approver2.getPendingVerification())) {
      // Approve newly created user
      withCredentials(adminUser, t -> mutationExecutor.approvePerson("", approver2.getUuid()));
    }

    final PositionInput approver1PosInput = PositionInput.builder()
        .withName("Test Approver 1 Position").withOrganization(getOrganizationInput(advisorOrg))
        .withLocation(getLocationInput(getGeneralHospital())).withType(PositionType.SUPERUSER)
        .withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE).build();
    final Position approver1Pos = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, approver1PosInput));
    assertThat(approver1Pos).isNotNull();
    assertThat(approver1Pos.getUuid()).isNotNull();
    Integer nrUpdated = withCredentials(adminUser, t -> mutationExecutor.putPersonInPosition("",
        getPersonInput(approver1), approver1Pos.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    final PositionInput approver2PosInput = PositionInput.builder()
        .withName("Test Approver 2 Position").withOrganization(getOrganizationInput(advisorOrg))
        .withLocation(getLocationInput(getGeneralHospital())).withType(PositionType.SUPERUSER)
        .withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE).build();
    final Position approver2Pos = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, approver2PosInput));
    assertThat(approver2Pos).isNotNull();
    assertThat(approver2Pos.getUuid()).isNotNull();
    nrUpdated = withCredentials(adminUser, t -> mutationExecutor.putPersonInPosition("",
        getPersonInput(approver2), approver2Pos.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    // Create a billet for the author
    final PositionInput authorBilletInput =
        PositionInput.builder().withName("A report writer").withType(PositionType.REGULAR)
            .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(advisorOrg))
            .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();
    final Position authorBillet = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, authorBilletInput));
    assertThat(authorBillet).isNotNull();
    assertThat(authorBillet.getUuid()).isNotNull();

    // Set this author in this billet
    nrUpdated = withCredentials(adminUser, t -> mutationExecutor.putPersonInPosition("",
        getPersonInput(author), authorBillet.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);
    final Position checkit = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, authorBillet.getUuid()));
    assertThat(checkit.getPerson()).isNotNull();
    assertThat(checkit.getPerson().getUuid()).isEqualTo(author.getUuid());

    // Create Approval workflow for Advising Organization
    final List<ApprovalStepInput> approvalStepsInput = new ArrayList<>();
    final ApprovalStepInput approvalStepInput =
        ApprovalStepInput.builder().withName("Test Group for Approving")
            .withType(ApprovalStepType.REPORT_APPROVAL).withRelatedObjectUuid(advisorOrg.getUuid())
            .withApprovers(List.of(getPositionInput(approver1Pos))).build();
    approvalStepsInput.add(approvalStepInput);

    // Adding a new approval step to an AO automatically puts it at the end of the approval process.
    final ApprovalStepInput releaseApprovalStepInput =
        ApprovalStepInput.builder().withName("Test Group of Releasers")
            .withType(ApprovalStepType.REPORT_APPROVAL).withRelatedObjectUuid(advisorOrg.getUuid())
            .withApprovers(List.of(getPositionInput(approver2Pos))).build();
    approvalStepsInput.add(releaseApprovalStepInput);
    final OrganizationInput advisorOrgInput = getOrganizationInput(advisorOrg);
    advisorOrgInput.setApprovalSteps(approvalStepsInput);

    nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateOrganization("", advisorOrgInput));
    assertThat(nrUpdated).isEqualTo(1);
    // Pull the approval workflow for this AO
    final Organization orgWithSteps = withCredentials(adminUser,
        t -> queryExecutor.organization(ORGANIZATION_FIELDS, advisorOrg.getUuid()));
    final List<ApprovalStep> steps = orgWithSteps.getApprovalSteps();
    assertThat(steps).hasSize(2);
    final ApprovalStep approvalStep = steps.get(0);
    assertThat(approvalStep.getName()).isEqualTo(approvalStepInput.getName());
    final ApprovalStep releaseApprovalStep = steps.get(1);
    assertThat(approvalStep.getNextStepUuid()).isEqualTo(releaseApprovalStep.getUuid());
    assertThat(releaseApprovalStep.getName()).isEqualTo(releaseApprovalStepInput.getName());

    // Ensure approver1 is now an approver
    final Position approver1Pos3 = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, approver1Pos.getUuid()));
    assertThat(approver1Pos3.getIsApprover()).isTrue();

    // Create some tasks for this organization
    final Task top = withCredentials(adminUser,
        t -> mutationExecutor.createTask(TASK_FIELDS,
            TestData.createTaskInput("test-1", "Test Top Task", "TOP", null,
                Collections.singletonList(getOrganizationInput(advisorOrg)), Status.ACTIVE)));
    assertThat(top).isNotNull();
    assertThat(top.getUuid()).isNotNull();
    final Task action = withCredentials(adminUser,
        t -> mutationExecutor.createTask(TASK_FIELDS, TestData.createTaskInput("test-1-1",
            "Test Task Action", "Action", getTaskInput(top), null, Status.ACTIVE)));
    assertThat(action).isNotNull();
    assertThat(action.getUuid()).isNotNull();

    // Create a Location that this Report was written at
    final Location loc =
        withCredentials(adminUser, t -> mutationExecutor.createLocation(LOCATION_FIELDS,
            TestData.createLocationInput("The Boat Dock", 1.23, 4.56)));
    assertThat(loc).isNotNull();
    assertThat(loc.getUuid()).isNotNull();

    // Write a Report
    final ReportPerson nonAttendingAuthor = personToReportAuthor(getElizabethElizawell());
    nonAttendingAuthor.setAttendee(false);
    final List<ReportPerson> reportPeople =
        List.of(interlocutor, personToPrimaryReportAuthor(author), nonAttendingAuthor);
    final ReportInput rInput = ReportInput.builder().withEngagementDate(Instant.now())
        .withDuration(120).withReportPeople(getReportPeopleInput(reportPeople))
        .withTasks(List.of(getTaskInput(action))).withLocation(getLocationInput(loc))
        .withAtmosphere(Atmosphere.POSITIVE).withAtmosphereDetails("Everybody was super nice!")
        .withIntent("A testing report to test that reporting reports")
        // set HTML of report text
        .withReportText(UtilsTest.getCombinedHtmlTestCase().getInput())
        // set JSON of customFields
        .withCustomFields(UtilsTest.getCombinedJsonTestCase().getInput())
        .withNextSteps("This is the next steps on a report")
        .withKeyOutcomes("These are the key outcomes of this engagement").build();
    final Report created = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    // Retrieve the report and do some additional checks
    final Report check = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(check.getState()).isEqualTo(ReportState.DRAFT);
    assertThat(check.getAdvisorOrg().getUuid()).isEqualTo(authorBillet.getOrganization().getUuid());
    assertThat(check.getInterlocutorOrg().getUuid()).isEqualTo(interlocutorOrg.getUuid());
    // check that HTML of report text is sanitized after create
    assertThat(check.getReportText()).isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());
    // check that JSON of customFields is sanitized after create
    assertThat(check.getCustomFields()).isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());
    assertThat(check.getReportPeople()).hasSameSizeAs(reportPeople);
    assertThat(check.getReportPeople())
        .allMatch(crp -> reportPeople.stream().anyMatch(rp -> isSameReportPerson(crp, rp)));

    // Have another regular user try to submit the report
    try {
      withCredentials(getDomainUsername(getRegularUser()),
          t -> mutationExecutor.submitReport("", created.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Have a superuser of another AO try to submit the report
    try {
      withCredentials(getDomainUsername(getSuperuser()),
          t -> mutationExecutor.submitReport("", created.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Have the author submit the report
    int numRows = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.submitReport("", created.getUuid()));
    assertThat(numRows).isOne();

    final Report returned1 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(returned1.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Verify that author can still edit the report
    returned1.setAtmosphereDetails("Everybody was super nice! Again!");
    final Report r2 = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(returned1), true));
    assertThat(r2.getAtmosphereDetails()).isEqualTo(returned1.getAtmosphereDetails());

    // Have the author submit the report, again
    numRows = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.submitReport("", created.getUuid()));
    assertThat(numRows).isOne();

    final Report returned2 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(returned2.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // The author should not be able to submit the report now
    try {
      withCredentials(getDomainUsername(author),
          t -> mutationExecutor.submitReport("", returned2.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    logger.debug("Expecting report {} in step {} because of org {} on author {}",
        returned2.getUuid(), approvalStep.getUuid(), advisorOrg.getUuid(), author);
    assertThat(returned2.getApprovalStep().getUuid()).isEqualTo(approvalStep.getUuid());

    // verify the location on this report
    assertThat(returned2.getLocation().getUuid()).isEqualTo(loc.getUuid());

    // verify the interlocutors on this report
    assertThat(
        returned2.getAttendees().stream().map(ReportPerson::getUuid).collect(Collectors.toSet()))
        .contains(interlocutor.getUuid());

    // verify the tasks on this report
    assertThat(returned2.getTasks().stream().map(Task::getUuid).collect(Collectors.toSet()))
        .contains(action.getUuid());

    // Verify this shows up on the approver's list of pending documents
    final ReportSearchQueryInput pendingQuery =
        ReportSearchQueryInput.builder().withPendingApprovalOf(approver1.getUuid()).build();
    AnetBeanList_Report pending = withCredentials(getDomainUsername(approver1),
        t -> queryExecutor.reportList(getListFields(FIELDS), pendingQuery));
    assertThat(pending.getList().stream().map(Report::getUuid).collect(Collectors.toSet()))
        .contains(returned2.getUuid());

    // Check on Report status for who needs to approve
    List<ReportAction> workflow = returned2.getWorkflow();
    assertThat(workflow).hasSize(3);
    ReportAction reportAction = workflow.get(1);
    assertThat(reportAction.getPerson()).isNull(); // Because this hasn't been approved yet.
    assertThat(reportAction.getCreatedAt()).isNull();
    assertThat(reportAction.getStep().getUuid()).isEqualTo(approvalStep.getUuid());
    reportAction = workflow.get(2);
    assertThat(reportAction.getStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Reject the report
    numRows = withCredentials(getDomainUsername(approver1), t -> mutationExecutor.rejectReport("",
        TestData.createCommentInput("a test rejection"), created.getUuid()));
    assertThat(numRows).isOne();

    // Check on report status to verify it was rejected
    final Report returned3 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(returned3.getState()).isEqualTo(ReportState.REJECTED);
    assertThat(returned3.getApprovalStep()).isNull();

    // Author needs to re-submit
    numRows = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.submitReport("", created.getUuid()));
    assertThat(numRows).isOne();

    // TODO: Approver modify the report *specifically change the attendees!*

    // Approve the report
    numRows = withCredentials(getDomainUsername(approver1),
        t -> mutationExecutor.approveReport("", null, created.getUuid()));
    assertThat(numRows).isOne();

    // Check on Report status to verify it got moved forward
    final Report returned4 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(returned4.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
    assertThat(returned4.getApprovalStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Verify that the wrong person cannot approve this report.
    try {
      withCredentials(getDomainUsername(approver1),
          t -> mutationExecutor.approveReport("", null, created.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Approve the report
    numRows = withCredentials(getDomainUsername(approver2),
        t -> mutationExecutor.approveReport("", null, created.getUuid()));
    assertThat(numRows).isOne();

    // Check on Report status to verify it got moved forward
    final Report returned5 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(returned5.getState()).isEqualTo(ReportState.APPROVED);
    assertThat(returned5.getApprovalStep()).isNull();

    // The author should not be able to submit the report now
    try {
      withCredentials(getDomainUsername(author),
          t -> mutationExecutor.submitReport("", returned5.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // check on report status to see that it got approved.
    workflow = returned5.getWorkflow();
    // there were 5 actions on the report: submit, reject, submit, approve, approve
    assertThat(workflow).hasSize(6);
    reportAction = workflow.get(4);
    assertThat(reportAction.getPerson().getUuid()).isEqualTo(approver1.getUuid());
    assertThat(reportAction.getCreatedAt()).isNotNull();
    assertThat(reportAction.getStep().getUuid()).isEqualTo(approvalStep.getUuid());
    reportAction = workflow.get(5);
    assertThat(reportAction.getStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Admin can publish approved reports.
    numRows =
        withCredentials(adminUser, t -> mutationExecutor.publishReport("", created.getUuid()));
    assertThat(numRows).isOne();

    // Post a comment on the report because it's awesome
    final Comment commentOne =
        withCredentials(getDomainUsername(author), t -> mutationExecutor.addComment(COMMENT_FIELDS,
            TestData.createCommentInput("This is a test comment one"), created.getUuid()));
    assertThat(commentOne.getUuid()).isNotNull();
    assertThat(commentOne.getAuthor().getUuid()).isEqualTo(author.getUuid());

    final Comment commentTwo = withCredentials(getDomainUsername(approver1),
        t -> mutationExecutor.addComment(COMMENT_FIELDS,
            TestData.createCommentInput("This is a test comment two"), created.getUuid()));
    assertThat(commentTwo.getUuid()).isNotNull();

    final Report returned6 = withCredentials(getDomainUsername(approver1),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    final List<Comment> commentsReturned = returned6.getComments();
    assertThat(commentsReturned).hasSize(3); // the rejection comment will be there as well.
    // Assert order of comments!
    assertThat(commentsReturned.stream().map(Comment::getUuid).collect(Collectors.toList()))
        .containsSequence(commentOne.getUuid(), commentTwo.getUuid());

    // Verify this report shows up in the daily rollup
    final ReportSearchQueryInput query = ReportSearchQueryInput.builder()
        .withReleasedAtStart(
            Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant())
        .build();
    AnetBeanList_Report rollup =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(rollup.getTotalCount()).isPositive();
    assertThat(rollup.getList().stream().map(Report::getUuid).collect(Collectors.toSet()))
        .contains(returned6.getUuid());

    // Pull recent People, Tasks, and Locations and verify that the records from the last report are
    // there.
    final PersonSearchQueryInput queryPeople =
        PersonSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(PersonSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Person recentPeople = withCredentials(getDomainUsername(author),
        t -> queryExecutor.personList(getListFields(PERSON_FIELDS), queryPeople));
    assertThat(recentPeople.getList().stream().map(Person::getUuid).collect(Collectors.toSet()))
        .contains(interlocutorPerson.getUuid());

    final TaskSearchQueryInput queryTasks =
        TaskSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(TaskSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Task recentTasks = withCredentials(getDomainUsername(author),
        t -> queryExecutor.taskList(getListFields(TASK_FIELDS), queryTasks));
    assertThat(recentTasks.getList().stream().map(Task::getUuid).collect(Collectors.toSet()))
        .contains(action.getUuid());

    final LocationSearchQueryInput queryLocations =
        LocationSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(LocationSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Location recentLocations = withCredentials(getDomainUsername(author),
        t -> queryExecutor.locationList(getListFields(LOCATION_FIELDS), queryLocations));
    assertThat(
        recentLocations.getList().stream().map(Location::getUuid).collect(Collectors.toSet()))
        .contains(loc.getUuid());

    // Go and delete the entire approval chain!
    advisorOrg.setApprovalSteps(List.of());
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", getOrganizationInput(advisorOrg)));
    assertThat(nrUpdated).isEqualTo(1);

    Organization updatedOrg = withCredentials(adminUser,
        t -> queryExecutor.organization(ORGANIZATION_FIELDS, advisorOrg.getUuid()));
    assertThat(updatedOrg).isNotNull();
    assertThat(updatedOrg.getApprovalSteps()).isEmpty();
  }

  private boolean isSameReportPerson(ReportPerson crp, ReportPerson rp) {
    return rp.getUuid().equals(crp.getUuid()) && rp.getAuthor().equals(crp.getAuthor())
        && rp.getPrimary().equals(crp.getPrimary()) && rp.getAttendee().equals(crp.getAttendee());
  }

  @Test
  void createReportWithoutInterlocutor() {
    // Create a report writer
    final Person author = getNickNicholson();

    // Create a person for the report
    final Person reportAttendeePerson = getJackJackson();
    final ReportPerson reportAttendee = personToPrimaryReportPerson(reportAttendeePerson, true);
    final Position reportAttendeePosition = reportAttendeePerson.getPosition();
    assertThat(reportAttendeePosition).isNotNull();
    final Organization reportAttendeeOrg = reportAttendeePosition.getOrganization();
    assertThat(reportAttendeeOrg).isNotNull();

    // Create an Advising Organization for the report writer
    final Organization advisorOrg = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    assertThat(advisorOrg).isNotNull();
    assertThat(advisorOrg.getUuid()).isNotNull();

    // Create leadership people in the AO who can approve this report
    final EmailAddress emailAddress1 =
        EmailAddress.builder().withNetwork(Utils.getEmailNetworkForNotifications())
            .withAddress("testApprover1@example.com").build();
    final User user1 = User.builder().withDomainUsername("testapprover1").build();
    final Person approver1tpl = Person.builder().withUser(true).withUsers(List.of(user1))
        .withEmailAddresses(List.of(emailAddress1)).withName("Test Approver 1")
        .withStatus(Status.ACTIVE).build();
    final Person approver1 = findOrPutPersonInDb(getDomainUsername(approver1tpl), approver1tpl);
    final EmailAddress emailAddress2 =
        EmailAddress.builder().withNetwork(Utils.getEmailNetworkForNotifications())
            .withAddress("testApprover2@example.com").build();
    final User user2 = User.builder().withDomainUsername("testapprover2").build();
    final Person approver2tpl = Person.builder().withUser(true).withUsers(List.of(user2))
        .withEmailAddresses(List.of(emailAddress2)).withName("Test Approver 2")
        .withStatus(Status.ACTIVE).build();
    final Person approver2 = findOrPutPersonInDb(getDomainUsername(approver2tpl), approver2tpl);

    final PositionInput approver1PosInput = PositionInput.builder()
        .withName("Test Approver 1 Position").withOrganization(getOrganizationInput(advisorOrg))
        .withLocation(getLocationInput(getGeneralHospital())).withType(PositionType.SUPERUSER)
        .withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE).build();
    final Position approver1Pos = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, approver1PosInput));
    assertThat(approver1Pos).isNotNull();
    assertThat(approver1Pos.getUuid()).isNotNull();
    Integer nrUpdated = withCredentials(adminUser, t -> mutationExecutor.putPersonInPosition("",
        getPersonInput(approver1), approver1Pos.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    final PositionInput approver2PosInput = PositionInput.builder()
        .withName("Test Approver 2 Position").withOrganization(getOrganizationInput(advisorOrg))
        .withLocation(getLocationInput(getGeneralHospital())).withType(PositionType.SUPERUSER)
        .withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE).build();
    final Position approver2Pos = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, approver2PosInput));
    assertThat(approver2Pos).isNotNull();
    assertThat(approver2Pos.getUuid()).isNotNull();
    nrUpdated = withCredentials(adminUser, t -> mutationExecutor.putPersonInPosition("",
        getPersonInput(approver2), approver2Pos.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    // Verify these users
    final PersonInput approver1ActivateInput = getPersonInput(approver1);
    approver1ActivateInput.setPendingVerification(false);
    nrUpdated = withCredentials(getDomainUsername(approver1),
        t -> mutationExecutor.updateMe("", approver1ActivateInput));
    assertThat(nrUpdated).isEqualTo(1);
    final PersonInput approver2ActivateInput = getPersonInput(approver2);
    approver2ActivateInput.setPendingVerification(false);
    nrUpdated = withCredentials(getDomainUsername(approver2),
        t -> mutationExecutor.updateMe("", approver2ActivateInput));
    assertThat(nrUpdated).isEqualTo(1);

    // Create a billet for the author
    final PositionInput authorBilletInput =
        PositionInput.builder().withName("A report writer").withType(PositionType.REGULAR)
            .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(advisorOrg))
            .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();
    final Position authorBillet = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, authorBilletInput));
    assertThat(authorBillet).isNotNull();
    assertThat(authorBillet.getUuid()).isNotNull();

    // Set this author in this billet
    nrUpdated = withCredentials(adminUser, t -> mutationExecutor.putPersonInPosition("",
        getPersonInput(author), authorBillet.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);
    final Position checkit = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, authorBillet.getUuid()));
    assertThat(checkit.getPerson()).isNotNull();
    assertThat(checkit.getPerson().getUuid()).isEqualTo(author.getUuid());

    // Create Approval workflow for Advising Organization
    final List<ApprovalStepInput> approvalStepsInput = new ArrayList<>();
    final ApprovalStepInput approvalStepInput =
        ApprovalStepInput.builder().withName("Test Group for Approving")
            .withType(ApprovalStepType.REPORT_APPROVAL).withRelatedObjectUuid(advisorOrg.getUuid())
            .withApprovers(List.of(getPositionInput(approver1Pos))).build();
    approvalStepsInput.add(approvalStepInput);

    // Adding a new approval step to an AO automatically puts it at the end of the approval process.
    final ApprovalStepInput releaseApprovalStepInput =
        ApprovalStepInput.builder().withName("Test Group of Releasers")
            .withType(ApprovalStepType.REPORT_APPROVAL).withRelatedObjectUuid(advisorOrg.getUuid())
            .withApprovers(List.of(getPositionInput(approver2Pos))).build();
    approvalStepsInput.add(releaseApprovalStepInput);
    final OrganizationInput advisorOrgInput = getOrganizationInput(advisorOrg);
    advisorOrgInput.setApprovalSteps(approvalStepsInput);

    nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateOrganization("", advisorOrgInput));
    assertThat(nrUpdated).isEqualTo(1);
    // Pull the approval workflow for this AO
    final Organization orgWithSteps = withCredentials(adminUser,
        t -> queryExecutor.organization(ORGANIZATION_FIELDS, advisorOrg.getUuid()));
    final List<ApprovalStep> steps = orgWithSteps.getApprovalSteps();
    assertThat(steps).hasSize(2);
    final ApprovalStep approvalStep = steps.get(0);
    assertThat(approvalStep.getName()).isEqualTo(approvalStepInput.getName());
    final ApprovalStep releaseApprovalStep = steps.get(1);
    assertThat(approvalStep.getNextStepUuid()).isEqualTo(releaseApprovalStep.getUuid());
    assertThat(releaseApprovalStep.getName()).isEqualTo(releaseApprovalStepInput.getName());

    // Ensure approver1 is now an approver
    final Position approver1Pos1 = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, approver1Pos.getUuid()));
    assertThat(approver1Pos1.getIsApprover()).isTrue();

    // Create some tasks for this organization
    final Task top = withCredentials(adminUser,
        t -> mutationExecutor.createTask(TASK_FIELDS,
            TestData.createTaskInput("test-1-2", "Interlocutor Test Top Task", "TOP", null,
                Collections.singletonList(getOrganizationInput(advisorOrg)), Status.ACTIVE)));
    assertThat(top).isNotNull();
    assertThat(top.getUuid()).isNotNull();
    final Task action = withCredentials(adminUser,
        t -> mutationExecutor.createTask(TASK_FIELDS, TestData.createTaskInput("test-1-3",
            "Interlocutor Test Task Action", "Action", getTaskInput(top), null, Status.ACTIVE)));
    assertThat(action).isNotNull();
    assertThat(action.getUuid()).isNotNull();

    // Create a Location that this Report was written at
    final Location loc =
        withCredentials(adminUser, t -> mutationExecutor.createLocation(LOCATION_FIELDS,
            TestData.createLocationInput("The Boat Dock", 1.23, 4.56)));
    assertThat(loc).isNotNull();
    assertThat(loc.getUuid()).isNotNull();

    // Write a Report
    final ReportInput rInput =
        ReportInput.builder().withEngagementDate(Instant.now()).withDuration(120)
            .withReportPeople(
                getReportPeopleInput(List.of(reportAttendee, personToPrimaryReportAuthor(author))))
            .withTasks(List.of(getTaskInput(action))).withLocation(getLocationInput(loc))
            .withAtmosphere(Atmosphere.POSITIVE).withAtmosphereDetails("Everybody was super nice!")
            .withIntent("A testing report to test that reporting reports")
            // set HTML of report text
            .withReportText(UtilsTest.getCombinedHtmlTestCase().getInput())
            // set JSON of customFields
            .withCustomFields(UtilsTest.getCombinedJsonTestCase().getInput())
            .withNextSteps("This is the next steps on a report")
            .withKeyOutcomes("These are the key outcomes of this engagement")
            .withClassification(getFirstClassification()).build();
    final Report created = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getState()).isEqualTo(ReportState.DRAFT);
    assertThat(created.getAdvisorOrg().getUuid()).isEqualTo(advisorOrg.getUuid());
    assertThat(created.getInterlocutorOrg().getUuid()).isEqualTo(reportAttendeeOrg.getUuid());
    // check that HTML of report text is sanitized after create
    assertThat(created.getReportText()).isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());
    // check that JSON of customFields is sanitized after create
    assertThat(created.getCustomFields())
        .isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());

    // Have another regular user try to submit the report
    try {
      withCredentials(getDomainUsername(getRegularUser()),
          t -> mutationExecutor.submitReport("", created.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Have a superuser of another AO try to submit the report
    try {
      withCredentials(getDomainUsername(getSuperuser()),
          t -> mutationExecutor.submitReport("", created.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Have the author submit the report
    int numRows = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.submitReport("", created.getUuid()));
    assertThat(numRows).isOne();

    final Report returned1 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(returned1.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Verify that author can still edit the report
    returned1.setAtmosphereDetails("Everybody was super nice! Again!");
    final Report r2 = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(returned1), true));
    assertThat(r2.getAtmosphereDetails()).isEqualTo(returned1.getAtmosphereDetails());

    // Have the author submit the report, again
    numRows = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.submitReport("", created.getUuid()));
    assertThat(numRows).isOne();

    final Report returned2 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(returned2.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // The author should not be able to submit the report now
    try {
      withCredentials(getDomainUsername(author),
          t -> mutationExecutor.submitReport("", returned2.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    logger.debug("Expecting report {} in step {} because of org {} on author {}",
        returned2.getUuid(), approvalStep.getUuid(), advisorOrg.getUuid(), author);
    assertThat(returned2.getApprovalStep().getUuid()).isEqualTo(approvalStep.getUuid());

    // verify the location on this report
    assertThat(returned2.getLocation().getUuid()).isEqualTo(loc.getUuid());

    // verify the interlocutors on this report
    assertThat(
        returned2.getAttendees().stream().map(ReportPerson::getUuid).collect(Collectors.toSet()))
        .contains(reportAttendee.getUuid());

    // verify the tasks on this report
    assertThat(returned2.getTasks().stream().map(Task::getUuid).collect(Collectors.toSet()))
        .contains(action.getUuid());

    // Verify this shows up on the approver's list of pending documents
    final ReportSearchQueryInput pendingQuery =
        ReportSearchQueryInput.builder().withPendingApprovalOf(approver1.getUuid()).build();
    AnetBeanList_Report pending = withCredentials(getDomainUsername(approver1),
        t -> queryExecutor.reportList(getListFields(FIELDS), pendingQuery));
    assertThat(pending.getList().stream().map(Report::getUuid).collect(Collectors.toSet()))
        .contains(returned2.getUuid());

    // Check on Report status for who needs to approve
    List<ReportAction> workflow = returned2.getWorkflow();
    assertThat(workflow).hasSize(3);
    ReportAction reportAction = workflow.get(1);
    assertThat(reportAction.getPerson()).isNull(); // Because this hasn't been approved yet.
    assertThat(reportAction.getCreatedAt()).isNull();
    assertThat(reportAction.getStep().getUuid()).isEqualTo(approvalStep.getUuid());
    reportAction = workflow.get(2);
    assertThat(reportAction.getStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Reject the report
    numRows = withCredentials(getDomainUsername(approver1), t -> mutationExecutor.rejectReport("",
        TestData.createCommentInput("a test rejection"), created.getUuid()));
    assertThat(numRows).isOne();

    // Check on report status to verify it was rejected
    final Report returned3 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(returned3.getState()).isEqualTo(ReportState.REJECTED);
    assertThat(returned3.getApprovalStep()).isNull();

    // Author needs to re-submit
    numRows = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.submitReport("", created.getUuid()));
    assertThat(numRows).isOne();

    // TODO: Approver modify the report *specifically change the attendees!*

    // Approve the report
    numRows = withCredentials(getDomainUsername(approver1),
        t -> mutationExecutor.approveReport("", null, created.getUuid()));
    assertThat(numRows).isOne();

    // Check on Report status to verify it got moved forward
    final Report returned4 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(returned4.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
    assertThat(returned4.getApprovalStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Verify that the wrong person cannot approve this report.
    try {
      withCredentials(getDomainUsername(approver1),
          t -> mutationExecutor.approveReport("", null, created.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Approve the report
    numRows = withCredentials(getDomainUsername(approver2),
        t -> mutationExecutor.approveReport("", null, created.getUuid()));
    assertThat(numRows).isOne();

    // Check on Report status to verify it got moved forward
    final Report returned5 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(returned5.getState()).isEqualTo(ReportState.APPROVED);
    assertThat(returned5.getApprovalStep()).isNull();

    // The author should not be able to submit the report now
    try {
      withCredentials(getDomainUsername(author),
          t -> mutationExecutor.submitReport("", returned5.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // check on report status to see that it got approved.
    workflow = returned5.getWorkflow();
    // there were 5 actions on the report: submit, reject, submit, approve, approve
    assertThat(workflow).hasSize(6);
    reportAction = workflow.get(4);
    assertThat(reportAction.getPerson().getUuid()).isEqualTo(approver1.getUuid());
    assertThat(reportAction.getCreatedAt()).isNotNull();
    assertThat(reportAction.getStep().getUuid()).isEqualTo(approvalStep.getUuid());
    reportAction = workflow.get(5);
    assertThat(reportAction.getStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Admin can publish approved reports.
    numRows =
        withCredentials(adminUser, t -> mutationExecutor.publishReport("", created.getUuid()));
    assertThat(numRows).isOne();

    // Post a comment on the report because it's awesome
    final Comment commentOne =
        withCredentials(getDomainUsername(author), t -> mutationExecutor.addComment(COMMENT_FIELDS,
            TestData.createCommentInput("This is a test comment one"), created.getUuid()));
    assertThat(commentOne.getUuid()).isNotNull();
    assertThat(commentOne.getAuthor().getUuid()).isEqualTo(author.getUuid());

    final Comment commentTwo = withCredentials(getDomainUsername(approver1),
        t -> mutationExecutor.addComment(COMMENT_FIELDS,
            TestData.createCommentInput("This is a test comment two"), created.getUuid()));
    assertThat(commentTwo.getUuid()).isNotNull();

    final Report returned6 = withCredentials(getDomainUsername(approver1),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    final List<Comment> commentsReturned = returned6.getComments();
    assertThat(commentsReturned).hasSize(3); // the rejection comment will be there as well.
    // Assert order of comments!
    assertThat(commentsReturned.stream().map(Comment::getUuid).collect(Collectors.toList()))
        .containsSequence(commentOne.getUuid(), commentTwo.getUuid());

    // Verify this report shows up in the daily rollup
    final ReportSearchQueryInput query = ReportSearchQueryInput.builder()
        .withReleasedAtStart(
            Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant())
        .build();
    AnetBeanList_Report rollup =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(rollup.getTotalCount()).isPositive();
    assertThat(rollup.getList().stream().map(Report::getUuid).collect(Collectors.toSet()))
        .contains(returned6.getUuid());

    // Pull recent People, Tasks, and Locations and verify that the records from the last report are
    // there.
    final PersonSearchQueryInput queryPeople =
        PersonSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(PersonSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Person recentPeople = withCredentials(getDomainUsername(author),
        t -> queryExecutor.personList(getListFields(PERSON_FIELDS), queryPeople));
    assertThat(recentPeople.getList().stream().map(Person::getUuid).collect(Collectors.toSet()))
        .contains(reportAttendeePerson.getUuid());

    final TaskSearchQueryInput queryTasks =
        TaskSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(TaskSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Task recentTasks = withCredentials(getDomainUsername(author),
        t -> queryExecutor.taskList(getListFields(TASK_FIELDS), queryTasks));
    assertThat(recentTasks.getList().stream().map(Task::getUuid).collect(Collectors.toSet()))
        .contains(action.getUuid());

    final LocationSearchQueryInput queryLocations =
        LocationSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(LocationSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Location recentLocations = withCredentials(getDomainUsername(author),
        t -> queryExecutor.locationList(getListFields(LOCATION_FIELDS), queryLocations));
    assertThat(
        recentLocations.getList().stream().map(Location::getUuid).collect(Collectors.toSet()))
        .contains(loc.getUuid());

    // Go and delete the entire approval chain!
    advisorOrg.setApprovalSteps(List.of());
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", getOrganizationInput(advisorOrg)));
    assertThat(nrUpdated).isEqualTo(1);

    Organization updatedOrg = withCredentials(adminUser,
        t -> queryExecutor.organization(ORGANIZATION_FIELDS, advisorOrg.getUuid()));
    assertThat(updatedOrg).isNotNull();
    assertThat(updatedOrg.getApprovalSteps()).isEmpty();
  }

  @Test
  void testInheritedAndDefaultApprovalFlow() throws NumberFormatException {
    final Person jack = getJackJackson();
    final Person roger = getRogerRogwell();
    final Person bob = getBobBobtown();
    final Person ben = getBenRogers();

    // Create a Person who isn't in a Billet
    final EmailAddressInput emailAddressInput =
        EmailAddressInput.builder().withNetwork(Utils.getEmailNetworkForNotifications())
            .withAddress("newguy@example.com").build();
    final UserInput userInput = UserInput.builder().withDomainUsername("newguy").build();
    final PersonInput authorInput =
        PersonInput.builder().withName("A New Guy").withUser(true).withStatus(Status.ACTIVE)
            .withUsers(List.of(userInput)).withEmailAddresses(List.of(emailAddressInput)).build();
    final Person author =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(PERSON_FIELDS, authorInput));
    assertThat(author).isNotNull();
    assertThat(author.getUuid()).isNotNull();

    final List<ReportPersonInput> reportPeopleInput =
        getReportPeopleInput(List.of(personToPrimaryReportPerson(roger, true),
            personToPrimaryReportPerson(jack, false), personToReportAuthor(author)));

    // Write a report as that person
    final ReportInput rInput = ReportInput.builder()
        .withIntent("I am a new Advisor and wish to be included in things")
        .withAtmosphere(Atmosphere.NEUTRAL).withReportPeople(reportPeopleInput)
        .withReportText(
            "I just got here in town and am writing a report for the first time, but have no reporting structure set up")
        .withKeyOutcomes("Summary for the key outcomes").withNextSteps("Summary for the next steps")
        .withEngagementDate(Instant.now()).withDuration(75).build();
    final Report r = withCredentials(jackUser, t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(r).isNotNull();
    assertThat(r.getUuid()).isNotNull();

    // Test the situation where no default workflow has been defined
    final String defaultOrgUuid = adminDao.getDefaultOrgUuid();
    final String defaultOrgSetting = AdminDao.AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION.name();

    // Clear the defaultOrgUuid
    failSubmit(r, defaultOrgSetting, null);

    // Set the defaultOrgUuid to an empty string
    failSubmit(r, defaultOrgSetting, "");

    // Set the defaultOrgUuid to a non-existing org
    failSubmit(r, defaultOrgSetting, mil.dds.anet.beans.Organization.DUMMY_ORG_UUID);

    // Set the defaultOrgUuid back to the correct value
    final int numSettings = withCredentials(adminUser,
        t -> mutationExecutor.saveAdminSettings("", List.of(AdminSettingInput.builder()
            .withKey(defaultOrgSetting).withValue(defaultOrgUuid).build())));
    assertThat(numSettings).isOne();
    // Submit the report (by admin who can do that, as author doesn't have a position)
    int numRows = withCredentials(adminUser, t -> mutationExecutor.submitReport("", r.getUuid()));
    assertThat(numRows).isOne();

    // Check the approval Step
    final Report returned =
        withCredentials(jackUser, t -> queryExecutor.report(FIELDS, r.getUuid()));
    assertThat(returned.getUuid()).isEqualTo(r.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Find the default ApprovalSteps
    assertThat(defaultOrgUuid).isNotNull();
    final Organization orgWithSteps = withCredentials(jackUser,
        t -> queryExecutor.organization(ORGANIZATION_FIELDS, defaultOrgUuid));
    final List<ApprovalStep> steps = orgWithSteps.getApprovalSteps();
    assertThat(steps).isNotNull();
    assertThat(steps).hasSize(1);
    // Primary advisor (jack) is in EF1 which has no approval chain, so it should fall back to the
    // default
    assertThat(returned.getApprovalStep().getUuid()).isEqualTo(steps.get(0).getUuid());

    // The only default approver is admin; reject the report
    numRows = withCredentials(adminUser, t -> mutationExecutor.rejectReport("",
        TestData.createCommentInput("default approval chain test rejection"), returned.getUuid()));
    assertThat(numRows).isOne();

    // Fetch needed organizations
    final OrganizationSearchQueryInput queryOrgs = OrganizationSearchQueryInput.builder().build();
    queryOrgs.setPageSize(0);
    final AnetBeanList_Organization results = withCredentials(adminUser,
        t -> queryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs));
    Optional<Organization> ef11 = results.getList().stream()
        .filter(org -> org.getShortName().trim().equalsIgnoreCase("EF 1.1")).findFirst();
    Optional<Organization> ef6 = results.getList().stream()
        .filter(org -> org.getShortName().trim().equalsIgnoreCase("EF 6")).findFirst();
    assertThat(ef11).isPresent();
    assertThat(ef6).isPresent();

    // Change primary advisor of the report to someone in EF 1.1 (Bob)
    returned.setReportPeople(
        List.of(personToPrimaryReportPerson(roger, true), personToReportPerson(jack, false),
            personToPrimaryReportPerson(bob, false), personToReportAuthor(author)));

    final Report updated = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(returned), true));
    assertThat(updated).isNotNull();
    assertThat(updated.getAdvisorOrg().getUuid()).isNotEqualTo(returned.getAdvisorOrg().getUuid());

    // Re-submit the reported
    numRows = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.submitReport("", r.getUuid()));
    assertThat(numRows).isOne();

    // Report should now have the EF 1.1 approval step
    validateReportApprovalStep(
        withCredentials(jackUser, t -> queryExecutor.report(FIELDS, r.getUuid())),
        ef11.get().getUuid());

    // Change primary advisor of the report to someone in EF 6.1 (Ben)
    updated.setReportPeople(
        List.of(personToPrimaryReportPerson(roger, true), personToReportPerson(jack, false),
            personToPrimaryReportPerson(ben, false), personToReportAuthor(author)));

    final Report updated2 = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(updated), true));
    assertThat(updated2).isNotNull();
    assertThat(updated2.getAdvisorOrg().getUuid()).isNotEqualTo(updated.getAdvisorOrg().getUuid());

    // Re-submit the report
    numRows = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.submitReport("", r.getUuid()));
    assertThat(numRows).isOne();

    // EF 6.1 does not have approval steps but EF 6 does,
    // Report should now be up for review by EF 6 approvers due to inheriting approval steps form
    // parent
    validateReportApprovalStep(
        withCredentials(jackUser, t -> queryExecutor.report(FIELDS, r.getUuid())),
        ef6.get().getUuid());
  }

  private void validateReportApprovalStep(Report report, String organizationUuid) {
    assertThat(report.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
    assertThat(report.getApprovalStep()).isNotNull();
    assertThat(report.getApprovalStep().getRelatedObjectUuid()).isEqualTo(organizationUuid);
  }

  private void failSubmit(final Report r, final String defaultOrgSetting,
      final String defaultOrgValue) {
    final int numSettings = withCredentials(adminUser,
        t -> mutationExecutor.saveAdminSettings("", List.of(AdminSettingInput.builder()
            .withKey(defaultOrgSetting).withValue(defaultOrgValue).build())));
    assertThat(numSettings).isOne();
    // Submit the report: should fail
    try {
      withCredentials(adminUser, t -> mutationExecutor.submitReport("", r.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void reportEditTest() {
    // Elizabeth writes a report about meeting with Roger
    final Person elizabeth = getElizabethElizawell();
    final Person roger = getRogerRogwell();
    final Person nick = getNickNicholson();
    final Person bob = getBobBobtown();

    // Fetch some objects from the DB that we'll use later.
    final LocationSearchQueryInput queryLocs =
        LocationSearchQueryInput.builder().withText("Police").build();
    final AnetBeanList_Location locSearchResults = withCredentials(getDomainUsername(elizabeth),
        t -> queryExecutor.locationList(getListFields(LOCATION_FIELDS), queryLocs));
    assertThat(locSearchResults).isNotNull();
    assertThat(locSearchResults.getList()).isNotEmpty();
    final Location loc = locSearchResults.getList().get(0);

    final TaskSearchQueryInput queryTasks =
        TaskSearchQueryInput.builder().withText("Budgeting").build();
    final AnetBeanList_Task taskSearchResults = withCredentials(getDomainUsername(elizabeth),
        t -> queryExecutor.taskList(getListFields(TASK_FIELDS), queryTasks));
    assertThat(taskSearchResults.getTotalCount()).isGreaterThan(2);

    final ReportInput rInput = ReportInput.builder()
        .withIntent("A Test Report to test editing reports").withAtmosphere(Atmosphere.POSITIVE)
        .withAtmosphereDetails("it was a cold, cold day").withEngagementDate(Instant.now())
        .withDuration(60).withKeyOutcomes("There were some key out comes summarized")
        .withNextSteps("These are the next steps summarized")
        .withReportText("This report was generated by ReportsResourceTest#reportEditTest")
        .withReportPeople(getReportPeopleInput(
            List.of(personToPrimaryReportPerson(roger, true), personToReportAuthor(elizabeth))))
        .withTasks(List.of(getTaskInput(taskSearchResults.getList().get(0)))).build();
    Report returned = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(returned).isNotNull();
    assertThat(returned.getUuid()).isNotNull();

    // Elizabeth edits the report (update locationUuid and text, addPerson, remove a Task)
    returned.setLocation(loc);
    // update HTML of report text
    returned.setReportText(UtilsTest.getCombinedHtmlTestCase().getInput());
    // u[date JSON of customFields
    returned.setCustomFields(UtilsTest.getCombinedJsonTestCase().getInput());
    returned.setReportPeople(List.of(personToPrimaryReportPerson(roger, true),
        personToReportPerson(nick, false), personToPrimaryReportAuthor(elizabeth)));
    returned.setTasks(List.of());
    Report updated = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(returned), true));
    assertThat(updated).isNotNull();

    // Verify the report changed
    Report returned2 = withCredentials(getDomainUsername(elizabeth),
        t -> queryExecutor.report(FIELDS, returned.getUuid()));
    assertThat(returned2.getIntent()).isEqualTo(rInput.getIntent());
    assertThat(returned2.getLocation().getUuid()).isEqualTo(loc.getUuid());
    assertThat(returned2.getTasks()).isEmpty();
    final List<ReportPerson> returned2Attendees = returned2.getAttendees();
    assertThat(returned2Attendees).hasSize(3);
    assertThat(returned2Attendees.stream().map(ReportPerson::getUuid).collect(Collectors.toSet()))
        .contains(roger.getUuid());
    // check that HTML of report text is sanitized after update
    assertThat(returned2.getReportText())
        .isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());
    // check that JSON of customFields is sanitized after update
    assertThat(returned2.getCustomFields())
        .isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());

    // Elizabeth submits the report
    int numRows = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.submitReport("", returned.getUuid()));
    assertThat(numRows).isOne();
    Report returned3 = withCredentials(getDomainUsername(elizabeth),
        t -> queryExecutor.report(FIELDS, returned.getUuid()));
    assertThat(returned3.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Bob gets the approval (EF1 Approvers)
    final ReportSearchQueryInput pendingQuery =
        ReportSearchQueryInput.builder().withPendingApprovalOf(bob.getUuid()).build();
    AnetBeanList_Report pendingBobsApproval =
        withCredentials("bob", t -> queryExecutor.reportList(getListFields(FIELDS), pendingQuery));
    assertThat(pendingBobsApproval.getList().stream()
        .anyMatch(rpt -> rpt.getUuid().equals(returned3.getUuid()))).isTrue();

    // Bob edits the report (change reportText, remove Person, add a Task)
    returned3.setReportText(rInput.getReportText() + ", edited by Bob!!");
    returned3.setReportPeople(
        List.of(personToPrimaryReportPerson(nick, false), personToPrimaryReportAuthor(elizabeth)));
    returned3
        .setTasks(List.of(taskSearchResults.getList().get(1), taskSearchResults.getList().get(2)));
    updated = withCredentials("bob",
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(returned3), true));
    assertThat(updated).isNotNull();

    Report returned4 = withCredentials(getDomainUsername(elizabeth),
        t -> queryExecutor.report(FIELDS, returned.getUuid()));
    assertThat(returned4.getReportText()).endsWith("Bob!!");
    final List<ReportPerson> returned4Attendees = returned4.getAttendees();
    assertThat(returned4Attendees).hasSize(2);
    assertThat(returned4Attendees.stream().map(ReportPerson::getUuid).collect(Collectors.toSet()))
        .contains(nick.getUuid());
    assertThat(returned4.getTasks()).hasSize(2);

    numRows =
        withCredentials("bob", t -> mutationExecutor.approveReport("", null, returned.getUuid()));
    assertThat(numRows).isOne();
  }

  @Test
  void searchTest() {
    final Person jack = getJackJackson();
    final Person steve = getSteveSteveson();

    // Search based on report Text body, for any report State
    final ReportSearchQueryInput query1 = ReportSearchQueryInput.builder()
        .withState(List.of(ReportState.values())).withText("spreadsheet").build();
    AnetBeanList_Report searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).isNotEmpty();

    // Search based on summary
    query1.setText("Amherst");
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).isNotEmpty();

    // Search by Author
    query1.setText(null);
    query1.setAuthorUuid(jack.getUuid());
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getAuthors().stream().anyMatch(p -> p.getUuid().equals(jack.getUuid())))
        .count()).isEqualTo(searchResults.getList().size());
    final int numResults = searchResults.getList().size();

    // Search by Author with Date Filtering
    query1.setEngagementDateStart(
        ZonedDateTime.of(2020, 6, 1, 0, 0, 0, 0, DaoUtils.getServerNativeZoneId()).toInstant());
    query1.setEngagementDateEnd(
        ZonedDateTime.of(2020, 6, 15, 0, 0, 0, 0, DaoUtils.getServerNativeZoneId()).toInstant());
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList()).hasSizeLessThan(numResults);

    // Search by Attendee
    query1.setEngagementDateStart(null);
    query1.setEngagementDateEnd(null);
    query1.setAuthorUuid(null);
    query1.setAttendeeUuid(steve.getUuid());
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream().filter(r -> {
      try {
        return r.getAttendees().stream().anyMatch(rp -> (rp.getUuid().equals(steve.getUuid())));
      } catch (Exception e) {
        fail("error", e);
        return false;
      }
    })).hasSameSizeAs(searchResults.getList());

    final TaskSearchQueryInput queryTasks =
        TaskSearchQueryInput.builder().withText("1.1.A").build();
    final AnetBeanList_Task taskResults = withCredentials(jackUser,
        t -> queryExecutor.taskList(getListFields(TASK_FIELDS), queryTasks));
    assertThat(taskResults).isNotNull();
    assertThat(taskResults.getList()).isNotEmpty();
    Task task = taskResults.getList().stream().filter(t -> "1.1.A".equals(t.getShortName()))
        .findFirst().get();

    // Search by Task
    query1.setAttendeeUuid(null);
    query1.setTaskUuid(List.of(task.getUuid()));
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream().filter(r -> {
      try {
        return r.getTasks().stream().anyMatch(p -> p.getUuid().equals(task.getUuid()));
      } catch (Exception e) {
        fail("error", e);
        return false;
      }
    })).hasSameSizeAs(searchResults.getList());

    // Search by direct organization
    final OrganizationSearchQueryInput queryOrgs1 =
        OrganizationSearchQueryInput.builder().withText("EF 1").build();
    AnetBeanList_Organization orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs1));
    assertThat(orgs.getList()).isNotEmpty();
    Organization ef11 =
        orgs.getList().stream().filter(o -> o.getShortName().equals("EF 1.1")).findFirst().get();
    assertThat(ef11.getShortName()).isEqualToIgnoringCase("EF 1.1");

    final ReportSearchQueryInput query2 = ReportSearchQueryInput.builder()
        .withOrgUuid(List.of(ef11.getUuid())).withOrgRecurseStrategy(RecurseStrategy.NONE).build();
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query2));
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream().filter(r -> {
      try {
        return r.getAdvisorOrg().getUuid().equals(ef11.getUuid());
      } catch (Exception e) {
        fail("error", e);
        return false;
      }
    })).hasSameSizeAs(searchResults.getList());

    // Search by parent organization
    final OrganizationSearchQueryInput queryOrgs2 =
        OrganizationSearchQueryInput.builder().withText("ef 1").build();
    orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs2));
    assertThat(orgs.getList()).isNotEmpty();
    Organization ef1 = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("ef 1")).findFirst().get();
    assertThat(ef1.getShortName()).isEqualToIgnoringCase("EF 1");

    query2.setOrgUuid(List.of(ef1.getUuid()));
    query2.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query2));
    assertThat(searchResults.getList()).isNotEmpty();
    // #TODO: figure out how to verify the results?

    // Check search for just a single org, no recursion
    query2.setOrgUuid(List.of(ef11.getUuid()));
    query2.setOrgRecurseStrategy(null);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query2));
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream().filter(r -> {
      try {
        return r.getAdvisorOrg().getUuid().equals(ef11.getUuid());
      } catch (Exception e) {
        fail("error", e);
        return false;
      }
    })).hasSameSizeAs(searchResults.getList());


    // Search by location
    final LocationSearchQueryInput queryLocs =
        LocationSearchQueryInput.builder().withText("Cabot").build();
    final AnetBeanList_Location locSearchResults = withCredentials(jackUser,
        t -> queryExecutor.locationList(getListFields(LOCATION_FIELDS), queryLocs));
    assertThat(locSearchResults).isNotNull();
    assertThat(locSearchResults.getList()).isNotEmpty();
    Location cabot = locSearchResults.getList().get(0);

    final ReportSearchQueryInput query3 =
        ReportSearchQueryInput.builder().withState(List.of(ReportState.values()))
            .withLocationUuid(List.of(cabot.getUuid())).build();
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query3));
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getLocation().getUuid().equals(cabot.getUuid())))
        .hasSameSizeAs(searchResults.getList());

    // Search by Status.
    query3.setLocationUuid(null);
    query3.setState(List.of(ReportState.CANCELLED));
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query3));
    assertThat(searchResults.getList()).isNotEmpty();
    final int numCancelled = searchResults.getTotalCount();

    query3.setState(List.of(ReportState.CANCELLED, ReportState.PUBLISHED));
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query3));
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getTotalCount()).isGreaterThan(numCancelled);

    final OrganizationSearchQueryInput queryOrgs3 =
        OrganizationSearchQueryInput.builder().withText("Defense").build();
    orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs3));
    assertThat(orgs.getList()).isNotEmpty();
    Organization mod = orgs.getList().stream().filter(o -> o.getShortName().equalsIgnoreCase("MoD"))
        .findFirst().get();
    assertThat(mod.getShortName()).isEqualToIgnoringCase("MoD");

    // Search by Interlocutor Organization
    query3.setState(null);
    query3.setOrgUuid(List.of(mod.getUuid()));
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query3));
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream().filter(r -> {
      try {
        return r.getInterlocutorOrg().getUuid().equals(mod.getUuid());
      } catch (Exception e) {
        fail("error", e);
        return false;
      }
    })).hasSameSizeAs(searchResults.getList());

    // Search by Interlocutor Parent Organization
    query3.setOrgUuid(List.of(mod.getUuid()));
    query3.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query3));
    assertThat(searchResults.getList()).isNotEmpty();
    // TODO: figure out how to verify the results?

    final ReportSearchQueryInput query4 = ReportSearchQueryInput.builder().withText("spreadsheet")
        .withSortBy(ReportSearchSortBy.ENGAGEMENT_DATE).withSortOrder(SortOrder.ASC).build();
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query4));
    Instant prev = Instant.ofEpochMilli(0L);
    for (Report res : searchResults.getList()) {
      assertThat(res.getEngagementDate()).isAfter(prev);
      prev = res.getEngagementDate();
    }

    // Search for report text with stopwords
    final ReportSearchQueryInput query5 = ReportSearchQueryInput.builder()
        .withText("Hospital usage of Drugs").withPageSize(0).build(); // get them all
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query5));
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getIntent().contains("Hospital usage of Drugs")).count()).isPositive();

    /// find EF 2.2
    final OrganizationSearchQueryInput queryOrgs4 =
        OrganizationSearchQueryInput.builder().withText("ef 2.2").build();
    orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs4));
    assertThat(orgs.getList()).isNotEmpty();
    Organization ef22 = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("ef 2.2")).findFirst().get();
    assertThat(ef22.getShortName()).isEqualToIgnoringCase("EF 2.2");

    // Search for a report by interlocutor org
    final ReportSearchQueryInput query6 =
        ReportSearchQueryInput.builder().withOrgUuid(List.of(mod.getUuid())).build();
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query6));
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getInterlocutorOrg().getUuid().equals(mod.getUuid())).count())
        .isEqualTo(searchResults.getList().size());

    // this might fail if there are any children of mod, but there aren't in the base data set
    query6.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query6));
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getInterlocutorOrg().getUuid().equals(mod.getUuid())).count())
        .isEqualTo(searchResults.getList().size());

    // Search for a report by advisor org
    final ReportSearchQueryInput query7 =
        ReportSearchQueryInput.builder().withOrgUuid(List.of(ef22.getUuid())).build();
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query7));
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getAdvisorOrg().getUuid().equals(ef22.getUuid())).count())
        .isEqualTo(searchResults.getList().size());

    // this might fail if there are any children of ef22, but there aren't in the base data set
    query7.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query7));
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getAdvisorOrg().getUuid().equals(ef22.getUuid())).count())
        .isEqualTo(searchResults.getList().size());

    // Search by Atmosphere
    final ReportSearchQueryInput query8 =
        ReportSearchQueryInput.builder().withAtmosphere(Atmosphere.NEGATIVE).build();
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query8));
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getAtmosphere().equals(Atmosphere.NEGATIVE)).count())
        .isEqualTo(searchResults.getList().size());
  }

  @Test
  void searchWithinMultipleOrganizations() {
    final String EF1_UUID = "9a35caa7-a095-4963-ac7b-b784fde4d583";
    final String EF2_UUID = "291abe56-e2c2-4a3a-8419-1661e5c5ac17";

    final List<String> allEf1AndEf2ReportUuids =
        new ArrayList<>(searchAllReports(List.of(EF1_UUID)));
    allEf1AndEf2ReportUuids.addAll(searchAllReports(List.of(EF2_UUID)));
    final List<String> combinedEf1AndEf2ReportUuids = searchAllReports(List.of(EF1_UUID, EF2_UUID));

    // Now check that these match:
    assertThat(allEf1AndEf2ReportUuids)
        .containsExactlyInAnyOrderElementsOf(combinedEf1AndEf2ReportUuids);
  }

  private List<String> searchAllReports(List<String> orgUuid) {
    // Search recursively for all organizations in the given hierarchy
    final List<Organization> allOrgs = getDescendantOrgs(orgUuid);
    final List<String> allOrgUuids = new ArrayList<>(orgUuid);
    allOrgUuids.addAll(allOrgs.stream().map(Organization::getUuid).toList());

    // Search recursively for all reports in the given organizations
    final List<Report> allReports = searchReports(orgUuid, RecurseStrategy.CHILDREN);
    // And check that all reports have an advisor org from the given hierarchy:
    assertThat(allReports).allSatisfy(r -> assertThat(r.getAdvisorOrg()).isNotNull()
        .extracting(Organization::getUuid).isIn(allOrgUuids));

    // Combine search for reports in the whole hierarchy
    final List<Report> combinedReports = allOrgUuids.stream()
        .map(uuid -> searchReports(List.of(uuid), null)).flatMap(Collection::stream).toList();

    // Now check that these two results match:
    final List<String> allReportUuids = allReports.stream().map(Report::getUuid).toList();
    final List<String> combinedReportUuids = combinedReports.stream().map(Report::getUuid).toList();
    assertThat(allReportUuids).containsExactlyInAnyOrderElementsOf(combinedReportUuids);
    return allReportUuids;
  }

  private List<Organization> getDescendantOrgs(final List<String> uuids) {
    final String fields = String.format("{ %1$s descendantOrgs { %1$s } }", _ORGANIZATION_FIELDS);
    final List<Organization> organizations =
        withCredentials(jackUser, t -> queryExecutor.organizations(fields, uuids));
    assertThat(organizations).isNotNull();
    assertThat(organizations).allSatisfy(o -> assertThat(o.getDescendantOrgs()).isNotNull());
    return organizations.stream().map(Organization::getDescendantOrgs).flatMap(Collection::stream)
        .toList();
  }

  private List<Report> searchReports(final List<String> orgUuid,
      final RecurseStrategy recurseStrategy) {
    final ReportSearchQueryInput query = ReportSearchQueryInput.builder().withPageSize(0)
        .withOrgUuid(orgUuid).withOrgRecurseStrategy(recurseStrategy).build();
    final AnetBeanList_Report searchResults =
        withCredentials(jackUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(searchResults).isNotNull();
    assertThat(searchResults.getList()).isNotNull();
    return searchResults.getList();
  }

  @Test
  void searchInactiveReportsTest() {
    // All reports are considered ACTIVE; check that none are INACTIVE
    final ReportSearchQueryInput query =
        ReportSearchQueryInput.builder().withStatus(Status.INACTIVE).build();
    final AnetBeanList_Report searchResults =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(searchResults.getTotalCount()).isZero();
    assertThat(searchResults.getList()).isEmpty();
  }

  @Test
  void searchAuthorizationGroupUuid() {
    // Search by empty list of communities should not return reports
    final ReportSearchQueryInput query1 = ReportSearchQueryInput.builder()
        .withAuthorizationGroupUuid(Collections.emptyList()).build();
    final AnetBeanList_Report searchResults =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).isEmpty();

    // Get communities for sensitive information
    final AuthorizationGroupSearchQueryInput communitySearchQueryInput =
        AuthorizationGroupSearchQueryInput.builder().withPageSize(0)
            .withForSensitiveInformation(true).build();
    final AnetBeanList_AuthorizationGroup communitySearchResults = withCredentials(adminUser,
        t -> queryExecutor.authorizationGroupList(getListFields(AUTHORIZATION_GROUP_FIELDS),
            communitySearchQueryInput));

    // Search by list of communities
    final List<String> agUuids =
        communitySearchResults.getList().stream().map(AuthorizationGroup::getUuid).toList();
    final Set<String> agUuidSet = new HashSet<>(agUuids);
    final ReportSearchQueryInput query2 =
        ReportSearchQueryInput.builder().withAuthorizationGroupUuid(agUuids).build();
    final List<Report> reportList =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query2))
            .getList();

    for (final Report report : reportList) {
      assertThat(report.getAuthorizationGroups()).isNotNull();
      assertThat(report.getAuthorizationGroups()).isNotEmpty();
      final Set<String> collect = report.getAuthorizationGroups().stream()
          .map(AuthorizationGroup::getUuid).collect(Collectors.toSet());
      collect.retainAll(agUuidSet);
      assertThat(collect).isNotEmpty();
    }
  }

  @Test
  void searchUpdatedAtStartAndEndTest() {
    // insertBaseData has 1 report that is updatedAt 2 days before current timestamp
    final Instant startDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(3).toInstant();
    final Instant endDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant();

    // Greater than startDate and smaller than endDate
    final ReportSearchQueryInput query = ReportSearchQueryInput.builder()
        .withUpdatedAtStart(startDate).withUpdatedAtEnd(endDate).withPageSize(0).build();
    AnetBeanList_Report results =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(results.getList()).hasSize(1);
    Instant actualReportDate = results.getList().get(0).getUpdatedAt();

    // Greater than startDate and equal to endDate plus 1 ms (to avoid rounding errors)
    query.setUpdatedAtStart(startDate);
    query.setUpdatedAtEnd(actualReportDate.plus(1, ChronoUnit.MILLIS));
    results =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(results.getList()).hasSize(1);

    // Equal to startDate and smaller than endDate plus 1 ms (to avoid rounding errors)
    query.setUpdatedAtStart(actualReportDate);
    query.setUpdatedAtEnd(endDate.plus(1, ChronoUnit.MILLIS));
    results =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(results.getList()).hasSize(1);

    // Equal to startDate and equal to endDate plus 1 ms (to avoid rounding errors)
    query.setUpdatedAtStart(actualReportDate);
    query.setUpdatedAtEnd(actualReportDate.plus(1, ChronoUnit.MILLIS));
    results =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(results.getList()).hasSize(1);

    // A day before the startDate and startDate (no results expected)
    query.setUpdatedAtStart(
        startDate.atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant());
    query.setUpdatedAtEnd(startDate);
    query.setPageSize(0);
    results =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(results.getList()).isEmpty();
  }

  @Test
  void searchByAuthorPosition() {
    final ReportSearchQueryInput query = ReportSearchQueryInput.builder()
        .withAuthorPositionUuid(admin.getPosition().getUuid()).build();

    // Search by author position
    final AnetBeanList_Report results =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(results).isNotNull();
    assertThat(results.getList()).isNotEmpty();
  }

  @Test
  void searchAttendeePosition() {
    final ReportSearchQueryInput query = ReportSearchQueryInput.builder()
        .withAttendeePositionUuid(admin.getPosition().getUuid()).build();

    // Search by attendee position
    final AnetBeanList_Report results =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(results).isNotNull();
    assertThat(results.getList()).isNotEmpty();
  }

  @Test
  void reportDeleteTest() {
    final Map<String, Object> attachmentSettings = AttachmentResource.getAttachmentSettings();
    final Person elizabeth = getElizabethElizawell();
    final Person jack = getJackJackson();
    final Person roger = getRogerRogwell();
    final List<ReportPersonInput> reportPeopleInput =
        getReportPeopleInput(List.of(personToPrimaryReportPerson(roger, true),
            personToReportPerson(jack, false), personToPrimaryReportAuthor(elizabeth)));

    // Write a report as that person
    final ReportInput rInput = ReportInput.builder()
        .withIntent("This is a report that should be deleted").withAtmosphere(Atmosphere.NEUTRAL)
        .withReportPeople(reportPeopleInput)
        .withReportText("I'm writing a report that I intend to delete very soon.")
        .withKeyOutcomes("Summary for the key outcomes").withNextSteps("Summary for the next steps")
        .withEngagementDate(Instant.now()).withDuration(15).build();
    final Report r = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(r).isNotNull();
    assertThat(r.getUuid()).isNotNull();

    // Attach attachment to test report
    @SuppressWarnings("unchecked")
    final var allowedFileTypes = (List<Map<String, ?>>) attachmentSettings.get("fileTypes");
    final var allowedMimeTypes = (List<String>) allowedFileTypes.stream()
        .map(element -> (String) element.get("mimeType")).toList();
    final String mimeType = allowedMimeTypes.get(0);

    final GenericRelatedObjectInput testAroInput = GenericRelatedObjectInput.builder()
        .withRelatedObjectType(ReportDao.TABLE_NAME).withRelatedObjectUuid(r.getUuid()).build();
    final AttachmentInput testAttachmentInput =
        AttachmentInput.builder().withFileName("testDeleteAttachment.jpg").withMimeType(mimeType)
            .withDescription("a test attachment created by testDeleteAttachment")
            .withAttachmentRelatedObjects(Collections.singletonList(testAroInput)).build();
    final String createdAttachmentUuid = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.createAttachment("", testAttachmentInput));
    assertThat(createdAttachmentUuid).isNotNull();

    final Report updatedReport =
        withCredentials(adminUser, t -> queryExecutor.report(FIELDS, r.getUuid()));
    assertThat(updatedReport.getAttachments()).hasSize(1);
    final Attachment reportAttachment = updatedReport.getAttachments().get(0);
    assertThat(reportAttachment.getUuid()).isEqualTo(createdAttachmentUuid);
    assertThat(reportAttachment.getAttachmentRelatedObjects()).hasSize(1);

    // Try to delete by jack, this should fail.
    try {
      withCredentials(jackUser, t -> mutationExecutor.deleteReport("", r.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Now have the author delete this report.
    final Integer nrDeleted = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.deleteReport("", r.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);

    // Assert the report is gone.
    try {
      withCredentials("elizabeth", t -> queryExecutor.report(FIELDS, r.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Assert that the attachment is gone
    try {
      withCredentials(adminUser, t -> queryExecutor
          .attachment(AttachmentResourceTest.ATTACHMENT_FIELDS, reportAttachment.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void reportCancelTest() {
    final Person elizabeth = getElizabethElizawell(); // Report Author
    final Person steve = getSteveSteveson(); // Interlocutor
    final Person bob = getBobBobtown(); // Report Approver

    // Liz was supposed to meet with Steve, but he cancelled.

    final ReportInput rInput =
        ReportInput.builder().withIntent("Meet with Steve about a thing we never got to talk about")
            .withEngagementDate(Instant.now()).withDuration(45)
            .withReportPeople(getReportPeopleInput(List.of(personToPrimaryReportAuthor(elizabeth),
                personToPrimaryReportPerson(steve, true))))
            .withCancelledReason(ReportCancelledReason.CANCELLED_BY_INTERLOCUTOR).build();

    final Report saved = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(saved).isNotNull();
    assertThat(saved.getUuid()).isNotNull();

    int numRows = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.submitReport("", saved.getUuid()));
    assertThat(numRows).isOne();
    final Report returned = withCredentials(getDomainUsername(elizabeth),
        t -> queryExecutor.report(FIELDS, saved.getUuid()));
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
    assertThat(returned.getCancelledReason())
        .isEqualTo(ReportCancelledReason.CANCELLED_BY_INTERLOCUTOR);

    // Bob gets the approval (EF1 Approvers)
    final ReportSearchQueryInput pendingQuery =
        ReportSearchQueryInput.builder().withPendingApprovalOf(bob.getUuid()).build();
    AnetBeanList_Report pendingBobsApproval =
        withCredentials("bob", t -> queryExecutor.reportList(getListFields(FIELDS), pendingQuery));
    assertThat(pendingBobsApproval.getList().stream()
        .anyMatch(rpt -> rpt.getUuid().equals(returned.getUuid()))).isTrue();

    // Bob should approve this report.
    numRows =
        withCredentials("bob", t -> mutationExecutor.approveReport("", null, saved.getUuid()));
    assertThat(numRows).isOne();

    // Ensure it went to cancelled status.
    final Report returned2 = withCredentials(getDomainUsername(elizabeth),
        t -> queryExecutor.report(FIELDS, saved.getUuid()));
    assertThat(returned2.getState()).isEqualTo(ReportState.CANCELLED);

    // The author should not be able to submit the report now
    try {
      withCredentials(getDomainUsername(elizabeth),
          t -> mutationExecutor.submitReport("", returned2.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void dailyRollupGraphNonReportingTest() {
    final Person steve = getSteveSteveson();

    final ReportInput rInput = ReportInput.builder().withIntent("Test the Daily rollup graph")
        .withNextSteps("Check for a change in the rollup graph")
        .withKeyOutcomes("Foobar the bazbiz")
        .withReportPeople(getReportPeopleInput(
            List.of(personToPrimaryReportAuthor(admin), personToPrimaryReportPerson(steve, true))))
        .build();
    final Report r1 =
        withCredentials(adminUser, t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(r1).isNotNull();
    assertThat(r1.getUuid()).isNotNull();

    // Pull the daily rollup graph
    Instant startDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant();
    Instant endDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).plusDays(1).toInstant();
    final List<RollupGraph> startGraph = withCredentials(adminUser,
        t -> queryExecutor.rollupGraph(ROLLUP_FIELDS, endDate, null, null, startDate));

    // Submit the report
    try {
      withCredentials(adminUser, t -> mutationExecutor.submitReport("", r1.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Oops set the engagementDate.
    r1.setEngagementDate(Instant.now());
    r1.setDuration(50);
    final Report updated = withCredentials(adminUser,
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(r1), true));
    assertThat(updated).isNotNull();

    // Re-submit the report, it should work.
    int numRows = withCredentials(adminUser, t -> mutationExecutor.submitReport("", r1.getUuid()));
    assertThat(numRows).isOne();

    // Admin can approve his own reports.
    numRows =
        withCredentials(adminUser, t -> mutationExecutor.approveReport("", null, r1.getUuid()));
    assertThat(numRows).isOne();

    // Verify report is in APPROVED state.
    final Report r2 = withCredentials(adminUser, t -> queryExecutor.report(FIELDS, r1.getUuid()));
    assertThat(r2.getState()).isEqualTo(ReportState.APPROVED);

    // Admin can publish approved reports.
    numRows = withCredentials(adminUser, t -> mutationExecutor.publishReport("", r2.getUuid()));
    assertThat(numRows).isOne();

    // Verify report is in PUBLISHED state.
    final Report r3 = withCredentials(adminUser, t -> queryExecutor.report(FIELDS, r2.getUuid()));
    assertThat(r3.getState()).isEqualTo(ReportState.PUBLISHED);

    // Check on the daily rollup graph now.
    final List<RollupGraph> endGraph = withCredentials(adminUser,
        t -> queryExecutor.rollupGraph(ROLLUP_FIELDS, endDate, null, null, startDate));

    final Organization org = admin.getPosition().getOrganization();
    @SuppressWarnings("unchecked")
    final List<String> nro = (List<String>) dict.getDictionaryEntry("non_reporting_ORGs");
    // Admin's organization should have one more report PUBLISHED only if it is not in the
    // non-reporting orgs
    final int diff = (nro == null || !nro.contains(org.getShortName())) ? 1 : 0;
    final String orgUuid = org.getUuid();
    final Optional<RollupGraph> orgReportsStart = startGraph.stream()
        .filter(rg -> rg.getOrg() != null && rg.getOrg().getUuid().equals(orgUuid)).findFirst();
    final int startCt = orgReportsStart.isPresent() ? (orgReportsStart.get().getPublished()) : 0;
    final Optional<RollupGraph> orgReportsEnd = endGraph.stream()
        .filter(rg -> rg.getOrg() != null && rg.getOrg().getUuid().equals(orgUuid)).findFirst();
    final int endCt = orgReportsEnd.isPresent() ? (orgReportsEnd.get().getPublished()) : 0;
    assertThat(startCt).isEqualTo(endCt - diff);
  }

  @Test
  void dailyRollupGraphReportingTest() {
    final Person elizabeth = getElizabethElizawell();
    final Person steve = getSteveSteveson();

    final ReportInput rInput = ReportInput.builder().withIntent("Test the Daily rollup graph")
        .withNextSteps("Check for a change in the rollup graph")
        .withKeyOutcomes("Foobar the bazbiz").withReportPeople(getReportPeopleInput(List
            .of(personToPrimaryReportAuthor(elizabeth), personToPrimaryReportPerson(steve, true))))
        .build();
    final Report r1 = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(r1).isNotNull();
    assertThat(r1.getUuid()).isNotNull();

    // Pull the daily rollup graph
    final Instant startDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant();
    final Instant endDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).plusDays(1).toInstant();
    final List<RollupGraph> startGraph = withCredentials(adminUser,
        t -> queryExecutor.rollupGraph(ROLLUP_FIELDS, endDate, null, null, startDate));

    // Submit the report
    try {
      withCredentials(getDomainUsername(elizabeth),
          t -> mutationExecutor.submitReport("", r1.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Oops set the engagementDate.
    r1.setEngagementDate(Instant.now());
    r1.setDuration(115);
    final Report updated = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(r1), true));
    assertThat(updated).isNotNull();

    // Re-submit the report, it should work.
    int numRows = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.submitReport("", r1.getUuid()));
    assertThat(numRows).isOne();

    // Approve report.
    numRows = withCredentials("bob", t -> mutationExecutor.approveReport("", null, r1.getUuid()));
    assertThat(numRows).isOne();

    // Verify report is in APPROVED state.
    final Report r2 = withCredentials(getDomainUsername(elizabeth),
        t -> queryExecutor.report(FIELDS, r1.getUuid()));
    assertThat(r2.getState()).isEqualTo(ReportState.APPROVED);

    // Admin can publish approved reports.
    numRows = withCredentials(adminUser, t -> mutationExecutor.publishReport("", r1.getUuid()));
    assertThat(numRows).isOne();

    // Verify report is in PUBLISHED state.
    final Report r3 = withCredentials(getDomainUsername(elizabeth),
        t -> queryExecutor.report(FIELDS, r1.getUuid()));
    assertThat(r3.getState()).isEqualTo(ReportState.PUBLISHED);

    // Check on the daily rollup graph now.
    final List<RollupGraph> endGraph = withCredentials(adminUser,
        t -> queryExecutor.rollupGraph(ROLLUP_FIELDS, endDate, null, null, startDate));

    final Organization org = admin.getPosition().getOrganization();
    @SuppressWarnings("unchecked")
    final List<String> nro = (List<String>) dict.getDictionaryEntry("non_reporting_ORGs");
    // Elizabeth's organization should have one more report PUBLISHED only if it is not in the
    // non-reporting orgs
    final int diff = (nro == null || !nro.contains(org.getShortName())) ? 1 : 0;
    final Organization po = org.getParentOrg();
    final String orgUuid = po == null ? null : po.getUuid();
    final Optional<RollupGraph> orgReportsStart = startGraph.stream()
        .filter(rg -> rg.getOrg() != null && rg.getOrg().getUuid().equals(orgUuid)).findFirst();
    final int startCt = orgReportsStart.isPresent() ? (orgReportsStart.get().getPublished()) : 0;
    final Optional<RollupGraph> orgReportsEnd = endGraph.stream()
        .filter(rg -> rg.getOrg() != null && rg.getOrg().getUuid().equals(orgUuid)).findFirst();
    final int endCt = orgReportsEnd.isPresent() ? (orgReportsEnd.get().getPublished()) : 0;
    assertThat(startCt).isEqualTo(endCt - diff);
  }

  @Test
  void testSensitiveInformationByAuthor() {
    final Person elizabeth = getElizabethElizawell();
    final ReportSensitiveInformationInput rsiInput = ReportSensitiveInformationInput.builder()
        // set HTML of report sensitive information
        .withText(UtilsTest.getCombinedHtmlTestCase().getInput()).build();
    final ReportInput rInput = ReportInput.builder()
        .withReportPeople(getReportPeopleInput(List.of(personToPrimaryReportAuthor(elizabeth))))
        .withReportText(
            "This reportTest was generated by ReportsResourceTest#testSensitiveInformation")
        .withReportSensitiveInformation(rsiInput).build();
    final Report returned = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(returned).isNotNull();
    assertThat(returned.getUuid()).isNotNull();
    // elizabeth should be allowed to see it returned, as she's the author
    assertThat(returned.getReportSensitiveInformation()).isNotNull();
    // check that HTML of report sensitive information is sanitized after create
    assertThat(returned.getReportSensitiveInformation().getText())
        .isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());

    final Report returned2 = withCredentials(getDomainUsername(elizabeth),
        t -> queryExecutor.report(FIELDS, returned.getUuid()));
    // elizabeth should be allowed to see it
    assertThat(returned2.getReportSensitiveInformation()).isNotNull();
    assertThat(returned2.getReportSensitiveInformation().getText())
        .isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());

    // update HTML of report sensitive information
    returned2.getReportSensitiveInformation()
        .setText(UtilsTest.getCombinedHtmlTestCase().getInput());
    final Report updated = withCredentials(getDomainUsername(elizabeth),
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(returned2), true));
    assertThat(updated).isNotNull();
    assertThat(updated.getReportSensitiveInformation()).isNotNull();
    // check that HTML of report sensitive information is sanitized after update
    assertThat(updated.getReportSensitiveInformation().getText())
        .isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());

    final Report returned3 =
        withCredentials(jackUser, t -> queryExecutor.report(FIELDS, returned.getUuid()));
    // jack should not be allowed to see it
    assertThat(returned3.getReportSensitiveInformation()).isNull();
  }

  @Test
  void testSensitiveInformationByAuthorizationGroup() {
    final PersonSearchQueryInput erinQuery =
        PersonSearchQueryInput.builder().withText("erin").build();
    final AnetBeanList_Person erinSearchResults = withCredentials(adminUser,
        t -> queryExecutor.personList(getListFields(PERSON_FIELDS), erinQuery));
    assertThat(erinSearchResults.getTotalCount()).isPositive();
    final Optional<Person> erinResult = erinSearchResults.getList().stream()
        .filter(p -> p.getName().equals("Erinson, Erin")).findFirst();
    assertThat(erinResult).isNotEmpty();

    final ReportSearchQueryInput reportQuery =
        ReportSearchQueryInput.builder().withText("Test Cases are good")
            // otherwise test-case-created data can crowd the actual report we want out of the first
            // page
            .withSortOrder(SortOrder.ASC).build();
    final AnetBeanList_Report reportSearchResults =
        withCredentials("erin", t -> queryExecutor.reportList(getListFields(FIELDS), reportQuery));
    assertThat(reportSearchResults.getTotalCount()).isPositive();
    final Optional<Report> reportResult = reportSearchResults.getList().stream()
        .filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
    assertThat(reportResult).isNotEmpty();
    final Report report = reportResult.get();
    // erin is the author, so should be able to see the sensitive information
    assertThat(report.getReportSensitiveInformation()).isNotNull();
    assertThat(report.getReportSensitiveInformation().getText()).isEqualTo("Need to know only");

    final PersonSearchQueryInput reinaQuery =
        PersonSearchQueryInput.builder().withText("reina").build();
    final AnetBeanList_Person searchResults = withCredentials(adminUser,
        t -> queryExecutor.personList(getListFields(PERSON_FIELDS), reinaQuery));
    assertThat(searchResults.getTotalCount()).isPositive();
    final Optional<Person> reinaResult = searchResults.getList().stream()
        .filter(p -> p.getName().equals("Reinton, Reina")).findFirst();
    assertThat(reinaResult).isNotEmpty();

    final AnetBeanList_Report reportSearchResults2 =
        withCredentials("reina", t -> queryExecutor.reportList(getListFields(FIELDS), reportQuery));
    assertThat(reportSearchResults2.getTotalCount()).isPositive();
    final Optional<Report> reportResult2 = reportSearchResults2.getList().stream()
        .filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
    assertThat(reportResult2).isNotEmpty();
    final Report report2 = reportResult2.get();
    // reina is in the community, so should be able to see the sensitive information
    assertThat(report2.getReportSensitiveInformation()).isNotNull();
    assertThat(report2.getReportSensitiveInformation().getText()).isEqualTo("Need to know only");

    final PersonSearchQueryInput elizabethQuery =
        PersonSearchQueryInput.builder().withText("elizabeth").build();
    final AnetBeanList_Person searchResults3 = withCredentials(adminUser,
        t -> queryExecutor.personList(getListFields(PERSON_FIELDS), elizabethQuery));
    assertThat(searchResults3.getTotalCount()).isPositive();
    final Optional<Person> elizabethResult3 = searchResults3.getList().stream()
        .filter(p -> p.getName().equals("Elizawell, Elizabeth")).findFirst();
    assertThat(elizabethResult3).isNotEmpty();

    final AnetBeanList_Report reportSearchResults3 = withCredentials("elizabeth",
        t -> queryExecutor.reportList(getListFields(FIELDS), reportQuery));
    assertThat(reportSearchResults3.getTotalCount()).isPositive();
    final Optional<Report> reportResult3 = reportSearchResults3.getList().stream()
        .filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
    assertThat(reportResult3).isNotEmpty();
    final Report report3 = reportResult3.get();
    // elizabeth is not in the community, so should not be able to see the sensitive
    // information
    assertThat(report3.getReportSensitiveInformation()).isNull();
  }

  private ReportSearchQueryInput.Builder setupQueryEngagementDayOfWeek() {
    return ReportSearchQueryInput.builder().withState(List.of(ReportState.PUBLISHED));
  }

  private AnetBeanList_Report runSearchQuery(ReportSearchQueryInput query) {
    return withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
  }

  @Test
  void testEngagementDayOfWeekNotIncludedInResults() {
    final ReportSearchQueryInput query = setupQueryEngagementDayOfWeek().build();
    final AnetBeanList_Report reportResults = runSearchQuery(query);

    assertThat(reportResults).isNotNull();

    final List<Report> reports = reportResults.getList();
    for (Report rpt : reports) {
      assertThat(rpt.getEngagementDayOfWeek()).isNull();
    }
  }

  @Test
  void testEngagementDayOfWeekIncludedInResults() {
    final ReportSearchQueryInput query =
        setupQueryEngagementDayOfWeek().withIncludeEngagementDayOfWeek(true).build();

    final AnetBeanList_Report reportResults = runSearchQuery(query);
    assertThat(reportResults).isNotNull();

    final List<Integer> daysOfWeek = Arrays.asList(0, 1, 2, 3, 4, 5, 6);
    final List<Report> reports = reportResults.getList();
    for (Report rpt : reports) {
      assertThat(rpt.getEngagementDayOfWeek()).isIn(daysOfWeek);
    }
  }

  @Test
  void testSetEngagementDayOfWeek() {
    final ReportSearchQueryInput query = setupQueryEngagementDayOfWeek().withEngagementDayOfWeek(1)
        .withIncludeEngagementDayOfWeek(true).build();

    final AnetBeanList_Report reportResults = runSearchQuery(query);
    assertThat(reportResults).isNotNull();

    final List<Report> reports = reportResults.getList();
    for (Report rpt : reports) {
      assertThat(rpt.getEngagementDayOfWeek()).isEqualTo(1);
    }
  }

  @Test
  void testSetEngagementDayOfWeekOutsideWeekRange() {
    final ReportSearchQueryInput query = setupQueryEngagementDayOfWeek().withEngagementDayOfWeek(8)
        .withIncludeEngagementDayOfWeek(true).build();

    final AnetBeanList_Report reportResults = runSearchQuery(query);
    assertThat(reportResults).isNotNull();

    final List<Report> reports = reportResults.getList();
    assertThat(reports).isEmpty();
  }

  @Test
  void testAdvisorReportInsightsSuperuser() {
    advisorReportInsights(getSuperuser());
  }

  @Test
  void testAdvisorReportInsightsRegularUser() {
    advisorReportInsights(getRegularUser());
  }

  private void advisorReportInsights(final Person user) {
    try {
      createTestReport();
      final List<AdvisorReportsEntry> advisorReports =
          withCredentials(getDomainUsername(user),
              t -> queryExecutor.advisorReportInsights(
                  "{ uuid name stats { week nrReportsSubmitted nrEngagementsAttended } }", "-1",
                  3));
      assertThat(advisorReports).isNotNull();
      assertThat(advisorReports).isNotEmpty();
    } catch (Exception e) {
      fail("Unexpected Exception", e);
    }
  }

  private void createTestReport() {
    final Person author = getJackJackson();
    final ReportPerson reportPerson = personToPrimaryReportAuthor(author);
    final Position advisorPosition = author.getPosition();
    final Organization advisorOrganization = advisorPosition.getOrganization();

    final Instant engagementDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusWeeks(2).toInstant();
    final ReportInput rInput = ReportInput.builder().withState(ReportState.PUBLISHED)
        .withAtmosphere(Atmosphere.POSITIVE).withIntent("Testing the advisor reports insight")
        .withNextSteps("Retrieve the advisor reports insight")
        .withLocation(getLocationInput(getLocation(author, "General Hospital")))
        .withEngagementDate(engagementDate)
        .withReportPeople(getReportPeopleInput(List.of(reportPerson))).build();
    final Report created =
        withCredentials(adminUser, t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
  }

  private Location getLocation(Person user, String name) {
    final LocationSearchQueryInput query =
        LocationSearchQueryInput.builder().withText(name).build();
    final AnetBeanList_Location results = withCredentials(getDomainUsername(user),
        t -> queryExecutor.locationList(getListFields(LOCATION_FIELDS), query));
    assertThat(results).isNotNull();
    assertThat(results.getList()).isNotEmpty();
    return results.getList().get(0);
  }

  @Test
  void testApprovalFlow() throws NumberFormatException {
    // Fill a report
    final Person author = getJackJackson();
    final Location loc = getLocation(author, "Portugal Cove Ferry Terminal");
    final Instant engagementDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusWeeks(2).toInstant();
    final ReportInput rInput = ReportInput.builder()
        .withReportPeople(
            getReportPeopleInput(List.of(personToPrimaryReportPerson(getSteveSteveson(), true),
                personToPrimaryReportPerson(getElizabethElizawell(), false),
                personToReportAuthor(author))))
        .withState(ReportState.DRAFT).withAtmosphere(Atmosphere.POSITIVE)
        .withIntent("Testing the report approval flow")
        .withKeyOutcomes("Report approval flow works")
        .withNextSteps("Approve through the organization, task and location flow")
        .withReportText("Trying to get this report approved").withLocation(getLocationInput(loc))
        .withEngagementDate(engagementDate).build();

    // Reference task 1.1.A
    final TaskSearchQueryInput query = TaskSearchQueryInput.builder().withText("1.1.A").build();
    final AnetBeanList_Task searchObjects = withCredentials(getDomainUsername(author),
        t -> queryExecutor.taskList(getListFields(TASK_FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final List<Task> searchResults = searchObjects.getList();
    assertThat(searchResults).isNotEmpty();
    final Task t11a =
        searchResults.stream().filter(t -> t.getShortName().equals("1.1.A")).findFirst().get();
    rInput.setTasks(List.of(getTaskInput(t11a)));

    // Create the report
    final Report created = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getState()).isEqualTo(ReportState.DRAFT);

    // Submit the report
    int numRows = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.submitReport("", created.getUuid()));
    assertThat(numRows).isOne();
    final Report submitted = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(submitted).isNotNull();
    assertThat(submitted.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Check that the approval workflow has a step for task 1.1.A
    final Person andrew = getAndrewAnderson();
    assertThat(submitted.getWorkflow()).isNotNull();
    final List<ReportAction> t11aActions = submitted.getWorkflow().stream().filter(
        ra -> ra.getStep() != null && t11a.getUuid().equals(ra.getStep().getRelatedObjectUuid()))
        .toList();
    assertThat(t11aActions).hasSize(1);
    final ReportAction t11aAction = t11aActions.get(0);
    final ApprovalStep t11aStep = t11aAction.getStep();
    assertThat(t11aStep).isNotNull();
    final List<Position> t11aApprovers = t11aStep.getApprovers();
    assertThat(t11aApprovers).isNotEmpty();
    assertThat(
        t11aApprovers.stream().anyMatch(a -> andrew.getUuid().equals(a.getPerson().getUuid())))
        .isTrue();

    // Check that the approval workflow has a step for location Portugal Cove Ferry Terminal
    final List<ReportAction> locActions = submitted.getWorkflow().stream()
        .filter(
            ra -> ra.getStep() != null && loc.getUuid().equals(ra.getStep().getRelatedObjectUuid()))
        .toList();
    assertThat(locActions).hasSize(1);
    final ReportAction locAction = locActions.get(0);
    final ApprovalStep locStep = locAction.getStep();
    assertThat(locStep).isNotNull();
    final List<Position> locApprovers = locStep.getApprovers();
    assertThat(locApprovers).isNotEmpty();
    assertThat(locApprovers.stream().anyMatch(a -> admin.getUuid().equals(a.getPerson().getUuid())))
        .isTrue();

    // Have the report approved by the EF 1.1 approver
    numRows =
        withCredentials("bob", t -> mutationExecutor.approveReport("", null, submitted.getUuid()));
    assertThat(numRows).isOne();
    final Report approvedStep1 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(approvedStep1).isNotNull();
    assertThat(approvedStep1.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Check that the next step is the task approval
    final ApprovalStep step2 = approvedStep1.getApprovalStep();
    assertThat(step2).isNotNull();
    assertThat(step2.getRelatedObjectUuid()).isEqualTo(t11a.getUuid());

    // Have the report approved by the 1.1.A approver
    numRows = withCredentials(getDomainUsername(andrew),
        t -> mutationExecutor.approveReport("", null, submitted.getUuid()));
    assertThat(numRows).isOne();
    final Report approvedStep2 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(approvedStep2).isNotNull();
    assertThat(approvedStep1.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Check that the next step is the location approval
    final ApprovalStep step3 = approvedStep2.getApprovalStep();
    assertThat(step3).isNotNull();
    assertThat(step3.getRelatedObjectUuid()).isEqualTo(loc.getUuid());

    // Have the report approved by the location Portugal Cove Ferry Terminal approver
    numRows = withCredentials(adminUser,
        t -> mutationExecutor.approveReport("", null, submitted.getUuid()));
    assertThat(numRows).isOne();
    final Report approvedStep3 = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(approvedStep3).isNotNull();
    assertThat(approvedStep3.getState()).isEqualTo(ReportState.APPROVED);
  }

  @Test
  void testReportAuthors() {
    final Person author = getJackJackson();
    final ReportInput rInput = ReportInput.builder()
        .withReportPeople(getReportPeopleInput(List.of(personToReportAuthor(author))))
        .withState(ReportState.DRAFT).withAtmosphere(Atmosphere.POSITIVE)
        .withIntent("Testing report authors").withEngagementDate(Instant.now()).build();
    final Report reportFirstAuthor = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(reportFirstAuthor).isNotNull();
    assertThat(reportFirstAuthor.getUuid()).isNotNull();
    assertThat(reportFirstAuthor.getState()).isEqualTo(ReportState.DRAFT);
    assertThat(reportFirstAuthor.getReportPeople())
        .anyMatch(rp -> Objects.equals(rp.getUuid(), author.getUuid()) && rp.getAuthor());

    // Try to remove the author, should fail
    reportFirstAuthor.setReportPeople(null);
    try {
      withCredentials(getDomainUsername(author),
          t -> mutationExecutor.updateReport(FIELDS, getReportInput(reportFirstAuthor), true));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Add a second author
    final Person liz = getElizabethElizawell();
    reportFirstAuthor
        .setReportPeople(List.of(personToReportAuthor(author), personToReportAuthor(liz)));
    final Report reportTwoAuthors = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(reportFirstAuthor), true));
    assertThat(reportTwoAuthors.getReportPeople())
        .anyMatch(rp -> Objects.equals(rp.getUuid(), author.getUuid()) && rp.getAuthor());
    assertThat(reportTwoAuthors.getReportPeople())
        .anyMatch(rp -> Objects.equals(rp.getUuid(), liz.getUuid()) && rp.getAuthor());

    // Remove the first author
    reportTwoAuthors.setReportPeople(List.of(personToReportAuthor(liz)));
    final Report reportSecondAuthor = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(reportTwoAuthors), true));
    assertThat(reportSecondAuthor.getReportPeople())
        .noneMatch(rp -> Objects.equals(rp.getUuid(), author.getUuid()) && rp.getAuthor());
    assertThat(reportSecondAuthor.getReportPeople())
        .anyMatch(rp -> Objects.equals(rp.getUuid(), liz.getUuid()) && rp.getAuthor());

    // Try to edit the report as the first author, should fail
    reportSecondAuthor.setIntent("Testing report authors again");
    try {
      withCredentials(getDomainUsername(author),
          t -> mutationExecutor.updateReport(FIELDS, getReportInput(reportSecondAuthor), true));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Try to add first author again, should fail
    reportSecondAuthor
        .setReportPeople(List.of(personToReportAuthor(author), personToReportAuthor(liz)));
    try {
      withCredentials(getDomainUsername(author),
          t -> mutationExecutor.updateReport(FIELDS, getReportInput(reportSecondAuthor), true));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Try to delete the report as the first author, should fail
    try {
      withCredentials(getDomainUsername(author),
          t -> mutationExecutor.deleteReport("", reportSecondAuthor.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Have the remaining author delete this report.
    final Integer nrDeleted = withCredentials("elizabeth",
        t -> mutationExecutor.deleteReport("", reportSecondAuthor.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);
  }

  @Test
  void testUnpublishReport() {
    testUnpublishReport(false);
  }

  @Test
  void testUnpublishFutureReport() {
    testUnpublishReport(true);
  }

  private void testUnpublishReport(boolean isFuture) {
    final Person author = findOrPutPersonInDb("selena", Person.builder().build());
    final Location loc = getLocation(author, "Cabot Tower");
    final Instant engagementDate = Instant.now().atZone(DaoUtils.getServerNativeZoneId())
        .minusWeeks(isFuture ? -2 : 2).toInstant();
    final ReportInput rInput = ReportInput.builder()
        .withReportPeople(
            getReportPeopleInput(List.of(personToPrimaryReportPerson(getSteveSteveson(), true),
                personToPrimaryReportAuthor(author))))
        .withState(ReportState.DRAFT).withAtmosphere(Atmosphere.POSITIVE)
        .withIntent("Testing unpublishing").withKeyOutcomes("Unpublishing works")
        .withNextSteps("Approve before unpublishing")
        .withReportText("<p>Trying to get this report unpublished</p>")
        .withLocation(getLocationInput(loc)).withEngagementDate(engagementDate).build();

    // Reference task EF7
    final TaskSearchQueryInput query = TaskSearchQueryInput.builder().withText("EF7").build();
    final AnetBeanList_Task searchObjects = withCredentials(getDomainUsername(author),
        t -> queryExecutor.taskList(getListFields(TASK_FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final List<Task> searchResults = searchObjects.getList();
    assertThat(searchResults).isNotEmpty();
    final Task t11a =
        searchResults.stream().filter(t -> t.getShortName().equals("EF7")).findFirst().get();
    rInput.setTasks(List.of(getTaskInput(t11a)));

    // Create the report
    final Report created = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.createReport(FIELDS, rInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getState()).isEqualTo(ReportState.DRAFT);

    // Submit the report
    int numRows = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.submitReport("", created.getUuid()));
    assertThat(numRows).isOne();
    final Report submitted = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(submitted).isNotNull();
    if (!isFuture) {
      assertThat(submitted.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
      // Approve
      numRows = withCredentials(adminUser,
          t -> mutationExecutor.approveReport("", null, created.getUuid()));
      assertThat(numRows).isOne();
    }
    final Report approved = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(approved).isNotNull();
    assertThat(approved.getState()).isEqualTo(ReportState.APPROVED);

    // Try to unpublish report that is not published
    try {
      withCredentials(adminUser, t -> mutationExecutor.unpublishReport("", approved.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Publish report
    numRows =
        withCredentials(adminUser, t -> mutationExecutor.publishReport("", approved.getUuid()));
    assertThat(numRows).isOne();
    final Report published = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, created.getUuid()));
    assertThat(published).isNotNull();
    assertThat(published.getState()).isEqualTo(ReportState.PUBLISHED);

    // Try to unpublish published report by regular user
    try {
      withCredentials(getDomainUsername(author),
          t -> mutationExecutor.unpublishReport("", published.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
    // Try to unpublish published report by superuser
    try {
      withCredentials("bob", t -> mutationExecutor.unpublishReport("", published.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
    // Unpublish published report by admin
    final Integer nrUnpublished =
        withCredentials(adminUser, t -> mutationExecutor.unpublishReport("", published.getUuid()));
    assertThat(nrUnpublished).isEqualTo(1);
    // Check that workflow has been extended
    final Report unpublished = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(FIELDS, published.getUuid()));
    assertThat(unpublished).isNotNull();
    assertThat(unpublished.getState()).isEqualTo(ReportState.DRAFT);
    assertThat(unpublished.getWorkflow()).hasSize(published.getWorkflow().size() + 1);

    // Clean up
    final Integer nrDeleted = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.deleteReport("", unpublished.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);
  }

  @Test
  void testAdminCanFindAllDrafts() {
    final ReportSearchQueryInput draftsQuery = ReportSearchQueryInput.builder()
        .withState(List.of(ReportState.DRAFT)).withPageSize(0).build();

    // Normal users should find only their own drafts
    AnetBeanList_Report erinsDraftReports =
        withCredentials("erin", t -> queryExecutor.reportList(getListFields(FIELDS), draftsQuery));
    assertThat(erinsDraftReports.getTotalCount()).isOne();
    final Report erinsDraftReport = erinsDraftReports.getList().get(0);

    // Even when including all drafts (or trying to)
    draftsQuery.setIncludeAllDrafts(true);
    AnetBeanList_Report erinsDraftReportsAgain =
        withCredentials("erin", t -> queryExecutor.reportList(getListFields(FIELDS), draftsQuery));
    assertThat(erinsDraftReportsAgain.getTotalCount()).isOne();
    draftsQuery.setIncludeAllDrafts(false);

    // Erin's superuser should not be able to find it
    AnetBeanList_Report rebeccaDraftReports = withCredentials("rebecca",
        t -> queryExecutor.reportList(getListFields(FIELDS), draftsQuery));
    assertThat(rebeccaDraftReports.getTotalCount()).isZero();

    // Admin should normally find only their own drafts
    AnetBeanList_Report adminDraftReports = withCredentials(adminUser,
        t -> queryExecutor.reportList(getListFields(FIELDS), draftsQuery));
    assertThat(adminDraftReports.getTotalCount()).isEqualTo(2);
    // List should not include Erin's draft
    assertThat(adminDraftReports.getList())
        .noneMatch(report -> report.getUuid().equals(erinsDraftReport.getUuid()));

    // Except when including all drafts
    draftsQuery.setIncludeAllDrafts(true);
    AnetBeanList_Report allDraftReports = withCredentials(adminUser,
        t -> queryExecutor.reportList(getListFields(FIELDS), draftsQuery));
    assertThat(allDraftReports.getTotalCount()).isGreaterThan(1);
    // List should include Erin's draft
    assertThat(allDraftReports.getList())
        .anyMatch(report -> report.getUuid().equals(erinsDraftReport.getUuid()));
    // List should include other draft
    assertThat(allDraftReports.getList())
        .anyMatch(report -> !report.getUuid().equals(erinsDraftReport.getUuid()));
  }

  @Test
  void testAdminCanSubmit() {
    // Erin's Draft report, ready for submission
    final String uuid = "530b735e-1134-4daa-9e87-4491c888a4f7";
    final Report report = withCredentials(adminUser, t -> queryExecutor.report(FIELDS, uuid));
    assertThat(report.getState()).isEqualTo(ReportState.DRAFT);

    // Erin's superuser should not be able to submit it
    try {
      withCredentials("rebecca", t -> mutationExecutor.submitReport("", uuid));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Admin should be able to submit it
    try {
      withCredentials(adminUser, t -> mutationExecutor.submitReport("", uuid));
    } catch (Exception e) {
      fail("Unexpected Exception", e);
    }
    final Report submittedReport =
        withCredentials(adminUser, t -> queryExecutor.report(FIELDS, uuid));
    assertThat(submittedReport.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Erin should be able to edit it again
    final Report updatedReport = withCredentials("erin",
        t -> mutationExecutor.updateReport(FIELDS, getReportInput(report), false));

    // It should be back to Draft
    assertThat(updatedReport.getState()).isEqualTo(ReportState.DRAFT);
  }

  @Test
  void shouldBeSearchableViaCustomFields() {
    final var searchText = "minim";
    final var query = ReportSearchQueryInput.builder().withText(searchText).build();
    final var searchObjects =
        withCredentials(adminUser, t -> queryExecutor.reportList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getTotalCount()).isOne();
    assertThat(searchObjects.getList()).allSatisfy(
        searchResult -> assertThat(searchResult.getCustomFields()).contains(searchText));
  }
}
