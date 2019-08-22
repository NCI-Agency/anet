package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import com.fasterxml.jackson.core.type.TypeReference;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;
import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.ForbiddenException;
import javax.ws.rs.NotFoundException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AdvisorReportsEntry;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Task.TaskStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.ReportSearchSortBy;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.beans.OrganizationTest;
import mil.dds.anet.test.beans.PersonTest;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.UtilsTest;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReportsResourceTest extends AbstractResourceTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String COMMENT_FIELDS = "uuid text author { uuid }";
  private static final String LOCATION_FIELDS = "uuid name status lat lng";
  private static final String ORGANIZATION_FIELDS =
      "uuid shortName longName status identificationCode type";
  private static final String PERSON_FIELDS =
      "uuid name status role emailAddress phoneNumber rank biography country"
          + " gender endOfTourDate domainUsername pendingVerification createdAt updatedAt";
  private static final String POSITION_FIELDS = "uuid";
  private static final String REPORT_FIELDS =
      "uuid intent exsum state cancelledReason atmosphere atmosphereDetails"
          + " engagementDate duration engagementDayOfWeek keyOutcomes nextSteps reportText createdAt updatedAt";
  private static final String _TASK_FIELDS = "uuid shortName longName category";
  private static final String TASK_FIELDS =
      String.format("%1$s customFieldRef1 { %1$s }", _TASK_FIELDS);
  private static final String FIELDS = String.format(
      "%1$s" + " advisorOrg { %2$s }" + " principalOrg { %2$s }" + " author { %3$s }"
          + " attendees { %3$s primary }" + " tasks { %4$s }" + " approvalStep { uuid }"
          + " location { %5$s }" + " tags { uuid name description }" + " comments { %6$s }"
          + " authorizationGroups { uuid name }"
          + " workflow { step { uuid } person { uuid } type createdAt }",
      REPORT_FIELDS, ORGANIZATION_FIELDS, PERSON_FIELDS, TASK_FIELDS, LOCATION_FIELDS,
      COMMENT_FIELDS);

  @Test
  public void createReport() throws ExecutionException, InterruptedException {
    // Create a report writer
    final Person author = getJackJackson();

    // Create a principal for the report
    final Person principalPerson = getSteveSteveson();
    final ReportPerson principal = PersonTest.personToReportPerson(principalPerson);
    principal.setPrimary(true);
    Position principalPosition = principal.loadPosition();
    assertThat(principalPosition).isNotNull();
    Organization principalOrg = principalPosition.loadOrganization(context).get();
    assertThat(principalOrg).isNotNull();

    // Create an Advising Organization for the report writer
    final String advisorOrgUuid = graphQLHelper.createObject(admin, "createOrganization",
        "organization", "OrganizationInput", OrganizationTest.getTestAO(true),
        new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(advisorOrgUuid).isNotNull();
    final Organization advisorOrg = graphQLHelper.getObjectById(admin, "organization",
        ORGANIZATION_FIELDS, advisorOrgUuid, new TypeReference<GraphQlResponse<Organization>>() {});

    // Create leadership people in the AO who can approve this report
    Person approver1 = new Person();
    approver1.setDomainUsername("testApprover1");
    approver1.setEmailAddress("hunter+testApprover1@dds.mil");
    approver1.setName("Test Approver 1");
    approver1.setRole(Role.ADVISOR);
    approver1.setStatus(PersonStatus.ACTIVE);
    approver1 = findOrPutPersonInDb(approver1);
    Person approver2 = new Person();
    approver2.setDomainUsername("testApprover2");
    approver2.setEmailAddress("hunter+testApprover2@dds.mil");
    approver2.setName("Test Approver 2");
    approver2.setRole(Person.Role.ADVISOR);
    approver2.setStatus(PersonStatus.ACTIVE);
    approver2 = findOrPutPersonInDb(approver2);

    Position approver1Pos = new Position();
    approver1Pos.setName("Test Approver 1 Position");
    approver1Pos.setOrganization(advisorOrg);
    approver1Pos.setType(PositionType.SUPER_USER);
    approver1Pos.setStatus(PositionStatus.ACTIVE);
    String approver1PosUuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", approver1Pos, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(approver1PosUuid).isNotNull();
    approver1Pos = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, approver1PosUuid,
        new TypeReference<GraphQlResponse<Position>>() {});
    Map<String, Object> variables = new HashMap<>();
    variables.put("uuid", approver1Pos.getUuid());
    variables.put("person", approver1);
    Integer nrUpdated = graphQLHelper.updateObject(admin,
        "mutation ($uuid: String!, $person: PersonInput!) { payload: putPersonInPosition (uuid: $uuid, person: $person) }",
        variables);
    assertThat(nrUpdated).isEqualTo(1);

    Position approver2Pos = new Position();
    approver2Pos.setName("Test Approver 2 Position");
    approver2Pos.setOrganization(advisorOrg);
    approver2Pos.setType(PositionType.SUPER_USER);
    approver2Pos.setStatus(PositionStatus.ACTIVE);
    String approver2PosUuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", approver2Pos, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(approver2PosUuid).isNotNull();
    approver2Pos = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, approver2PosUuid,
        new TypeReference<GraphQlResponse<Position>>() {});
    variables = new HashMap<>();
    variables.put("uuid", approver2Pos.getUuid());
    variables.put("person", approver2);
    nrUpdated = graphQLHelper.updateObject(admin,
        "mutation ($uuid: String!, $person: PersonInput!) { payload: putPersonInPosition (uuid: $uuid, person: $person) }",
        variables);
    assertThat(nrUpdated).isEqualTo(1);

    // Create a billet for the author
    Position authorBillet = new Position();
    authorBillet.setName("A report writer");
    authorBillet.setType(PositionType.ADVISOR);
    authorBillet.setOrganization(advisorOrg);
    authorBillet.setStatus(PositionStatus.ACTIVE);
    String authorBilletUuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", authorBillet, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(authorBilletUuid).isNotNull();
    authorBillet = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, authorBilletUuid,
        new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(authorBillet.getUuid()).isNotNull();

    // Set this author in this billet
    variables = new HashMap<>();
    variables.put("uuid", authorBillet.getUuid());
    variables.put("person", author);
    nrUpdated = graphQLHelper.updateObject(admin,
        "mutation ($uuid: String!, $person: PersonInput!) { payload: putPersonInPosition (uuid: $uuid, person: $person) }",
        variables);
    assertThat(nrUpdated).isEqualTo(1);
    Position checkit =
        graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS + " person { uuid }",
            authorBillet.getUuid(), new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(checkit.getPerson()).isNotNull();
    assertThat(checkit.getPersonUuid()).isEqualTo(author.getUuid());

    // Create Approval workflow for Advising Organization
    final List<ApprovalStep> approvalSteps = new ArrayList<>();
    final ApprovalStep approval = new ApprovalStep();
    approval.setName("Test Group for Approving");
    approval.setAdvisorOrganizationUuid(advisorOrg.getUuid());
    approval.setApprovers(ImmutableList.of(approver1Pos));
    approvalSteps.add(approval);

    // Adding a new approval step to an AO automatically puts it at the end of the approval process.
    final ApprovalStep releaseApproval = new ApprovalStep();
    releaseApproval.setName("Test Group of Releasers");
    releaseApproval.setAdvisorOrganizationUuid(advisorOrg.getUuid());
    releaseApproval.setApprovers(ImmutableList.of(approver2Pos));
    approvalSteps.add(releaseApproval);
    advisorOrg.setApprovalSteps(approvalSteps);

    nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization",
        "OrganizationInput", advisorOrg);
    assertThat(nrUpdated).isEqualTo(1);
    // Pull the approval workflow for this AO
    final Organization orgWithSteps = graphQLHelper.getObjectById(admin, "organization",
        "uuid approvalSteps { uuid name nextStepUuid advisorOrganizationUuid }",
        advisorOrg.getUuid(), new TypeReference<GraphQlResponse<Organization>>() {});
    final List<ApprovalStep> steps = orgWithSteps.loadApprovalSteps(context).get();
    assertThat(steps.size()).isEqualTo(2);
    assertThat(steps.get(0).getName()).isEqualTo(approval.getName());
    assertThat(steps.get(0).getNextStepUuid()).isEqualTo(steps.get(1).getUuid());
    assertThat(steps.get(1).getName()).isEqualTo(releaseApproval.getName());
    approval.setUuid(steps.get(0).getUuid());
    releaseApproval.setUuid(steps.get(1).getUuid());

    // Ensure the approver is an approver
    assertThat(approver1Pos.loadIsApprover()).isTrue();

    // Create some tasks for this organization
    final String topUuid = graphQLHelper.createObject(admin, "createTask", "task", "TaskInput",
        TestData.createTask("test-1", "Test Top Task", "TOP", null, advisorOrg, TaskStatus.ACTIVE),
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(topUuid).isNotNull();
    final Task top = graphQLHelper.getObjectById(admin, "task", TASK_FIELDS, topUuid,
        new TypeReference<GraphQlResponse<Task>>() {});
    final String actionUuid = graphQLHelper.createObject(admin, "createTask", "task", "TaskInput",
        TestData.createTask("test-1-1", "Test Task Action", "Action", top, null, TaskStatus.ACTIVE),
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(actionUuid).isNotNull();
    final Task action = graphQLHelper.getObjectById(admin, "task", TASK_FIELDS, actionUuid,
        new TypeReference<GraphQlResponse<Task>>() {});

    // Create a Location that this Report was written at
    final String locUuid = graphQLHelper.createObject(admin, "createLocation", "location",
        "LocationInput", TestData.createLocation("The Boat Dock", 1.23, 4.56),
        new TypeReference<GraphQlResponse<Location>>() {});
    assertThat(locUuid).isNotNull();
    final Location loc = graphQLHelper.getObjectById(admin, "location", LOCATION_FIELDS, locUuid,
        new TypeReference<GraphQlResponse<Location>>() {});

    // Write a Report
    Report r = new Report();
    r.setAuthor(author);
    r.setEngagementDate(Instant.now());
    r.setDuration(120);
    r.setAttendees(Lists.newArrayList(principal));
    r.setTasks(Lists.newArrayList(action));
    r.setLocation(loc);
    r.setAtmosphere(Atmosphere.POSITIVE);
    r.setAtmosphereDetails("Eerybody was super nice!");
    r.setIntent("A testing report to test that reporting reports");
    // set HTML of report text
    r.setReportText(UtilsTest.getCombinedTestCase().getInput());
    r.setNextSteps("This is the next steps on a report");
    r.setKeyOutcomes("These are the key outcomes of this engagement");
    r.setAdvisorOrg(advisorOrg);
    r.setPrincipalOrg(principalOrg);
    String createdUuid = graphQLHelper.createObject(author, "createReport", "report", "ReportInput",
        r, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(createdUuid).isNotNull();
    Report created = graphQLHelper.getObjectById(author, "report", FIELDS, createdUuid,
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getState()).isEqualTo(ReportState.DRAFT);
    assertThat(created.getAdvisorOrgUuid()).isEqualTo(advisorOrg.getUuid());
    assertThat(created.getPrincipalOrgUuid()).isEqualTo(principalOrg.getUuid());
    // check that HTML of report text is sanitized after create
    assertThat(created.getReportText()).isEqualTo(UtilsTest.getCombinedTestCase().getOutput());

    // Have the author submit the report
    Report submitted = graphQLHelper.updateObject(author, "submitReport", "uuid", FIELDS, "String",
        created.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(submitted).isNotNull();

    Report returned = graphQLHelper.getObjectById(author, "report", FIELDS, created.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Verify that author can no longer edit the report
    try {
      graphQLHelper.updateObject(author, "updateReport", "report", FIELDS, "ReportInput", returned,
          new TypeReference<GraphQlResponse<Report>>() {});
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    logger.debug("Expecting report {} in step {} because of org {} on author {}", new Object[] {
        returned.getUuid(), approval.getUuid(), advisorOrg.getUuid(), author.getUuid()});
    assertThat(returned.getApprovalStepUuid()).isEqualTo(approval.getUuid());

    // verify the location on this report
    assertThat(returned.getLocationUuid()).isEqualTo(loc.getUuid());

    // verify the principals on this report
    assertThat(returned.getAttendees()).contains(principal);

    // verify the tasks on this report
    assertThat(returned.getTasks()).contains(action);

    // Verify this shows up on the approvers list of pending documents
    ReportSearchQuery pendingQuery = new ReportSearchQuery();
    pendingQuery.setPendingApprovalOf(approver1.getUuid());
    AnetBeanList<Report> pending =
        graphQLHelper.searchObjects(approver1, "reportList", "query", "ReportSearchQueryInput",
            FIELDS, pendingQuery, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    String uuid = returned.getUuid();
    Report expected =
        pending.getList().stream().filter(re -> re.getUuid().equals(uuid)).findFirst().get();
    assertThat(expected).isEqualTo(returned);
    assertThat(pending.getList()).contains(returned);

    // Run a search for this users pending approvals
    ReportSearchQuery searchQuery = new ReportSearchQuery();
    searchQuery.setPendingApprovalOf(approver1.getUuid());
    pending =
        graphQLHelper.searchObjects(approver1, "reportList", "query", "ReportSearchQueryInput",
            FIELDS, searchQuery, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(pending.getList().size()).isGreaterThan(0);

    // Check on Report status for who needs to approve
    List<ReportAction> workflow = returned.getWorkflow();
    assertThat(workflow.size()).isEqualTo(3);
    ReportAction reportAction = workflow.get(1);
    assertThat(reportAction.getPerson()).isNull(); // Because this hasn't been approved yet.
    assertThat(reportAction.getCreatedAt()).isNull();
    assertThat(reportAction.getStepUuid()).isEqualTo(steps.get(0).getUuid());
    reportAction = workflow.get(2);
    assertThat(reportAction.getStepUuid()).isEqualTo(steps.get(1).getUuid());

    // Reject the report
    variables = new HashMap<>();
    variables.put("uuid", created.getUuid());
    variables.put("comment", TestData.createComment("a test rejection"));
    Report rejected = graphQLHelper.updateObject(approver1,
        "mutation ($uuid: String!, $comment: CommentInput!) { payload: rejectReport (uuid: $uuid, comment: $comment) { "
            + FIELDS + " } }",
        variables, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(rejected).isNotNull();

    // Check on report status to verify it was rejected
    returned = graphQLHelper.getObjectById(author, "report", FIELDS, created.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned.getState()).isEqualTo(ReportState.REJECTED);
    assertThat(returned.getApprovalStepUuid()).isNull();

    // Author needs to re-submit
    submitted = graphQLHelper.updateObject(author, "submitReport", "uuid", FIELDS, "String",
        created.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(submitted).isNotNull();

    // TODO: Approver modify the report *specifically change the attendees!*

    // Approve the report
    Report approved = graphQLHelper.updateObject(approver1, "approveReport", "uuid", FIELDS,
        "String", created.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(approved).isNotNull();

    // Check on Report status to verify it got moved forward
    returned = graphQLHelper.getObjectById(author, "report", FIELDS, created.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
    assertThat(returned.getApprovalStepUuid()).isEqualTo(releaseApproval.getUuid());

    // Verify that the wrong person cannot approve this report.
    try {
      graphQLHelper.updateObject(approver1, "approveReport", "uuid", FIELDS, "String",
          created.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Approve the report
    approved = graphQLHelper.updateObject(approver2, "approveReport", "uuid", FIELDS, "String",
        created.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(approved).isNotNull();

    // Check on Report status to verify it got moved forward
    returned = graphQLHelper.getObjectById(author, "report", FIELDS, created.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned.getState()).isEqualTo(ReportState.APPROVED);
    assertThat(returned.getApprovalStepUuid()).isNull();

    // check on report status to see that it got approved.
    workflow = returned.getWorkflow();
    // there were 5 actions on the report: submit, reject, submit, approve, approve
    assertThat(workflow.size()).isEqualTo(5);
    reportAction = workflow.get(3);
    assertThat(reportAction.getPersonUuid()).isEqualTo(approver1.getUuid());
    assertThat(reportAction.getCreatedAt()).isNotNull();
    assertThat(reportAction.getStepUuid()).isEqualTo(steps.get(0).getUuid());
    reportAction = workflow.get(4);
    assertThat(reportAction.getStepUuid()).isEqualTo(steps.get(1).getUuid());

    // Admin can publish approved reports.
    Report published = graphQLHelper.updateObject(admin, "publishReport", "uuid", FIELDS, "String",
        created.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(published).isNotNull();

    // Post a comment on the report because it's awesome
    variables = new HashMap<>();
    variables.put("uuid", created.getUuid());
    variables.put("comment", TestData.createComment("This is a test comment one"));
    Comment commentOne = graphQLHelper.updateObject(author,
        "mutation ($uuid: String!, $comment: CommentInput!) { payload: addComment (uuid: $uuid, comment: $comment) { "
            + COMMENT_FIELDS + " } }",
        variables, new TypeReference<GraphQlResponse<Comment>>() {});
    assertThat(commentOne.getUuid()).isNotNull();
    assertThat(commentOne.getAuthorUuid()).isEqualTo(author.getUuid());

    variables = new HashMap<>();
    variables.put("uuid", created.getUuid());
    variables.put("comment", TestData.createComment("This is a test comment two"));
    Comment commentTwo = graphQLHelper.updateObject(approver1,
        "mutation ($uuid: String!, $comment: CommentInput!) { payload: addComment (uuid: $uuid, comment: $comment) { "
            + COMMENT_FIELDS + " } }",
        variables, new TypeReference<GraphQlResponse<Comment>>() {});
    assertThat(commentTwo.getUuid()).isNotNull();

    returned = graphQLHelper.getObjectById(approver1, "report", FIELDS, created.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    List<Comment> commentsReturned = returned.getComments();
    assertThat(commentsReturned).hasSize(3); // the rejection comment will be there as well.
    // Assert order of comments!
    assertThat(commentsReturned).containsSequence(commentOne, commentTwo);

    // Verify this report shows up in the daily rollup
    ReportSearchQuery query = new ReportSearchQuery();
    query.setReleasedAtStart(
        Instant.now().atZone(DaoUtils.getDefaultZoneId()).minusDays(1).toInstant());
    AnetBeanList<Report> rollup =
        graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(rollup.getTotalCount()).isGreaterThan(0);
    assertThat(rollup.getList()).contains(returned);

    // Pull recent People, Tasks, and Locations and verify that the records from the last report are
    // there.
    AnetBeanList<Person> recentPeople = graphQLHelper.getAllObjects(author, "personRecents",
        PERSON_FIELDS, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(recentPeople.getList()).contains(principalPerson);

    AnetBeanList<Task> recentTasks = graphQLHelper.getAllObjects(author, "taskRecents", TASK_FIELDS,
        new TypeReference<GraphQlResponse<AnetBeanList<Task>>>() {});
    assertThat(recentTasks.getList()).contains(action);

    AnetBeanList<Location> recentLocations = graphQLHelper.getAllObjects(author, "locationRecents",
        LOCATION_FIELDS, new TypeReference<GraphQlResponse<AnetBeanList<Location>>>() {});
    assertThat(recentLocations.getList()).contains(loc);

    // Go and delete the entire approval chain!
    advisorOrg.setApprovalSteps(ImmutableList.of());
    nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization",
        "OrganizationInput", advisorOrg);
    assertThat(nrUpdated).isEqualTo(1);

    Organization updatedOrg =
        graphQLHelper.getObjectById(admin, "organization", ORGANIZATION_FIELDS,
            advisorOrg.getUuid(), new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(updatedOrg).isNotNull();
    assertThat(updatedOrg.loadApprovalSteps(context).get()).isEmpty();
  }

  @Test
  public void testDefaultApprovalFlow()
      throws NumberFormatException, InterruptedException, ExecutionException {
    final Person jack = getJackJackson();
    final Person roger = getRogerRogwell();

    // Create a Person who isn't in a Billet
    Person author = new Person();
    author.setName("A New Guy");
    author.setRole(Role.ADVISOR);
    author.setStatus(PersonStatus.ACTIVE);
    author.setDomainUsername("newGuy");
    author.setEmailAddress("newGuy@dds.mil");
    String authorUuid = graphQLHelper.createObject(admin, "createPerson", "person", "PersonInput",
        author, new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(authorUuid).isNotNull();
    author = graphQLHelper.getObjectById(admin, "person", PERSON_FIELDS, authorUuid,
        new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(author.getUuid()).isNotNull();

    List<ReportPerson> attendees = ImmutableList.of(PersonTest.personToPrimaryReportPerson(roger),
        PersonTest.personToPrimaryReportPerson(jack));

    // Write a report as that person
    Report r = new Report();
    r.setAuthor(author);
    r.setIntent("I am a new Advisor and wish to be included in things");
    r.setAtmosphere(Atmosphere.NEUTRAL);
    r.setAttendees(attendees);
    r.setReportText(
        "I just got here in town and am writing a report for the first time, but have no reporting structure set up");
    r.setKeyOutcomes("Summary for the key outcomes");
    r.setNextSteps("Summary for the next steps");
    r.setEngagementDate(Instant.now());
    r.setDuration(75);
    String ruuid = graphQLHelper.createObject(jack, "createReport", "report", "ReportInput", r,
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(ruuid).isNotNull();
    r = graphQLHelper.getObjectById(jack, "report", FIELDS, ruuid,
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(r.getUuid()).isNotNull();

    // Submit the report
    Report submitted = graphQLHelper.updateObject(jack, "submitReport", "uuid", FIELDS, "String",
        r.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(submitted).isNotNull();

    // Check the approval Step
    Report returned = graphQLHelper.getObjectById(jack, "report", FIELDS, r.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned.getUuid()).isEqualTo(r.getUuid());
    assertThat(returned.getState()).isEqualTo(Report.ReportState.PENDING_APPROVAL);

    // Find the default ApprovalSteps
    String defaultOrgUuid = AnetObjectEngine.getInstance().getDefaultOrgUuid();
    assertThat(defaultOrgUuid).isNotNull();
    final Organization orgWithSteps = graphQLHelper.getObjectById(jack, "organization",
        "uuid approvalSteps { uuid nextStepUuid }", defaultOrgUuid,
        new TypeReference<GraphQlResponse<Organization>>() {});
    final List<ApprovalStep> steps = orgWithSteps.loadApprovalSteps(context).get();
    assertThat(steps).isNotNull();
    assertThat(steps).hasSize(1);
    assertThat(returned.getApprovalStepUuid()).isEqualTo(steps.get(0).getUuid());

    // Get the Person who is able to approve that report (nick@example.com)
    Person nick = new Person();
    nick.setDomainUsername("nick");

    // Create billet for Author
    Position billet = new Position();
    billet.setName("EF 1.1 new advisor");
    billet.setType(Position.PositionType.ADVISOR);
    billet.setStatus(PositionStatus.ACTIVE);

    // Put billet in EF1
    final OrganizationSearchQuery queryOrgs = new OrganizationSearchQuery();
    queryOrgs.setText("EF 1");
    queryOrgs.setType(OrganizationType.ADVISOR_ORG);
    final AnetBeanList<Organization> results = graphQLHelper.searchObjects(nick, "organizationList",
        "query", "OrganizationSearchQueryInput", ORGANIZATION_FIELDS, queryOrgs,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(results.getList().size()).isGreaterThan(0);
    Organization ef1 = null;
    for (Organization org : results.getList()) {
      if (org.getShortName().trim().equalsIgnoreCase("ef 1.1")) {
        billet.setOrganization(createOrganizationWithUuid(org.getUuid()));
        ef1 = org;
        break;
      }
    }
    assertThat(billet.getOrganization()).isNotNull();
    assertThat(ef1).isNotNull();

    final String billetUuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", billet, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(billetUuid).isNotNull();
    billet = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, billetUuid,
        new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(billet).isNotNull();

    // Put Author in the billet
    Map<String, Object> variables = new HashMap<>();
    variables.put("uuid", billet.getUuid());
    variables.put("person", author);
    Integer nrUpdated = graphQLHelper.updateObject(admin,
        "mutation ($uuid: String!, $person: PersonInput!) { payload: putPersonInPosition (uuid: $uuid, person: $person) }",
        variables);
    assertThat(nrUpdated).isEqualTo(1);

    // Nick should kick the report
    submitted = graphQLHelper.updateObject(nick, "submitReport", "uuid", FIELDS, "String",
        r.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(submitted).isNotNull();

    // Report should now be up for review by EF1 approvers
    Report returned2 = graphQLHelper.getObjectById(jack, "report", FIELDS, r.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned2.getUuid()).isEqualTo(r.getUuid());
    assertThat(returned2.getState()).isEqualTo(Report.ReportState.PENDING_APPROVAL);
    assertThat(returned2.getApprovalStepUuid()).isNotEqualTo(returned.getApprovalStepUuid());
  }

  @Test
  public void reportEditTest() throws ExecutionException, InterruptedException {
    // Elizabeth writes a report about meeting with Roger
    final Person elizabeth = getElizabethElizawell();
    final Person roger = getRogerRogwell();
    final Person nick = getNickNicholson();
    final Person bob = getBobBobtown();

    // Fetch some objects from the DB that we'll use later.
    final LocationSearchQuery queryLocs = new LocationSearchQuery();
    queryLocs.setText("Police");
    final AnetBeanList<Location> locSearchResults =
        graphQLHelper.searchObjects(elizabeth, "locationList", "query", "LocationSearchQueryInput",
            "uuid", queryLocs, new TypeReference<GraphQlResponse<AnetBeanList<Location>>>() {});
    assertThat(locSearchResults).isNotNull();
    assertThat(locSearchResults.getList()).isNotEmpty();
    final Location loc = locSearchResults.getList().get(0);

    TaskSearchQuery queryTasks = new TaskSearchQuery();
    queryTasks.setText("Budgeting");
    final AnetBeanList<Task> taskSearchResults =
        graphQLHelper.searchObjects(elizabeth, "taskList", "query", "TaskSearchQueryInput",
            TASK_FIELDS, queryTasks, new TypeReference<GraphQlResponse<AnetBeanList<Task>>>() {});
    assertThat(taskSearchResults.getTotalCount()).isGreaterThan(2);

    Report r = new Report();
    r.setIntent("A Test Report to test editing reports");
    r.setAuthor(elizabeth);
    r.setAtmosphere(Atmosphere.POSITIVE);
    r.setAtmosphereDetails("it was a cold, cold day");
    r.setEngagementDate(Instant.now());
    r.setDuration(60);
    r.setKeyOutcomes("There were some key out comes summarized");
    r.setNextSteps("These are the next steps summarized");
    r.setReportText("This report was generated by ReportsResourceTest#reportEditTest");
    r.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(roger)));
    r.setTasks(ImmutableList.of(taskSearchResults.getList().get(0)));
    String returnedUuid = graphQLHelper.createObject(elizabeth, "createReport", "report",
        "ReportInput", r, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returnedUuid).isNotNull();
    Report returned = graphQLHelper.getObjectById(elizabeth, "report", FIELDS, returnedUuid,
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned.getUuid()).isNotNull();

    // Elizabeth edits the report (update locationUuid and text, addPerson, remove a Task)
    returned.setLocation(loc);
    // update HTML of report text
    returned.setReportText(UtilsTest.getCombinedTestCase().getInput());
    returned.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(roger),
        PersonTest.personToReportPerson(nick), PersonTest.personToPrimaryReportPerson(elizabeth)));
    returned.setTasks(ImmutableList.of());
    Report updated = graphQLHelper.updateObject(elizabeth, "updateReport", "report", FIELDS,
        "ReportInput", returned, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(updated).isNotNull();

    // Verify the report changed
    Report returned2 = graphQLHelper.getObjectById(elizabeth, "report", FIELDS, returned.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned2.getIntent()).isEqualTo(r.getIntent());
    assertThat(returned2.getLocationUuid()).isEqualTo(loc.getUuid());
    assertThat(returned2.getTasks()).isEmpty();
    final List<ReportPerson> returned2Attendees = returned2.getAttendees();
    assertThat(returned2Attendees).hasSize(3);
    assertThat(returned2Attendees.contains(roger));
    // check that HTML of report text is sanitized after update
    assertThat(returned2.getReportText()).isEqualTo(UtilsTest.getCombinedTestCase().getOutput());

    // Elizabeth submits the report
    Report submitted = graphQLHelper.updateObject(elizabeth, "submitReport", "uuid", FIELDS,
        "String", returned.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(submitted).isNotNull();
    Report returned3 = graphQLHelper.getObjectById(elizabeth, "report", FIELDS, returned.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned3.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

    // Bob gets the approval (EF1 Approvers)
    ReportSearchQuery pendingQuery = new ReportSearchQuery();
    pendingQuery.setPendingApprovalOf(bob.getUuid());
    AnetBeanList<Report> pendingBobsApproval =
        graphQLHelper.searchObjects(bob, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            pendingQuery, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(pendingBobsApproval.getList().stream()
        .anyMatch(rpt -> rpt.getUuid().equals(returned3.getUuid()))).isTrue();

    // Bob edits the report (change reportText, remove Person, add a Task)
    returned3.setReportText(r.getReportText() + ", edited by Bob!!");
    returned3.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(nick),
        PersonTest.personToPrimaryReportPerson(elizabeth)));
    returned3.setTasks(
        ImmutableList.of(taskSearchResults.getList().get(1), taskSearchResults.getList().get(2)));
    updated = graphQLHelper.updateObject(bob, "updateReport", "report", FIELDS, "ReportInput",
        returned3, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(updated).isNotNull();

    Report returned4 = graphQLHelper.getObjectById(elizabeth, "report", FIELDS, returned.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned4.getReportText()).endsWith("Bob!!");
    final List<ReportPerson> returned4Attendees = returned4.getAttendees();
    assertThat(returned4Attendees).hasSize(2);
    assertThat(returned4Attendees).contains(PersonTest.personToPrimaryReportPerson(nick));
    assertThat(returned4.getTasks()).hasSize(2);

    Report approved = graphQLHelper.updateObject(bob, "approveReport", "uuid", FIELDS, "String",
        returned.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(approved).isNotNull();
  }

  @Test
  public void searchTest() throws ExecutionException, InterruptedException {
    final Person jack = getJackJackson();
    final Person steve = getSteveSteveson();
    ReportSearchQuery query = new ReportSearchQuery();

    // Search based on report Text body
    query.setText("spreadsheet");
    AnetBeanList<Report> searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();

    // Search based on summary
    query.setText("Amherst");
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();

    // Search by Author
    query.setText(null);
    query.setAuthorUuid(jack.getUuid());
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream()
        .filter(r -> (r.getAuthorUuid().equals(jack.getUuid()))).count())
            .isEqualTo(searchResults.getList().size());
    final int numResults = searchResults.getList().size();

    // Search by Author with Date Filtering
    query.setEngagementDateStart(
        ZonedDateTime.of(2016, 6, 1, 0, 0, 0, 0, DaoUtils.getDefaultZoneId()).toInstant());
    query.setEngagementDateEnd(
        ZonedDateTime.of(2016, 6, 15, 0, 0, 0, 0, DaoUtils.getDefaultZoneId()).toInstant());
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().size()).isLessThan(numResults);

    // Search by Attendee
    query.setEngagementDateStart(null);
    query.setEngagementDateEnd(null);
    query.setAuthorUuid(null);
    query.setAttendeeUuid(steve.getUuid());
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream().filter(r -> {
      try {
        return r.getAttendees().stream().anyMatch(rp -> (rp.getUuid().equals(steve.getUuid())));
      } catch (Exception e) {
        fail("error", e);
        return false;
      }
    })).hasSameSizeAs(searchResults.getList());

    TaskSearchQuery queryTasks = new TaskSearchQuery();
    queryTasks.setText("1.1.A");
    final AnetBeanList<Task> taskResults =
        graphQLHelper.searchObjects(jack, "taskList", "query", "TaskSearchQueryInput", TASK_FIELDS,
            queryTasks, new TypeReference<GraphQlResponse<AnetBeanList<Task>>>() {});
    assertThat(taskResults).isNotNull();
    assertThat(taskResults.getList()).isNotEmpty();
    Task task = taskResults.getList().get(0);

    // Search by Task
    query.setAttendeeUuid(null);
    query.setTaskUuid(task.getUuid());
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
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
    OrganizationSearchQuery queryOrgs = new OrganizationSearchQuery();
    queryOrgs.setText("EF 1");
    queryOrgs.setType(OrganizationType.ADVISOR_ORG);
    AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(jack, "organizationList", "query",
        "OrganizationSearchQueryInput", ORGANIZATION_FIELDS, queryOrgs,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList().size()).isGreaterThan(0);
    Organization ef11 =
        orgs.getList().stream().filter(o -> o.getShortName().equals("EF 1.1")).findFirst().get();
    assertThat(ef11.getShortName()).isEqualToIgnoringCase("EF 1.1");

    query = new ReportSearchQuery();
    query.setAdvisorOrgUuid(ef11.getUuid());
    query.setIncludeAdvisorOrgChildren(false);
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
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
    queryOrgs = new OrganizationSearchQuery();
    queryOrgs.setText("ef 1");
    queryOrgs.setType(OrganizationType.ADVISOR_ORG);
    orgs = graphQLHelper.searchObjects(jack, "organizationList", "query",
        "OrganizationSearchQueryInput", ORGANIZATION_FIELDS, queryOrgs,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList().size()).isGreaterThan(0);
    Organization ef1 = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("ef 1")).findFirst().get();
    assertThat(ef1.getShortName()).isEqualToIgnoringCase("EF 1");

    query.setAdvisorOrgUuid(ef1.getUuid());
    query.setIncludeAdvisorOrgChildren(true);
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();
    // #TODO: figure out how to verify the results?

    // Check search for just an org, when we don't know if it's advisor or principal.
    query.setOrgUuid(ef11.getUuid());
    query.setAdvisorOrgUuid(null);
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
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
    final LocationSearchQuery queryLocs = new LocationSearchQuery();
    queryLocs.setText("Cabot");
    final AnetBeanList<Location> locSearchResults =
        graphQLHelper.searchObjects(jack, "locationList", "query", "LocationSearchQueryInput",
            "uuid", queryLocs, new TypeReference<GraphQlResponse<AnetBeanList<Location>>>() {});
    assertThat(locSearchResults).isNotNull();
    assertThat(locSearchResults.getList()).isNotEmpty();
    Location cabot = locSearchResults.getList().get(0);

    query = new ReportSearchQuery();
    query.setLocationUuid(cabot.getUuid());
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(
        searchResults.getList().stream().filter(r -> r.getLocationUuid().equals(cabot.getUuid())))
            .hasSameSizeAs(searchResults.getList());

    // Search by Status.
    query.setLocationUuid(null);
    query.setState(ImmutableList.of(ReportState.CANCELLED));
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();
    final int numCancelled = searchResults.getTotalCount();

    query.setState(ImmutableList.of(ReportState.CANCELLED, ReportState.PUBLISHED));
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getTotalCount()).isGreaterThan(numCancelled);

    queryOrgs = new OrganizationSearchQuery();
    queryOrgs.setText("Defense");
    queryOrgs.setType(OrganizationType.PRINCIPAL_ORG);
    orgs = graphQLHelper.searchObjects(jack, "organizationList", "query",
        "OrganizationSearchQueryInput", ORGANIZATION_FIELDS, queryOrgs,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList().size()).isGreaterThan(0);
    Organization mod = orgs.getList().stream().filter(o -> o.getShortName().equalsIgnoreCase("MoD"))
        .findFirst().get();
    assertThat(mod.getShortName()).isEqualToIgnoringCase("MoD");

    // Search by Principal Organization
    query.setState(null);
    query.setPrincipalOrgUuid(mod.getUuid());
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
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
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();
    // TODO: figure out how to verify the results?

    query = new ReportSearchQuery();
    query.setText("spreadsheet");
    query.setSortBy(ReportSearchSortBy.ENGAGEMENT_DATE);
    query.setSortOrder(SortOrder.ASC);
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    Instant prev = Instant.ofEpochMilli(0L);
    for (Report res : searchResults.getList()) {
      assertThat(res.getEngagementDate()).isAfter(prev);
      prev = res.getEngagementDate();
    }

    // Search for report text with stopwords
    query = new ReportSearchQuery();
    query.setText("Hospital usage of Drugs");
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getIntent().contains("Hospital usage of Drugs")).count()).isGreaterThan(0);

    /// find EF 2.2
    queryOrgs = new OrganizationSearchQuery();
    queryOrgs.setText("ef 2.2");
    queryOrgs.setType(OrganizationType.ADVISOR_ORG);
    orgs = graphQLHelper.searchObjects(jack, "organizationList", "query",
        "OrganizationSearchQueryInput", ORGANIZATION_FIELDS, queryOrgs,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList().size()).isGreaterThan(0);
    Organization ef22 = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("ef 2.2")).findFirst().get();
    assertThat(ef22.getShortName()).isEqualToIgnoringCase("EF 2.2");


    // Search for a report by both principal AND advisor orgs.
    query = new ReportSearchQuery();
    query.setAdvisorOrgUuid(mod.getUuid());
    query.setPrincipalOrgUuid(ef22.getUuid());
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getAdvisorOrgUuid().equals(ef22.getUuid())
            && r.getPrincipalOrgUuid().equals(mod.getUuid()))
        .count()).isEqualTo(searchResults.getList().size());

    // this might fail if there are any children of ef22 or mod, but there aren't in the base data
    // set.
    query.setIncludeAdvisorOrgChildren(true);
    query.setIncludePrincipalOrgChildren(true);
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getAdvisorOrgUuid().equals(ef22.getUuid())
            && r.getPrincipalOrgUuid().equals(mod.getUuid()))
        .count()).isEqualTo(searchResults.getList().size());

    // Search by Atmosphere
    query = new ReportSearchQuery();
    query.setAtmosphere(Atmosphere.NEGATIVE);
    searchResults =
        graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList().stream()
        .filter(r -> r.getAtmosphere().equals(Atmosphere.NEGATIVE)).count())
            .isEqualTo(searchResults.getList().size());
  }

  @Test
  public void searchAuthorizationGroupUuid() {
    // Search by empty list of authorization groups should not return reports
    ReportSearchQuery query = new ReportSearchQuery();
    query.setAuthorizationGroupUuid(Collections.emptyList());
    AnetBeanList<Report> searchResults =
        graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(searchResults.getList()).isEmpty();

    // Search by list of authorization groups
    final List<String> agUuids = Arrays.asList("1", "2", "3"); // FIXME: use real uuid's
    final Set<String> agUuidSet = new HashSet<String>(agUuids);
    query = new ReportSearchQuery();
    query.setAuthorizationGroupUuid(agUuids);
    final List<Report> reportList =
        graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {}).getList();

    for (final Report report : reportList) {
      assertThat(report.loadAuthorizationGroups()).isNotNull();
      assertThat(report.getAuthorizationGroups()).isNotEmpty();
      final Set<String> collect = report.getAuthorizationGroups().stream().map(ag -> ag.getUuid())
          .collect(Collectors.toSet());
      collect.retainAll(agUuidSet);
      assertThat(collect).isNotEmpty();
    }
  }

  @Test
  public void searchUpdatedAtStartAndEndTest() {
    // insertBaseData has 1 report that is updatedAt 2 days before current timestamp
    final ReportSearchQuery query = new ReportSearchQuery();
    final Instant startDate =
        Instant.now().atZone(DaoUtils.getDefaultZoneId()).minusDays(3).toInstant();
    final Instant endDate =
        Instant.now().atZone(DaoUtils.getDefaultZoneId()).minusDays(1).toInstant();

    // Greater than startDate and smaller than endDate
    query.setUpdatedAtStart(startDate);
    query.setUpdatedAtEnd(endDate);
    query.setPageSize(0);
    AnetBeanList<Report> results =
        graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(results.getList().size()).isEqualTo(1);
    Instant actualReportDate = results.getList().get(0).getUpdatedAt();

    // Greater than startDate and equal to endDate
    query.setUpdatedAtStart(startDate);
    query.setUpdatedAtEnd(actualReportDate);
    results = graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput",
        FIELDS, query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(results.getList().size()).isEqualTo(1);

    // Equal to startDate and smaller than endDate
    query.setUpdatedAtStart(actualReportDate);
    query.setUpdatedAtEnd(endDate);
    results = graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput",
        FIELDS, query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(results.getList().size()).isEqualTo(1);

    // Equal to startDate and equal to endDate
    query.setUpdatedAtStart(actualReportDate);
    query.setUpdatedAtEnd(actualReportDate);
    results = graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput",
        FIELDS, query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(results.getList().size()).isEqualTo(1);

    // A day before the startDate and startDate (no results expected)
    query.setUpdatedAtStart(startDate.atZone(DaoUtils.getDefaultZoneId()).minusDays(1).toInstant());
    query.setUpdatedAtEnd(startDate);
    query.setPageSize(0);
    results = graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput",
        FIELDS, query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(results.getList().size()).isEqualTo(0);
  }

  @Test
  public void searchByAuthorPosition() {
    final ReportSearchQuery query = new ReportSearchQuery();
    final Position adminPos = admin.loadPosition();
    query.setAuthorPositionUuid(adminPos.getUuid());

    // Search by author position
    final AnetBeanList<Report> results =
        graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(results).isNotNull();
    assertThat(results.getList().size()).isGreaterThan(0);
  }


  @Test
  public void searchAttendeePosition() {
    final ReportSearchQuery query = new ReportSearchQuery();
    final Position adminPos = admin.loadPosition();
    query.setAttendeePositionUuid(adminPos.getUuid());

    // Search by attendee position
    final AnetBeanList<Report> results =
        graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(results).isNotNull();
    assertThat(results.getList().size()).isGreaterThan(0);
  }

  @Test
  public void reportDeleteTest() {
    final Person jack = getJackJackson();
    final Person liz = getElizabethElizawell();
    final Person roger = getRogerRogwell();

    List<ReportPerson> attendees = ImmutableList.of(PersonTest.personToPrimaryReportPerson(roger),
        PersonTest.personToReportPerson(jack), PersonTest.personToPrimaryReportPerson(liz));

    // Write a report as that person
    Report r = new Report();
    r.setAuthor(liz);
    r.setIntent("This is a report that should be deleted");
    r.setAtmosphere(Atmosphere.NEUTRAL);
    r.setAttendees(attendees);
    r.setReportText("I'm writing a report that I intend to delete very soon.");
    r.setKeyOutcomes("Summary for the key outcomes");
    r.setNextSteps("Summary for the next steps");
    r.setEngagementDate(Instant.now());
    r.setDuration(15);
    String ruuid = graphQLHelper.createObject(liz, "createReport", "report", "ReportInput", r,
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(ruuid).isNotNull();
    r = graphQLHelper.getObjectById(liz, "report", FIELDS, ruuid,
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(r.getUuid()).isNotNull();

    // Try to delete by jack, this should fail.
    try {
      graphQLHelper.deleteObject(jack, "deleteReport", r.getUuid());
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Now have the author delete this report.
    final Integer nrDeleted = graphQLHelper.deleteObject(liz, "deleteReport", r.getUuid());
    assertThat(nrDeleted).isEqualTo(1);

    // Assert the report is gone.
    try {
      graphQLHelper.getObjectById(liz, "report", FIELDS, r.getUuid(),
          new TypeReference<GraphQlResponse<Report>>() {});
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }
  }

  @Test
  public void reportCancelTest() {
    final Person liz = getElizabethElizawell(); // Report Author
    final Person steve = getSteveSteveson(); // Principal
    final Person bob = getBobBobtown(); // Report Approver

    // Liz was supposed to meet with Steve, but he cancelled.

    Report r = new Report();
    r.setIntent("Meet with Steve about a thing we never got to talk about");
    r.setEngagementDate(Instant.now());
    r.setDuration(45);
    r.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(liz),
        PersonTest.personToPrimaryReportPerson(steve)));
    r.setCancelledReason(ReportCancelledReason.CANCELLED_BY_PRINCIPAL);

    String savedUuid = graphQLHelper.createObject(liz, "createReport", "report", "ReportInput", r,
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(savedUuid).isNotNull();
    Report saved = graphQLHelper.getObjectById(liz, "report", FIELDS, savedUuid,
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(saved.getUuid()).isNotNull();

    Report submitted = graphQLHelper.updateObject(liz, "submitReport", "uuid", FIELDS, "String",
        saved.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(submitted).isNotNull();
    Report returned = graphQLHelper.getObjectById(liz, "report", FIELDS, saved.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
    assertThat(returned.getCancelledReason())
        .isEqualTo(ReportCancelledReason.CANCELLED_BY_PRINCIPAL);

    // Bob gets the approval (EF1 Approvers)
    ReportSearchQuery pendingQuery = new ReportSearchQuery();
    pendingQuery.setPendingApprovalOf(bob.getUuid());
    AnetBeanList<Report> pendingBobsApproval =
        graphQLHelper.searchObjects(bob, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            pendingQuery, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(pendingBobsApproval.getList().stream()
        .anyMatch(rpt -> rpt.getUuid().equals(returned.getUuid()))).isTrue();

    // Bob should approve this report.
    Report approved = graphQLHelper.updateObject(bob, "approveReport", "uuid", FIELDS, "String",
        saved.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(approved).isNotNull();

    // Ensure it went to cancelled status.
    Report returned2 = graphQLHelper.getObjectById(liz, "report", FIELDS, saved.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned2.getState()).isEqualTo(ReportState.CANCELLED);
  }

  @Test
  public void dailyRollupGraphNonReportingTest() throws ExecutionException, InterruptedException {
    Person steve = getSteveSteveson();

    Report r = new Report();
    r.setAuthor(admin);
    r.setIntent("Test the Daily rollup graph");
    r.setNextSteps("Check for a change in the rollup graph");
    r.setKeyOutcomes("Foobar the bazbiz");
    r.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(admin),
        PersonTest.personToPrimaryReportPerson(steve)));
    String ruuid = graphQLHelper.createObject(admin, "createReport", "report", "ReportInput", r,
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(ruuid).isNotNull();
    r = graphQLHelper.getObjectById(admin, "report", FIELDS, ruuid,
        new TypeReference<GraphQlResponse<Report>>() {});

    // Pull the daily rollup graph
    Instant startDate = Instant.now().atZone(DaoUtils.getDefaultZoneId()).minusDays(1).toInstant();
    Instant endDate = Instant.now().atZone(DaoUtils.getDefaultZoneId()).plusDays(1).toInstant();
    final Map<String, Object> variables = new HashMap<>();
    variables.put("startDate", startDate.toEpochMilli());
    variables.put("endDate", endDate.toEpochMilli());
    final List<RollupGraph> startGraph = graphQLHelper.getObjectList(admin,
        "query ($startDate: Long!, $endDate: Long!) { payload: rollupGraph(startDate: $startDate, endDate: $endDate) { org {"
            + ORGANIZATION_FIELDS + "} published cancelled } }",
        variables, new TypeReference<GraphQlResponse<List<RollupGraph>>>() {});

    // Submit the report
    try {
      graphQLHelper.updateObject(admin, "submitReport", "uuid", FIELDS, "String", r.getUuid(),
          new TypeReference<GraphQlResponse<Report>>() {});
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }

    // Oops set the engagementDate.
    r.setEngagementDate(Instant.now());
    r.setDuration(50);
    Report updated = graphQLHelper.updateObject(admin, "updateReport", "report", FIELDS,
        "ReportInput", r, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(updated).isNotNull();

    // Re-submit the report, it should work.
    Report submitted = graphQLHelper.updateObject(admin, "submitReport", "uuid", FIELDS, "String",
        r.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(submitted).isNotNull();

    // Admin can approve his own reports.
    Report approved = graphQLHelper.updateObject(admin, "approveReport", "uuid", FIELDS, "String",
        r.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(approved).isNotNull();

    // Verify report is in APPROVED state.
    r = graphQLHelper.getObjectById(admin, "report", FIELDS, r.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(r.getState()).isEqualTo(ReportState.APPROVED);

    // Admin can publish approved reports.
    Report published = graphQLHelper.updateObject(admin, "publishReport", "uuid", FIELDS, "String",
        r.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(published).isNotNull();

    // Verify report is in PUBLISHED state.
    r = graphQLHelper.getObjectById(admin, "report", FIELDS, r.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(r.getState()).isEqualTo(ReportState.PUBLISHED);

    // Check on the daily rollup graph now.
    final List<RollupGraph> endGraph = graphQLHelper.getObjectList(admin,
        "query ($startDate: Long!, $endDate: Long!) { payload: rollupGraph(startDate: $startDate, endDate: $endDate) { org {"
            + ORGANIZATION_FIELDS + "} published cancelled } }",
        variables, new TypeReference<GraphQlResponse<List<RollupGraph>>>() {});

    final Position pos = admin.loadPosition();
    final Organization org = pos.loadOrganization(context).get();
    @SuppressWarnings("unchecked")
    final List<String> nro =
        (List<String>) RULE.getConfiguration().getDictionaryEntry("non_reporting_ORGs");
    // Admin's organization should have one more report PUBLISHED only if it is not in the
    // non-reporting orgs
    final int diff = (nro == null || !nro.contains(org.getShortName())) ? 1 : 0;
    final String orgUuid = org.getUuid();
    Optional<RollupGraph> orgReportsStart = startGraph.stream()
        .filter(rg -> rg.getOrg() != null && rg.getOrg().getUuid().equals(orgUuid)).findFirst();
    final int startCt = orgReportsStart.isPresent() ? (orgReportsStart.get().getPublished()) : 0;
    Optional<RollupGraph> orgReportsEnd = endGraph.stream()
        .filter(rg -> rg.getOrg() != null && rg.getOrg().getUuid().equals(orgUuid)).findFirst();
    final int endCt = orgReportsEnd.isPresent() ? (orgReportsEnd.get().getPublished()) : 0;
    assertThat(startCt).isEqualTo(endCt - diff);
  }

  @Test
  public void dailyRollupGraphReportingTest() throws ExecutionException, InterruptedException {
    final Person elizabeth = getElizabethElizawell();
    final Person bob = getBobBobtown();
    Person steve = getSteveSteveson();

    Report r = new Report();
    r.setAuthor(elizabeth);
    r.setIntent("Test the Daily rollup graph");
    r.setNextSteps("Check for a change in the rollup graph");
    r.setKeyOutcomes("Foobar the bazbiz");
    r.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(elizabeth),
        PersonTest.personToPrimaryReportPerson(steve)));
    String ruuid = graphQLHelper.createObject(elizabeth, "createReport", "report", "ReportInput", r,
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(ruuid).isNotNull();
    r = graphQLHelper.getObjectById(elizabeth, "report", FIELDS, ruuid,
        new TypeReference<GraphQlResponse<Report>>() {});

    // Pull the daily rollup graph
    Instant startDate = Instant.now().atZone(DaoUtils.getDefaultZoneId()).minusDays(1).toInstant();
    Instant endDate = Instant.now().atZone(DaoUtils.getDefaultZoneId()).plusDays(1).toInstant();
    final Map<String, Object> variables = new HashMap<>();
    variables.put("startDate", startDate.toEpochMilli());
    variables.put("endDate", endDate.toEpochMilli());
    final List<RollupGraph> startGraph = graphQLHelper.getObjectList(elizabeth,
        "query ($startDate: Long!, $endDate: Long!) { payload: rollupGraph(startDate: $startDate, endDate: $endDate) { org {"
            + ORGANIZATION_FIELDS + "} published cancelled } }",
        variables, new TypeReference<GraphQlResponse<List<RollupGraph>>>() {});

    // Submit the report
    try {
      graphQLHelper.updateObject(elizabeth, "submitReport", "uuid", FIELDS, "String", r.getUuid(),
          new TypeReference<GraphQlResponse<Report>>() {});
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }

    // Oops set the engagementDate.
    r.setEngagementDate(Instant.now());
    r.setDuration(115);
    Report updated = graphQLHelper.updateObject(elizabeth, "updateReport", "report", FIELDS,
        "ReportInput", r, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(updated).isNotNull();

    // Re-submit the report, it should work.
    Report submitted = graphQLHelper.updateObject(elizabeth, "submitReport", "uuid", FIELDS,
        "String", r.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(submitted).isNotNull();

    // Approve report.
    Report approved = graphQLHelper.updateObject(bob, "approveReport", "uuid", FIELDS, "String",
        r.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(approved).isNotNull();

    // Verify report is in APPROVED state.
    r = graphQLHelper.getObjectById(elizabeth, "report", FIELDS, r.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(r.getState()).isEqualTo(ReportState.APPROVED);

    // Admin can publish approved reports.
    Report published = graphQLHelper.updateObject(admin, "publishReport", "uuid", FIELDS, "String",
        r.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(published).isNotNull();

    // Verify report is in PUBLISHED state.
    r = graphQLHelper.getObjectById(elizabeth, "report", FIELDS, r.getUuid(),
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(r.getState()).isEqualTo(ReportState.PUBLISHED);

    // Check on the daily rollup graph now.
    final List<RollupGraph> endGraph = graphQLHelper.getObjectList(elizabeth,
        "query ($startDate: Long!, $endDate: Long!) { payload: rollupGraph(startDate: $startDate, endDate: $endDate) { org {"
            + ORGANIZATION_FIELDS + "} published cancelled } }",
        variables, new TypeReference<GraphQlResponse<List<RollupGraph>>>() {});

    final Position pos = elizabeth.loadPosition();
    final Organization org = pos.loadOrganization(context).get();
    @SuppressWarnings("unchecked")
    final List<String> nro =
        (List<String>) RULE.getConfiguration().getDictionaryEntry("non_reporting_ORGs");
    // Elizabeth's organization should have one more report PUBLISHED only if it is not in the
    // non-reporting orgs
    final int diff = (nro == null || !nro.contains(org.getShortName())) ? 1 : 0;
    final Organization po = org.loadParentOrg(context).get();
    final String orgUuid = po.getUuid();
    Optional<RollupGraph> orgReportsStart = startGraph.stream()
        .filter(rg -> rg.getOrg() != null && rg.getOrg().getUuid().equals(orgUuid)).findFirst();
    final int startCt = orgReportsStart.isPresent() ? (orgReportsStart.get().getPublished()) : 0;
    Optional<RollupGraph> orgReportsEnd = endGraph.stream()
        .filter(rg -> rg.getOrg() != null && rg.getOrg().getUuid().equals(orgUuid)).findFirst();
    final int endCt = orgReportsEnd.isPresent() ? (orgReportsEnd.get().getPublished()) : 0;
    assertThat(startCt).isEqualTo(endCt - diff);
  }

  @Test
  public void testTagSearch() throws InterruptedException, ExecutionException {
    final ReportSearchQuery tagQuery = new ReportSearchQuery();
    tagQuery.setText("bribery");
    final AnetBeanList<Report> taggedReportList =
        graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput", FIELDS,
            tagQuery, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(taggedReportList).isNotNull();
    final List<Report> taggedReports = taggedReportList.getList();
    for (Report rpt : taggedReports) {
      final List<Tag> tags = rpt.getTags();
      assertThat(tags).isNotNull();
      assertThat(tags.stream().filter(o -> o.getName().equals("bribery"))).isNotEmpty();
    }
  }

  @Test
  public void testSensitiveInformationByAuthor() throws ExecutionException, InterruptedException {
    final String rsiFields = FIELDS + " reportSensitiveInformation { uuid text }";
    final Person elizabeth = getElizabethElizawell();
    final Report r = new Report();
    r.setAuthor(elizabeth);
    r.setReportText(
        "This reportTest was generated by ReportsResourceTest#testSensitiveInformation");
    final ReportSensitiveInformation rsi = new ReportSensitiveInformation();
    // set HTML of report sensitive information
    rsi.setText(UtilsTest.getCombinedTestCase().getInput());
    r.setReportSensitiveInformation(rsi);
    String returnedUuid = graphQLHelper.createObject(elizabeth, "createReport", "report",
        "ReportInput", r, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returnedUuid).isNotNull();
    Report returned = graphQLHelper.getObjectById(elizabeth, "report", rsiFields, returnedUuid,
        new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned.getUuid()).isNotNull();
    // elizabeth should be allowed to see it returned, as she's the author
    assertThat(returned.getReportSensitiveInformation()).isNotNull();
    // check that HTML of report sensitive information is sanitized after create
    assertThat(returned.getReportSensitiveInformation().getText())
        .isEqualTo(UtilsTest.getCombinedTestCase().getOutput());

    final Report returned2 = graphQLHelper.getObjectById(elizabeth, "report", rsiFields,
        returned.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    // elizabeth should be allowed to see it
    returned2.setUser(elizabeth);
    assertThat(returned2.getReportSensitiveInformation()).isNotNull();
    assertThat(returned2.getReportSensitiveInformation().getText())
        .isEqualTo(UtilsTest.getCombinedTestCase().getOutput());

    // update HTML of report sensitive information
    returned2.getReportSensitiveInformation().setText(UtilsTest.getCombinedTestCase().getInput());
    Report updated = graphQLHelper.updateObject(elizabeth, "updateReport", "report", rsiFields,
        "ReportInput", returned2, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(updated).isNotNull();
    assertThat(updated.getReportSensitiveInformation()).isNotNull();
    // check that HTML of report sensitive information is sanitized after update
    assertThat(updated.getReportSensitiveInformation().getText())
        .isEqualTo(UtilsTest.getCombinedTestCase().getOutput());

    final Person jack = getJackJackson();
    final Report returned3 = graphQLHelper.getObjectById(jack, "report", rsiFields,
        returned.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    // jack should not be allowed to see it
    returned3.setUser(jack);
    assertThat(returned3.getReportSensitiveInformation()).isNull();
  }

  @Test
  public void testSensitiveInformationByAuthorizationGroup()
      throws ExecutionException, InterruptedException {
    final PersonSearchQuery erinQuery = new PersonSearchQuery();
    erinQuery.setText("erin");
    final AnetBeanList<Person> erinSearchResults = graphQLHelper.searchObjects(admin, "personList",
        "query", "PersonSearchQueryInput", PERSON_FIELDS, erinQuery,
        new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(erinSearchResults.getTotalCount()).isGreaterThan(0);
    final Optional<Person> erinResult = erinSearchResults.getList().stream()
        .filter(p -> p.getName().equals("ERINSON, Erin")).findFirst();
    assertThat(erinResult).isNotEmpty();
    final Person erin = erinResult.get();

    final ReportSearchQuery reportQuery = new ReportSearchQuery();
    reportQuery.setText("Test Cases are good");
    // otherwise test-case-created data can crowd the actual report we want out of the first page
    reportQuery.setSortOrder(SortOrder.ASC);
    final AnetBeanList<Report> reportSearchResults = graphQLHelper.searchObjects(erin, "reportList",
        "query", "ReportSearchQueryInput", FIELDS + " reportSensitiveInformation { text }",
        reportQuery, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(reportSearchResults.getTotalCount()).isGreaterThan(0);
    final Optional<Report> reportResult = reportSearchResults.getList().stream()
        .filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
    assertThat(reportResult).isNotEmpty();
    final Report report = reportResult.get();
    report.setUser(erin);
    // erin is the author, so should be able to see the sensitive information
    assertThat(report.getReportSensitiveInformation()).isNotNull();
    assertThat(report.getReportSensitiveInformation().getText()).isEqualTo("Need to know only");

    final PersonSearchQuery reinaQuery = new PersonSearchQuery();
    reinaQuery.setText("reina");
    final AnetBeanList<Person> searchResults = graphQLHelper.searchObjects(admin, "personList",
        "query", "PersonSearchQueryInput", PERSON_FIELDS, reinaQuery,
        new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(searchResults.getTotalCount()).isGreaterThan(0);
    final Optional<Person> reinaResult = searchResults.getList().stream()
        .filter(p -> p.getName().equals("REINTON, Reina")).findFirst();
    assertThat(reinaResult).isNotEmpty();
    final Person reina = reinaResult.get();

    final AnetBeanList<Report> reportSearchResults2 =
        graphQLHelper.searchObjects(reina, "reportList", "query", "ReportSearchQueryInput",
            FIELDS + " reportSensitiveInformation { text }", reportQuery,
            new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(reportSearchResults2.getTotalCount()).isGreaterThan(0);
    final Optional<Report> reportResult2 = reportSearchResults2.getList().stream()
        .filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
    assertThat(reportResult2).isNotEmpty();
    final Report report2 = reportResult2.get();
    report2.setUser(reina);
    // reina is in the authorization group, so should be able to see the sensitive information
    assertThat(report2.getReportSensitiveInformation()).isNotNull();
    assertThat(report2.getReportSensitiveInformation().getText()).isEqualTo("Need to know only");

    final PersonSearchQuery elizabethQuery = new PersonSearchQuery();
    elizabethQuery.setText("elizabeth");
    final AnetBeanList<Person> searchResults3 = graphQLHelper.searchObjects(admin, "personList",
        "query", "PersonSearchQueryInput", PERSON_FIELDS, elizabethQuery,
        new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(searchResults3.getTotalCount()).isGreaterThan(0);
    final Optional<Person> elizabethResult3 = searchResults3.getList().stream()
        .filter(p -> p.getName().equals("ELIZAWELL, Elizabeth")).findFirst();
    assertThat(elizabethResult3).isNotEmpty();
    final Person elizabeth = elizabethResult3.get();

    final AnetBeanList<Report> reportSearchResults3 =
        graphQLHelper.searchObjects(elizabeth, "reportList", "query", "ReportSearchQueryInput",
            FIELDS + " reportSensitiveInformation { text }", reportQuery,
            new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(reportSearchResults3.getTotalCount()).isGreaterThan(0);
    final Optional<Report> reportResult3 = reportSearchResults3.getList().stream()
        .filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
    assertThat(reportResult3).isNotEmpty();
    final Report report3 = reportResult3.get();
    report3.setUser(elizabeth);
    // elizabeth is not in the authorization group, so should not be able to see the sensitive
    // information
    assertThat(report3.getReportSensitiveInformation()).isNull();
  }

  private ReportSearchQuery setupQueryEngagementDayOfWeek() {
    final ReportSearchQuery query = new ReportSearchQuery();
    query.setState(ImmutableList.of(ReportState.PUBLISHED));
    return query;
  }

  private AnetBeanList<Report> runSearchQuery(ReportSearchQuery query) {
    return graphQLHelper.searchObjects(admin, "reportList", "query", "ReportSearchQueryInput",
        FIELDS, query, new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
  }

  @Test
  public void testEngagementDayOfWeekNotIncludedInResults() {
    final ReportSearchQuery query = setupQueryEngagementDayOfWeek();
    final AnetBeanList<Report> reportResults = runSearchQuery(query);

    assertThat(reportResults).isNotNull();

    final List<Report> reports = reportResults.getList();
    for (Report rpt : reports) {
      assertThat(rpt.getEngagementDayOfWeek()).isNull();
    }
  }

  @Test
  public void testEngagementDayOfWeekIncludedInResults() {
    final ReportSearchQuery query = setupQueryEngagementDayOfWeek();
    query.setIncludeEngagementDayOfWeek(true);

    final AnetBeanList<Report> reportResults = runSearchQuery(query);
    assertThat(reportResults).isNotNull();

    final List<Integer> daysOfWeek = Arrays.asList(1, 2, 3, 4, 5, 6, 7);
    final List<Report> reports = reportResults.getList();
    for (Report rpt : reports) {
      assertThat(rpt.getEngagementDayOfWeek()).isIn(daysOfWeek);
    }
  }

  @Test
  public void testSetEngagementDayOfWeek() {
    final ReportSearchQuery query = setupQueryEngagementDayOfWeek();
    query.setEngagementDayOfWeek(1);
    query.setIncludeEngagementDayOfWeek(true);

    final AnetBeanList<Report> reportResults = runSearchQuery(query);
    assertThat(reportResults).isNotNull();

    final List<Report> reports = reportResults.getList();
    for (Report rpt : reports) {
      assertThat(rpt.getEngagementDayOfWeek()).isEqualTo(1);
    }
  }

  @Test
  public void testSetEngagementDayOfWeekOutsideWeekRange() {
    final ReportSearchQuery query = setupQueryEngagementDayOfWeek();
    query.setEngagementDayOfWeek(0);
    query.setIncludeEngagementDayOfWeek(true);

    final AnetBeanList<Report> reportResults = runSearchQuery(query);
    assertThat(reportResults).isNotNull();

    final List<Report> reports = reportResults.getList();
    assertThat(reports.size()).isEqualTo(0);
  }

  @Test
  public void testAdvisorReportInsightsSuperUser() {
    advisorReportInsights(getSuperUser());
  }

  @Test
  public void testAdvisorReportInsightsRegularUser() {
    advisorReportInsights(getRegularUser());
  }

  private void advisorReportInsights(final Person user) {
    final Position position = user.getPosition();
    final boolean isSuperUser = position.getType() == PositionType.SUPER_USER;
    try {
      final List<AdvisorReportsEntry> advisorReports = graphQLHelper.getObjectList(user,
          "query { payload: advisorReportInsights { uuid name stats { week nrReportsSubmitted nrEngagementsAttended } } }",
          null, new TypeReference<GraphQlResponse<List<AdvisorReportsEntry>>>() {});
      if (isSuperUser) {
        assertThat(advisorReports).isNotNull();
        assertThat(advisorReports.size()).isGreaterThan(0);
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isSuperUser) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

}
