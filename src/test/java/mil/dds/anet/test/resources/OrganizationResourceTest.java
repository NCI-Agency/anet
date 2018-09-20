package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.concurrent.ExecutionException;

import javax.ws.rs.ClientErrorException;
import javax.ws.rs.core.GenericType;

import org.joda.time.DateTime;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;

import com.google.common.collect.ImmutableList;

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
import mil.dds.anet.test.resources.utils.GraphQLResponse;

public class OrganizationResourceTest extends AbstractResourceTest {

	private static final String FIELDS = "id shortName longName status identificationCode type";
	private static final String POSITION_FIELDS = "id name code type status organization { id } location { id }";

	@Rule
	public ExpectedException thrown = ExpectedException.none();

	@Test
	public void createAO() throws InterruptedException, ExecutionException {
		final Organization ao = OrganizationTest.getTestAO(true);
		final Person jack = getJackJackson();

		//Create a new AO
		final Integer aoId = graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				ao, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(aoId).isNotNull();
		final Organization created = graphQLHelper.getObjectById(admin, "organization", FIELDS, aoId, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao.getShortName()).isEqualTo(created.getShortName());
		assertThat(ao.getLongName()).isEqualTo(created.getLongName());
		assertThat(ao.getIdentificationCode()).isEqualTo(created.getIdentificationCode());

		//update name of the AO
		created.setLongName("Ao McAoFace");
		Integer nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization", "OrganizationInput", created);
		assertThat(nrUpdated).isEqualTo(1);

		//Verify the AO name is updated.
		Organization updated = graphQLHelper.getObjectById(jack, "organization", FIELDS, created.getId(), new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(updated.getLongName()).isEqualTo(created.getLongName());

		//Create a position and put it in this AO
		Position b1 = PositionTest.getTestAdvisor();
		b1.setOrganization(updated);
		b1.setCode(b1.getCode() + "_" + DateTime.now().getMillis());
		final Integer b1Id = graphQLHelper.createObject(admin, "createPosition", "position", "PositionInput",
				b1, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(b1Id).isNotNull();
		b1 = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, b1Id, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(b1.getId()).isNotNull();
		assertThat(b1.getOrganization().getId()).isEqualTo(updated.getId());

		b1.setOrganization(updated);
		nrUpdated = graphQLHelper.updateObject(admin, "updatePosition", "position", "PositionInput", b1);
		assertThat(nrUpdated).isEqualTo(1);

		Position ret = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, b1.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(ret.getOrganization()).isNotNull();
		assertThat(ret.getOrganization().getId()).isEqualTo(updated.getId());

		//Create a child organizations
		Organization child = new Organization();
		child.setParentOrg(Organization.createWithId(created.getId()));
		child.setShortName("AO McChild");
		child.setLongName("Child McAo");
		child.setStatus(OrganizationStatus.ACTIVE);
		child.setType(OrganizationType.ADVISOR_ORG);
		final Integer childId = graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				child, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(childId).isNotNull();
		child = graphQLHelper.getObjectById(admin, "organization", FIELDS, childId, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(child.getId()).isNotNull();

		OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setParentOrgId(created.getId());
		final AnetBeanList<Organization> children = graphQLHelper.searchObjects(admin, "organizationList", "query", "OrganizationSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(children.getList()).hasSize(1).contains(child);
		
		//Give this Org some Approval Steps
		ApprovalStep step1 = new ApprovalStep();
		step1.setName("First Approvers");
		step1.setApprovers(ImmutableList.of(b1));
		child.setApprovalSteps(ImmutableList.of(step1));
		nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization", "OrganizationInput", child);
		assertThat(nrUpdated).isEqualTo(1);
		
		//Verify approval step was saved. 
		updated = graphQLHelper.getObjectById(jack, "organization", FIELDS, child.getId(), new GenericType<GraphQLResponse<Organization>>() {});
		List<ApprovalStep> returnedSteps = updated.loadApprovalSteps(context).get();
		assertThat(returnedSteps.size()).isEqualTo(1);
		assertThat(returnedSteps.get(0).loadApprovers(context).get()).contains(b1);
		
		//Give this org a Task
		Task task = new Task();
		task.setShortName("TST POM1");
		task.setLongName("Verify that you can update Tasks on a Organization");
		task.setStatus(TaskStatus.ACTIVE);
		final Integer taskId = graphQLHelper.createObject(admin, "createTask", "task", "TaskInput",
				task, new GenericType<GraphQLResponse<Task>>() {});
		assertThat(taskId).isNotNull();
		task = graphQLHelper.getObjectById(admin, "task", "id shortName longName status", taskId, new GenericType<GraphQLResponse<Task>>() {});
		assertThat(task.getId()).isNotNull();
		
		child.setTasks(ImmutableList.of(task));
		child.setApprovalSteps(null);
		nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization", "OrganizationInput", child);
		assertThat(nrUpdated).isEqualTo(1);
		
		//Verify task was saved. 
		updated = graphQLHelper.getObjectById(jack, "organization", FIELDS, child.getId(), new GenericType<GraphQLResponse<Organization>>() {});
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
		nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization", "OrganizationInput", child);
		assertThat(nrUpdated).isEqualTo(1);
		
		//Verify approval steps updated correct. 
		updated = graphQLHelper.getObjectById(jack, "organization", FIELDS, child.getId(), new GenericType<GraphQLResponse<Organization>>() {});
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
		final Integer aoId = graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				ao, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(aoId).isNotNull();
		final Organization created = graphQLHelper.getObjectById(admin, "organization", FIELDS, aoId, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao.getShortName()).isEqualTo(created.getShortName());
		assertThat(ao.getLongName()).isEqualTo(created.getLongName());
		assertThat(ao.getIdentificationCode()).isEqualTo(created.getIdentificationCode());

		// Trying to create another AO with the same identificationCode should fail
		thrown.expect(ClientErrorException.class);
		graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				ao, new GenericType<GraphQLResponse<Organization>>() {});
	}

	@Test
	public void updateDuplicateAO() {
		// Create a new AO
		final Organization ao1 = OrganizationTest.getTestAO(true);
		final Integer ao1Id = graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				ao1, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao1Id).isNotNull();
		final Organization created1 = graphQLHelper.getObjectById(admin, "organization", FIELDS, ao1Id, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao1.getShortName()).isEqualTo(created1.getShortName());
		assertThat(ao1.getLongName()).isEqualTo(created1.getLongName());
		assertThat(ao1.getIdentificationCode()).isEqualTo(created1.getIdentificationCode());

		// Create another new AO
		final Organization ao2 = OrganizationTest.getTestAO(true);
		final Integer ao2Id = graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				ao2, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao2Id).isNotNull();
		final Organization created2 = graphQLHelper.getObjectById(admin, "organization", FIELDS, ao2Id, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao2.getShortName()).isEqualTo(created2.getShortName());
		assertThat(ao2.getLongName()).isEqualTo(created2.getLongName());
		assertThat(ao2.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());

		// Trying to update AO2 with the same identificationCode as AO1 should fail
		created2.setIdentificationCode(ao1.getIdentificationCode());
		thrown.expect(ClientErrorException.class);
		graphQLHelper.updateObject(admin, "updateOrganization", "organization", "OrganizationInput", created2);
	}

	@Test
	public void createEmptyDuplicateAO() {
		// Create a new AO with NULL identificationCode
		final Organization ao1 = OrganizationTest.getTestAO(false);
		final Integer ao1Id = graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				ao1, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao1Id).isNotNull();
		final Organization created1 = graphQLHelper.getObjectById(admin, "organization", FIELDS, ao1Id, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao1.getShortName()).isEqualTo(created1.getShortName());
		assertThat(ao1.getLongName()).isEqualTo(created1.getLongName());
		assertThat(ao1.getIdentificationCode()).isEqualTo(created1.getIdentificationCode());

		// Creating another AO with NULL identificationCode should succeed
		final Integer ao2Id = graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				ao1, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao2Id).isNotNull();
		final Organization created2 = graphQLHelper.getObjectById(admin, "organization", FIELDS, ao2Id, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao1.getShortName()).isEqualTo(created2.getShortName());
		assertThat(ao1.getLongName()).isEqualTo(created2.getLongName());
		assertThat(ao1.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());

		// Creating an AO with empty identificationCode should succeed
		ao1.setIdentificationCode("");
		final Integer ao3Id = graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				ao1, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao3Id).isNotNull();
		final Organization created3 = graphQLHelper.getObjectById(admin, "organization", FIELDS, ao3Id, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao1.getShortName()).isEqualTo(created3.getShortName());
		assertThat(ao1.getLongName()).isEqualTo(created3.getLongName());
		assertThat(ao1.getIdentificationCode()).isEqualTo(created3.getIdentificationCode());

		// Creating another AO with empty identificationCode should succeed
		final Integer ao4Id = graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				ao1, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao4Id).isNotNull();
		final Organization created4 = graphQLHelper.getObjectById(admin, "organization", FIELDS, ao4Id, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao1.getShortName()).isEqualTo(created4.getShortName());
		assertThat(ao1.getLongName()).isEqualTo(created4.getLongName());
		assertThat(ao1.getIdentificationCode()).isEqualTo(created4.getIdentificationCode());

		// Create a new AO with non-NULL identificationCode
		final Organization ao2 = OrganizationTest.getTestAO(true);
		final Integer ao5Id = graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				ao2, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao5Id).isNotNull();
		final Organization created5 = graphQLHelper.getObjectById(admin, "organization", FIELDS, ao5Id, new GenericType<GraphQLResponse<Organization>>() {});
		assertThat(ao2.getShortName()).isEqualTo(created5.getShortName());
		assertThat(ao2.getLongName()).isEqualTo(created5.getLongName());
		assertThat(ao2.getIdentificationCode()).isEqualTo(created5.getIdentificationCode());

		// Updating this AO with empty identificationCode should succeed
		created5.setIdentificationCode("");
		Integer nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization", "OrganizationInput", created5);
		assertThat(nrUpdated).isEqualTo(1);

		// Updating this AO with NULL  identificationCode should succeed
		created5.setIdentificationCode(null);
		nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization", "OrganizationInput", created5);
		assertThat(nrUpdated).isEqualTo(1);
	}

	@Test
	public void searchTest() { 
		Person jack = getJackJackson();
		
		//Search by name
		OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setText("Ministry");
		AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(jack, "organizationList", "query", "OrganizationSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(orgs.getList()).isNotEmpty();
		
		//Search by name and type
		query.setType(OrganizationType.ADVISOR_ORG);
		orgs = graphQLHelper.searchObjects(jack, "organizationList", "query", "OrganizationSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(orgs.getList()).isEmpty(); //Should be empty!
		
		query.setType(OrganizationType.PRINCIPAL_ORG);
		orgs = graphQLHelper.searchObjects(jack, "organizationList", "query", "OrganizationSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(orgs.getList()).isNotEmpty();
		
		//Autocomplete puts the star in, verify that works. 
		query.setText("EF 2*");
		query.setType(null);
		orgs = graphQLHelper.searchObjects(jack, "organizationList", "query", "OrganizationSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2")).count()).isEqualTo(1);
		
		query.setText("EF 2.2*");
		orgs = graphQLHelper.searchObjects(jack, "organizationList", "query", "OrganizationSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2.2")).count()).isEqualTo(1);
		
		query.setText("MOD-F");
		orgs = graphQLHelper.searchObjects(jack, "organizationList", "query", "OrganizationSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("MOD-F")).count()).isEqualTo(1);
		
		query.setText("MOD-F*");
		orgs = graphQLHelper.searchObjects(jack, "organizationList", "query", "OrganizationSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("MOD-F")).count()).isEqualTo(1);
	}

	@Test
	public void searchNoPaginationTest() {
		final OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setText("EF");
		query.setPageSize(1);
		final AnetBeanList<Organization> list1 = graphQLHelper.searchObjects(admin, "organizationList", "query", "OrganizationSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(list1).isNotNull();
		assertThat(list1.getTotalCount()).isGreaterThan(1);

		query.setPageSize(0);
		final AnetBeanList<Organization> listAll = graphQLHelper.searchObjects(admin, "organizationList", "query", "OrganizationSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
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
			list = graphQLHelper.getAllObjects(jack, "organizations (pageNum: " + pageNum + ", pageSize: " + pageSize + ")",
					FIELDS, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
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
