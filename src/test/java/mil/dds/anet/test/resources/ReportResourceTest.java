package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;
import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.ForbiddenException;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AdminSettingInput;
import mil.dds.anet.test.client.AdvisorReportsEntry;
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
import mil.dds.anet.test.client.Comment;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.LocationSearchQueryInput;
import mil.dds.anet.test.client.LocationSearchSortBy;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationInput;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
import mil.dds.anet.test.client.OrganizationType;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonInput;
import mil.dds.anet.test.client.PersonSearchQueryInput;
import mil.dds.anet.test.client.PersonSearchSortBy;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionType;
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
import mil.dds.anet.test.client.Role;
import mil.dds.anet.test.client.RollupGraph;
import mil.dds.anet.test.client.SortOrder;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskSearchQueryInput;
import mil.dds.anet.test.client.TaskSearchSortBy;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.client.util.QueryExecutor;
import mil.dds.anet.test.integration.utils.TestApp;
import mil.dds.anet.test.utils.UtilsTest;
import mil.dds.anet.utils.DaoUtils;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReportResourceTest extends AbstractResourceTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String COMMENT_FIELDS = "{ uuid text author { uuid } }";
  private static final String LOCATION_FIELDS = "{ uuid name status lat lng }";
  private static final String _ORGANIZATION_FIELDS =
      "uuid shortName longName status identificationCode type";
  private static final String ORGANIZATION_FIELDS = String.format(
      "{ %1$s approvalSteps { uuid name nextStepUuid relatedObjectUuid } }", _ORGANIZATION_FIELDS);
  private static final String _PERSON_FIELDS =
      "uuid name status role emailAddress phoneNumber rank biography country"
          + " gender endOfTourDate domainUsername openIdSubject pendingVerification createdAt updatedAt";
  private static final String PERSON_FIELDS = String.format("{ %1$s }", _PERSON_FIELDS);
  private static final String REPORT_PEOPLE_FIELDS =
      String.format("{ %1$s primary author attendee }", _PERSON_FIELDS);
  private static final String POSITION_FIELDS = "{ uuid isApprover person { uuid } }";
  private static final String REPORT_FIELDS =
      "uuid intent exsum state cancelledReason atmosphere atmosphereDetails"
          + " engagementDate duration engagementDayOfWeek keyOutcomes nextSteps reportText"
          + " createdAt updatedAt customFields";
  private static final String ROLLUP_FIELDS =
      String.format("{ org { %1$s } published cancelled }", _ORGANIZATION_FIELDS);
  private static final String _TASK_FIELDS = "uuid shortName longName category";
  private static final String TASK_FIELDS =
      String.format("{ %1$s parentTask { %1$s } }", _TASK_FIELDS);
  protected static final String FIELDS = String.format(
      "{ %1$s advisorOrg %2$s principalOrg %2$s authors %3$s attendees %3$s"
          + " reportPeople %3$s tasks %4$s approvalStep { uuid relatedObjectUuid } location %5$s"
          + " comments %6$s notes %7$s authorizationGroups { uuid name }"
          + " workflow { step { uuid relatedObjectUuid approvers { uuid person { uuid } } }"
          + " person { uuid } type createdAt } reportSensitiveInformation { uuid text } "
          + " attachments %8$s }",
      REPORT_FIELDS, ORGANIZATION_FIELDS, REPORT_PEOPLE_FIELDS, TASK_FIELDS, LOCATION_FIELDS,
      COMMENT_FIELDS, NoteResourceTest.NOTE_FIELDS, AttachmentResourceTest.ATTACHMENT_FIELDS);

  @Test
  public void createReport()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a report writer
    final Person author = getNickNicholson();
    final QueryExecutor authorQueryExecutor = getQueryExecutor(author.getDomainUsername());
    final MutationExecutor authorMutationExecutor = getMutationExecutor(author.getDomainUsername());

    // Create a principal for the report
    final Person principalPerson = getSteveSteveson();
    final ReportPerson principal = personToPrimaryReportPerson(principalPerson);
    final Position principalPosition = principalPerson.getPosition();
    assertThat(principalPosition).isNotNull();
    final Organization principalOrg = principalPosition.getOrganization();
    assertThat(principalOrg).isNotNull();

    // Create an Advising Organization for the report writer
    final Organization advisorOrg = adminMutationExecutor.createOrganization(ORGANIZATION_FIELDS,
        TestData.createAdvisorOrganizationInput(true));
    assertThat(advisorOrg).isNotNull();
    assertThat(advisorOrg.getUuid()).isNotNull();

    // Create leadership people in the AO who can approve this report
    Person approver1 = Person.builder().withDomainUsername("testapprover1")
        .withEmailAddress("hunter+testApprover1@example.com").withName("Test Approver 1")
        .withRole(Role.ADVISOR).withStatus(Status.ACTIVE).build();
    approver1 = findOrPutPersonInDb(approver1);
    if (Boolean.TRUE.equals(approver1.getPendingVerification())) {
      // Approve newly created user
      adminMutationExecutor.approvePerson("", approver1.getUuid());
    }
    Person approver2 = Person.builder().withDomainUsername("testapprover2")
        .withEmailAddress("hunter+testApprover2@example.com").withName("Test Approver 2")
        .withRole(Role.ADVISOR).withStatus(Status.ACTIVE).build();
    approver2 = findOrPutPersonInDb(approver2);
    if (Boolean.TRUE.equals(approver2.getPendingVerification())) {
      // Approve newly created user
      adminMutationExecutor.approvePerson("", approver2.getUuid());
    }

    final PositionInput approver1PosInput = PositionInput.builder()
        .withName("Test Approver 1 Position").withOrganization(getOrganizationInput(advisorOrg))
        .withLocation(getLocationInput(getGeneralHospital())).withType(PositionType.SUPERUSER)
        .withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE).build();
    Position approver1Pos =
        adminMutationExecutor.createPosition(POSITION_FIELDS, approver1PosInput);
    assertThat(approver1Pos).isNotNull();
    assertThat(approver1Pos.getUuid()).isNotNull();
    Integer nrUpdated = adminMutationExecutor.putPersonInPosition("", getPersonInput(approver1),
        approver1Pos.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    final PositionInput approver2PosInput = PositionInput.builder()
        .withName("Test Approver 2 Position").withOrganization(getOrganizationInput(advisorOrg))
        .withLocation(getLocationInput(getGeneralHospital())).withType(PositionType.SUPERUSER)
        .withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE).build();
    final Position approver2Pos =
        adminMutationExecutor.createPosition(POSITION_FIELDS, approver2PosInput);
    assertThat(approver2Pos).isNotNull();
    assertThat(approver2Pos.getUuid()).isNotNull();
    nrUpdated = adminMutationExecutor.putPersonInPosition("", getPersonInput(approver2),
        approver2Pos.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    // Create a billet for the author
    final PositionInput authorBilletInput =
        PositionInput.builder().withName("A report writer").withType(PositionType.ADVISOR)
            .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(advisorOrg))
            .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();
    final Position authorBillet =
        adminMutationExecutor.createPosition(POSITION_FIELDS, authorBilletInput);
    assertThat(authorBillet).isNotNull();
    assertThat(authorBillet.getUuid()).isNotNull();

    // Set this author in this billet
    nrUpdated = adminMutationExecutor.putPersonInPosition("", getPersonInput(author),
        authorBillet.getUuid());
    assertThat(nrUpdated).isEqualTo(1);
    final Position checkit = adminQueryExecutor.position(POSITION_FIELDS, authorBillet.getUuid());
    assertThat(checkit.getPerson()).isNotNull();
    assertThat(checkit.getPerson().getUuid()).isEqualTo(author.getUuid());

    // Create Approval workflow for Advising Organization
    final List<ApprovalStepInput> approvalStepsInput = new ArrayList<>();
    final ApprovalStepInput approvalStepInput =
        ApprovalStepInput.builder().withName("Test Group for Approving")
            .withType(ApprovalStepType.REPORT_APPROVAL).withRelatedObjectUuid(advisorOrg.getUuid())
            .withApprovers(ImmutableList.of(getPositionInput(approver1Pos))).build();
    approvalStepsInput.add(approvalStepInput);

    // Adding a new approval step to an AO automatically puts it at the end of the approval process.
    final ApprovalStepInput releaseApprovalStepInput =
        ApprovalStepInput.builder().withName("Test Group of Releasers")
            .withType(ApprovalStepType.REPORT_APPROVAL).withRelatedObjectUuid(advisorOrg.getUuid())
            .withApprovers(ImmutableList.of(getPositionInput(approver2Pos))).build();
    approvalStepsInput.add(releaseApprovalStepInput);
    final OrganizationInput advisorOrgInput = getOrganizationInput(advisorOrg);
    advisorOrgInput.setApprovalSteps(approvalStepsInput);

    nrUpdated = adminMutationExecutor.updateOrganization("", advisorOrgInput);
    assertThat(nrUpdated).isEqualTo(1);
    // Pull the approval workflow for this AO
    final Organization orgWithSteps =
        adminQueryExecutor.organization(ORGANIZATION_FIELDS, advisorOrg.getUuid());
    final List<ApprovalStep> steps = orgWithSteps.getApprovalSteps();
    assertThat(steps.size()).isEqualTo(2);
    final ApprovalStep approvalStep = steps.get(0);
    assertThat(approvalStep.getName()).isEqualTo(approvalStepInput.getName());
    final ApprovalStep releaseApprovalStep = steps.get(1);
    assertThat(approvalStep.getNextStepUuid()).isEqualTo(releaseApprovalStep.getUuid());
    assertThat(releaseApprovalStep.getName()).isEqualTo(releaseApprovalStepInput.getName());

    // Ensure approver1 is now an approver
    approver1Pos = adminQueryExecutor.position(POSITION_FIELDS, approver1Pos.getUuid());
    assertThat(approver1Pos.getIsApprover()).isTrue();

    // Create some tasks for this organization
    final Task top = adminMutationExecutor.createTask(TASK_FIELDS,
        TestData.createTaskInput("test-1", "Test Top Task", "TOP", null,
            Collections.singletonList(getOrganizationInput(advisorOrg)), Status.ACTIVE));
    assertThat(top).isNotNull();
    assertThat(top.getUuid()).isNotNull();
    final Task action =
        adminMutationExecutor.createTask(TASK_FIELDS, TestData.createTaskInput("test-1-1",
            "Test Task Action", "Action", getTaskInput(top), null, Status.ACTIVE));
    assertThat(action).isNotNull();
    assertThat(action.getUuid()).isNotNull();

    // Create a Location that this Report was written at
    final Location loc = adminMutationExecutor.createLocation(LOCATION_FIELDS,
        TestData.createLocationInput("The Boat Dock", 1.23, 4.56));
    assertThat(loc).isNotNull();
    assertThat(loc.getUuid()).isNotNull();

    // Write a Report
    final ReportPerson nonAttendingAuthor = personToReportAuthor(getElizabethElizawell());
    nonAttendingAuthor.setAttendee(false);
    final ArrayList<ReportPerson> reportPeople =
        Lists.newArrayList(principal, personToReportAuthor(author), nonAttendingAuthor);
    final ReportInput rInput = ReportInput.builder().withEngagementDate(Instant.now())
        .withDuration(120).withReportPeople(getReportPeopleInput(reportPeople))
        .withTasks(Lists.newArrayList(getTaskInput(action))).withLocation(getLocationInput(loc))
        .withAtmosphere(Atmosphere.POSITIVE).withAtmosphereDetails("Everybody was super nice!")
        .withIntent("A testing report to test that reporting reports")
        // set HTML of report text
        .withReportText(UtilsTest.getCombinedHtmlTestCase().getInput())
        // set JSON of customFields
        .withCustomFields(UtilsTest.getCombinedJsonTestCase().getInput())
        .withNextSteps("This is the next steps on a report")
        .withKeyOutcomes("These are the key outcomes of this engagement")
        .withAdvisorOrg(getOrganizationInput(advisorOrg))
        .withPrincipalOrg(getOrganizationInput(principalOrg)).build();
    final Report created = authorMutationExecutor.createReport(FIELDS, rInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    // Retrieve the report and do some additional checks
    final Report check = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(check.getState()).isEqualTo(ReportState.DRAFT);
    assertThat(check.getAdvisorOrg().getUuid()).isEqualTo(advisorOrg.getUuid());
    assertThat(check.getPrincipalOrg().getUuid()).isEqualTo(principalOrg.getUuid());
    // check that HTML of report text is sanitized after create
    assertThat(check.getReportText()).isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());
    // check that JSON of customFields is sanitized after create
    assertThat(check.getCustomFields()).isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());
    assertThat(check.getReportPeople()).hasSameSizeAs(reportPeople);
    assertThat(check.getReportPeople())
        .allMatch(crp -> reportPeople.stream().anyMatch(rp -> isSameReportPerson(crp, rp)));

    // Have another regular user try to submit the report
    try {
      getMutationExecutor(getRegularUser().getDomainUsername()).submitReport("", created.getUuid());
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Have a superuser of another AO try to submit the report
    try {
      getMutationExecutor(getSuperuser().getDomainUsername()).submitReport("", created.getUuid());
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Have the author submit the report
    int numRows = authorMutationExecutor.submitReport("", created.getUuid());
    assertThat(numRows).isOne();

    Report returned = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Verify that author can still edit the report
    returned.setAtmosphereDetails("Everybody was super nice! Again!");
    final Report r2 = authorMutationExecutor.updateReport(FIELDS, getReportInput(returned), true);
    assertThat(r2.getAtmosphereDetails()).isEqualTo(returned.getAtmosphereDetails());

    // Have the author submit the report, again
    numRows = authorMutationExecutor.submitReport("", created.getUuid());
    assertThat(numRows).isOne();

    returned = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // The author should not be able to submit the report now
    try {
      authorMutationExecutor.submitReport("", returned.getUuid());
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }

    logger.debug("Expecting report {} in step {} because of org {} on author {}",
        returned.getUuid(), approvalStep.getUuid(), advisorOrg.getUuid(), author);
    assertThat(returned.getApprovalStep().getUuid()).isEqualTo(approvalStep.getUuid());

    // verify the location on this report
    assertThat(returned.getLocation().getUuid()).isEqualTo(loc.getUuid());

    // verify the principals on this report
    assertThat(returned.getAttendees().stream().map(a -> a.getUuid()).collect(Collectors.toSet()))
        .contains(principal.getUuid());

    // verify the tasks on this report
    assertThat(returned.getTasks().stream().map(t -> t.getUuid()).collect(Collectors.toSet()))
        .contains(action.getUuid());

    // Verify this shows up on the approvers list of pending documents
    final ReportSearchQueryInput pendingQuery =
        ReportSearchQueryInput.builder().withPendingApprovalOf(approver1.getUuid()).build();
    final QueryExecutor approver1QueryExecutor = getQueryExecutor(approver1.getDomainUsername());
    final MutationExecutor approver1MutationExecutor =
        getMutationExecutor(approver1.getDomainUsername());
    AnetBeanList_Report pending =
        approver1QueryExecutor.reportList(getListFields(FIELDS), pendingQuery);
    assertThat(pending.getList().stream().map(r -> r.getUuid()).collect(Collectors.toSet()))
        .contains(returned.getUuid());

    // Run a search for this users pending approvals
    final ReportSearchQueryInput searchQuery =
        ReportSearchQueryInput.builder().withPendingApprovalOf(approver1.getUuid()).build();
    pending = approver1QueryExecutor.reportList(getListFields(FIELDS), searchQuery);
    assertThat(pending.getList().size()).isGreaterThan(0);

    // Check on Report status for who needs to approve
    List<ReportAction> workflow = returned.getWorkflow();
    assertThat(workflow.size()).isEqualTo(3);
    ReportAction reportAction = workflow.get(1);
    assertThat(reportAction.getPerson()).isNull(); // Because this hasn't been approved yet.
    assertThat(reportAction.getCreatedAt()).isNull();
    assertThat(reportAction.getStep().getUuid()).isEqualTo(approvalStep.getUuid());
    reportAction = workflow.get(2);
    assertThat(reportAction.getStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Reject the report
    numRows = approver1MutationExecutor.rejectReport("",
        TestData.createCommentInput("a test rejection"), created.getUuid());
    assertThat(numRows).isOne();

    // Check on report status to verify it was rejected
    returned = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.REJECTED);
    assertThat(returned.getApprovalStep()).isNull();

    // Author needs to re-submit
    numRows = authorMutationExecutor.submitReport("", created.getUuid());
    assertThat(numRows).isOne();

    // TODO: Approver modify the report *specifically change the attendees!*

    // Approve the report
    numRows = approver1MutationExecutor.approveReport("", null, created.getUuid());
    assertThat(numRows).isOne();

    // Check on Report status to verify it got moved forward
    returned = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
    assertThat(returned.getApprovalStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Verify that the wrong person cannot approve this report.
    try {
      approver1MutationExecutor.approveReport("", null, created.getUuid());
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Approve the report
    numRows = getMutationExecutor(approver2.getDomainUsername()).approveReport("", null,
        created.getUuid());
    assertThat(numRows).isOne();

    // Check on Report status to verify it got moved forward
    returned = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.APPROVED);
    assertThat(returned.getApprovalStep()).isNull();

    // The author should not be able to submit the report now
    try {
      authorMutationExecutor.submitReport("", returned.getUuid());
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }

    // check on report status to see that it got approved.
    workflow = returned.getWorkflow();
    // there were 5 actions on the report: submit, reject, submit, approve, approve
    assertThat(workflow.size()).isEqualTo(6);
    reportAction = workflow.get(4);
    assertThat(reportAction.getPerson().getUuid()).isEqualTo(approver1.getUuid());
    assertThat(reportAction.getCreatedAt()).isNotNull();
    assertThat(reportAction.getStep().getUuid()).isEqualTo(approvalStep.getUuid());
    reportAction = workflow.get(5);
    assertThat(reportAction.getStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Admin can publish approved reports.
    numRows = adminMutationExecutor.publishReport("", created.getUuid());
    assertThat(numRows).isOne();

    // Post a comment on the report because it's awesome
    final Comment commentOne = authorMutationExecutor.addComment(COMMENT_FIELDS,
        TestData.createCommentInput("This is a test comment one"), created.getUuid());
    assertThat(commentOne.getUuid()).isNotNull();
    assertThat(commentOne.getAuthor().getUuid()).isEqualTo(author.getUuid());

    final Comment commentTwo = approver1MutationExecutor.addComment(COMMENT_FIELDS,
        TestData.createCommentInput("This is a test comment two"), created.getUuid());
    assertThat(commentTwo.getUuid()).isNotNull();

    returned = approver1QueryExecutor.report(FIELDS, created.getUuid());
    final List<Comment> commentsReturned = returned.getComments();
    assertThat(commentsReturned).hasSize(3); // the rejection comment will be there as well.
    // Assert order of comments!
    assertThat(commentsReturned.stream().map(c -> c.getUuid()).collect(Collectors.toList()))
        .containsSequence(commentOne.getUuid(), commentTwo.getUuid());

    // Verify this report shows up in the daily rollup
    final ReportSearchQueryInput query = ReportSearchQueryInput.builder()
        .withReleasedAtStart(
            Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant())
        .build();
    AnetBeanList_Report rollup = adminQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(rollup.getTotalCount()).isGreaterThan(0);
    assertThat(rollup.getList().stream().map(r -> r.getUuid()).collect(Collectors.toSet()))
        .contains(returned.getUuid());

    // Pull recent People, Tasks, and Locations and verify that the records from the last report are
    // there.
    final PersonSearchQueryInput queryPeople =
        PersonSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(PersonSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Person recentPeople =
        authorQueryExecutor.personList(getListFields(PERSON_FIELDS), queryPeople);
    assertThat(recentPeople.getList().stream().map(p -> p.getUuid()).collect(Collectors.toSet()))
        .contains(principalPerson.getUuid());

    final TaskSearchQueryInput queryTasks =
        TaskSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(TaskSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Task recentTasks =
        authorQueryExecutor.taskList(getListFields(TASK_FIELDS), queryTasks);
    assertThat(recentTasks.getList().stream().map(t -> t.getUuid()).collect(Collectors.toSet()))
        .contains(action.getUuid());

    final LocationSearchQueryInput queryLocations =
        LocationSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(LocationSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Location recentLocations =
        authorQueryExecutor.locationList(getListFields(LOCATION_FIELDS), queryLocations);
    assertThat(recentLocations.getList().stream().map(l -> l.getUuid()).collect(Collectors.toSet()))
        .contains(loc.getUuid());

    // Go and delete the entire approval chain!
    advisorOrg.setApprovalSteps(ImmutableList.of());
    nrUpdated = adminMutationExecutor.updateOrganization("", getOrganizationInput(advisorOrg));
    assertThat(nrUpdated).isEqualTo(1);

    Organization updatedOrg =
        adminQueryExecutor.organization(ORGANIZATION_FIELDS, advisorOrg.getUuid());
    assertThat(updatedOrg).isNotNull();
    assertThat(updatedOrg.getApprovalSteps()).isEmpty();
  }

  private boolean isSameReportPerson(ReportPerson crp, ReportPerson rp) {
    return rp.getUuid().equals(crp.getUuid()) && rp.getAuthor().equals(crp.getAuthor())
        && rp.getPrimary().equals(crp.getPrimary()) && rp.getAttendee().equals(crp.getAttendee());
  }

  @Test
  public void createReportWithoutPrincipal()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a report writer
    final Person author = getNickNicholson();
    final QueryExecutor authorQueryExecutor = getQueryExecutor(author.getDomainUsername());
    final MutationExecutor authorMutationExecutor = getMutationExecutor(author.getDomainUsername());

    // Create a person for the report
    final Person reportAttendeePerson = getJackJackson();
    final ReportPerson reportAttendee = personToPrimaryReportPerson(reportAttendeePerson);
    final Position reportAttendeePosition = reportAttendeePerson.getPosition();
    assertThat(reportAttendeePosition).isNotNull();
    final Organization reportAttendeeOrg = reportAttendeePosition.getOrganization();
    assertThat(reportAttendeeOrg).isNotNull();

    // Create an Advising Organization for the report writer
    final Organization advisorOrg = adminMutationExecutor.createOrganization(ORGANIZATION_FIELDS,
        TestData.createAdvisorOrganizationInput(true));
    assertThat(advisorOrg).isNotNull();
    assertThat(advisorOrg.getUuid()).isNotNull();

    // Create leadership people in the AO who can approve this report
    Person approver1 = Person.builder().withDomainUsername("testapprover1")
        .withEmailAddress("hunter+testApprover1@example.com").withName("Test Approver 1")
        .withRole(Role.ADVISOR).withStatus(Status.ACTIVE).build();
    approver1 = findOrPutPersonInDb(approver1);
    Person approver2 = Person.builder().withDomainUsername("testapprover2")
        .withEmailAddress("hunter+testApprover2@example.com").withName("Test Approver 2")
        .withRole(Role.ADVISOR).withStatus(Status.ACTIVE).build();
    approver2 = findOrPutPersonInDb(approver2);

    final PositionInput approver1PosInput = PositionInput.builder()
        .withName("Test Approver 1 Position").withOrganization(getOrganizationInput(advisorOrg))
        .withLocation(getLocationInput(getGeneralHospital())).withType(PositionType.SUPERUSER)
        .withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE).build();
    Position approver1Pos =
        adminMutationExecutor.createPosition(POSITION_FIELDS, approver1PosInput);
    assertThat(approver1Pos).isNotNull();
    assertThat(approver1Pos.getUuid()).isNotNull();
    Integer nrUpdated = adminMutationExecutor.putPersonInPosition("", getPersonInput(approver1),
        approver1Pos.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    final PositionInput approver2PosInput = PositionInput.builder()
        .withName("Test Approver 2 Position").withOrganization(getOrganizationInput(advisorOrg))
        .withLocation(getLocationInput(getGeneralHospital())).withType(PositionType.SUPERUSER)
        .withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE).build();
    final Position approver2Pos =
        adminMutationExecutor.createPosition(POSITION_FIELDS, approver2PosInput);
    assertThat(approver2Pos).isNotNull();
    assertThat(approver2Pos.getUuid()).isNotNull();
    nrUpdated = adminMutationExecutor.putPersonInPosition("", getPersonInput(approver2),
        approver2Pos.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    // Create a billet for the author
    final PositionInput authorBilletInput =
        PositionInput.builder().withName("A report writer").withType(PositionType.ADVISOR)
            .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(advisorOrg))
            .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();
    final Position authorBillet =
        adminMutationExecutor.createPosition(POSITION_FIELDS, authorBilletInput);
    assertThat(authorBillet).isNotNull();
    assertThat(authorBillet.getUuid()).isNotNull();

    // Set this author in this billet
    nrUpdated = adminMutationExecutor.putPersonInPosition("", getPersonInput(author),
        authorBillet.getUuid());
    assertThat(nrUpdated).isEqualTo(1);
    final Position checkit = adminQueryExecutor.position(POSITION_FIELDS, authorBillet.getUuid());
    assertThat(checkit.getPerson()).isNotNull();
    assertThat(checkit.getPerson().getUuid()).isEqualTo(author.getUuid());

    // Create Approval workflow for Advising Organization
    final List<ApprovalStepInput> approvalStepsInput = new ArrayList<>();
    final ApprovalStepInput approvalStepInput =
        ApprovalStepInput.builder().withName("Test Group for Approving")
            .withType(ApprovalStepType.REPORT_APPROVAL).withRelatedObjectUuid(advisorOrg.getUuid())
            .withApprovers(ImmutableList.of(getPositionInput(approver1Pos))).build();
    approvalStepsInput.add(approvalStepInput);

    // Adding a new approval step to an AO automatically puts it at the end of the approval process.
    final ApprovalStepInput releaseApprovalStepInput =
        ApprovalStepInput.builder().withName("Test Group of Releasers")
            .withType(ApprovalStepType.REPORT_APPROVAL).withRelatedObjectUuid(advisorOrg.getUuid())
            .withApprovers(ImmutableList.of(getPositionInput(approver2Pos))).build();
    approvalStepsInput.add(releaseApprovalStepInput);
    final OrganizationInput advisorOrgInput = getOrganizationInput(advisorOrg);
    advisorOrgInput.setApprovalSteps(approvalStepsInput);

    nrUpdated = adminMutationExecutor.updateOrganization("", advisorOrgInput);
    assertThat(nrUpdated).isEqualTo(1);
    // Pull the approval workflow for this AO
    final Organization orgWithSteps =
        adminQueryExecutor.organization(ORGANIZATION_FIELDS, advisorOrg.getUuid());
    final List<ApprovalStep> steps = orgWithSteps.getApprovalSteps();
    assertThat(steps.size()).isEqualTo(2);
    final ApprovalStep approvalStep = steps.get(0);
    assertThat(approvalStep.getName()).isEqualTo(approvalStepInput.getName());
    final ApprovalStep releaseApprovalStep = steps.get(1);
    assertThat(approvalStep.getNextStepUuid()).isEqualTo(releaseApprovalStep.getUuid());
    assertThat(releaseApprovalStep.getName()).isEqualTo(releaseApprovalStepInput.getName());

    // Ensure approver1 is now an approver
    approver1Pos = adminQueryExecutor.position(POSITION_FIELDS, approver1Pos.getUuid());
    assertThat(approver1Pos.getIsApprover()).isTrue();

    // Create some tasks for this organization
    final Task top = adminMutationExecutor.createTask(TASK_FIELDS,
        TestData.createTaskInput("test-1-2", "Principal Test Top Task", "TOP", null,
            Collections.singletonList(getOrganizationInput(advisorOrg)), Status.ACTIVE));
    assertThat(top).isNotNull();
    assertThat(top.getUuid()).isNotNull();
    final Task action =
        adminMutationExecutor.createTask(TASK_FIELDS, TestData.createTaskInput("test-1-3",
            "Principal Test Task Action", "Action", getTaskInput(top), null, Status.ACTIVE));
    assertThat(action).isNotNull();
    assertThat(action.getUuid()).isNotNull();

    // Create a Location that this Report was written at
    final Location loc = adminMutationExecutor.createLocation(LOCATION_FIELDS,
        TestData.createLocationInput("The Boat Dock", 1.23, 4.56));
    assertThat(loc).isNotNull();
    assertThat(loc.getUuid()).isNotNull();

    // Write a Report
    final ReportInput rInput = ReportInput.builder().withEngagementDate(Instant.now())
        .withDuration(120)
        .withReportPeople(
            getReportPeopleInput(Lists.newArrayList(reportAttendee, personToReportAuthor(author))))
        .withTasks(Lists.newArrayList(getTaskInput(action))).withLocation(getLocationInput(loc))
        .withAtmosphere(Atmosphere.POSITIVE).withAtmosphereDetails("Everybody was super nice!")
        .withIntent("A testing report to test that reporting reports")
        // set HTML of report text
        .withReportText(UtilsTest.getCombinedHtmlTestCase().getInput())
        // set JSON of customFields
        .withCustomFields(UtilsTest.getCombinedJsonTestCase().getInput())
        .withNextSteps("This is the next steps on a report")
        .withKeyOutcomes("These are the key outcomes of this engagement")
        .withAdvisorOrg(getOrganizationInput(advisorOrg))
        .withPrincipalOrg(getOrganizationInput(reportAttendeeOrg)).build();
    final Report created = authorMutationExecutor.createReport(FIELDS, rInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getState()).isEqualTo(ReportState.DRAFT);
    assertThat(created.getAdvisorOrg().getUuid()).isEqualTo(advisorOrg.getUuid());
    assertThat(created.getPrincipalOrg().getUuid()).isEqualTo(reportAttendeeOrg.getUuid());
    // check that HTML of report text is sanitized after create
    assertThat(created.getReportText()).isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());
    // check that JSON of customFields is sanitized after create
    assertThat(created.getCustomFields())
        .isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());

    // Have another regular user try to submit the report
    try {
      getMutationExecutor(getRegularUser().getDomainUsername()).submitReport("", created.getUuid());
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Have a superuser of another AO try to submit the report
    try {
      getMutationExecutor(getSuperuser().getDomainUsername()).submitReport("", created.getUuid());
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Have the author submit the report
    int numRows = authorMutationExecutor.submitReport("", created.getUuid());
    assertThat(numRows).isOne();

    Report returned = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Verify that author can still edit the report
    returned.setAtmosphereDetails("Everybody was super nice! Again!");
    final Report r2 = authorMutationExecutor.updateReport(FIELDS, getReportInput(returned), true);
    assertThat(r2.getAtmosphereDetails()).isEqualTo(returned.getAtmosphereDetails());

    // Have the author submit the report, again
    numRows = authorMutationExecutor.submitReport("", created.getUuid());
    assertThat(numRows).isOne();

    returned = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // The author should not be able to submit the report now
    try {
      authorMutationExecutor.submitReport("", returned.getUuid());
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }

    logger.debug("Expecting report {} in step {} because of org {} on author {}",
        returned.getUuid(), approvalStep.getUuid(), advisorOrg.getUuid(), author);
    assertThat(returned.getApprovalStep().getUuid()).isEqualTo(approvalStep.getUuid());

    // verify the location on this report
    assertThat(returned.getLocation().getUuid()).isEqualTo(loc.getUuid());

    // verify the principals on this report
    assertThat(returned.getAttendees().stream().map(a -> a.getUuid()).collect(Collectors.toSet()))
        .contains(reportAttendee.getUuid());

    // verify the tasks on this report
    assertThat(returned.getTasks().stream().map(t -> t.getUuid()).collect(Collectors.toSet()))
        .contains(action.getUuid());

    // Verify this shows up on the approvers list of pending documents
    final ReportSearchQueryInput pendingQuery =
        ReportSearchQueryInput.builder().withPendingApprovalOf(approver1.getUuid()).build();
    final QueryExecutor approver1QueryExecutor = getQueryExecutor(approver1.getDomainUsername());
    final MutationExecutor approver1MutationExecutor =
        getMutationExecutor(approver1.getDomainUsername());
    AnetBeanList_Report pending =
        approver1QueryExecutor.reportList(getListFields(FIELDS), pendingQuery);
    assertThat(pending.getList().stream().map(r -> r.getUuid()).collect(Collectors.toSet()))
        .contains(returned.getUuid());

    // Run a search for this users pending approvals
    final ReportSearchQueryInput searchQuery =
        ReportSearchQueryInput.builder().withPendingApprovalOf(approver1.getUuid()).build();
    pending = approver1QueryExecutor.reportList(getListFields(FIELDS), searchQuery);
    assertThat(pending.getList().size()).isGreaterThan(0);

    // Check on Report status for who needs to approve
    List<ReportAction> workflow = returned.getWorkflow();
    assertThat(workflow.size()).isEqualTo(3);
    ReportAction reportAction = workflow.get(1);
    assertThat(reportAction.getPerson()).isNull(); // Because this hasn't been approved yet.
    assertThat(reportAction.getCreatedAt()).isNull();
    assertThat(reportAction.getStep().getUuid()).isEqualTo(approvalStep.getUuid());
    reportAction = workflow.get(2);
    assertThat(reportAction.getStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Reject the report
    numRows = approver1MutationExecutor.rejectReport("",
        TestData.createCommentInput("a test rejection"), created.getUuid());
    assertThat(numRows).isOne();

    // Check on report status to verify it was rejected
    returned = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.REJECTED);
    assertThat(returned.getApprovalStep()).isNull();

    // Author needs to re-submit
    numRows = authorMutationExecutor.submitReport("", created.getUuid());
    assertThat(numRows).isOne();

    // TODO: Approver modify the report *specifically change the attendees!*

    // Approve the report
    numRows = approver1MutationExecutor.approveReport("", null, created.getUuid());
    assertThat(numRows).isOne();

    // Check on Report status to verify it got moved forward
    returned = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
    assertThat(returned.getApprovalStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Verify that the wrong person cannot approve this report.
    try {
      approver1MutationExecutor.approveReport("", null, created.getUuid());
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Approve the report
    numRows = getMutationExecutor(approver2.getDomainUsername()).approveReport("", null,
        created.getUuid());
    assertThat(numRows).isOne();

    // Check on Report status to verify it got moved forward
    returned = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.APPROVED);
    assertThat(returned.getApprovalStep()).isNull();

    // The author should not be able to submit the report now
    try {
      authorMutationExecutor.submitReport("", returned.getUuid());
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }

    // check on report status to see that it got approved.
    workflow = returned.getWorkflow();
    // there were 5 actions on the report: submit, reject, submit, approve, approve
    assertThat(workflow.size()).isEqualTo(6);
    reportAction = workflow.get(4);
    assertThat(reportAction.getPerson().getUuid()).isEqualTo(approver1.getUuid());
    assertThat(reportAction.getCreatedAt()).isNotNull();
    assertThat(reportAction.getStep().getUuid()).isEqualTo(approvalStep.getUuid());
    reportAction = workflow.get(5);
    assertThat(reportAction.getStep().getUuid()).isEqualTo(releaseApprovalStep.getUuid());

    // Admin can publish approved reports.
    numRows = adminMutationExecutor.publishReport("", created.getUuid());
    assertThat(numRows).isOne();

    // Post a comment on the report because it's awesome
    final Comment commentOne = authorMutationExecutor.addComment(COMMENT_FIELDS,
        TestData.createCommentInput("This is a test comment one"), created.getUuid());
    assertThat(commentOne.getUuid()).isNotNull();
    assertThat(commentOne.getAuthor().getUuid()).isEqualTo(author.getUuid());

    final Comment commentTwo = approver1MutationExecutor.addComment(COMMENT_FIELDS,
        TestData.createCommentInput("This is a test comment two"), created.getUuid());
    assertThat(commentTwo.getUuid()).isNotNull();

    returned = approver1QueryExecutor.report(FIELDS, created.getUuid());
    final List<Comment> commentsReturned = returned.getComments();
    assertThat(commentsReturned).hasSize(3); // the rejection comment will be there as well.
    // Assert order of comments!
    assertThat(commentsReturned.stream().map(c -> c.getUuid()).collect(Collectors.toList()))
        .containsSequence(commentOne.getUuid(), commentTwo.getUuid());

    // Verify this report shows up in the daily rollup
    final ReportSearchQueryInput query = ReportSearchQueryInput.builder()
        .withReleasedAtStart(
            Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant())
        .build();
    AnetBeanList_Report rollup = adminQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(rollup.getTotalCount()).isGreaterThan(0);
    assertThat(rollup.getList().stream().map(r -> r.getUuid()).collect(Collectors.toSet()))
        .contains(returned.getUuid());

    // Pull recent People, Tasks, and Locations and verify that the records from the last report are
    // there.
    final PersonSearchQueryInput queryPeople =
        PersonSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(PersonSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Person recentPeople =
        authorQueryExecutor.personList(getListFields(PERSON_FIELDS), queryPeople);
    assertThat(recentPeople.getList().stream().map(p -> p.getUuid()).collect(Collectors.toSet()))
        .contains(reportAttendeePerson.getUuid());

    final TaskSearchQueryInput queryTasks =
        TaskSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(TaskSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Task recentTasks =
        authorQueryExecutor.taskList(getListFields(TASK_FIELDS), queryTasks);
    assertThat(recentTasks.getList().stream().map(t -> t.getUuid()).collect(Collectors.toSet()))
        .contains(action.getUuid());

    final LocationSearchQueryInput queryLocations =
        LocationSearchQueryInput.builder().withStatus(Status.ACTIVE).withInMyReports(true)
            .withSortBy(LocationSearchSortBy.RECENT).withSortOrder(SortOrder.DESC).build();
    final AnetBeanList_Location recentLocations =
        authorQueryExecutor.locationList(getListFields(LOCATION_FIELDS), queryLocations);
    assertThat(recentLocations.getList().stream().map(l -> l.getUuid()).collect(Collectors.toSet()))
        .contains(loc.getUuid());

    // Go and delete the entire approval chain!
    advisorOrg.setApprovalSteps(ImmutableList.of());
    nrUpdated = adminMutationExecutor.updateOrganization("", getOrganizationInput(advisorOrg));
    assertThat(nrUpdated).isEqualTo(1);

    Organization updatedOrg =
        adminQueryExecutor.organization(ORGANIZATION_FIELDS, advisorOrg.getUuid());
    assertThat(updatedOrg).isNotNull();
    assertThat(updatedOrg.getApprovalSteps()).isEmpty();
  }

  @Test
  public void testDefaultApprovalFlow() throws NumberFormatException,
      GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person jack = getJackJackson();
    final Person roger = getRogerRogwell();
    final Person bob = getBobBobtown();

    // Create a Person who isn't in a Billet
    final PersonInput authorInput =
        PersonInput.builder().withName("A New Guy").withRole(Role.ADVISOR).withStatus(Status.ACTIVE)
            .withDomainUsername("newguy").withEmailAddress("newGuy@example.com").build();
    final Person author = adminMutationExecutor.createPerson(PERSON_FIELDS, authorInput);
    assertThat(author).isNotNull();
    assertThat(author.getUuid()).isNotNull();
    final MutationExecutor authorMutationExecutor = getMutationExecutor(author.getDomainUsername());

    final List<ReportPersonInput> reportPeopleInput =
        getReportPeopleInput(ImmutableList.of(personToPrimaryReportPerson(roger),
            personToPrimaryReportPerson(jack), personToReportAuthor(author)));

    // Write a report as that person
    final ReportInput rInput = ReportInput.builder()
        .withIntent("I am a new Advisor and wish to be included in things")
        .withAtmosphere(Atmosphere.NEUTRAL).withReportPeople(reportPeopleInput)
        .withReportText(
            "I just got here in town and am writing a report for the first time, but have no reporting structure set up")
        .withKeyOutcomes("Summary for the key outcomes").withNextSteps("Summary for the next steps")
        .withEngagementDate(Instant.now()).withDuration(75).build();
    final Report r = jackMutationExecutor.createReport(FIELDS, rInput);
    assertThat(r).isNotNull();
    assertThat(r.getUuid()).isNotNull();

    // Test the situation where no default workflow has been defined
    final String defaultOrgUuid = AnetObjectEngine.getInstance().getDefaultOrgUuid();
    final String defaultOrgSetting = AdminDao.AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION.name();

    // Clear the defaultOrgUuid
    failSubmit(r, defaultOrgSetting, null);

    // Set the defaultOrgUuid to an empty string
    failSubmit(r, defaultOrgSetting, "");

    // Set the defaultOrgUuid to a non-existing org
    failSubmit(r, defaultOrgSetting, mil.dds.anet.beans.Organization.DUMMY_ORG_UUID);

    // Set the defaultOrgUuid back to the correct value
    final int numSettings = adminMutationExecutor.saveAdminSettings("", List.of(
        AdminSettingInput.builder().withKey(defaultOrgSetting).withValue(defaultOrgUuid).build()));
    assertThat(numSettings).isOne();
    // Submit the report (by admin who can do that, as author doesn't have a position)
    int numRows = adminMutationExecutor.submitReport("", r.getUuid());
    assertThat(numRows).isOne();

    // Check the approval Step
    final Report returned = jackQueryExecutor.report(FIELDS, r.getUuid());
    assertThat(returned.getUuid()).isEqualTo(r.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Find the default ApprovalSteps
    assertThat(defaultOrgUuid).isNotNull();
    final Organization orgWithSteps =
        jackQueryExecutor.organization(ORGANIZATION_FIELDS, defaultOrgUuid);
    final List<ApprovalStep> steps = orgWithSteps.getApprovalSteps();
    assertThat(steps).isNotNull();
    assertThat(steps).hasSize(1);
    // Primary advisor (jack) is in EF1 which has no approval chain, so it should fall back to the
    // default
    assertThat(returned.getApprovalStep().getUuid()).isEqualTo(steps.get(0).getUuid());

    // The only default approver is admin; reject the report
    numRows = adminMutationExecutor.rejectReport("",
        TestData.createCommentInput("default approval chain test rejection"), returned.getUuid());
    assertThat(numRows).isOne();

    // Create billet for Author
    final PositionInput billetInput = PositionInput.builder().withName("EF 1.1 new advisor")
        .withType(PositionType.ADVISOR).withRole(PositionRole.MEMBER)
        .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();

    // Put billet in EF 1.1
    final OrganizationSearchQueryInput queryOrgs = OrganizationSearchQueryInput.builder()
        .withText("EF 1").withType(OrganizationType.ADVISOR_ORG).build();
    final AnetBeanList_Organization results =
        adminQueryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs);
    assertThat(results.getList().size()).isGreaterThan(0);
    Organization ef11 = null;
    for (final Organization org : results.getList()) {
      if (org.getShortName().trim().equalsIgnoreCase("ef 1.1")) {
        billetInput.setOrganization(getOrganizationInput(org));
        ef11 = org;
        break;
      }
    }
    assertThat(billetInput.getOrganization()).isNotNull();
    assertThat(ef11).isNotNull();

    final Position billet = adminMutationExecutor.createPosition(POSITION_FIELDS, billetInput);
    assertThat(billet).isNotNull();
    assertThat(billet.getUuid()).isNotNull();

    // Put Author in the billet
    Integer nrUpdated =
        adminMutationExecutor.putPersonInPosition("", getPersonInput(author), billet.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    // Change primary advisor of the report to someone in EF 1.1
    returned.setReportPeople(
        ImmutableList.of(personToPrimaryReportPerson(roger), personToReportPerson(jack),
            personToPrimaryReportPerson(bob), personToReportAuthor(author)));
    final Report updated =
        authorMutationExecutor.updateReport(FIELDS, getReportInput(returned), true);
    assertThat(updated).isNotNull();
    assertThat(updated.getAdvisorOrg().getUuid()).isNotEqualTo(returned.getAdvisorOrg().getUuid());

    // Re-submit the report
    numRows = authorMutationExecutor.submitReport("", r.getUuid());
    assertThat(numRows).isOne();

    // Report should now be up for review by primary advisor org's (EF 1.1) approvers
    final Report returned2 = jackQueryExecutor.report(FIELDS, r.getUuid());
    assertThat(returned2.getUuid()).isEqualTo(r.getUuid());
    assertThat(returned2.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
    assertThat(returned2.getApprovalStep().getUuid())
        .isNotEqualTo(returned.getApprovalStep().getUuid());
    assertThat(returned2.getApprovalStep()).isNotNull();
    assertThat(returned2.getApprovalStep().getRelatedObjectUuid()).isEqualTo(ef11.getUuid());
  }

  private static void failSubmit(final Report r, final String defaultOrgSetting,
      final String defaultOrgValue)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final int numSettings = adminMutationExecutor.saveAdminSettings("", List.of(
        AdminSettingInput.builder().withKey(defaultOrgSetting).withValue(defaultOrgValue).build()));
    assertThat(numSettings).isOne();
    // Submit the report: should fail
    try {
      adminMutationExecutor.submitReport("", r.getUuid());
      fail("Expected WebApplicationException");
    } catch (WebApplicationException expected) {
      // OK
    }
  }

  @Test
  public void reportEditTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Elizabeth writes a report about meeting with Roger
    final Person elizabeth = getElizabethElizawell();
    final QueryExecutor elizabethQueryExecutor = getQueryExecutor(elizabeth.getDomainUsername());
    final MutationExecutor elizabethMutationExecutor =
        getMutationExecutor(elizabeth.getDomainUsername());
    final Person roger = getRogerRogwell();
    final Person nick = getNickNicholson();
    final Person bob = getBobBobtown();

    // Fetch some objects from the DB that we'll use later.
    final LocationSearchQueryInput queryLocs =
        LocationSearchQueryInput.builder().withText("Police").build();
    final AnetBeanList_Location locSearchResults =
        elizabethQueryExecutor.locationList(getListFields(LOCATION_FIELDS), queryLocs);
    assertThat(locSearchResults).isNotNull();
    assertThat(locSearchResults.getList()).isNotEmpty();
    final Location loc = locSearchResults.getList().get(0);

    final TaskSearchQueryInput queryTasks =
        TaskSearchQueryInput.builder().withText("Budgeting").build();
    final AnetBeanList_Task taskSearchResults =
        elizabethQueryExecutor.taskList(getListFields(TASK_FIELDS), queryTasks);
    assertThat(taskSearchResults.getTotalCount()).isGreaterThan(2);

    final ReportInput rInput = ReportInput.builder()
        .withIntent("A Test Report to test editing reports").withAtmosphere(Atmosphere.POSITIVE)
        .withAtmosphereDetails("it was a cold, cold day").withEngagementDate(Instant.now())
        .withDuration(60).withKeyOutcomes("There were some key out comes summarized")
        .withNextSteps("These are the next steps summarized")
        .withReportText("This report was generated by ReportsResourceTest#reportEditTest")
        .withReportPeople(getReportPeopleInput(
            ImmutableList.of(personToPrimaryReportPerson(roger), personToReportAuthor(elizabeth))))
        .withTasks(ImmutableList.of(getTaskInput(taskSearchResults.getList().get(0)))).build();
    Report returned = elizabethMutationExecutor.createReport(FIELDS, rInput);
    assertThat(returned).isNotNull();
    assertThat(returned.getUuid()).isNotNull();

    // Elizabeth edits the report (update locationUuid and text, addPerson, remove a Task)
    returned.setLocation(loc);
    // update HTML of report text
    returned.setReportText(UtilsTest.getCombinedHtmlTestCase().getInput());
    // u[date JSON of customFields
    returned.setCustomFields(UtilsTest.getCombinedJsonTestCase().getInput());
    returned.setReportPeople(ImmutableList.of(personToPrimaryReportPerson(roger),
        personToReportPerson(nick), personToPrimaryReportAuthor(elizabeth)));
    returned.setTasks(ImmutableList.of());
    Report updated = elizabethMutationExecutor.updateReport(FIELDS, getReportInput(returned), true);
    assertThat(updated).isNotNull();

    // Verify the report changed
    Report returned2 = elizabethQueryExecutor.report(FIELDS, returned.getUuid());
    assertThat(returned2.getIntent()).isEqualTo(rInput.getIntent());
    assertThat(returned2.getLocation().getUuid()).isEqualTo(loc.getUuid());
    assertThat(returned2.getTasks()).isEmpty();
    final List<ReportPerson> returned2Attendees = returned2.getAttendees();
    assertThat(returned2Attendees).hasSize(3);
    assertThat(returned2Attendees.stream().map(a -> a.getUuid()).collect(Collectors.toSet()))
        .contains(roger.getUuid());
    // check that HTML of report text is sanitized after update
    assertThat(returned2.getReportText())
        .isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());
    // check that JSON of customFields is sanitized after update
    assertThat(returned2.getCustomFields())
        .isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());

    // Elizabeth submits the report
    int numRows = elizabethMutationExecutor.submitReport("", returned.getUuid());
    assertThat(numRows).isOne();
    Report returned3 = elizabethQueryExecutor.report(FIELDS, returned.getUuid());
    assertThat(returned3.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Bob gets the approval (EF1 Approvers)
    final ReportSearchQueryInput pendingQuery =
        ReportSearchQueryInput.builder().withPendingApprovalOf(bob.getUuid()).build();
    final QueryExecutor bobQueryExecutor = getQueryExecutor("bob");
    AnetBeanList_Report pendingBobsApproval =
        bobQueryExecutor.reportList(getListFields(FIELDS), pendingQuery);
    assertThat(pendingBobsApproval.getList().stream()
        .anyMatch(rpt -> rpt.getUuid().equals(returned3.getUuid()))).isTrue();

    // Bob edits the report (change reportText, remove Person, add a Task)
    returned3.setReportText(rInput.getReportText() + ", edited by Bob!!");
    returned3.setReportPeople(ImmutableList.of(personToPrimaryReportPerson(nick),
        personToPrimaryReportAuthor(elizabeth)));
    returned3.setTasks(
        ImmutableList.of(taskSearchResults.getList().get(1), taskSearchResults.getList().get(2)));
    updated = getMutationExecutor("bob").updateReport(FIELDS, getReportInput(returned3), true);
    assertThat(updated).isNotNull();

    Report returned4 = elizabethQueryExecutor.report(FIELDS, returned.getUuid());
    assertThat(returned4.getReportText()).endsWith("Bob!!");
    final List<ReportPerson> returned4Attendees = returned4.getAttendees();
    assertThat(returned4Attendees).hasSize(2);
    assertThat(returned4Attendees.stream().map(a -> a.getUuid()).collect(Collectors.toSet()))
        .contains(nick.getUuid());
    assertThat(returned4.getTasks()).hasSize(2);

    numRows = getMutationExecutor("bob").approveReport("", null, returned.getUuid());
    assertThat(numRows).isOne();
  }

  @Test
  public void searchTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person jack = getJackJackson();
    final Person steve = getSteveSteveson();

    // Search based on report Text body
    ReportSearchQueryInput query = ReportSearchQueryInput.builder().withText("spreadsheet").build();
    AnetBeanList_Report searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList()).isNotEmpty();

    // Search based on summary
    query.setText("Amherst");
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList()).isNotEmpty();

    // Search by Author
    query.setText(null);
    query.setAuthorUuid(jack.getUuid());
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream().filter(r -> {
      final List<ReportPerson> authors = r.getAuthors();
      return authors.stream().filter(p -> p.getUuid().equals(jack.getUuid())).count() > 0;
    }).count()).isEqualTo(searchResults.getList().size());
    final int numResults = searchResults.getList().size();

    // Search by Author with Date Filtering
    query.setEngagementDateStart(
        ZonedDateTime.of(2016, 6, 1, 0, 0, 0, 0, DaoUtils.getServerNativeZoneId()).toInstant());
    query.setEngagementDateEnd(
        ZonedDateTime.of(2016, 6, 15, 0, 0, 0, 0, DaoUtils.getServerNativeZoneId()).toInstant());
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().size()).isLessThan(numResults);

    // Search by Attendee
    query.setEngagementDateStart(null);
    query.setEngagementDateEnd(null);
    query.setAuthorUuid(null);
    query.setAttendeeUuid(steve.getUuid());
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
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
    final AnetBeanList_Task taskResults =
        jackQueryExecutor.taskList(getListFields(TASK_FIELDS), queryTasks);
    assertThat(taskResults).isNotNull();
    assertThat(taskResults.getList()).isNotEmpty();
    Task task = taskResults.getList().stream().filter(t -> "1.1.A".equals(t.getShortName()))
        .findFirst().get();

    // Search by Task
    query.setAttendeeUuid(null);
    query.setTaskUuid(task.getUuid());
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
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
    OrganizationSearchQueryInput queryOrgs = OrganizationSearchQueryInput.builder().withText("EF 1")
        .withType(OrganizationType.ADVISOR_ORG).build();
    AnetBeanList_Organization orgs =
        jackQueryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs);
    assertThat(orgs.getList().size()).isGreaterThan(0);
    Organization ef11 =
        orgs.getList().stream().filter(o -> o.getShortName().equals("EF 1.1")).findFirst().get();
    assertThat(ef11.getShortName()).isEqualToIgnoringCase("EF 1.1");

    query = ReportSearchQueryInput.builder().withAdvisorOrgUuid(ef11.getUuid())
        .withIncludeAdvisorOrgChildren(false).build();
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
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
    queryOrgs = OrganizationSearchQueryInput.builder().withText("ef 1")
        .withType(OrganizationType.ADVISOR_ORG).build();
    orgs = jackQueryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs);
    assertThat(orgs.getList().size()).isGreaterThan(0);
    Organization ef1 = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("ef 1")).findFirst().get();
    assertThat(ef1.getShortName()).isEqualToIgnoringCase("EF 1");

    query.setAdvisorOrgUuid(ef1.getUuid());
    query.setIncludeAdvisorOrgChildren(true);
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList()).isNotEmpty();
    // #TODO: figure out how to verify the results?

    // Check search for just an org, when we don't know if it's advisor or principal.
    query.setOrgUuid(ef11.getUuid());
    query.setAdvisorOrgUuid(null);
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
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
    final AnetBeanList_Location locSearchResults =
        jackQueryExecutor.locationList(getListFields(LOCATION_FIELDS), queryLocs);
    assertThat(locSearchResults).isNotNull();
    assertThat(locSearchResults.getList()).isNotEmpty();
    Location cabot = locSearchResults.getList().get(0);

    query = ReportSearchQueryInput.builder().withLocationUuid(cabot.getUuid()).build();
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getLocation().getUuid().equals(cabot.getUuid())))
        .hasSameSizeAs(searchResults.getList());

    // Search by Status.
    query.setLocationUuid(null);
    query.setState(ImmutableList.of(ReportState.CANCELLED));
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList()).isNotEmpty();
    final int numCancelled = searchResults.getTotalCount();

    query.setState(ImmutableList.of(ReportState.CANCELLED, ReportState.PUBLISHED));
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getTotalCount()).isGreaterThan(numCancelled);

    queryOrgs = OrganizationSearchQueryInput.builder().withText("Defense")
        .withType(OrganizationType.PRINCIPAL_ORG).build();
    orgs = jackQueryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs);
    assertThat(orgs.getList().size()).isGreaterThan(0);
    Organization mod = orgs.getList().stream().filter(o -> o.getShortName().equalsIgnoreCase("MoD"))
        .findFirst().get();
    assertThat(mod.getShortName()).isEqualToIgnoringCase("MoD");

    // Search by Principal Organization
    query.setState(null);
    query.setPrincipalOrgUuid(mod.getUuid());
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream().filter(r -> {
      try {
        return r.getPrincipalOrg().getUuid().equals(mod.getUuid());
      } catch (Exception e) {
        fail("error", e);
        return false;
      }
    })).hasSameSizeAs(searchResults.getList());

    // Search by Principal Parent Organization
    query.setPrincipalOrgUuid(mod.getUuid());
    query.setIncludePrincipalOrgChildren(true);
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList()).isNotEmpty();
    // TODO: figure out how to verify the results?

    query = ReportSearchQueryInput.builder().withText("spreadsheet")
        .withSortBy(ReportSearchSortBy.ENGAGEMENT_DATE).withSortOrder(SortOrder.ASC).build();
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    Instant prev = Instant.ofEpochMilli(0L);
    for (Report res : searchResults.getList()) {
      assertThat(res.getEngagementDate()).isAfter(prev);
      prev = res.getEngagementDate();
    }

    // Search for report text with stopwords
    query = ReportSearchQueryInput.builder().withText("Hospital usage of Drugs").withPageSize(0)
        .build(); // get them all
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getIntent().contains("Hospital usage of Drugs")).count()).isGreaterThan(0);

    /// find EF 2.2
    queryOrgs = OrganizationSearchQueryInput.builder().withText("ef 2.2")
        .withType(OrganizationType.ADVISOR_ORG).build();
    orgs = jackQueryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs);
    assertThat(orgs.getList().size()).isGreaterThan(0);
    Organization ef22 = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("ef 2.2")).findFirst().get();
    assertThat(ef22.getShortName()).isEqualToIgnoringCase("EF 2.2");


    // Search for a report by both principal AND advisor orgs.
    query = ReportSearchQueryInput.builder().withAdvisorOrgUuid(mod.getUuid())
        .withPrincipalOrgUuid(ef22.getUuid()).build();
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getAdvisorOrg().getUuid().equals(ef22.getUuid())
            && r.getPrincipalOrg().getUuid().equals(mod.getUuid()))
        .count()).isEqualTo(searchResults.getList().size());

    // this might fail if there are any children of ef22 or mod, but there aren't in the base data
    // set.
    query.setIncludeAdvisorOrgChildren(true);
    query.setIncludePrincipalOrgChildren(true);
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getAdvisorOrg().getUuid().equals(ef22.getUuid())
            && r.getPrincipalOrg().getUuid().equals(mod.getUuid()))
        .count()).isEqualTo(searchResults.getList().size());

    // Search by Atmosphere
    query = ReportSearchQueryInput.builder().withAtmosphere(Atmosphere.NEGATIVE).build();
    searchResults = jackQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getAtmosphere().equals(Atmosphere.NEGATIVE)).count())
        .isEqualTo(searchResults.getList().size());
  }

  @Test
  public void searchInactiveReportsTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // All reports are considered ACTIVE; check that none are INACTIVE
    final ReportSearchQueryInput query =
        ReportSearchQueryInput.builder().withStatus(Status.INACTIVE).build();
    final AnetBeanList_Report searchResults =
        adminQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getTotalCount()).isZero();
    assertThat(searchResults.getList()).isEmpty();
  }

  @Test
  public void searchAuthorizationGroupUuid()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Search by empty list of authorization groups should not return reports
    ReportSearchQueryInput query = ReportSearchQueryInput.builder()
        .withAuthorizationGroupUuid(Collections.emptyList()).build();
    final AnetBeanList_Report searchResults =
        adminQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(searchResults.getList()).isEmpty();

    // Search by list of authorization groups
    final List<String> agUuids = Arrays.asList("1", "2", "3"); // FIXME: use real uuid's
    final Set<String> agUuidSet = new HashSet<String>(agUuids);
    query = ReportSearchQueryInput.builder().withAuthorizationGroupUuid(agUuids).build();
    final List<Report> reportList =
        adminQueryExecutor.reportList(getListFields(FIELDS), query).getList();

    for (final Report report : reportList) {
      assertThat(report.getAuthorizationGroups()).isNotNull();
      assertThat(report.getAuthorizationGroups()).isNotEmpty();
      final Set<String> collect = report.getAuthorizationGroups().stream().map(ag -> ag.getUuid())
          .collect(Collectors.toSet());
      collect.retainAll(agUuidSet);
      assertThat(collect).isNotEmpty();
    }
  }

  @Test
  public void searchUpdatedAtStartAndEndTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // insertBaseData has 1 report that is updatedAt 2 days before current timestamp
    final Instant startDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(3).toInstant();
    final Instant endDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant();

    // Greater than startDate and smaller than endDate
    final ReportSearchQueryInput query = ReportSearchQueryInput.builder()
        .withUpdatedAtStart(startDate).withUpdatedAtEnd(endDate).withPageSize(0).build();
    AnetBeanList_Report results = adminQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(results.getList().size()).isEqualTo(1);
    Instant actualReportDate = results.getList().get(0).getUpdatedAt();

    // Greater than startDate and equal to endDate
    query.setUpdatedAtStart(startDate);
    query.setUpdatedAtEnd(actualReportDate);
    results = adminQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(results.getList().size()).isEqualTo(1);

    // Equal to startDate and smaller than endDate
    query.setUpdatedAtStart(actualReportDate);
    query.setUpdatedAtEnd(endDate);
    results = adminQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(results.getList().size()).isEqualTo(1);

    // Equal to startDate and equal to endDate
    query.setUpdatedAtStart(actualReportDate);
    query.setUpdatedAtEnd(actualReportDate);
    results = adminQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(results.getList().size()).isEqualTo(1);

    // A day before the startDate and startDate (no results expected)
    query.setUpdatedAtStart(
        startDate.atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant());
    query.setUpdatedAtEnd(startDate);
    query.setPageSize(0);
    results = adminQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(results.getList().size()).isEqualTo(0);
  }

  @Test
  public void searchByAuthorPosition()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final ReportSearchQueryInput query = ReportSearchQueryInput.builder()
        .withAuthorPositionUuid(admin.getPosition().getUuid()).build();

    // Search by author position
    final AnetBeanList_Report results = adminQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(results).isNotNull();
    assertThat(results.getList().size()).isGreaterThan(0);
  }

  @Test
  public void searchAttendeePosition()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final ReportSearchQueryInput query = ReportSearchQueryInput.builder()
        .withAttendeePositionUuid(admin.getPosition().getUuid()).build();

    // Search by attendee position
    final AnetBeanList_Report results = adminQueryExecutor.reportList(getListFields(FIELDS), query);
    assertThat(results).isNotNull();
    assertThat(results.getList().size()).isGreaterThan(0);
  }

  @Test
  void reportDeleteTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Map<String, Object> attachmentSettings = AttachmentResource.getAttachmentSettings();
    final Person elizabeth = getElizabethElizawell();
    final MutationExecutor elizabethMutationExecutor =
        getMutationExecutor(elizabeth.getDomainUsername());
    final Person jack = getJackJackson();
    final Person roger = getRogerRogwell();
    final List<ReportPersonInput> reportPeopleInput =
        getReportPeopleInput(ImmutableList.of(personToPrimaryReportPerson(roger),
            personToReportPerson(jack), personToPrimaryReportAuthor(elizabeth)));

    // Write a report as that person
    final ReportInput rInput = ReportInput.builder()
        .withIntent("This is a report that should be deleted").withAtmosphere(Atmosphere.NEUTRAL)
        .withReportPeople(reportPeopleInput)
        .withReportText("I'm writing a report that I intend to delete very soon.")
        .withKeyOutcomes("Summary for the key outcomes").withNextSteps("Summary for the next steps")
        .withEngagementDate(Instant.now()).withDuration(15).build();
    final Report r = elizabethMutationExecutor.createReport(FIELDS, rInput);
    assertThat(r).isNotNull();
    assertThat(r.getUuid()).isNotNull();

    // Attach attachment to test report
    final var allowedMimeTypes = (List<String>) attachmentSettings.get("mimeTypes");
    final String mimeType = allowedMimeTypes.get(0);

    final GenericRelatedObjectInput testAroInput = GenericRelatedObjectInput.builder()
        .withRelatedObjectType(ReportDao.TABLE_NAME).withRelatedObjectUuid(r.getUuid()).build();
    final AttachmentInput testAttachmentInput =
        AttachmentInput.builder().withFileName("testDeleteAttachment.jpg").withMimeType(mimeType)
            .withDescription("a test attachment created by testDeleteAttachment")
            .withAttachmentRelatedObjects(Collections.singletonList(testAroInput)).build();
    final String createdAttachmentUuid =
        elizabethMutationExecutor.createAttachment("", testAttachmentInput);
    assertThat(createdAttachmentUuid).isNotNull();

    final Report updatedReport = adminQueryExecutor.report(FIELDS, r.getUuid());
    assertThat(updatedReport.getAttachments()).hasSize(1);
    final Attachment reportAttachment = updatedReport.getAttachments().get(0);
    assertThat(reportAttachment.getUuid()).isEqualTo(createdAttachmentUuid);
    assertThat(reportAttachment.getAttachmentRelatedObjects()).hasSize(1);

    // Try to delete by jack, this should fail.
    try {
      jackMutationExecutor.deleteReport("", r.getUuid());
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Now have the author delete this report.
    final Integer nrDeleted = elizabethMutationExecutor.deleteReport("", r.getUuid());
    assertThat(nrDeleted).isEqualTo(1);

    // Assert the report is gone.
    try {
      getQueryExecutor("elizabeth").report(FIELDS, r.getUuid());
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }

    // Assert that the attachment is gone
    try {
      adminQueryExecutor.attachment(AttachmentResourceTest.ATTACHMENT_FIELDS,
          reportAttachment.getUuid());
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }
  }

  @Test
  public void reportCancelTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person elizabeth = getElizabethElizawell(); // Report Author
    final QueryExecutor elizabethQueryExecutor = getQueryExecutor(elizabeth.getDomainUsername());
    final MutationExecutor elizabethMutationExecutor =
        getMutationExecutor(elizabeth.getDomainUsername());
    final Person steve = getSteveSteveson(); // Principal
    final Person bob = getBobBobtown(); // Report Approver

    // Liz was supposed to meet with Steve, but he cancelled.

    final ReportInput rInput =
        ReportInput.builder().withIntent("Meet with Steve about a thing we never got to talk about")
            .withEngagementDate(Instant.now()).withDuration(45)
            .withReportPeople(getReportPeopleInput(ImmutableList
                .of(personToPrimaryReportAuthor(elizabeth), personToPrimaryReportPerson(steve))))
            .withCancelledReason(ReportCancelledReason.CANCELLED_BY_PRINCIPAL).build();

    final Report saved = elizabethMutationExecutor.createReport(FIELDS, rInput);
    assertThat(saved).isNotNull();
    assertThat(saved.getUuid()).isNotNull();

    int numRows = elizabethMutationExecutor.submitReport("", saved.getUuid());
    assertThat(numRows).isOne();
    final Report returned = elizabethQueryExecutor.report(FIELDS, saved.getUuid());
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
    assertThat(returned.getCancelledReason())
        .isEqualTo(ReportCancelledReason.CANCELLED_BY_PRINCIPAL);

    // Bob gets the approval (EF1 Approvers)
    final ReportSearchQueryInput pendingQuery =
        ReportSearchQueryInput.builder().withPendingApprovalOf(bob.getUuid()).build();
    AnetBeanList_Report pendingBobsApproval =
        getQueryExecutor("bob").reportList(getListFields(FIELDS), pendingQuery);
    assertThat(pendingBobsApproval.getList().stream()
        .anyMatch(rpt -> rpt.getUuid().equals(returned.getUuid()))).isTrue();

    // Bob should approve this report.
    numRows = getMutationExecutor("bob").approveReport("", null, saved.getUuid());
    assertThat(numRows).isOne();

    // Ensure it went to cancelled status.
    final Report returned2 = elizabethQueryExecutor.report(FIELDS, saved.getUuid());
    assertThat(returned2.getState()).isEqualTo(ReportState.CANCELLED);

    // The author should not be able to submit the report now
    try {
      elizabethMutationExecutor.submitReport("", returned2.getUuid());
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }
  }

  @Test
  public void dailyRollupGraphNonReportingTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person steve = getSteveSteveson();

    final ReportInput rInput =
        ReportInput.builder().withIntent("Test the Daily rollup graph")
            .withNextSteps("Check for a change in the rollup graph")
            .withKeyOutcomes("Foobar the bazbiz")
            .withReportPeople(getReportPeopleInput(ImmutableList
                .of(personToPrimaryReportAuthor(admin), personToPrimaryReportPerson(steve))))
            .build();
    Report r = adminMutationExecutor.createReport(FIELDS, rInput);
    assertThat(r).isNotNull();
    assertThat(r.getUuid()).isNotNull();

    // Pull the daily rollup graph
    Instant startDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant();
    Instant endDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).plusDays(1).toInstant();
    final List<RollupGraph> startGraph =
        adminQueryExecutor.rollupGraph(ROLLUP_FIELDS, null, endDate, null, null, startDate);

    // Submit the report
    try {
      adminMutationExecutor.submitReport("", r.getUuid());
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }

    // Oops set the engagementDate.
    r.setEngagementDate(Instant.now());
    r.setDuration(50);
    final Report updated = adminMutationExecutor.updateReport(FIELDS, getReportInput(r), true);
    assertThat(updated).isNotNull();

    // Re-submit the report, it should work.
    int numRows = adminMutationExecutor.submitReport("", r.getUuid());
    assertThat(numRows).isOne();

    // Admin can approve his own reports.
    numRows = adminMutationExecutor.approveReport("", null, r.getUuid());
    assertThat(numRows).isOne();

    // Verify report is in APPROVED state.
    r = adminQueryExecutor.report(FIELDS, r.getUuid());
    assertThat(r.getState()).isEqualTo(ReportState.APPROVED);

    // Admin can publish approved reports.
    numRows = adminMutationExecutor.publishReport("", r.getUuid());
    assertThat(numRows).isOne();

    // Verify report is in PUBLISHED state.
    r = adminQueryExecutor.report(FIELDS, r.getUuid());
    assertThat(r.getState()).isEqualTo(ReportState.PUBLISHED);

    // Check on the daily rollup graph now.
    final List<RollupGraph> endGraph =
        adminQueryExecutor.rollupGraph(ROLLUP_FIELDS, null, endDate, null, null, startDate);

    final Organization org = admin.getPosition().getOrganization();
    @SuppressWarnings("unchecked")
    final List<String> nro =
        (List<String>) TestApp.app.getConfiguration().getDictionaryEntry("non_reporting_ORGs");
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
  public void dailyRollupGraphReportingTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person elizabeth = getElizabethElizawell();
    final QueryExecutor elizabethQueryExecutor = getQueryExecutor(elizabeth.getDomainUsername());
    final MutationExecutor elizabethMutationExecutor =
        getMutationExecutor(elizabeth.getDomainUsername());
    final Person steve = getSteveSteveson();

    final ReportInput rInput = ReportInput.builder().withIntent("Test the Daily rollup graph")
        .withNextSteps("Check for a change in the rollup graph")
        .withKeyOutcomes("Foobar the bazbiz")
        .withReportPeople(getReportPeopleInput(ImmutableList
            .of(personToPrimaryReportAuthor(elizabeth), personToPrimaryReportPerson(steve))))
        .build();
    Report r = elizabethMutationExecutor.createReport(FIELDS, rInput);
    assertThat(r).isNotNull();
    assertThat(r.getUuid()).isNotNull();

    // Pull the daily rollup graph
    final Instant startDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusDays(1).toInstant();
    final Instant endDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).plusDays(1).toInstant();
    final List<RollupGraph> startGraph =
        adminQueryExecutor.rollupGraph(ROLLUP_FIELDS, null, endDate, null, null, startDate);

    // Submit the report
    try {
      elizabethMutationExecutor.submitReport("", r.getUuid());
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }

    // Oops set the engagementDate.
    r.setEngagementDate(Instant.now());
    r.setDuration(115);
    final Report updated = elizabethMutationExecutor.updateReport(FIELDS, getReportInput(r), true);
    assertThat(updated).isNotNull();

    // Re-submit the report, it should work.
    int numRows = elizabethMutationExecutor.submitReport("", r.getUuid());
    assertThat(numRows).isOne();

    // Approve report.
    numRows = getMutationExecutor("bob").approveReport("", null, r.getUuid());
    assertThat(numRows).isOne();

    // Verify report is in APPROVED state.
    r = elizabethQueryExecutor.report(FIELDS, r.getUuid());
    assertThat(r.getState()).isEqualTo(ReportState.APPROVED);

    // Admin can publish approved reports.
    numRows = adminMutationExecutor.publishReport("", r.getUuid());
    assertThat(numRows).isOne();

    // Verify report is in PUBLISHED state.
    r = elizabethQueryExecutor.report(FIELDS, r.getUuid());
    assertThat(r.getState()).isEqualTo(ReportState.PUBLISHED);

    // Check on the daily rollup graph now.
    final List<RollupGraph> endGraph =
        adminQueryExecutor.rollupGraph(ROLLUP_FIELDS, null, endDate, null, null, startDate);

    final Organization org = admin.getPosition().getOrganization();
    @SuppressWarnings("unchecked")
    final List<String> nro =
        (List<String>) TestApp.app.getConfiguration().getDictionaryEntry("non_reporting_ORGs");
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
  public void testSensitiveInformationByAuthor()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person elizabeth = getElizabethElizawell();
    final MutationExecutor elizabethMutationExecutor =
        getMutationExecutor(elizabeth.getDomainUsername());
    final ReportSensitiveInformationInput rsiInput = ReportSensitiveInformationInput.builder()
        // set HTML of report sensitive information
        .withText(UtilsTest.getCombinedHtmlTestCase().getInput()).build();
    final ReportInput rInput = ReportInput.builder()
        .withReportPeople(
            getReportPeopleInput(ImmutableList.of(personToPrimaryReportAuthor(elizabeth))))
        .withReportText(
            "This reportTest was generated by ReportsResourceTest#testSensitiveInformation")
        .withReportSensitiveInformation(rsiInput).build();
    final Report returned = elizabethMutationExecutor.createReport(FIELDS, rInput);
    assertThat(returned).isNotNull();
    assertThat(returned.getUuid()).isNotNull();
    // elizabeth should be allowed to see it returned, as she's the author
    assertThat(returned.getReportSensitiveInformation()).isNotNull();
    // check that HTML of report sensitive information is sanitized after create
    assertThat(returned.getReportSensitiveInformation().getText())
        .isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());

    final Report returned2 = getQueryExecutor("elizabeth").report(FIELDS, returned.getUuid());
    // elizabeth should be allowed to see it
    assertThat(returned2.getReportSensitiveInformation()).isNotNull();
    assertThat(returned2.getReportSensitiveInformation().getText())
        .isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());

    // update HTML of report sensitive information
    returned2.getReportSensitiveInformation()
        .setText(UtilsTest.getCombinedHtmlTestCase().getInput());
    final Report updated =
        elizabethMutationExecutor.updateReport(FIELDS, getReportInput(returned2), true);
    assertThat(updated).isNotNull();
    assertThat(updated.getReportSensitiveInformation()).isNotNull();
    // check that HTML of report sensitive information is sanitized after update
    assertThat(updated.getReportSensitiveInformation().getText())
        .isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());

    final Report returned3 = getQueryExecutor("jack").report(FIELDS, returned.getUuid());
    // jack should not be allowed to see it
    assertThat(returned3.getReportSensitiveInformation()).isNull();
  }

  @Test
  public void testSensitiveInformationByAuthorizationGroup()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final PersonSearchQueryInput erinQuery =
        PersonSearchQueryInput.builder().withText("erin").build();
    final AnetBeanList_Person erinSearchResults =
        adminQueryExecutor.personList(getListFields(PERSON_FIELDS), erinQuery);
    assertThat(erinSearchResults.getTotalCount()).isGreaterThan(0);
    final Optional<Person> erinResult = erinSearchResults.getList().stream()
        .filter(p -> p.getName().equals("ERINSON, Erin")).findFirst();
    assertThat(erinResult).isNotEmpty();

    final ReportSearchQueryInput reportQuery =
        ReportSearchQueryInput.builder().withText("Test Cases are good")
            // otherwise test-case-created data can crowd the actual report we want out of the first
            // page
            .withSortOrder(SortOrder.ASC).build();
    final AnetBeanList_Report reportSearchResults =
        getQueryExecutor("erin").reportList(getListFields(FIELDS), reportQuery);
    assertThat(reportSearchResults.getTotalCount()).isGreaterThan(0);
    final Optional<Report> reportResult = reportSearchResults.getList().stream()
        .filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
    assertThat(reportResult).isNotEmpty();
    final Report report = reportResult.get();
    // erin is the author, so should be able to see the sensitive information
    assertThat(report.getReportSensitiveInformation()).isNotNull();
    assertThat(report.getReportSensitiveInformation().getText()).isEqualTo("Need to know only");

    final PersonSearchQueryInput reinaQuery =
        PersonSearchQueryInput.builder().withText("reina").build();
    final AnetBeanList_Person searchResults =
        adminQueryExecutor.personList(getListFields(PERSON_FIELDS), reinaQuery);
    assertThat(searchResults.getTotalCount()).isGreaterThan(0);
    final Optional<Person> reinaResult = searchResults.getList().stream()
        .filter(p -> p.getName().equals("REINTON, Reina")).findFirst();
    assertThat(reinaResult).isNotEmpty();

    final AnetBeanList_Report reportSearchResults2 =
        getQueryExecutor("reina").reportList(getListFields(FIELDS), reportQuery);
    assertThat(reportSearchResults2.getTotalCount()).isGreaterThan(0);
    final Optional<Report> reportResult2 = reportSearchResults2.getList().stream()
        .filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
    assertThat(reportResult2).isNotEmpty();
    final Report report2 = reportResult2.get();
    // reina is in the authorization group, so should be able to see the sensitive information
    assertThat(report2.getReportSensitiveInformation()).isNotNull();
    assertThat(report2.getReportSensitiveInformation().getText()).isEqualTo("Need to know only");

    final PersonSearchQueryInput elizabethQuery =
        PersonSearchQueryInput.builder().withText("elizabeth").build();
    final AnetBeanList_Person searchResults3 =
        adminQueryExecutor.personList(getListFields(PERSON_FIELDS), elizabethQuery);
    assertThat(searchResults3.getTotalCount()).isGreaterThan(0);
    final Optional<Person> elizabethResult3 = searchResults3.getList().stream()
        .filter(p -> p.getName().equals("ELIZAWELL, Elizabeth")).findFirst();
    assertThat(elizabethResult3).isNotEmpty();

    final AnetBeanList_Report reportSearchResults3 =
        getQueryExecutor("elizabeth").reportList(getListFields(FIELDS), reportQuery);
    assertThat(reportSearchResults3.getTotalCount()).isGreaterThan(0);
    final Optional<Report> reportResult3 = reportSearchResults3.getList().stream()
        .filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
    assertThat(reportResult3).isNotEmpty();
    final Report report3 = reportResult3.get();
    // elizabeth is not in the authorization group, so should not be able to see the sensitive
    // information
    assertThat(report3.getReportSensitiveInformation()).isNull();
  }

  private ReportSearchQueryInput.Builder setupQueryEngagementDayOfWeek() {
    return ReportSearchQueryInput.builder().withState(ImmutableList.of(ReportState.PUBLISHED));
  }

  private AnetBeanList_Report runSearchQuery(ReportSearchQueryInput query)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    return adminQueryExecutor.reportList(getListFields(FIELDS), query);
  }

  @Test
  public void testEngagementDayOfWeekNotIncludedInResults()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final ReportSearchQueryInput query = setupQueryEngagementDayOfWeek().build();
    final AnetBeanList_Report reportResults = runSearchQuery(query);

    assertThat(reportResults).isNotNull();

    final List<Report> reports = reportResults.getList();
    for (Report rpt : reports) {
      assertThat(rpt.getEngagementDayOfWeek()).isNull();
    }
  }

  @Test
  public void testEngagementDayOfWeekIncludedInResults()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final ReportSearchQueryInput query =
        setupQueryEngagementDayOfWeek().withIncludeEngagementDayOfWeek(true).build();

    final AnetBeanList_Report reportResults = runSearchQuery(query);
    assertThat(reportResults).isNotNull();

    final List<Integer> daysOfWeek = Arrays.asList(1, 2, 3, 4, 5, 6, 7);
    final List<Report> reports = reportResults.getList();
    for (Report rpt : reports) {
      assertThat(rpt.getEngagementDayOfWeek()).isIn(daysOfWeek);
    }
  }

  @Test
  public void testSetEngagementDayOfWeek()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
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
  public void testSetEngagementDayOfWeekOutsideWeekRange()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final ReportSearchQueryInput query = setupQueryEngagementDayOfWeek().withEngagementDayOfWeek(0)
        .withIncludeEngagementDayOfWeek(true).build();

    final AnetBeanList_Report reportResults = runSearchQuery(query);
    assertThat(reportResults).isNotNull();

    final List<Report> reports = reportResults.getList();
    assertThat(reports.size()).isEqualTo(0);
  }

  @Test
  public void testAdvisorReportInsightsSuperuser()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    advisorReportInsights(getSuperuser());
  }

  @Test
  public void testAdvisorReportInsightsRegularUser()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    advisorReportInsights(getRegularUser());
  }

  private void advisorReportInsights(final Person user)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Position position = user.getPosition();
    final boolean isSuperuser = position.getType() == PositionType.SUPERUSER;
    try {
      createTestReport();
      final List<AdvisorReportsEntry> advisorReports =
          getQueryExecutor(user.getDomainUsername()).advisorReportInsights(
              "{ uuid name stats { week nrReportsSubmitted nrEngagementsAttended } }", "-1", 3);
      if (isSuperuser) {
        assertThat(advisorReports).isNotNull();
        assertThat(advisorReports.size()).isGreaterThan(0);
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isSuperuser) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

  private void createTestReport()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
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
        .withReportPeople(getReportPeopleInput(Lists.newArrayList(reportPerson)))
        .withAdvisorOrg(getOrganizationInput(advisorOrganization)).build();
    final Report created = adminMutationExecutor.createReport(FIELDS, rInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
  }

  private Location getLocation(Person user, String name)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final LocationSearchQueryInput query =
        LocationSearchQueryInput.builder().withText(name).build();
    final AnetBeanList_Location results = getQueryExecutor(user.getDomainUsername())
        .locationList(getListFields(LOCATION_FIELDS), query);
    assertThat(results).isNotNull();
    assertThat(results.getList()).isNotEmpty();
    return results.getList().get(0);
  }

  @Test
  public void testApprovalFlow() throws NumberFormatException, GraphQLRequestExecutionException,
      GraphQLRequestPreparationException {
    // Fill a report
    final Person author = getJackJackson();
    final QueryExecutor authorQueryExecutor = getQueryExecutor(author.getDomainUsername());
    final MutationExecutor authorMutationExecutor = getMutationExecutor(author.getDomainUsername());
    final Location loc = getLocation(author, "Portugal Cove Ferry Terminal");
    final Instant engagementDate =
        Instant.now().atZone(DaoUtils.getServerNativeZoneId()).minusWeeks(2).toInstant();
    final ReportInput rInput = ReportInput.builder()
        .withReportPeople(getReportPeopleInput(ImmutableList.of(
            personToPrimaryReportPerson(getSteveSteveson()),
            personToPrimaryReportPerson(getElizabethElizawell()), personToReportAuthor(author))))
        .withState(ReportState.DRAFT).withAtmosphere(Atmosphere.POSITIVE)
        .withIntent("Testing the report approval flow")
        .withKeyOutcomes("Report approval flow works")
        .withNextSteps("Approve through the organization, task and location flow")
        .withReportText("Trying to get this report approved").withLocation(getLocationInput(loc))
        .withEngagementDate(engagementDate).build();

    // Reference task 1.1.A
    final TaskSearchQueryInput query = TaskSearchQueryInput.builder().withText("1.1.A").build();
    final AnetBeanList_Task searchObjects =
        authorQueryExecutor.taskList(getListFields(TASK_FIELDS), query);
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final List<Task> searchResults = searchObjects.getList();
    assertThat(searchResults).isNotEmpty();
    final Task t11a =
        searchResults.stream().filter(t -> t.getShortName().equals("1.1.A")).findFirst().get();
    rInput.setTasks(ImmutableList.of(getTaskInput(t11a)));

    // Create the report
    final Report created = authorMutationExecutor.createReport(FIELDS, rInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getState()).isEqualTo(ReportState.DRAFT);

    // Submit the report
    int numRows = authorMutationExecutor.submitReport("", created.getUuid());
    assertThat(numRows).isOne();
    final Report submitted = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(submitted).isNotNull();
    assertThat(submitted.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Check that the approval workflow has a step for task 1.1.A
    final Person andrew = getAndrewAnderson();
    assertThat(submitted.getWorkflow()).isNotNull();
    final List<ReportAction> t11aActions = submitted.getWorkflow().stream().filter(
        ra -> ra.getStep() != null && t11a.getUuid().equals(ra.getStep().getRelatedObjectUuid()))
        .collect(Collectors.toList());
    assertThat(t11aActions.size()).isEqualTo(1);
    final ReportAction t11aAction = t11aActions.get(0);
    final ApprovalStep t11aStep = t11aAction.getStep();
    assertThat(t11aStep).isNotNull();
    final List<Position> t11aApprovers = t11aStep.getApprovers();
    assertThat(t11aApprovers.size()).isGreaterThan(0);
    assertThat(
        t11aApprovers.stream().anyMatch(a -> andrew.getUuid().equals(a.getPerson().getUuid())))
        .isEqualTo(true);

    // Check that the approval workflow has a step for location Portugal Cove Ferry Terminal
    final List<ReportAction> locActions = submitted.getWorkflow().stream()
        .filter(
            ra -> ra.getStep() != null && loc.getUuid().equals(ra.getStep().getRelatedObjectUuid()))
        .collect(Collectors.toList());
    assertThat(locActions.size()).isEqualTo(1);
    final ReportAction locAction = locActions.get(0);
    final ApprovalStep locStep = locAction.getStep();
    assertThat(locStep).isNotNull();
    final List<Position> locApprovers = locStep.getApprovers();
    assertThat(locApprovers.size()).isGreaterThan(0);
    assertThat(locApprovers.stream().anyMatch(a -> admin.getUuid().equals(a.getPerson().getUuid())))
        .isEqualTo(true);

    // Have the report approved by the EF 1.1 approver
    numRows = getMutationExecutor("bob").approveReport("", null, submitted.getUuid());
    assertThat(numRows).isOne();
    final Report approvedStep1 = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(approvedStep1).isNotNull();
    assertThat(approvedStep1.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Check that the next step is the task approval
    final ApprovalStep step2 = approvedStep1.getApprovalStep();
    assertThat(step2).isNotNull();
    assertThat(step2.getRelatedObjectUuid()).isEqualTo(t11a.getUuid());

    // Have the report approved by the 1.1.A approver
    numRows = getMutationExecutor(andrew.getDomainUsername()).approveReport("", null,
        submitted.getUuid());
    assertThat(numRows).isOne();
    final Report approvedStep2 = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(approvedStep2).isNotNull();
    assertThat(approvedStep1.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Check that the next step is the location approval
    final ApprovalStep step3 = approvedStep2.getApprovalStep();
    assertThat(step3).isNotNull();
    assertThat(step3.getRelatedObjectUuid()).isEqualTo(loc.getUuid());

    // Have the report approved by the location Portugal Cove Ferry Terminal approver
    numRows = adminMutationExecutor.approveReport("", null, submitted.getUuid());
    assertThat(numRows).isOne();
    final Report approvedStep3 = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(approvedStep3).isNotNull();
    assertThat(approvedStep3.getState()).isEqualTo(ReportState.APPROVED);
  }

  @Test
  public void testReportAuthors()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person author = getJackJackson();
    final MutationExecutor authorMutationExecutor = getMutationExecutor(author.getDomainUsername());
    final ReportInput rInput = ReportInput.builder()
        .withReportPeople(getReportPeopleInput(ImmutableList.of(personToReportAuthor(author))))
        .withState(ReportState.DRAFT).withAtmosphere(Atmosphere.POSITIVE)
        .withIntent("Testing report authors").withEngagementDate(Instant.now()).build();
    final Report reportFirstAuthor = authorMutationExecutor.createReport(FIELDS, rInput);
    assertThat(reportFirstAuthor).isNotNull();
    assertThat(reportFirstAuthor.getUuid()).isNotNull();
    assertThat(reportFirstAuthor.getState()).isEqualTo(ReportState.DRAFT);
    assertThat(reportFirstAuthor.getReportPeople())
        .anyMatch(rp -> Objects.equals(rp.getUuid(), author.getUuid()) && rp.getAuthor());

    // Try to remove the author, should fail
    reportFirstAuthor.setReportPeople(null);
    try {
      authorMutationExecutor.updateReport(FIELDS, getReportInput(reportFirstAuthor), true);
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }

    // Add a second author
    final Person liz = getElizabethElizawell();
    reportFirstAuthor
        .setReportPeople(ImmutableList.of(personToReportAuthor(author), personToReportAuthor(liz)));
    final Report reportTwoAuthors =
        authorMutationExecutor.updateReport(FIELDS, getReportInput(reportFirstAuthor), true);
    assertThat(reportTwoAuthors.getReportPeople())
        .anyMatch(rp -> Objects.equals(rp.getUuid(), author.getUuid()) && rp.getAuthor());
    assertThat(reportTwoAuthors.getReportPeople())
        .anyMatch(rp -> Objects.equals(rp.getUuid(), liz.getUuid()) && rp.getAuthor());

    // Remove the first author
    reportTwoAuthors.setReportPeople(ImmutableList.of(personToReportAuthor(liz)));
    final Report reportSecondAuthor =
        authorMutationExecutor.updateReport(FIELDS, getReportInput(reportTwoAuthors), true);
    assertThat(reportSecondAuthor.getReportPeople())
        .noneMatch(rp -> Objects.equals(rp.getUuid(), author.getUuid()) && rp.getAuthor());
    assertThat(reportSecondAuthor.getReportPeople())
        .anyMatch(rp -> Objects.equals(rp.getUuid(), liz.getUuid()) && rp.getAuthor());

    // Try to edit the report as the first author, should fail
    reportSecondAuthor.setIntent("Testing report authors again");
    try {
      authorMutationExecutor.updateReport(FIELDS, getReportInput(reportSecondAuthor), true);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Try to add first author again, should fail
    reportSecondAuthor
        .setReportPeople(ImmutableList.of(personToReportAuthor(author), personToReportAuthor(liz)));
    try {
      authorMutationExecutor.updateReport(FIELDS, getReportInput(reportSecondAuthor), true);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Try to delete the report as the first author, should fail
    try {
      authorMutationExecutor.deleteReport("", reportSecondAuthor.getUuid());
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Have the remaining author delete this report.
    final Integer nrDeleted =
        getMutationExecutor("elizabeth").deleteReport("", reportSecondAuthor.getUuid());
    assertThat(nrDeleted).isEqualTo(1);
  }

  @Test
  public void testUnpublishReport()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    testUnpublishReport(false);
  }

  @Test
  public void testUnpublishFutureReport()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    testUnpublishReport(true);
  }

  private void testUnpublishReport(boolean isFuture)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person author =
        findOrPutPersonInDb(Person.builder().withDomainUsername("selena").build());
    final QueryExecutor authorQueryExecutor = getQueryExecutor(author.getDomainUsername());
    final MutationExecutor authorMutationExecutor = getMutationExecutor(author.getDomainUsername());
    final Location loc = getLocation(author, "Cabot Tower");
    final Instant engagementDate = Instant.now().atZone(DaoUtils.getServerNativeZoneId())
        .minusWeeks(isFuture ? -2 : 2).toInstant();
    final ReportInput rInput = ReportInput.builder()
        .withReportPeople(getReportPeopleInput(ImmutableList.of(
            personToPrimaryReportPerson(getSteveSteveson()), personToPrimaryReportAuthor(author))))
        .withState(ReportState.DRAFT).withAtmosphere(Atmosphere.POSITIVE)
        .withIntent("Testing unpublishing").withKeyOutcomes("Unpublishing works")
        .withNextSteps("Approve before unpublishing")
        .withReportText("<p>Trying to get this report unpublished</p>")
        .withLocation(getLocationInput(loc)).withEngagementDate(engagementDate).build();

    // Reference task EF7
    final TaskSearchQueryInput query = TaskSearchQueryInput.builder().withText("EF7").build();
    final AnetBeanList_Task searchObjects =
        authorQueryExecutor.taskList(getListFields(TASK_FIELDS), query);
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final List<Task> searchResults = searchObjects.getList();
    assertThat(searchResults).isNotEmpty();
    final Task t11a =
        searchResults.stream().filter(t -> t.getShortName().equals("EF7")).findFirst().get();
    rInput.setTasks(ImmutableList.of(getTaskInput(t11a)));

    // Create the report
    final Report created = authorMutationExecutor.createReport(FIELDS, rInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getState()).isEqualTo(ReportState.DRAFT);

    // Submit the report
    int numRows = authorMutationExecutor.submitReport("", created.getUuid());
    assertThat(numRows).isOne();
    final Report submitted = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(submitted).isNotNull();
    if (!isFuture) {
      assertThat(submitted.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
      // Approve
      numRows = adminMutationExecutor.approveReport("", null, created.getUuid());
      assertThat(numRows).isOne();
    }
    final Report approved = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(approved).isNotNull();
    assertThat(approved.getState()).isEqualTo(ReportState.APPROVED);

    // Try to unpublish report that is not published
    try {
      adminMutationExecutor.unpublishReport("", approved.getUuid());
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }

    // Publish report
    numRows = adminMutationExecutor.publishReport("", approved.getUuid());
    assertThat(numRows).isOne();
    final Report published = authorQueryExecutor.report(FIELDS, created.getUuid());
    assertThat(published).isNotNull();
    assertThat(published.getState()).isEqualTo(ReportState.PUBLISHED);

    // Try to unpublish published report by regular user
    try {
      authorMutationExecutor.unpublishReport("", published.getUuid());
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
    // Try to unpublish published report by superuser
    try {
      getMutationExecutor("bob").unpublishReport("", published.getUuid());
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
    // Unpublish published report by admin
    final Integer nrUnpublished = adminMutationExecutor.unpublishReport("", published.getUuid());
    assertThat(nrUnpublished).isEqualTo(1);
    // Check that workflow has been extended
    final Report unpublished = authorQueryExecutor.report(FIELDS, published.getUuid());
    assertThat(unpublished).isNotNull();
    assertThat(unpublished.getState()).isEqualTo(ReportState.DRAFT);
    assertThat(unpublished.getWorkflow()).hasSize(published.getWorkflow().size() + 1);

    // Clean up
    final Integer nrDeleted = authorMutationExecutor.deleteReport("", unpublished.getUuid());
    assertThat(nrDeleted).isEqualTo(1);
  }

  @Test
  void testAdminCanFindAllDrafts()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final ReportSearchQueryInput draftsQuery = ReportSearchQueryInput.builder()
        .withState(List.of(ReportState.DRAFT)).withPageSize(0).build();

    // Normal users should find only their own drafts
    final QueryExecutor erinQueryExecutor = getQueryExecutor("erin");
    AnetBeanList_Report erinsDraftReports =
        erinQueryExecutor.reportList(getListFields(FIELDS), draftsQuery);
    assertThat(erinsDraftReports.getTotalCount()).isOne();
    final Report erinsDraftReport = erinsDraftReports.getList().get(0);

    // Even when including all drafts (or trying to)
    draftsQuery.setIncludeAllDrafts(true);
    AnetBeanList_Report erinsDraftReportsAgain =
        erinQueryExecutor.reportList(getListFields(FIELDS), draftsQuery);
    assertThat(erinsDraftReportsAgain.getTotalCount()).isOne();
    draftsQuery.setIncludeAllDrafts(false);

    // Erin's superuser should not be able to find it
    final QueryExecutor rebeccaMutationExecutor = getQueryExecutor("rebecca");
    AnetBeanList_Report rebeccaDraftReports =
        rebeccaMutationExecutor.reportList(getListFields(FIELDS), draftsQuery);
    assertThat(rebeccaDraftReports.getTotalCount()).isZero();

    // Admin should normally find only their own drafts
    AnetBeanList_Report adminDraftReports =
        adminQueryExecutor.reportList(getListFields(FIELDS), draftsQuery);
    assertThat(adminDraftReports.getTotalCount()).isOne();
    // List should not include Erin's draft
    assertThat(adminDraftReports.getList())
        .noneMatch(report -> report.getUuid().equals(erinsDraftReport.getUuid()));

    // Except when including all drafts
    draftsQuery.setIncludeAllDrafts(true);
    AnetBeanList_Report allDraftReports =
        adminQueryExecutor.reportList(getListFields(FIELDS), draftsQuery);
    assertThat(allDraftReports.getTotalCount()).isGreaterThan(1);
    // List should include Erin's draft
    assertThat(allDraftReports.getList())
        .anyMatch(report -> report.getUuid().equals(erinsDraftReport.getUuid()));
    // List should include other draft
    assertThat(allDraftReports.getList())
        .anyMatch(report -> !report.getUuid().equals(erinsDraftReport.getUuid()));
  }

  void testAdminCanSubmit()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // Erin's Draft report, ready for submission
    final String uuid = "530b735e-1134-4daa-9e87-4491c888a4f7";
    final Report report = adminQueryExecutor.report(FIELDS, uuid);
    assertThat(report.getState()).isEqualTo(ReportState.DRAFT);

    // Erin's superuser should not be able to submit it
    final MutationExecutor rebeccaMutationExecutor = getMutationExecutor("rebecca");
    try {
      rebeccaMutationExecutor.submitReport("", uuid);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Admin should be able to submit it
    try {
      adminMutationExecutor.submitReport("", uuid);
    } catch (ForbiddenException expectedException) {
      fail("Unexpected ForbiddenException");
    }
    final Report submittedReport = adminQueryExecutor.report(FIELDS, uuid);
    assertThat(submittedReport.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Erin should be able to edit it again
    final MutationExecutor erinMutationExecutor = getMutationExecutor("erin");
    final Report updatedReport =
        erinMutationExecutor.updateReport(FIELDS, getReportInput(report), false);

    // It should be back to Draft
    assertThat(updatedReport.getState()).isEqualTo(ReportState.DRAFT);
  }

}
