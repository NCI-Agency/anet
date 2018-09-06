package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.concurrent.ExecutionException;

import javax.ws.rs.ClientErrorException;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.joda.time.DateTime;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;

import com.google.common.collect.ImmutableList;

import io.dropwizard.client.JerseyClientBuilder;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationStatus;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Task.TaskStatus;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.test.beans.OrganizationTest;
import mil.dds.anet.test.beans.PositionTest;

public class OrganizationResourceTest extends AbstractResourceTest {

	@Rule
	public ExpectedException thrown = ExpectedException.none();

	public OrganizationResourceTest() {
		if (client == null) {
			client = new JerseyClientBuilder(RULE.getEnvironment()).using(config).build("ao test client");
		}
	}

	@Test
	public void createAO() throws InterruptedException, ExecutionException {
		final Organization ao = OrganizationTest.getTestAO(true);
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
		child.setStatus(OrganizationStatus.ACTIVE);
		child.setType(OrganizationType.ADVISOR_ORG);
		child = httpQuery("/api/organizations/new", admin)
				.post(Entity.json(child), Organization.class);
		assertThat(child.getId()).isNotNull();

		OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setParentOrgId(created.getId());
		AnetBeanList<Organization> children = httpQuery("/api/organizations/search", admin)
			.post(Entity.json(query), new GenericType<AnetBeanList<Organization>>(){});
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
		List<ApprovalStep> returnedSteps = updated.loadApprovalSteps(context).get();
		assertThat(returnedSteps.size()).isEqualTo(1);
		assertThat(returnedSteps.get(0).loadApprovers(context).get()).contains(b1);
		
		//Give this org a Task
		Task task = new Task();
		task.setShortName("TST POM1");
		task.setLongName("Verify that you can update Tasks on a Organization");
		task.setStatus(TaskStatus.ACTIVE);
		task = httpQuery("/api/tasks/new", admin).post(Entity.json(task), Task.class);
		assertThat(task.getId()).isNotNull();
		
		child.setTasks(ImmutableList.of(task));
		child.setApprovalSteps(null);
		resp = httpQuery("/api/organizations/update/", admin).post(Entity.json(child));
		assertThat(resp.getStatus()).isEqualTo(200);
		
		//Verify task was saved. 
		updated = httpQuery(String.format("/api/organizations/%d",child.getId()), jack).get(Organization.class);
		assertThat(updated.loadTasks()).isNotNull();
		assertThat(updated.loadTasks().size()).isEqualTo(1);
		assertThat(updated.loadTasks().get(0).getId()).isEqualTo(task.getId());
		
		//Change the approval steps. 
		step1.setApprovers(ImmutableList.of(admin.loadPosition()));
		ApprovalStep step2 = new ApprovalStep();
		step2.setName("Final Reviewers");
		step2.setApprovers(ImmutableList.of(b1));
		child.setApprovalSteps(ImmutableList.of(step1, step2));
		child.setTasks(null);
		resp = httpQuery("/api/organizations/update/", admin).post(Entity.json(child));
		assertThat(resp.getStatus()).isEqualTo(200);
		
		//Verify approval steps updated correct. 
		updated = httpQuery(String.format("/api/organizations/%d",child.getId()), jack).get(Organization.class);
		returnedSteps = updated.loadApprovalSteps(context).get();
		assertThat(returnedSteps.size()).isEqualTo(2);
		assertThat(returnedSteps.get(0).getName()).isEqualTo(step1.getName());
		assertThat(returnedSteps.get(0).loadApprovers(context).get()).containsExactly(admin.loadPosition());
		assertThat(returnedSteps.get(1).loadApprovers(context).get()).containsExactly(b1);
		
	}

	@Test
	public void createDuplicateAO() {
		// Create a new AO
		final Organization ao = OrganizationTest.getTestAO(true);
		final Organization created = httpQuery("/api/organizations/new", admin)
			.post(Entity.json(ao), Organization.class);
		assertThat(ao.getShortName()).isEqualTo(created.getShortName());
		assertThat(ao.getLongName()).isEqualTo(created.getLongName());
		assertThat(ao.getIdentificationCode()).isEqualTo(created.getIdentificationCode());

		// Trying to create another AO with the same identificationCode should fail
		thrown.expect(ClientErrorException.class);
		httpQuery("/api/organizations/new", admin).post(Entity.json(ao), Organization.class);
	}

	@Test
	public void updateDuplicateAO() {
		// Create a new AO
		final Organization ao1 = OrganizationTest.getTestAO(true);
		final Organization created1 = httpQuery("/api/organizations/new", admin)
			.post(Entity.json(ao1), Organization.class);
		assertThat(ao1.getShortName()).isEqualTo(created1.getShortName());
		assertThat(ao1.getLongName()).isEqualTo(created1.getLongName());
		assertThat(ao1.getIdentificationCode()).isEqualTo(created1.getIdentificationCode());

		// Create another new AO
		final Organization ao2 = OrganizationTest.getTestAO(true);
		final Organization created2 = httpQuery("/api/organizations/new", admin)
			.post(Entity.json(ao2), Organization.class);
		assertThat(ao2.getShortName()).isEqualTo(created2.getShortName());
		assertThat(ao2.getLongName()).isEqualTo(created2.getLongName());
		assertThat(ao2.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());

		// Trying to update AO2 with the same identificationCode as AO1 should fail
		created2.setIdentificationCode(ao1.getIdentificationCode());
		final Response resp = httpQuery("/api/organizations/update", admin).post(Entity.json(created2));
		assertThat(resp.getStatus()).isEqualTo(Status.CONFLICT.getStatusCode());
	}

	@Test
	public void createEmptyDuplicateAO() {
		// Create a new AO with NULL identificationCode
		final Organization ao1 = OrganizationTest.getTestAO(false);
		final Organization created1 = httpQuery("/api/organizations/new", admin)
			.post(Entity.json(ao1), Organization.class);
		assertThat(ao1.getShortName()).isEqualTo(created1.getShortName());
		assertThat(ao1.getLongName()).isEqualTo(created1.getLongName());
		assertThat(ao1.getIdentificationCode()).isEqualTo(created1.getIdentificationCode());

		// Creating another AO with NULL identificationCode should succeed
		final Organization created2 = httpQuery("/api/organizations/new", admin)
				.post(Entity.json(ao1), Organization.class);
		assertThat(ao1.getShortName()).isEqualTo(created2.getShortName());
		assertThat(ao1.getLongName()).isEqualTo(created2.getLongName());
		assertThat(ao1.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());

		// Creating an AO with empty identificationCode should succeed
		ao1.setIdentificationCode("");
		final Organization created3 = httpQuery("/api/organizations/new", admin)
				.post(Entity.json(ao1), Organization.class);
		assertThat(ao1.getShortName()).isEqualTo(created3.getShortName());
		assertThat(ao1.getLongName()).isEqualTo(created3.getLongName());
		assertThat(ao1.getIdentificationCode()).isEqualTo(created3.getIdentificationCode());

		// Creating another AO with empty identificationCode should succeed
		final Organization created4 = httpQuery("/api/organizations/new", admin)
				.post(Entity.json(ao1), Organization.class);
		assertThat(ao1.getShortName()).isEqualTo(created4.getShortName());
		assertThat(ao1.getLongName()).isEqualTo(created4.getLongName());
		assertThat(ao1.getIdentificationCode()).isEqualTo(created4.getIdentificationCode());

		// Create a new AO with non-NULL identificationCode
		final Organization ao2 = OrganizationTest.getTestAO(true);
		final Organization created5 = httpQuery("/api/organizations/new", admin)
			.post(Entity.json(ao2), Organization.class);
		assertThat(ao2.getShortName()).isEqualTo(created5.getShortName());
		assertThat(ao2.getLongName()).isEqualTo(created5.getLongName());
		assertThat(ao2.getIdentificationCode()).isEqualTo(created5.getIdentificationCode());

		// Updating this AO with empty identificationCode should succeed
		created5.setIdentificationCode("");
		final Response resp1 = httpQuery("/api/organizations/update", admin).post(Entity.json(created5));
		assertThat(resp1.getStatus()).isEqualTo(Status.OK.getStatusCode());

		// Updating this AO with NULL  identificationCode should succeed
		created5.setIdentificationCode(null);
		final Response resp2 = httpQuery("/api/organizations/update", admin).post(Entity.json(created5));
		assertThat(resp2.getStatus()).isEqualTo(Status.OK.getStatusCode());
	}

	@Test
	public void searchTest() { 
		Person jack = getJackJackson();
		
		//Search by name
		OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setText("Ministry");
		List<Organization> results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Organization>>(){}).getList();
		assertThat(results).isNotEmpty();
		
		//Search by name and type
		query.setType(OrganizationType.ADVISOR_ORG);
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Organization>>(){}).getList();
		assertThat(results).isEmpty(); //Should be empty!
		
		query.setType(OrganizationType.PRINCIPAL_ORG);
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Organization>>(){}).getList();
		assertThat(results).isNotEmpty();
		
		//Autocomplete puts the star in, verify that works. 
		query.setText("EF 2*");
		query.setType(null);
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Organization>>(){}).getList();
		assertThat(results.stream().filter(o -> o.getShortName().equals("EF 2")).count()).isEqualTo(1);
		
		query.setText("EF 2.2*");
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Organization>>(){}).getList();
		assertThat(results.stream().filter(o -> o.getShortName().equals("EF 2.2")).count()).isEqualTo(1);
		
		query.setText("MOD-F");
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Organization>>(){}).getList();
		assertThat(results.stream().filter(o -> o.getShortName().equals("MOD-F")).count()).isEqualTo(1);
		
		query.setText("MOD-F*");
		results = httpQuery("/api/organizations/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Organization>>(){}).getList();
		assertThat(results.stream().filter(o -> o.getShortName().equals("MOD-F")).count()).isEqualTo(1);
		
		
	}

	@Test
	public void searchNoPaginationTest() {
		final OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setText("EF");
		query.setPageSize(1);
		final AnetBeanList<Organization> list1 = httpQuery("/api/organizations/search", admin).post(Entity.json(query), new GenericType<AnetBeanList<Organization>>(){});
		assertThat(list1).isNotNull();
		assertThat(list1.getTotalCount()).isGreaterThan(1);

		query.setPageSize(0);
		final AnetBeanList<Organization> listAll = httpQuery("/api/organizations/search", admin).post(Entity.json(query), new GenericType<AnetBeanList<Organization>>(){});
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
		AnetBeanList<Organization> list = null;
		do { 
			list = httpQuery("/api/organizations/?pageNum=" + pageNum + "&pageSize=" + pageSize, jack).get(new GenericType<AnetBeanList<Organization>>(){});
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
