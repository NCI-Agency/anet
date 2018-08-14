package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;

import org.junit.Test;

import io.dropwizard.client.JerseyClientBuilder;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Task.TaskStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
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
		assertThat(a.getId()).isNotNull();
				
		Task b = httpQuery("/api/tasks/new", admin)
				.post(Entity.json(TestData.createTask("TestM1", "Teach a person how to fish", "Test-Milestone", a, null, TaskStatus.ACTIVE)), Task.class);
		assertThat(b.getId()).isNotNull();
		
		Task c = httpQuery("/api/tasks/new", admin)
				.post(Entity.json(TestData.createTask("TestM2", "Watch the person fishing", "Test-Milestone", a, null, TaskStatus.ACTIVE)), Task.class);
		assertThat(c.getId()).isNotNull();
		
		Task d = httpQuery("/api/tasks/new", admin)
				.post(Entity.json(TestData.createTask("TestM3", "Have the person go fishing without you", "Test-Milestone", a, null, TaskStatus.ACTIVE)), Task.class);
		assertThat(d.getId()).isNotNull();
		
		Task e = httpQuery("/api/tasks/new", admin)
				.post(Entity.json(TestData.createTask("TestF2", "Be a thing in a test case", "Test-EF", null, null, TaskStatus.ACTIVE)), Task.class);
		assertThat(e.getId()).isNotNull();
		
		Task returned = httpQuery("/api/tasks/" + a.getId(), admin).get(Task.class);
		assertThat(returned).isEqualTo(a);
		returned = httpQuery("/api/tasks/" + b.getId(), admin).get(Task.class);
		assertThat(returned).isEqualTo(b);		
		
		//modify a task. 
		a.setLongName("Do a thing with a person modified");
		Response resp = httpQuery("/api/tasks/update", admin).post(Entity.json(a));
		assertThat(resp.getStatus()).isEqualTo(200);
		returned = httpQuery("/api/tasks/" + a.getId(), jack).get(Task.class);
		assertThat(returned.getLongName()).isEqualTo(a.getLongName());

		//Assign the Task to the AO
		List<Organization> orgs = httpQuery("/api/organizations/search?text=EF8", jack).get(new GenericType<AnetBeanList<Organization>>(){}).getList();
		Organization ef8 = orgs.stream().filter(o -> o.getShortName().equals("EF8")).findFirst().get();
		assertThat(ef8).isNotNull();
		
		a.setResponsibleOrg(ef8);
		resp = httpQuery("/api/tasks/update", admin).post(Entity.json(a));
		assertThat(resp.getStatus()).isEqualTo(200);
		returned = httpQuery("/api/tasks/" + a.getId(), jack).get(Task.class);
		assertThat(returned.getResponsibleOrg().getId()).isEqualTo(ef8.getId());
		
		//Fetch the tasks off the organization
		List<Task> tasks = httpQuery("/api/organizations/" + ef8.getId() + "/tasks", jack).get(new GenericType<AnetBeanList<Task>>(){}).getList();
		assertThat(tasks).contains(a);
		
		//Search for the task: 
		
		//set task to inactive
		a.setStatus(TaskStatus.INACTIVE);
		resp = httpQuery("/api/tasks/update", admin).post(Entity.json(a));
		assertThat(resp.getStatus()).isEqualTo(200);
		returned = httpQuery("/api/tasks/" + a.getId(), jack).get(Task.class);
		assertThat(returned.getStatus()).isEqualTo(TaskStatus.INACTIVE);
	}
	
	@Test
	public void searchTest() { 
		Person jack = getJackJackson();
		
		TaskSearchQuery query = new TaskSearchQuery();
		query.setText("Budget");
		List<Task> searchResults = httpQuery("/api/tasks/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Task>>(){}).getList();
		assertThat(searchResults).isNotEmpty();
		assertThat(searchResults.stream()
				.filter(p -> p.getLongName().toLowerCase().contains("budget"))
				.count())
			.isEqualTo(searchResults.size());
		
		//Search for a task by the organization
		AnetBeanList<Organization> orgs = httpQuery("/api/organizations/search?text=EF%202", jack).get(new GenericType<AnetBeanList<Organization>>(){});
		Organization ef2 = orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2")).findFirst().get();
		assertThat(ef2).isNotNull();
		
		query.setText(null);
		query.setResponsibleOrgId(ef2.getId());
		searchResults = httpQuery("/api/tasks/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Task>>(){}).getList();
		assertThat(searchResults).isNotEmpty();
		assertThat(searchResults.stream()
				.filter(p -> p.getResponsibleOrg().getId().equals(ef2.getId()))
				.count())
			.isEqualTo(searchResults.size());
		
		//Search by category
		query.setResponsibleOrgId(null);
		query.setText("expenses");
		query.setCategory("Milestone");
		searchResults = httpQuery("/api/tasks/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Task>>(){}).getList();
		assertThat(searchResults).isNotEmpty();
		
		//Autocomplete
		query = new TaskSearchQuery();
		query.setText("1.1*");
		searchResults = httpQuery("/api/tasks/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Task>>(){}).getList();
		assertThat(searchResults.stream().filter(p -> p.getShortName().equals("1.1")).count()).isEqualTo(1);
		assertThat(searchResults.stream().filter(p -> p.getShortName().equals("1.1.A")).count()).isEqualTo(1);
		assertThat(searchResults.stream().filter(p -> p.getShortName().equals("1.1.B")).count()).isEqualTo(1);
		
		query.setText("1.1.A*");
		searchResults = httpQuery("/api/tasks/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Task>>(){}).getList();
		assertThat(searchResults.stream().filter(p -> p.getShortName().equals("1.1.A")).count()).isEqualTo(1);
	}
	
	@Test
	public void getAllTasksTest() { 
		Person jack = getJackJackson();
		
		AnetBeanList<Task> list = httpQuery("/api/tasks/", jack).get(new GenericType<AnetBeanList<Task>>(){});
		assertThat(list).isNotNull();
		assertThat(list.getList()).isNotEmpty();
	}
}
