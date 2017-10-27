package mil.dds.anet.test.beans;

import org.junit.Test;

import mil.dds.anet.beans.Tag;

public class TagTest extends BeanTester<Tag> {

	public static Tag getTestTag() {
		final Tag t = new Tag();
		t.setName("name");
		t.setDescription("desc");
		return t;
	}

	@Test
	public void serializesToJson() throws Exception {
		serializesToJson(getTestTag(), "testJson/tags/test.json");
	}

	@Test
	public void deserializesFromJson() throws Exception {
		deserializesFromJson(getTestTag(), "testJson/tags/test.json");
    }

}
