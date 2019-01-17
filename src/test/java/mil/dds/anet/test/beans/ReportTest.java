package mil.dds.anet.test.beans;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

import org.junit.Test;

import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.test.TestData;

public class ReportTest extends BeanTester<Report> {

	public static Report getTestReport() {
		Report r = new Report();
		r.setCreatedAt(Instant.ofEpochMilli(1453753380000L));
		r.setUpdatedAt(Instant.ofEpochMilli(1453753380000L));
		r.setState(ReportState.DRAFT);
		
		Location loc = TestData.createLocation("The Boat Dock", 32.456,-123.4999);
		r.setLocation(loc);
		r.setIntent("Check up with Steve");
		r.setAtmosphere(Atmosphere.POSITIVE);
		r.setAtmosphereDetails("This was a great meeting!!!");
		r.setEngagementDate(Instant.ofEpochMilli(1453753380000L));
		
		r.setAuthor(PersonTest.getJackJacksonStub());
		
		LinkedList<Task> tasks = new LinkedList<Task>();
		tasks.add(TaskTest.getTestTask());
		tasks.add(TaskTest.getTestTask());
		r.setTasks(tasks);
		
		LinkedList<ReportPerson> principals = new LinkedList<ReportPerson>();
		ReportPerson principal = PersonTest.personToReportPerson(PersonTest.getSteveStevesonStub());
		principal.setPrimary(true);
		principals.add(principal);
		r.setAttendees(principals);
		
		r.setReportText("Lorem ipsum dolor sit amet, consectetur adipiscing elit, "
				+ "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. "
				+ "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris "
				+ "nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in "
				+ "reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla "
				+ "pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa "
				+ "qui officia deserunt mollit anim id est laborum.");
		r.setNextSteps("Go for a boat ride with Steve tomorrow");
		
		Comment c = new Comment();
		c.setCreatedAt(Instant.ofEpochMilli(1453815803000L));
		c.setAuthor(PersonTest.getJackJacksonStub());
		c.setText("I really like this report, it's awesome!!!");
		c.setReportUuid(null);
		LinkedList<Comment> comments = new LinkedList<Comment>();
		comments.add(c);
		r.setComments(comments);

		final List<Tag> tags = new ArrayList<Tag>();
		final Tag t1 = new Tag();
		t1.setName("name1");
		t1.setDescription("desc1");
		tags.add(t1);
		final Tag t2 = new Tag();
		t2.setName("name2");
		t2.setDescription("desc2");
		tags.add(t2);
		r.setTags(tags);

		final ReportSensitiveInformation rsi = new ReportSensitiveInformation();
		rsi.setText("For your eyes only");
		r.setReportSensitiveInformation(rsi);

		LinkedList<AuthorizationGroup> authorizationGroups = new LinkedList<AuthorizationGroup>();
		authorizationGroups.add(AuthorizationGroupTest.getTestAuthorizationGroup());
		r.setAuthorizationGroups(authorizationGroups);

		return r;
	}
	
	
	
	@Test
	public void serializesToJson() throws Exception {
		serializesToJson(getTestReport(), "testJson/reports/test.json");
	}
	
	@Test
	public void deserializesFromJson() throws Exception {
		deserializesFromJson(getTestReport(), "testJson/reports/test.json");
    }
	
	@Test
	public void staticCreatorTest() { 
		Report r = Report.createWithUuid("4");
		assertThat(r.getUuid()).isEqualTo("4");
		assertThat(r.getReportText()).isNull();
		assertThat(r.getApprovalStep()).isNull();
		assertThat(r.getNextSteps()).isNull();
		assertThat(r.getCreatedAt()).isNull();
	}
	
}
