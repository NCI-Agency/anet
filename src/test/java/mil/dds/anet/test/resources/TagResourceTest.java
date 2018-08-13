package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;

import javax.ws.rs.BadRequestException;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;

import io.dropwizard.client.JerseyClientBuilder;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;

public class TagResourceTest extends AbstractResourceTest {

	@Rule
	public ExpectedException thrown = ExpectedException.none();

	public TagResourceTest() {
		if (client == null) {
			client = new JerseyClientBuilder(RULE.getEnvironment()).using(config).build("test client");
		}
	}

	@Test
	public void tagCreateTest() throws UnsupportedEncodingException {
		final Tag t = new Tag();
		t.setName("name");
		t.setDescription("desc");

		// Create
		final Tag created = httpQuery("/api/tags/new", admin).post(Entity.json(t), Tag.class);
		assertThat(created.getName()).isEqualTo(t.getName());
		assertThat(created.getDescription()).isEqualTo(t.getDescription());
		assertThat(created.getCreatedAt()).isNotNull();
		assertThat(created).isNotEqualTo(t);

		// Update
		created.setName("eman");
		final Response resp = httpQuery("/api/tags/update", admin).post(Entity.json(created));
		assertThat(resp.getStatus()).isEqualTo(200);

		// Get
		final Tag returned = httpQuery(String.format("/api/tags/%d", created.getId()), admin).get(Tag.class);
		assertThat(returned).isEqualTo(created);
	}

	@Test
	public void tagExceptionTest() throws UnsupportedEncodingException {
		// Get with unknown id
		thrown.expect(NotFoundException.class);
		httpQuery(String.format("/api/tags/-1"), admin).get(Tag.class);

		// Create with empty name
		thrown.expect(BadRequestException.class);
		httpQuery("/api/tags/new", admin).post(Entity.json(new Tag()), Tag.class);
	}

	@Test
	public void tagListTest() throws UnsupportedEncodingException {
		// All
		final AnetBeanList<Tag> tagList = httpQuery("/api/tags/", admin).get(new GenericType<AnetBeanList<Tag>>(){});
		assertThat(tagList).isNotNull();
	}

	@Test
	public void tagSearchTest() throws UnsupportedEncodingException {
		// Search for a tag from the initial data
		final AnetBeanList<Tag> tagList  = httpQuery(String.format("/api/tags/search?text=%s",
				URLEncoder.encode("bribery", "UTF-8")), admin)
				.get(new GenericType<AnetBeanList<Tag>>(){});
		assertThat(tagList).isNotNull();
		final List<Tag> tags = tagList.getList();
		assertThat(tags).isNotNull();
		assertThat(tags.size()).isGreaterThan(0);
	}

}
