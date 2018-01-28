package mil.dds.anet.test.beans;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.Test;

import mil.dds.anet.beans.Task;
import mil.dds.anet.views.AbstractAnetBean.LoadLevel;

public class TaskTest extends BeanTester<Task> {

	public static Task getTestTask() { 
		Task p = new Task();
		p.setShortName("F-1");
		p.setLongName("Run the bases");
		p.setCategory("Functional Area");
		return p;
	}
	
	@Test
	public void serializesToJson() throws Exception {
		serializesToJson(getTestTask(), "testJson/task/testTask.json");
	}
	
	@Test
	public void deserializesFromJson() throws Exception {
		deserializesFromJson(getTestTask(), "testJson/task/testTask.json");
    }

	@Test
	public void staticCreatorTest() { 
		Task p = Task.createWithId(4);
		assertThat(p.getId()).isEqualTo(4);
		assertThat(p.getLoadLevel()).isEqualTo(LoadLevel.ID_ONLY);
		assertThat(p.getLongName()).isNull();
	}
}
