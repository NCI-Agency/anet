package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Response;

import org.joda.time.DateTime;
import org.junit.Test;

import com.google.common.collect.ImmutableList;

import io.dropwizard.client.JerseyClientBuilder;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Poam.PoamStatus;
import mil.dds.anet.beans.Poam;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.OrganizationList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.test.beans.OrganizationTest;
import mil.dds.anet.test.beans.PositionTest;

public class OrganizationResourceTest extends AbstractResourceTest {

	public OrganizationResourceTest() {
		if (client == null) {
			client = new JerseyClientBuilder(RULE.getEnvironment()).using(config).build("ao test client");
		}
	}

	@Test
	public void createAO() {
		Organization ao = OrganizationTest.getTestAO();
		final Person jack = getJackJackson();

		//Create a new AO
		Organization created = httpQuery("/api/organizations/new", admin)
			.post(Entity.json(ao), Organization.class);
		assertThat(ao.getShortName()).isEqualTo(created.getShortName());
		assertThat(ao.getLongName()).isEqualTo(created.getLongName());
		assertThat(ao.getIdentificationCode()).isEqualTo(created.getIdentificationCode());

		//update name of the AO
		created.setLongName("Ao McAoFace");
		Response resp = httpQuery("/api/organizations/update", admin)
				.post(Entity.json(created));
		assertThat(resp.getStatus()).isEqualTo(200);

		//Verify the AO name is updated.
		Organization updated = httpQuery(String.format("/api/organizations/%d",created.getId()), jack)
				.get(Organization.class);
		assertThat(updated.getLongName()).isEqualTo(created.getLongName());

		//Create a position and put it in this AO
		Position b1 = PositionTest.getTestAdvisor();
		b1.setOrganization(updated);
		b1.setCode(b1.getCode() + "_" + DateTime.now().getMillis());
		b1 = httpQuery("/api/positions/new", admin).post(Entity.json(b1), Position.class);
		assertThat(b1.getId()).isNotNull();
		assertThat(b1.getOrganization().getId()).isEqualTo(updated.getId());

		b1.setOrganization(updated);
		resp = httpQuery("/api/positions/update", admin).post(Entity.json(b1));
		assertThat(resp.getStatus()).isEqualTo(200);

		Position ret = httpQuery(String.format("/api/positions/%d", b1.getId()), admin).get(Position.class);
		assertThat(ret.getOrganization()).isNotNull();
		assertThat(ret.getOrganization().getId()).isEqualTo(updated.getId());

		//Create a child organizations
		Organization child = new Organization();
		child.setParentOrg(Organization.createWithId(created.getId()));
		child.setShortName("AO McChild");
		child.setLongName("Child McAo");
		child.setType(OrganizationType.ADVISOR_ORG);
		child = httpQuery("/api/organizations/new", admin)
				.post(Entity.json(child), Organization.class);
		assertThat(child.getId()).isNotNull();

		OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setParentOrgId(created.getId());
		OrganizationList children = httpQuery("/api/organizations/search", admin)
			.post(Entity.json(query), OrganizationList.class);
		assertThat(children.getList()).hasSize(1).contains(child);
		
		//Give this Org some Approval Steps
		ApprovalStep step1 = new ApprovalStep();
		step1.setName("First Approvers");
		step1.setApprovers(ImmutableList.of(b1));
		child.setApprovalSteps(ImmutableList.of(step1));
		resp = httpQuery("/api/organizations/update/", admin).post(Entity.json(child));
		assertThat(resp.getStatus()).isEqualTo(200);
		
		//Verify approval step was saved. 
		updated = httpQuery(String.format("/api/organizations/%d",child.getId()), jack).get(Organization.class);
		List<ApprovalStep> returnedSteps = updated.loadApprovalSteps();
		assertThat(returnedSteps.size()).isEqualTo(1);
		assertThat(returnedSteps.get(0).loadApprovers()).contains(b1);
		
		//Give this org a Poam
		Poam poam = new Poam();
		poam.setShortName("TST POM1");
		poam.setLongName("Verify that you can update Poams on a Organization");
		poam.setStatus(PoamStatus.ACTIVE);
		poam = httpQuery("/api/poams/new", admin).post(Entity.json(poam), Poam.class);
		assertThat(poam.getId()).isNotNull();
		
		child.setPoams(ImmutableList.of(poam));
		child.setApprovalSteps(null);
		resp = httpQuery("/api/organizations/update/", admin).post(Entity.json(child));
		assertThat(resp.getStatus()).isEqualTo(200);
		
		//Verify poam was saved. 
		updated = httpQuery(String.format("/api/organizations/%d",child.getId()), jack).get(Organization.class);
		assertThat(updated.loadPoams()).isNotNull();
		assertThat(updated.loadPoams().size()).isEqualTo(1);
		assertThat(updated.loadPoams().get(0).getId()).isEqualTo(poam.getId());
		
		//Change the approval steps. 
		step1.setApprovers(ImmutableList.of(admin.loadPosition()));
		ApprovalStep step2 = new ApprovalStep();
		step2.setName("Final Reviewers");
		step2.setApprovers(ImmutableList.of(b1));
		child.setApprovalSteps(ImmutableList.of(step1, step2));
		child.setPoams(null);
		resp = httpQuery("/api/organizations/update/", admin).post(Entity.json(child));
		assertThat(resp.getStatus()).isEqualTo(200);
		
		//Verify approval steps updated correct. 
		updated = httpQuery(String.format("/api/organizations/%d",child.getId()), jack).get(Organization.class);
		returnedSteps = updated.loadApprovalSteps();
		assertThat(returnedSteps.size()).isEqualTo(2);
		assertThat(returnedSteps.get(0).getName()).isEqualTo(step1.getName());
		assertThat(returnedSteps.get(0).loadApprovers()).containsExactly(admin.loadPosition());
		assertThat(returnedSteps.get(1).loadApprovers()).containsExactly(b1);
		
	}
	
	@Test
	public void searchTest() { 
		Person jack = getJackJackson();
		
		//Search by name
		OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setText("Ministry");
		List<Organization> results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), OrganizationList.class).getList();
		assertThat(results).isNotEmpty();
		
		//Search by name and type
		query.setType(OrganizationType.ADVISOR_ORG);
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), OrganizationList.class).getList();
		assertThat(results).isEmpty(); //Should be empty!
		
		query.setType(OrganizationType.PRINCIPAL_ORG);
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), OrganizationList.class).getList();
		assertThat(results).isNotEmpty();
		
		//Autocomplete puts the star in, verify that works. 
		query.setText("EF 2*");
		query.setType(null);
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), OrganizationList.class).getList();
		assertThat(results.stream().filter(o -> o.getShortName().equals("EF 2")).count()).isEqualTo(1);
		
		query.setText("EF 2.2*");
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), OrganizationList.class).getList();
		assertThat(results.stream().filter(o -> o.getShortName().equals("EF 2.2")).count()).isEqualTo(1);
		
		query.setText("MOD-F");
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), OrganizationList.class).getList();
		assertThat(results.stream().filter(o -> o.getShortName().equals("MOD-F")).count()).isEqualTo(1);
		
		query.setText("MOD-F*");
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), OrganizationList.class).getList();
		assertThat(results.stream().filter(o -> o.getShortName().equals("MOD-F")).count()).isEqualTo(1);
		
		
	}

	@Test
	public void searchNoPaginationTest() {
		final OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setText("EF");
		query.setPageSize(1);
		final OrganizationList list1 = httpQuery("/api/organizations/search", admin).post(Entity.json(query), OrganizationList.class);
		assertThat(list1).isNotNull();
		assertThat(list1.getTotalCount()).isGreaterThan(1);

		query.setPageSize(0);
		final OrganizationList listAll = httpQuery("/api/organizations/search", admin).post(Entity.json(query), OrganizationList.class);
		assertThat(listAll).isNotNull();
		assertThat(listAll.getTotalCount()).isEqualTo(list1.getTotalCount());
		assertThat(listAll.getTotalCount()).isEqualTo(listAll.getList().size());
	}

	@Test
	public void getAllOrgsTest() { 
		Person jack = getJackJackson();
		
		int pageNum = 0;
		int pageSize = 10;
		int totalReturned = 0;
		int firstTotalCount = 0;
		OrganizationList list = null;
		do { 
			list = httpQuery("/api/organizations/?pageNum=" + pageNum + "&pageSize=" + pageSize, jack).get(OrganizationList.class);
			assertThat(list).isNotNull();
			assertThat(list.getPageNum()).isEqualTo(pageNum);
			assertThat(list.getPageSize()).isEqualTo(pageSize);
			totalReturned += list.getList().size();
			if (pageNum == 0) { firstTotalCount = list.getTotalCount(); }
			pageNum++;
		} while (list.getList().size() != 0); 
		
		assertThat(totalReturned).isEqualTo(firstTotalCount);
	}
}
