package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.invoke.MethodHandles;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.joda.time.DateTime;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;

import io.dropwizard.client.JerseyClientBuilder;
import io.dropwizard.util.Duration;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Poam;
import mil.dds.anet.beans.Poam.PoamStatus;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.LocationList;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.OrganizationList;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.PersonList;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.PoamList;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.ReportList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery.ReportSearchSortBy;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.test.beans.OrganizationTest;
import mil.dds.anet.test.beans.PersonTest;
import mil.dds.anet.views.AbstractAnetBean.LoadLevel;

public class ReportsResourceTest extends AbstractResourceTest {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	public ReportsResourceTest() {
		if (client == null) {
			config.setConnectionRequestTimeout(Duration.seconds(30L));
			config.setConnectionTimeout(Duration.seconds(30L));
			config.setTimeout(Duration.seconds(30L));
			client = new JerseyClientBuilder(RULE.getEnvironment()).using(config).build("reports test client");
		}
	}

	@Test
	public void createReport() {
		//Create a report writer
		final Person author = getJackJackson();

		//Create a principal for the report
		ReportPerson principal = PersonTest.personToReportPerson(getSteveSteveson());
		principal.setPrimary(true);
		Position principalPosition = principal.loadPosition();
		assertThat(principalPosition).isNotNull();
		Organization principalOrg = principalPosition.loadOrganization();
		assertThat(principalOrg).isNotNull();

		//Create an Advising Organization for the report writer
		final Organization advisorOrg = httpQuery("/api/organizations/new", admin)
				.post(Entity.json(OrganizationTest.getTestAO(true)), Organization.class);

		//Create leadership people in the AO who can approve this report
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
		approver1Pos = httpQuery("/api/positions/new", admin)
				.post(Entity.json(approver1Pos), Position.class);
		Response resp = httpQuery("/api/positions/" + approver1Pos.getId() + "/person", admin).post(Entity.json(approver1));
		assertThat(resp.getStatus()).isEqualTo(200);

		Position approver2Pos = new Position();
		approver2Pos.setName("Test Approver 2 Position");
		approver2Pos.setOrganization(advisorOrg);
		approver2Pos.setType(PositionType.SUPER_USER);
		approver2Pos.setStatus(PositionStatus.ACTIVE);
		approver2Pos = httpQuery("/api/positions/new", admin)
				.post(Entity.json(approver1Pos), Position.class);
		resp = httpQuery("/api/positions/" + approver2Pos.getId() + "/person", admin).post(Entity.json(approver2));
		assertThat(resp.getStatus()).isEqualTo(200);

		//Create a billet for the author
		Position authorBillet = new Position();
		authorBillet.setName("A report writer");
		authorBillet.setType(PositionType.ADVISOR);
		authorBillet.setOrganization(advisorOrg);
		authorBillet.setStatus(PositionStatus.ACTIVE);
		authorBillet = httpQuery("/api/positions/new", admin).post(Entity.json(authorBillet), Position.class);
		assertThat(authorBillet.getId()).isNotNull();

		//Set this author in this billet
		resp = httpQuery(String.format("/api/positions/%d/person", authorBillet.getId()), admin).post(Entity.json(author));
		assertThat(resp.getStatus()).isEqualTo(200);

		//Create Approval workflow for Advising Organization
		ApprovalStep approval = new ApprovalStep();
		approval.setName("Test Group for Approving");
		approval.setAdvisorOrganizationId(advisorOrg.getId());
		approval.setApprovers(ImmutableList.of(approver1Pos));

		approval = httpQuery("/api/approvalSteps/new", admin)
				.post(Entity.json(approval), ApprovalStep.class);
		assertThat(approval.getId()).isNotNull();

		//Adding a new approval step to an AO automatically puts it at the end of the approval process.
		ApprovalStep releaseApproval = new ApprovalStep();
		releaseApproval.setName("Test Group of Releasers");
		releaseApproval.setAdvisorOrganizationId(advisorOrg.getId());
		releaseApproval.setApprovers(ImmutableList.of(approver2Pos));
		releaseApproval = httpQuery("/api/approvalSteps/new", admin)
				.post(Entity.json(releaseApproval), ApprovalStep.class);
		assertThat(releaseApproval.getId()).isNotNull();

		//Pull the approval workflow for this AO
		List<ApprovalStep> steps = httpQuery("/api/approvalSteps/byOrganization?orgId=" + advisorOrg.getId(), admin)
				.get(new GenericType<List<ApprovalStep>>() {});
		assertThat(steps.size()).isEqualTo(2);
		assertThat(steps.get(0).getId()).isEqualTo(approval.getId());
		assertThat(steps.get(0).getNextStepId()).isEqualTo(releaseApproval.getId());
		assertThat(steps.get(1).getId()).isEqualTo(releaseApproval.getId());

		//Ensure the approver is an approver
		assertThat(approver1Pos.loadIsApprover()).isTrue();
		
		//Create some poams for this organization
		Poam top = httpQuery("/api/poams/new", admin)
				.post(Entity.json(Poam.create("test-1", "Test Top Poam", "TOP", null, advisorOrg, PoamStatus.ACTIVE)), Poam.class);
		Poam action = httpQuery("/api/poams/new", admin)
				.post(Entity.json(Poam.create("test-1-1", "Test Poam Action", "Action", top, null, PoamStatus.ACTIVE)), Poam.class);

		//Create a Location that this Report was written at
		Location loc = httpQuery("/api/locations/new", admin)
				.post(Entity.json(Location.create("The Boat Dock", 1.23,4.56)), Location.class);

		//Write a Report
		Report r = new Report();
		r.setAuthor(author);
		r.setEngagementDate(DateTime.now());
		r.setAttendees(Lists.newArrayList(principal));
		r.setPoams(Lists.newArrayList(action));
		r.setLocation(loc);
		r.setAtmosphere(Atmosphere.POSITIVE);
		r.setAtmosphereDetails("Eerybody was super nice!");
		r.setIntent("A testing report to test that reporting reports");
		r.setReportText("Report Text goes here, asdfjk");
		r.setNextSteps("This is the next steps on a report");
		r.setKeyOutcomes("These are the key outcomes of this engagement");
		r.setAdvisorOrg(advisorOrg);
		r.setPrincipalOrg(principalOrg);
		Report created = httpQuery("/api/reports/new", author)
				.post(Entity.json(r), Report.class);
		assertThat(created.getId()).isNotNull();
		assertThat(created.getState()).isEqualTo(ReportState.DRAFT);

		//Have the author submit the report
		resp = httpQuery(String.format("/api/reports/%d/submit", created.getId()), author).post(null);
		assertThat(resp.getStatus()).isEqualTo(200);

		Report returned = httpQuery(String.format("/api/reports/%d", created.getId()), author).get(Report.class);
		assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
		logger.debug("Expecting report {} in step {} because of org {} on author {}",
				new Object[] { returned.getId(), approval.getId(), advisorOrg.getId(), author.getId() });
		assertThat(returned.getApprovalStep().getId()).isEqualTo(approval.getId());

		//verify the location on this report
		assertThat(returned.getLocation().getId()).isEqualTo(loc.getId());

		//verify the principals on this report
		assertThat(returned.loadAttendees()).contains(principal);
		returned.setAttendees(null); //Annoying, but required to make future .equals checks pass, because we just caused a lazy load.

		//verify the poams on this report
		assertThat(returned.loadPoams()).contains(action);
		returned.setPoams(null);

		//Verify this shows up on the approvers list of pending documents
		ReportSearchQuery pendingQuery = new ReportSearchQuery();
		pendingQuery.setPendingApprovalOf(approver1.getId());
		ReportList pending = httpQuery("/api/reports/search", approver1).post(Entity.json(pendingQuery), ReportList.class);
		int id = returned.getId();
		Report expected = pending.getList().stream().filter(re -> re.getId().equals(id)).findFirst().get();
		assertThat(expected).isEqualTo(returned);
		assertThat(pending.getList()).contains(returned);

		//Run a search for this users pending approvals
		ReportSearchQuery searchQuery = new ReportSearchQuery();
		searchQuery.setPendingApprovalOf(approver1.getId());
		pending = httpQuery("/api/reports/search", approver1).post(Entity.json(searchQuery), ReportList.class);
		assertThat(pending.getList().size()).isGreaterThan(0);

		//Check on Report status for who needs to approve
		List<ApprovalAction> approvalStatus = returned.loadApprovalStatus();
		assertThat(approvalStatus.size()).isEqualTo(2);
		ApprovalAction approvalAction = approvalStatus.get(0);
		assertThat(approvalAction.getPerson()).isNull(); //Because this hasn't been approved yet.
		assertThat(approvalAction.getCreatedAt()).isNull();
		assertThat(approvalAction.loadStep()).isEqualTo(steps.get(0));
		approvalAction = approvalStatus.get(1);
		assertThat(approvalAction.loadStep()).isEqualTo(steps.get(1));

		//Reject the report
		resp = httpQuery(String.format("/api/reports/%d/reject", created.getId()), approver1)
				.post(Entity.json(Comment.withText("a test rejection")));
		assertThat(resp.getStatus()).isEqualTo(200);

		//Check on report status to verify it was rejected
		returned = httpQuery(String.format("/api/reports/%d", created.getId()), author).get(Report.class);
		assertThat(returned.getState()).isEqualTo(ReportState.REJECTED);
		assertThat(returned.getApprovalStep()).isNull();

		//Author needs to re-submit
		resp = httpQuery(String.format("/api/reports/%d/submit", created.getId()), author).post(null);
		assertThat(resp.getStatus()).isEqualTo(200);

		//TODO: Approver modify the report *specifically change the attendees!*

		//Approve the report
		resp = httpQuery(String.format("/api/reports/%d/approve", created.getId()), approver1).post(null);
		assertThat(resp.getStatus()).isEqualTo(200);

		//Check on Report status to verify it got moved forward
		returned = httpQuery(String.format("/api/reports/%d", created.getId()), author).get(Report.class);
		assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
		assertThat(returned.getApprovalStep().getId()).isEqualTo(releaseApproval.getId());

		//Verify that the wrong person cannot approve this report.
		resp = httpQuery(String.format("/api/reports/%d/approve", created.getId()), approver1).post(null);
		assertThat(resp.getStatus()).isEqualTo(Status.FORBIDDEN.getStatusCode());

		//Approve the report
		resp = httpQuery(String.format("/api/reports/%d/approve", created.getId()), approver2).post(null);
		assertThat(resp.getStatus()).isEqualTo(200);

		//Check on Report status to verify it got moved forward
		returned = httpQuery(String.format("/api/reports/%d", created.getId()), author).get(Report.class);
		assertThat(returned.getState()).isEqualTo(ReportState.RELEASED);
		assertThat(returned.getApprovalStep()).isNull();

		//check on report status to see that it got approved.
		approvalStatus = returned.loadApprovalStatus();
		assertThat(approvalStatus.size()).isEqualTo(2);
		approvalAction = approvalStatus.get(0);
		assertThat(approvalAction.getPerson().getId()).isEqualTo(approver1.getId());
		assertThat(approvalAction.getCreatedAt()).isNotNull();
		assertThat(approvalAction.loadStep()).isEqualTo(steps.get(0));
		approvalAction = approvalStatus.get(1);
		assertThat(approvalAction.loadStep()).isEqualTo(steps.get(1));

		//Post a comment on the report because it's awesome
		Comment commentOne = httpQuery(String.format("/api/reports/%d/comments", created.getId()), author)
				.post(Entity.json(commentFromText("This is a test comment one")), Comment.class);
		assertThat(commentOne.getId()).isNotNull();
		assertThat(commentOne.getReportId()).isEqualTo(created.getId());
		assertThat(commentOne.getAuthor().getId()).isEqualTo(author.getId());

		Comment commentTwo = httpQuery(String.format("/api/reports/%d/comments", created.getId()), approver1)
				.post(Entity.json(commentFromText("This is a test comment two")), Comment.class);
		assertThat(commentTwo.getId()).isNotNull();

		List<Comment> commentsReturned = httpQuery(String.format("/api/reports/%d/comments", created.getId()), approver1)
			.get(new GenericType<List<Comment>>() {});
		assertThat(commentsReturned).hasSize(3); //the rejection comment will be there as well.
		assertThat(commentsReturned).containsSequence(commentOne, commentTwo); //Assert order of comments!

		//Verify this report shows up in the daily rollup
		ReportSearchQuery query = new ReportSearchQuery();
		query.setReleasedAtStart(DateTime.now().minusDays(1));
		ReportList rollup = httpQuery("/api/reports/search", admin).post(Entity.json(query), ReportList.class);
		assertThat(rollup.getTotalCount()).isGreaterThan(0);
		assertThat(rollup.getList()).contains(returned);
		
		//Pull recent People, Poams, and Locations and verify that the records from the last report are there. 
		List<Person> recentPeople = httpQuery("/api/people/recents", author).get(PersonList.class).getList();
		assertThat(recentPeople).contains(principal);
		
		List<Poam> recentPoams = httpQuery("/api/poams/recents", author).get(PoamList.class).getList();
		assertThat(recentPoams).contains(action);
		
		List<Location> recentLocations = httpQuery("/api/locations/recents", author).get(LocationList.class).getList();
		assertThat(recentLocations).contains(loc);
		
		//Go and delete the entire approval chain! 
		advisorOrg.setApprovalSteps(ImmutableList.of());
		resp = httpQuery("/api/organizations/update", admin).post(Entity.json(advisorOrg));
		assertThat(resp.getStatus()).isEqualTo(200);
		
		Organization updatedOrg = httpQuery("/api/organizations/" + advisorOrg.getId(), admin).get(Organization.class);
		assertThat(updatedOrg).isNotNull();
		assertThat(updatedOrg.loadApprovalSteps()).hasSize(0);
	}

	public static Comment commentFromText(String string) {
		Comment c = new Comment();
		c.setText(string);
		return c;
	}
	
	@Test
	public void testDefaultApprovalFlow() {
		final Person jack = getJackJackson();
		final Person roger = getRogerRogwell();

		//Create a Person who isn't in a Billet
		Person author = new Person();
		author.setName("A New Guy");
		author.setRole(Role.ADVISOR);
		author.setStatus(PersonStatus.ACTIVE);
		author.setDomainUsername("newGuy");
		author.setEmailAddress("newGuy@example.com");
		author = httpQuery("/api/people/new", admin).post(Entity.json(author), Person.class);
		assertThat(author.getId()).isNotNull();

		List<ReportPerson> attendees = ImmutableList.of(PersonTest.personToPrimaryReportPerson(roger), PersonTest.personToPrimaryReportPerson(jack));

		//Write a report as that person
		Report r = new Report();
		r.setAuthor(author);
		r.setIntent("I am a new Advisor and wish to be included in things");
		r.setAtmosphere(Atmosphere.NEUTRAL);
		r.setAttendees(attendees);
		r.setReportText("I just got here in town and am writing a report for the first time, but have no reporting structure set up");
		r.setKeyOutcomes("Summary for the key outcomes");
		r.setNextSteps("Summary for the next steps");
		r.setEngagementDate(DateTime.now());
		r = httpQuery("/api/reports/new", jack).post(Entity.json(r), Report.class);
		assertThat(r.getId()).isNotNull();

		//Submit the report
		Response resp = httpQuery("/api/reports/" + r.getId() + "/submit", jack).post(Entity.json(null));
		assertThat(resp.getStatus()).isEqualTo(200);

		//Check the approval Step
		Report returned = httpQuery("/api/reports/" + r.getId(), jack).get(Report.class);
		assertThat(returned.getId()).isEqualTo(r.getId());
		assertThat(returned.getState()).isEqualTo(Report.ReportState.PENDING_APPROVAL);

		//Find the default ApprovalSteps
		Integer defaultOrgId = Integer.parseInt(AnetObjectEngine.getInstance().getAdminSetting(AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION));
		assertThat(defaultOrgId).isNotNull();
		List<ApprovalStep> steps = httpQuery("/api/approvalSteps/byOrganization?orgId=" + defaultOrgId, jack)
				.get(new GenericType<List<ApprovalStep>>() {});
		assertThat(steps).isNotNull();
		assertThat(steps).hasSize(1);
		assertThat(returned.getApprovalStep().getId()).isEqualTo(steps.get(0).getId());

		//Get the Person who is able to approve that report (nick@example.com)
		Person nick = new Person();
		nick.setDomainUsername("nick");

		//Create billet for Author
		Position billet = new Position();
		billet.setName("EF 1.1 new advisor");
		billet.setType(Position.PositionType.ADVISOR);
		billet.setStatus(PositionStatus.ACTIVE);

		//Put billet in EF1
		OrganizationList results = httpQuery("/api/organizations/search?text=EF%201&type=ADVISOR_ORG", nick).get(OrganizationList.class);
		assertThat(results.getList().size()).isGreaterThan(0);
		Organization ef1 = null;
		for (Organization org : results.getList()) {
			if (org.getShortName().trim().equalsIgnoreCase("ef 1.1")) {
				billet.setOrganization(Organization.createWithId(org.getId()));
				ef1 = org;
				break;
			}
		}
		assertThat(billet.getOrganization()).isNotNull();
		assertThat(ef1).isNotNull();

		billet = httpQuery("/api/positions/new", admin)
				.post(Entity.json(billet), Position.class);
		assertThat(billet.getId()).isNotNull();

		//Put Author in the billet
		resp = httpQuery("/api/positions/" + billet.getId() + "/person", admin)
				.post(Entity.json(author));
		assertThat(resp.getStatus()).isEqualTo(200);

		//Nick should kick the report
		resp = httpQuery("/api/reports/" + r.getId() + "/submit", nick).post(Entity.json(null));
		assertThat(resp.getStatus()).isEqualTo(200);

		//Report should now be up for review by EF1 approvers
		Report returned2 = httpQuery("/api/reports/" + r.getId(), jack).get(Report.class);
		assertThat(returned2.getId()).isEqualTo(r.getId());
		assertThat(returned2.getState()).isEqualTo(Report.ReportState.PENDING_APPROVAL);
		assertThat(returned2.getApprovalStep().getId()).isNotEqualTo(returned.getApprovalStep().getId());
	}

	@Test
	public void reportEditTest() {
		//Elizabeth writes a report about meeting with Roger
		final Person elizabeth = getElizabethElizawell();
		final Person roger = getRogerRogwell();
		final Person nick = getNickNicholson();
		final Person bob = getBobBobtown();

		//Fetch some objects from the DB that we'll use later.
		List<Location> locSearchResults = httpQuery("/api/locations/search?text=Police", elizabeth)
				.get(LocationList.class).getList();
		assertThat(locSearchResults.size()).isGreaterThan(0);
		final Location loc = locSearchResults.get(0);

		PoamList poamSearchResults = httpQuery("/api/poams/search?text=Budgeting", elizabeth)
				.get(PoamList.class);
		assertThat(poamSearchResults.getTotalCount()).isGreaterThan(2);

		Report r = new Report();
		r.setIntent("A Test Report to test editing reports");
		r.setAuthor(elizabeth);
		r.setAtmosphere(Atmosphere.POSITIVE);
		r.setAtmosphereDetails("it was a cold, cold day");
		r.setEngagementDate(DateTime.now());
		r.setKeyOutcomes("There were some key out comes summarized");
		r.setNextSteps("These are the next steps summarized");
		r.setReportText("This report was generated by ReportsResourceTest#reportEditTest");
		r.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(roger)));
		r.setPoams(ImmutableList.of(poamSearchResults.getList().get(0)));
		Report returned = httpQuery("/api/reports/new", elizabeth).post(Entity.json(r), Report.class);
		assertThat(returned.getId()).isNotNull();

		//Elizabeth edits the report (update locationId, addPerson, remove a Poam)
		returned.setLocation(loc);
		returned.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(roger), 
				PersonTest.personToReportPerson(nick), 
				PersonTest.personToPrimaryReportPerson(elizabeth)));
		returned.setPoams(ImmutableList.of());
		Response resp = httpQuery("/api/reports/update", elizabeth).post(Entity.json(returned));
		assertThat(resp.getStatus()).isEqualTo(200);

		//Verify the report changed
		Report returned2 = httpQuery("/api/reports/" + returned.getId(), elizabeth).get(Report.class);
		assertThat(returned2.getIntent()).isEqualTo(r.getIntent());
		assertThat(returned2.getLocation().getId()).isEqualTo(loc.getId());
		assertThat(returned2.loadPoams()).isEmpty(); //yes this does a DB load :(
		assertThat(returned2.loadAttendees()).hasSize(3);
		assertThat(returned2.loadAttendees().contains(roger));

		//Elizabeth submits the report
		resp = httpQuery("/api/reports/" + returned.getId() + "/submit", elizabeth).post(Entity.json(null));
		assertThat(resp.getStatus()).isEqualTo(200);
		Report returned3 = httpQuery("/api/reports/" + returned.getId(), elizabeth).get(Report.class);
		assertThat(returned3.getState()).isEqualTo(ReportState.PENDING_APPROVAL);

		//Bob gets the approval (EF1 Approvers)
		ReportSearchQuery pendingQuery = new ReportSearchQuery();
		pendingQuery.setPendingApprovalOf(bob.getId());
		ReportList pendingBobsApproval = httpQuery("/api/reports/search", bob).post(Entity.json(pendingQuery), ReportList.class);
		assertThat(pendingBobsApproval.getList().stream().anyMatch(rpt -> rpt.getId().equals(returned3.getId()))).isTrue();

		//Bob edits the report (change reportText, remove Person, add a Poam)
		returned3.setReportText(r.getReportText() + ", edited by Bob!!");
		returned3.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(nick), PersonTest.personToPrimaryReportPerson(elizabeth)));
		returned3.setPoams(ImmutableList.of(poamSearchResults.getList().get(1), poamSearchResults.getList().get(2)));
		resp = httpQuery("/api/reports/update", bob).post(Entity.json(returned3));
		assertThat(resp.getStatus()).isEqualTo(200);

		Report returned4 = httpQuery("/api/reports/" + returned.getId(), elizabeth).get(Report.class);
		assertThat(returned4.getReportText()).endsWith("Bob!!");
		assertThat(returned4.loadAttendees()).hasSize(2);
		assertThat(returned4.loadAttendees()).contains(PersonTest.personToPrimaryReportPerson(nick));
		assertThat(returned4.loadPoams()).hasSize(2);

		resp = httpQuery("/api/reports/" + returned.getId() + "/approve", bob).post(null);
		assertThat(resp.getStatus()).isEqualTo(200);
	}

	@Test
	public void searchTest() {
		final Person jack =  getJackJackson();
		final Person steve = getSteveSteveson();
		ReportSearchQuery query = new ReportSearchQuery();

		//Search based on report Text body
		query.setText("spreadsheet");
		ReportList searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();

		//Search based on summary
		query.setText("Amherst");
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();

		//Search by Author
		query.setText(null);
		query.setAuthorId(jack.getId());
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		assertThat(searchResults.getList().stream()
				.filter(r -> (r.getAuthor().getId().equals(jack.getId()))).count())
			.isEqualTo(searchResults.getList().size());
		final int numResults = searchResults.getList().size();

		//Search by Author with Date Filtering
		query.setEngagementDateStart(new DateTime(2016,6,1,0,0));
		query.setEngagementDateEnd(new DateTime(2016,6,15,0,0,0));
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		assertThat(searchResults.getList().size()).isLessThan(numResults);

		//Search by Attendee
		query.setEngagementDateStart(null);
		query.setEngagementDateEnd(null);
		query.setAuthorId(null);
		query.setAttendeeId(steve.getId());
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		assertThat(searchResults.getList().stream().filter(r ->
			r.loadAttendees().stream().anyMatch(rp ->
				(rp.getId().equals(steve.getId()))
			))).hasSameSizeAs(searchResults.getList());

		List<Poam> poamResults = httpQuery("/api/poams/search?text=1.1.A", jack).get(PoamList.class).getList();
		assertThat(poamResults).isNotEmpty();
		Poam poam = poamResults.get(0);

		//Search by Poam
		query.setAttendeeId(null);
		query.setPoamId(poam.getId());
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		assertThat(searchResults.getList().stream().filter(r ->
				r.loadPoams().stream().anyMatch(p ->
					p.getId().equals(poam.getId()))
			)).hasSameSizeAs(searchResults.getList());

		//Search by direct organization
		OrganizationList orgs = httpQuery("/api/organizations/search?type=ADVISOR_ORG&text=EF%201", jack).get(OrganizationList.class);
		assertThat(orgs.getList().size()).isGreaterThan(0);
		Organization ef11 = orgs.getList().stream().filter(o -> o.getShortName().equals("EF 1.1")).findFirst().get();
		assertThat(ef11.getShortName()).isEqualToIgnoringCase("EF 1.1");

		query = new ReportSearchQuery();
		query.setAdvisorOrgId(ef11.getId());
		query.setIncludeAdvisorOrgChildren(false);
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		assertThat(searchResults.getList().stream().filter(r ->
				r.loadAdvisorOrg().getId().equals(ef11.getId())
			)).hasSameSizeAs(searchResults.getList());

		//Search by parent organization
		orgs = httpQuery("/api/organizations/search?type=ADVISOR_ORG&text=ef%201", jack).get(OrganizationList.class);
		assertThat(orgs.getList().size()).isGreaterThan(0);
		Organization ef1 = orgs.getList().stream().filter(o -> o.getShortName().equalsIgnoreCase("ef 1")).findFirst().get();
		assertThat(ef1.getShortName()).isEqualToIgnoringCase("EF 1");

		query.setAdvisorOrgId(ef1.getId());
		query.setIncludeAdvisorOrgChildren(true);
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		//#TODO: figure out how to verify the results?

		//Check search for just an org, when we don't know if it's advisor or principal. 
		query.setOrgId(ef11.getId());
		query.setAdvisorOrgId(null);
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		assertThat(searchResults.getList().stream().filter(r ->
				r.loadAdvisorOrg().getId().equals(ef11.getId())
			)).hasSameSizeAs(searchResults.getList());
		
		
		//Search by location
		List<Location> locs = httpQuery("/api/locations/search?text=Cabot", jack).get(LocationList.class).getList();
		assertThat(locs.size() == 0);
		Location cabot = locs.get(0);

		query = new ReportSearchQuery();
		query.setLocationId(cabot.getId());
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		assertThat(searchResults.getList().stream().filter(r ->
				r.getLocation().getId().equals(cabot.getId())
			)).hasSameSizeAs(searchResults.getList());

		//Search by Status. 
		query.setLocationId(null);
		query.setState(ImmutableList.of(ReportState.CANCELLED));
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		final int numCancelled = searchResults.getTotalCount();
		
		query.setState(ImmutableList.of(ReportState.CANCELLED, ReportState.RELEASED));
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		assertThat(searchResults.getTotalCount()).isGreaterThan(numCancelled);
		
		orgs = httpQuery("/api/organizations/search?type=PRINCIPAL_ORG&text=Defense", jack).get(OrganizationList.class);
		assertThat(orgs.getList().size()).isGreaterThan(0);
		Organization mod = orgs.getList().stream().filter(o -> o.getShortName().equalsIgnoreCase("MoD")).findFirst().get();
		assertThat(mod.getShortName()).isEqualToIgnoringCase("MoD");
		
		//Search by Principal Organization
		query.setState(null);
		query.setPrincipalOrgId(mod.getId());
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		assertThat(searchResults.getList().stream().filter(r ->
				r.loadPrincipalOrg().getId().equals(mod.getId())
			)).hasSameSizeAs(searchResults.getList());
		
		//Search by Principal Parent Organization
		query.setPrincipalOrgId(mod.getId());
		query.setIncludePrincipalOrgChildren(true);
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList()).isNotEmpty();
		//TODO: figure out how to verify the results? 
		
		query = new ReportSearchQuery();
		query.setText("spreadsheet");
		query.setSortBy(ReportSearchSortBy.ENGAGEMENT_DATE);
		query.setSortOrder(SortOrder.ASC);
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		DateTime prev = new DateTime(0L);
		for (Report res : searchResults.getList()) { 
			assertThat(res.getEngagementDate()).isGreaterThan(prev);
			prev = res.getEngagementDate();
		}
		
		//Search for report text with stopwords
		query = new ReportSearchQuery();
		query.setText("Hospital usage of Drugs");
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList().stream().filter(r -> r.getIntent().contains("Hospital usage of Drugs")).count()).isGreaterThan(0);
		
		///find EF 2.2
		orgs = httpQuery("/api/organizations/search?type=ADVISOR_ORG&text=ef%202.2", jack).get(OrganizationList.class);
		assertThat(orgs.getList().size()).isGreaterThan(0);
		Organization ef22 = orgs.getList().stream().filter(o -> o.getShortName().equalsIgnoreCase("ef 2.2")).findFirst().get();
		assertThat(ef22.getShortName()).isEqualToIgnoringCase("EF 2.2");
		
		
		//Search for a report by both principal AND advisor orgs. 
		query = new ReportSearchQuery();
		query.setAdvisorOrgId(mod.getId());
		query.setPrincipalOrgId(ef22.getId());
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList().stream().filter(r -> 
			r.getAdvisorOrg().getId().equals(ef22.getId()) && r.getPrincipalOrg().getId().equals(mod.getId())
			).count()).isEqualTo(searchResults.getList().size());
		
		//this might fail if there are any children of ef22 or mod, but there aren't in the base data set. 
		query.setIncludeAdvisorOrgChildren(true);
		query.setIncludePrincipalOrgChildren(true);
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList().stream().filter(r -> 
			r.getAdvisorOrg().getId().equals(ef22.getId()) && r.getPrincipalOrg().getId().equals(mod.getId())
			).count()).isEqualTo(searchResults.getList().size());
		
		//Search by Atmosphere
		query = new ReportSearchQuery();
		query.setAtmosphere(Atmosphere.NEGATIVE);
		searchResults = httpQuery("/api/reports/search", jack).post(Entity.json(query), ReportList.class);
		assertThat(searchResults.getList().stream().filter(r -> r.getAtmosphere().equals(Atmosphere.NEGATIVE)
			).count()).isEqualTo(searchResults.getList().size());
		
	}

	@Test
	public void searchUpdatedAtStartAndEndTest() {
		// insertBaseData has 1 report that is updatedAt 2 days before current timestamp
		final ReportSearchQuery query = new ReportSearchQuery();
		final DateTime startDate = DateTime.now().minusDays(3);
		final DateTime endDate = DateTime.now().minusDays(1);

		// Greater than startDate and smaller than endDate
		query.setUpdatedAtStart(startDate);
		query.setUpdatedAtEnd(endDate);
		query.setPageSize(0);
		ReportList results = httpQuery("/api/reports/search", admin).post(Entity.json(query), ReportList.class);
		assertThat(results.getList().size()).isEqualTo(1);

		// Greater than startDate and equal to endDate
		query.setUpdatedAtStart(startDate);
		query.setUpdatedAtEnd(endDate.minusDays(1));
		results = httpQuery("/api/reports/search", admin).post(Entity.json(query), ReportList.class);
		assertThat(results.getList().size()).isEqualTo(1);

		// Equal to startDate and smaller than endDate
		query.setUpdatedAtStart(startDate.plusDays(1));
		query.setUpdatedAtEnd(endDate);
		results = httpQuery("/api/reports/search", admin).post(Entity.json(query), ReportList.class);
		assertThat(results.getList().size()).isEqualTo(0);

		// Equal to startDate and equal to endDate
		query.setUpdatedAtStart(startDate.plusDays(1));
		query.setUpdatedAtEnd(startDate.plusDays(1));
		results = httpQuery("/api/reports/search", admin).post(Entity.json(query), ReportList.class);
		assertThat(results.getList().size()).isEqualTo(0);
	}

	@Test
	public void searchByAuthorPosition() {
		final ReportSearchQuery query = new ReportSearchQuery();
		final Position adminPos = admin.loadPosition();
		query.setAuthorPositionId(adminPos.getId());

		//Search by author position
		final ReportList results = httpQuery("/api/reports/search", admin).post(Entity.json(query), ReportList.class);
		assertThat(results).isNotNull();
		assertThat(results.getList().size()).isGreaterThan(0);
	}


	@Test
	public void searchAttendeePosition() {
		final ReportSearchQuery query = new ReportSearchQuery();
		final Position adminPos = admin.loadPosition();
		query.setAttendeePositionId(adminPos.getId());

		//Search by attendee position
		final ReportList results = httpQuery("/api/reports/search", admin).post(Entity.json(query), ReportList.class);
		assertThat(results).isNotNull();
		assertThat(results.getList().size()).isGreaterThan(0);
	}

	@Test
	public void reportDeleteTest() {
		final Person jack = getJackJackson();
		final Person liz = getElizabethElizawell();
		final Person roger = getRogerRogwell();

		List<ReportPerson> attendees = ImmutableList.of(
			PersonTest.personToPrimaryReportPerson(roger),
			PersonTest.personToReportPerson(jack),
			PersonTest.personToPrimaryReportPerson(liz));

		//Write a report as that person
		Report r = new Report();
		r.setAuthor(liz);
		r.setIntent("This is a report that should be deleted");
		r.setAtmosphere(Atmosphere.NEUTRAL);
		r.setAttendees(attendees);
		r.setReportText("I'm writing a report that I intend to delete very soon.");
		r.setKeyOutcomes("Summary for the key outcomes");
		r.setNextSteps("Summary for the next steps");
		r.setEngagementDate(DateTime.now());
		r = httpQuery("/api/reports/new", liz).post(Entity.json(r), Report.class);
		assertThat(r.getId()).isNotNull();

		//Try to delete  by jack, this should fail.
		Response resp = httpQuery("/api/reports/" + r.getId() + "/delete", jack).delete();
		assertThat(resp.getStatus()).isEqualTo(Status.FORBIDDEN.getStatusCode());

		//Now have the author delete this report.
		resp = httpQuery("/api/reports/" + r.getId() + "/delete", liz).delete();
		assertThat(resp.getStatus()).isEqualTo(200);

		//Assert the report is gone.
		resp = httpQuery("/api/reports/" + r.getId(),liz).get();
		assertThat(resp.getStatus()).isEqualTo(404);
	}

	@Test
	public void reportCancelTest() {
		final Person liz = getElizabethElizawell(); //Report Author
		final Person steve = getSteveSteveson(); //Principal
		final Person bob = getBobBobtown(); // Report Approver

		//Liz was supposed to meet with Steve, but he cancelled.

		Report r = new Report();
		r.setIntent("Meet with Steve about a thing we never got to talk about");
		r.setEngagementDate(DateTime.now());
		r.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(liz), PersonTest.personToPrimaryReportPerson(steve)));
		r.setCancelledReason(ReportCancelledReason.CANCELLED_BY_PRINCIPAL);

		Report saved = httpQuery("/api/reports/new", liz).post(Entity.json(r), Report.class);
		assertThat(saved.getId()).isNotNull();

		Response resp = httpQuery("/api/reports/" + saved.getId() + "/submit", liz).post(null);
		assertThat(resp.getStatus()).isEqualTo(200);
		Report returned = httpQuery("/api/reports/" + saved.getId(), liz).get(Report.class);
		assertThat(returned.getState()).isEqualTo(ReportState.PENDING_APPROVAL);
		assertThat(returned.getCancelledReason()).isEqualTo(ReportCancelledReason.CANCELLED_BY_PRINCIPAL);

		//Bob gets the approval (EF1 Approvers)
		ReportSearchQuery pendingQuery = new ReportSearchQuery();
		pendingQuery.setPendingApprovalOf(bob.getId());
		ReportList pendingBobsApproval = httpQuery("/api/reports/search", bob).post(Entity.json(pendingQuery), ReportList.class);
		assertThat(pendingBobsApproval.getList().stream().anyMatch(rpt -> rpt.getId().equals(returned.getId()))).isTrue();

		//Bob should approve this report.
		resp = httpQuery("/api/reports/" + saved.getId() + "/approve", bob).post(null);
		assertThat(resp.getStatus()).isEqualTo(200);

		//Ensure it went to cancelled status.
		Report returned2 = httpQuery("/api/reports/" + saved.getId(), liz).get(Report.class);
		assertThat(returned2.getState()).isEqualTo(ReportState.CANCELLED);
	}

	@Test
	public void dailyRollupGraphNonReportingTest() {
		Person steve = getSteveSteveson();
		
		Report r = new Report();
		r.setAuthor(admin);
		r.setIntent("Test the Daily rollup graph");
		r.setNextSteps("Check for a change in the rollup graph");
		r.setKeyOutcomes("Foobar the bazbiz");
		r.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(admin), PersonTest.personToPrimaryReportPerson(steve)));
		r = httpQuery("/api/reports/new", admin).post(Entity.json(r), Report.class);
		
		//Pull the daily rollup graph
		DateTime startDate = DateTime.now().minusDays(1);
		DateTime endDate = DateTime.now().plusDays(1);
		final List<RollupGraph> startGraph = httpQuery(
				String.format("/api/reports/rollupGraph?startDate=%d&endDate=%d", startDate.getMillis(), endDate.getMillis()), admin)
				.get(new GenericType<List<RollupGraph>>() {});
		
		//Submit the report
		Response resp = httpQuery("/api/reports/" + r.getId() + "/submit", admin).post(null);
		assertThat(resp.getStatus()).isEqualTo(Status.BAD_REQUEST.getStatusCode());
		
		//Oops set the engagementDate.
		r.setEngagementDate(DateTime.now());
		resp = httpQuery("/api/reports/update", admin).post(Entity.json(r));
		assertThat(resp.getStatus()).isEqualTo(200);
		
		//Re-submit the report, it should work. 
		resp = httpQuery("/api/reports/" + r.getId() + "/submit", admin).post(null);
		assertThat(resp.getStatus()).isEqualTo(200);
		
		//Admin can approve his own reports.
		resp = httpQuery("/api/reports/" + r.getId() + "/approve", admin).post(null);
		assertThat(resp.getStatus()).isEqualTo(200);
		
		//Verify report is in RELEASED state. 
		r = httpQuery("/api/reports/" + r.getId(), admin).get(Report.class);
		assertThat(r.getState()).isEqualTo(ReportState.RELEASED);
	
		//Check on the daily rollup graph now. 
		List<RollupGraph> endGraph = httpQuery(
				String.format("/api/reports/rollupGraph?startDate=%d&endDate=%d", startDate.getMillis(), endDate.getMillis()), admin)
				.get(new GenericType<List<RollupGraph>>() {});
		
		final Position pos = admin.loadPosition();
		pos.getOrganization().setLoadLevel(LoadLevel.ID_ONLY);
		final Organization org = pos.loadOrganization();
		final Map<String, Object> dictionary = RULE.getConfiguration().getDictionary();
		@SuppressWarnings("unchecked")
		final List<String> nro = (List<String>) dictionary.get("non_reporting_ORGs");
		//Admin's organization should have one more report RELEASED only if it is not in the non-reporting orgs
		final int diff = (nro == null || !nro.contains(org.getShortName())) ? 1 : 0;
		final int orgId = org.getId();
		Optional<RollupGraph> orgReportsStart = startGraph.stream().filter(rg -> rg.getOrg() != null && rg.getOrg().getId().equals(orgId)).findFirst();
		final int startCt = orgReportsStart.isPresent() ? (orgReportsStart.get().getReleased()) : 0;
		Optional<RollupGraph> orgReportsEnd = endGraph.stream().filter(rg -> rg.getOrg() != null && rg.getOrg().getId().equals(orgId)).findFirst();
		final int endCt = orgReportsEnd.isPresent() ? (orgReportsEnd.get().getReleased()) : 0;
		assertThat(startCt).isEqualTo(endCt - diff);
	}

	@Test
	public void dailyRollupGraphReportingTest() {
		final Person elizabeth = getElizabethElizawell();
		final Person bob = getBobBobtown();
		Person steve = getSteveSteveson();

		Report r = new Report();
		r.setAuthor(elizabeth);
		r.setIntent("Test the Daily rollup graph");
		r.setNextSteps("Check for a change in the rollup graph");
		r.setKeyOutcomes("Foobar the bazbiz");
		r.setAttendees(ImmutableList.of(PersonTest.personToPrimaryReportPerson(elizabeth), PersonTest.personToPrimaryReportPerson(steve)));
		r = httpQuery("/api/reports/new", elizabeth).post(Entity.json(r), Report.class);

		//Pull the daily rollup graph
		DateTime startDate = DateTime.now().minusDays(1);
		DateTime endDate = DateTime.now().plusDays(1);
		final List<RollupGraph> startGraph = httpQuery(
				String.format("/api/reports/rollupGraph?startDate=%d&endDate=%d", startDate.getMillis(), endDate.getMillis()), elizabeth)
				.get(new GenericType<List<RollupGraph>>() {});

		//Submit the report
		Response resp = httpQuery("/api/reports/" + r.getId() + "/submit", elizabeth).post(null);
		assertThat(resp.getStatus()).isEqualTo(Status.BAD_REQUEST.getStatusCode());

		//Oops set the engagementDate.
		r.setEngagementDate(DateTime.now());
		resp = httpQuery("/api/reports/update", elizabeth).post(Entity.json(r));
		assertThat(resp.getStatus()).isEqualTo(200);

		//Re-submit the report, it should work.
		resp = httpQuery("/api/reports/" + r.getId() + "/submit", elizabeth).post(null);
		assertThat(resp.getStatus()).isEqualTo(200);

		//Approve report.
		resp = httpQuery("/api/reports/" + r.getId() + "/approve", bob).post(null);
		assertThat(resp.getStatus()).isEqualTo(200);

		//Verify report is in RELEASED state.
		r = httpQuery("/api/reports/" + r.getId(), elizabeth).get(Report.class);
		assertThat(r.getState()).isEqualTo(ReportState.RELEASED);

		//Check on the daily rollup graph now.
		List<RollupGraph> endGraph = httpQuery(
				String.format("/api/reports/rollupGraph?startDate=%d&endDate=%d", startDate.getMillis(), endDate.getMillis()), elizabeth)
				.get(new GenericType<List<RollupGraph>>() {});

		final Position pos = elizabeth.loadPosition();
		pos.getOrganization().setLoadLevel(LoadLevel.ID_ONLY);
		final Organization org = pos.loadOrganization();
		final Map<String, Object> dictionary = RULE.getConfiguration().getDictionary();
		@SuppressWarnings("unchecked")
		final List<String> nro = (List<String>) dictionary.get("non_reporting_ORGs");
		//Elizabeth's organization should have one more report RELEASED only if it is not in the non-reporting orgs
		final int diff = (nro == null || !nro.contains(org.getShortName())) ? 1 : 0;
		final int orgId = org.loadParentOrg().getId();
		Optional<RollupGraph> orgReportsStart = startGraph.stream().filter(rg -> rg.getOrg() != null && rg.getOrg().getId().equals(orgId)).findFirst();
		final int startCt = orgReportsStart.isPresent() ? (orgReportsStart.get().getReleased()) : 0;
		Optional<RollupGraph> orgReportsEnd = endGraph.stream().filter(rg -> rg.getOrg() != null && rg.getOrg().getId().equals(orgId)).findFirst();
		final int endCt = orgReportsEnd.isPresent() ? (orgReportsEnd.get().getReleased()) : 0;
		assertThat(startCt).isEqualTo(endCt - diff);
	}

	@Test
	public void testTagSearch() {
		final ReportSearchQuery tagQuery = new ReportSearchQuery();
		tagQuery.setText("bribery");
		final ReportList taggedReportList = httpQuery("/api/reports/search", admin).post(Entity.json(tagQuery), ReportList.class);
		assertThat(taggedReportList).isNotNull();
		final List<Report> taggedReports = taggedReportList.getList();
		for (Report rpt : taggedReports) {
			rpt.loadTags();
			assertThat(rpt.getTags()).isNotNull();
			assertThat(rpt.getTags().stream().filter(o -> o.getName().equals("bribery"))).isNotEmpty();
		}
	}

	@Test
	public void testSensitiveInformationByAuthor() {
		final Person elizabeth = getElizabethElizawell();
		final Report r = new Report();
		r.setAuthor(elizabeth);
		r.setReportText("This reportTest was generated by ReportsResourceTest#testSensitiveInformation");
		final ReportSensitiveInformation rsi = new ReportSensitiveInformation();
		rsi.setText("This sensitiveInformation was generated by ReportsResourceTest#testSensitiveInformation");
		r.setReportSensitiveInformation(rsi);
		final Report returned = httpQuery("/api/reports/new", elizabeth).post(Entity.json(r), Report.class);
		assertThat(returned.getId()).isNotNull();
		// elizabeth should be allowed to see it returned, as she's the author
		assertThat(returned.getReportSensitiveInformation()).isNotNull();
		assertThat(returned.getReportSensitiveInformation().getText()).isEqualTo(rsi.getText());

		final Report returned2 = httpQuery("/api/reports/" + returned.getId(), elizabeth).get(Report.class);
		// elizabeth should be allowed to see it
		returned2.setUser(elizabeth);
		assertThat(returned2.loadReportSensitiveInformation()).isNotNull();
		assertThat(returned2.getReportSensitiveInformation().getText()).isEqualTo(rsi.getText());

		final Person jack = getJackJackson();
		final Report returned3 = httpQuery("/api/reports/" + returned.getId(), jack).get(Report.class);
		// jack should not be allowed to see it
		returned3.setUser(jack);
		assertThat(returned3.loadReportSensitiveInformation()).isNull();
	}

	@Test
	public void testSensitiveInformationByAuthorizedPosition() {
		final PersonSearchQuery erinQuery = new PersonSearchQuery();
		erinQuery.setText("erin");
		final PersonList erinSearchResults = httpQuery("/api/people/search", admin).post(Entity.json(erinQuery), PersonList.class);
		assertThat(erinSearchResults.getTotalCount()).isGreaterThan(0);
		final Optional<Person> erinResult = erinSearchResults.getList().stream().filter(p -> p.getName().equals("ERINSON, Erin")).findFirst();
		assertThat(erinResult).isNotEmpty();
		final Person erin = erinResult.get();

		final ReportSearchQuery reportQuery = new ReportSearchQuery();
		reportQuery.setText("Test Cases are good");
		final ReportList reportSearchResults = httpQuery("/api/reports/search", erin).post(Entity.json(reportQuery), ReportList.class);
		assertThat(reportSearchResults.getTotalCount()).isGreaterThan(0);
		final Optional<Report> reportResult = reportSearchResults.getList().stream().filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
		assertThat(reportResult).isNotEmpty();
		final Report report = reportResult.get();
		report.setUser(erin);
		// erin is the author, so should be able to see the sensitive information
		assertThat(report.loadReportSensitiveInformation()).isNotNull();
		assertThat(report.getReportSensitiveInformation().getText()).isEqualTo("Need to know only");

		final PersonSearchQuery reinaQuery = new PersonSearchQuery();
		reinaQuery.setText("reina");
		final PersonList searchResults = httpQuery("/api/people/search", admin).post(Entity.json(reinaQuery), PersonList.class);
		assertThat(searchResults.getTotalCount()).isGreaterThan(0);
		final Optional<Person> reinaResult = searchResults.getList().stream().filter(p -> p.getName().equals("REINTON, Reina")).findFirst();
		assertThat(reinaResult).isNotEmpty();
		final Person reina = reinaResult.get();

		final ReportList reportSearchResults2 = httpQuery("/api/reports/search", reina).post(Entity.json(reportQuery), ReportList.class);
		assertThat(reportSearchResults2.getTotalCount()).isGreaterThan(0);
		final Optional<Report> reportResult2 = reportSearchResults2.getList().stream().filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
		assertThat(reportResult2).isNotEmpty();
		final Report report2 = reportResult2.get();
		report2.setUser(reina);
		// reina is not authorized, so should not be able to see the sensitive information
		assertThat(report2.loadReportSensitiveInformation()).isNull();

		final PersonSearchQuery rebeccaQuery = new PersonSearchQuery();
		rebeccaQuery.setText("rebecca");
		final PersonList searchResults3 = httpQuery("/api/people/search", admin).post(Entity.json(rebeccaQuery), PersonList.class);
		assertThat(searchResults3.getTotalCount()).isGreaterThan(0);
		final Optional<Person> reinaResult3 = searchResults3.getList().stream().filter(p -> p.getName().equals("BECCABON, Rebecca")).findFirst();
		assertThat(reinaResult3).isNotEmpty();
		final Person rebecca = reinaResult3.get();

		final ReportList reportSearchResults3 = httpQuery("/api/reports/search", rebecca).post(Entity.json(reportQuery), ReportList.class);
		assertThat(reportSearchResults3.getTotalCount()).isGreaterThan(0);
		final Optional<Report> reportResult3 = reportSearchResults3.getList().stream().filter(r -> reportQuery.getText().equals(r.getKeyOutcomes())).findFirst();
		assertThat(reportResult3).isNotEmpty();
		final Report report3 = reportResult3.get();
		report3.setUser(rebecca);
		// rebecca is authorized, so should be able to see the sensitive information
		assertThat(report.loadReportSensitiveInformation()).isNotNull();
		assertThat(report.getReportSensitiveInformation().getText()).isEqualTo("Need to know only");
	}

	private ReportSearchQuery setupQueryEngagementDayOfWeek() {
		final ReportSearchQuery query = new ReportSearchQuery();
		query.setState(ImmutableList.of(ReportState.RELEASED));
		return query;
	}

	private ReportList runSearchQuery(ReportSearchQuery query) {
		return httpQuery("/api/reports/search", admin).post(Entity.json(query), ReportList.class);
	}

	@Test
	public void testEngagementDayOfWeekNotIncludedInResults() {
		final ReportSearchQuery query = setupQueryEngagementDayOfWeek();
		final ReportList reportResults = runSearchQuery(query);

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

		final ReportList reportResults = runSearchQuery(query);
		assertThat(reportResults).isNotNull();

		final List<Integer> daysOfWeek = Arrays.asList(1,2,3,4,5,6,7);
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

		final ReportList reportResults = runSearchQuery(query);
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

		final ReportList reportResults = runSearchQuery(query);
		assertThat(reportResults).isNotNull();

		final List<Report> reports = reportResults.getList();
		assertThat(reports.size()).isEqualTo(0);
	}
}
