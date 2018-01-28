package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.atIndex;

import java.util.List;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;

import org.junit.Test;

import com.google.common.collect.ImmutableList;

import io.dropwizard.client.JerseyClientBuilder;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.test.beans.OrganizationTest;

public class ApprovalStepResourceTest extends AbstractResourceTest {

	public ApprovalStepResourceTest() { 
		if (client == null) { 
			client = new JerseyClientBuilder(RULE.getEnvironment()).using(config).build("approval step test client");
		}
	}
	
	@Test
	public void approvalTest() {
		final Person jack = getJackJackson(); //Get an authenticated user. 
		final Person liz = getElizabethElizawell();
		
		//Create an Advisor Organization
		Organization org = httpQuery("/api/organizations/new", admin)
				.post(Entity.json(OrganizationTest.getTestAO(true)), Organization.class);
		assertThat(org.getId()).isNotNull();
	
		//Create 3 steps in order for this AO
		ApprovalStep as1 = new ApprovalStep();
		as1.setName("Test Approval Step 1");
		as1.setAdvisorOrganizationId(org.getId());
		as1.setApprovers(ImmutableList.of(liz.loadPosition()));
		as1 = httpQuery("/api/approvalSteps/new", admin).post(Entity.json(as1), ApprovalStep.class);
		assertThat(as1.getId()).isNotNull();
		
		ApprovalStep as2 = new ApprovalStep();
		as2.setName("Test Approval Step 2");
		as2.setAdvisorOrganizationId(org.getId());
		as2.setApprovers(ImmutableList.of(admin.loadPosition()));
		as2 = httpQuery("/api/approvalSteps/new", admin).post(Entity.json(as2), ApprovalStep.class);
		assertThat(as2.getId()).isNotNull();
		
		as1.setNextStepId(as2.getId());
		Response resp = httpQuery("/api/approvalSteps/update", admin).post(Entity.json(as1));
		assertThat(resp.getStatus()).isEqualTo(200);
		
		//Get them back in order
		List<ApprovalStep> returned = httpQuery(String.format("/api/approvalSteps/byOrganization?orgId=%d", org.getId()), jack)
				.get(new GenericType<List<ApprovalStep>>() {});
		assertThat(returned.size()).isEqualTo(2);
		assertThat(returned).contains(as1, atIndex(0));
		assertThat(returned).contains(as2, atIndex(1));
		
		//Remove the first step
		resp = httpQuery(String.format("/api/approvalSteps/%d", as1.getId()), admin).delete();
		assertThat(resp.getStatus()).isEqualTo(200);
		
		returned = httpQuery(String.format("/api/approvalSteps/byOrganization?orgId=%d", org.getId()), jack)
				.get(new GenericType<List<ApprovalStep>>() {});
		assertThat(returned.size()).isEqualTo(1);
		assertThat(returned).contains(as2, atIndex(0));
		
		//Create a new step and put in the middle
		ApprovalStep as4 = new ApprovalStep();
		as4.setName("Test Approval Step 4");
		as4.setAdvisorOrganizationId(org.getId());
		as4 = httpQuery("/api/approvalSteps/new", admin).post(Entity.json(as4), ApprovalStep.class);
		assertThat(as4.getId()).isNotNull();
		
		as2.setNextStepId(as4.getId());
		resp = httpQuery("/api/approvalSteps/update", admin).post(Entity.json(as2));
		assertThat(resp.getStatus()).isEqualTo(200);
		
		//Get them back in order 2 -> 4
		returned = httpQuery("/api/approvalSteps/byOrganization?orgId=" + org.getId(), admin)
				.get(new GenericType<List<ApprovalStep>>() {});
		assertThat(returned.size()).isEqualTo(2);
		assertThat(returned).contains(as2, atIndex(0));
		assertThat(returned).contains(as4, atIndex(1));
		
	}
	
	//TODO: test that you cannot delete a step if a report is in that step. 
}
