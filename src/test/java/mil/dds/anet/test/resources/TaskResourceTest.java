package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Response;

import org.junit.Test;

import io.dropwizard.client.JerseyClientBuilder;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Task.TaskStatus;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.OrganizationList;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.TaskList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.test.TestData;

public class TaskResourceTest extends AbstractResourceTest {

	public TaskResourceTest() { 
		if (client == null) { 
			client = new JerseyClientBuilder(RULE.getEnvironment()).using(config).build("task test client");
		}
	}
	
	@Test
	public void taskTest() { 
		final Person jack = getJackJackson();

		Task a = httpQuery("/api/tasks/new", admin)
			.post(Entity.json(TestData.createTask("TestF1", "Do a thing with a person", "Test-EF")), Task.class);
		assertThat(a.getUuid()).isNotNull();
				
		Task b = httpQuery("/api/tasks/new", admin)
				.post(Entity.json(TestData.createTask("TestM1", "Teach a person how to fish", "Test-Milestone", a, null, TaskStatus.ACTIVE)), Task.class);
		assertThat(b.getUuid()).isNotNull();
		
		Task c = httpQuery("/api/tasks/new", admin)
				.post(Entity.json(TestData.createTask("TestM2", "Watch the person fishing", "Test-Milestone", a, null, TaskStatus.ACTIVE)), Task.class);
		assertThat(c.getUuid()).isNotNull();
		
		Task d = httpQuery("/api/tasks/new", admin)
				.post(Entity.json(TestData.createTask("TestM3", "Have the person go fishing without you", "Test-Milestone", a, null, TaskStatus.ACTIVE)), Task.class);
		assertThat(d.getUuid()).isNotNull();
		
		Task e = httpQuery("/api/tasks/new", admin)
				.post(Entity.json(TestData.createTask("TestF2", "Be a thing in a test case", "Test-EF", null, null, TaskStatus.ACTIVE)), Task.class);
		assertThat(e.getUuid()).isNotNull();
		
		Task returned = httpQuery("/api/tasks/" + a.getUuid(), admin).get(Task.class);
		assertThat(returned).isEqualTo(a);
		returned = httpQuery("/api/tasks/" + b.getUuid(), admin).get(Task.class);
		assertThat(returned).isEqualTo(b);		
		
		//modify a task. 
		a.setLongName("Do a thing with a person modified");
		Response resp = httpQuery("/api/tasks/update", admin).post(Entity.json(a));
		assertThat(resp.getStatus()).isEqualTo(200);
		returned = httpQuery("/api/tasks/" + a.getUuid(), jack).get(Task.class);
		assertThat(returned.getLongName()).isEqualTo(a.getLongName());

		//Assign the Task to the AO
		List<Organization> orgs = httpQuery("/api/organizations/search?text=EF8", jack).get(OrganizationList.class).getList();
		Organization ef8 = orgs.stream().filter(o -> o.getShortName().equals("EF8")).findFirst().get();
		assertThat(ef8).isNotNull();
		
		a.setResponsibleOrg(ef8);
		resp = httpQuery("/api/tasks/update", admin).post(Entity.json(a));
		assertThat(resp.getStatus()).isEqualTo(200);
		returned = httpQuery("/api/tasks/" + a.getUuid(), jack).get(Task.class);
		assertThat(returned.getResponsibleOrg().getUuid()).isEqualTo(ef8.getUuid());
		
		//Fetch the tasks off the organization
		List<Task> tasks = httpQuery("/api/organizations/" + ef8.getUuid() + "/tasks", jack).get(TaskList.class).getList();
		assertThat(tasks).contains(a);
		
		//Search for the task: 
		
		//set task to inactive
		a.setStatus(TaskStatus.INACTIVE);
		resp = httpQuery("/api/tasks/update", admin).post(Entity.json(a));
		assertThat(resp.getStatus()).isEqualTo(200);
		returned = httpQuery("/api/tasks/" + a.getUuid(), jack).get(Task.class);
		assertThat(returned.getStatus()).isEqualTo(TaskStatus.INACTIVE);
	}
	
	@Test
	public void searchTest() { 
		Person jack = getJackJackson();
		
		TaskSearchQuery query = new TaskSearchQuery();
		query.setText("Budget");
		List<Task> searchResults = httpQuery("/api/tasks/search", jack).post(Entity.json(query), TaskList.class).getList();
		assertThat(searchResults).isNotEmpty();
		assertThat(searchResults.stream()
				.filter(p -> p.getLongName().toLowerCase().contains("budget"))
				.count())
			.isEqualTo(searchResults.size());
		
		//Search for a task by the organization
		OrganizationList orgs = httpQuery("/api/organizations/search?text=EF%202", jack).get(OrganizationList.class);
		Organization ef2 = orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2")).findFirst().get();
		assertThat(ef2).isNotNull();
		
		query.setText(null);
		query.setResponsibleOrgUuid(ef2.getUuid());
		searchResults = httpQuery("/api/tasks/search", jack).post(Entity.json(query), TaskList.class).getList();
		assertThat(searchResults).isNotEmpty();
		assertThat(searchResults.stream()
				.filter(p -> p.getResponsibleOrg().getUuid().equals(ef2.getUuid()))
				.count())
			.isEqualTo(searchResults.size());
		
		//Search by category
		query.setResponsibleOrgUuid(null);
		query.setText("expenses");
		query.setCategory("Milestone");
		searchResults = httpQuery("/api/tasks/search", jack).post(Entity.json(query), TaskList.class).getList();
		assertThat(searchResults).isNotEmpty();
		
		//Autocomplete
		query = new TaskSearchQuery();
		query.setText("1.1*");
		searchResults = httpQuery("/api/tasks/search", jack).post(Entity.json(query), TaskList.class).getList();
		assertThat(searchResults.stream().filter(p -> p.getShortName().equals("1.1")).count()).isEqualTo(1);
		assertThat(searchResults.stream().filter(p -> p.getShortName().equals("1.1.A")).count()).isEqualTo(1);
		assertThat(searchResults.stream().filter(p -> p.getShortName().equals("1.1.B")).count()).isEqualTo(1);
		
		query.setText("1.1.A*");
		searchResults = httpQuery("/api/tasks/search", jack).post(Entity.json(query), TaskList.class).getList();
		assertThat(searchResults.stream().filter(p -> p.getShortName().equals("1.1.A")).count()).isEqualTo(1);
	}
	
	@Test
	public void getAllTasksTest() { 
		Person jack = getJackJackson();
		
		TaskList list = httpQuery("/api/tasks/", jack).get(TaskList.class);
		assertThat(list).isNotNull();
		assertThat(list.getList()).isNotEmpty();
	}
}
