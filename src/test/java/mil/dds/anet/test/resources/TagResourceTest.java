package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.UnsupportedEncodingException;

import javax.ws.rs.BadRequestException;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.core.GenericType;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.test.resources.utils.GraphQLResponse;

public class TagResourceTest extends AbstractResourceTest {

	private static final String FIELDS = "id name description createdAt";

	@Rule
	public ExpectedException thrown = ExpectedException.none();

	@Test
	public void tagCreateTest() throws UnsupportedEncodingException {
		final Tag t = new Tag();
		t.setName("name");
		t.setDescription("desc");

		// Create
		final Integer tId = graphQLHelper.createObject(admin, "createTag", "tag", "TagInput", t, new GenericType<GraphQLResponse<Tag>>() {});
		assertThat(tId).isNotNull();
		final Tag created = graphQLHelper.getObjectById(admin, "tag", FIELDS, tId, new GenericType<GraphQLResponse<Tag>>() {});
		assertThat(created.getName()).isEqualTo(t.getName());
		assertThat(created.getDescription()).isEqualTo(t.getDescription());
		assertThat(created.getCreatedAt()).isNotNull();
		assertThat(created).isNotEqualTo(t);

		// Update
		created.setName("eman");
		final Integer nrUpdated = graphQLHelper.updateObject(admin, "updateTag", "tag", "TagInput", created);
		assertThat(nrUpdated).isEqualTo(1);

		// Get
		final Tag updated = graphQLHelper.getObjectById(admin, "tag", FIELDS, tId, new GenericType<GraphQLResponse<Tag>>() {});
		assertThat(updated).isEqualTo(created);
	}

	@Test
	public void tagExceptionTest() throws UnsupportedEncodingException {
		// Get with unknown id
		thrown.expect(NotFoundException.class);
		graphQLHelper.getObjectById(admin, "tag", FIELDS, -1, new GenericType<GraphQLResponse<Tag>>() {});

		// Create with empty name
		thrown.expect(BadRequestException.class);
		graphQLHelper.createObject(admin, "createTag", "tag", "TagInput", new Tag(), new GenericType<GraphQLResponse<Tag>>() {});
	}

	@Test
	public void tagListTest() throws UnsupportedEncodingException {
		// All
		final AnetBeanList<Tag> tagList = graphQLHelper.getAllObjects(admin, "tags",
				FIELDS, new GenericType<GraphQLResponse<AnetBeanList<Tag>>>() {});
		assertThat(tagList).isNotNull();
	}

	@Test
	public void tagSearchTest() throws UnsupportedEncodingException {
		// Search for a tag from the initial data
		final TagSearchQuery query = new TagSearchQuery();
		query.setText("bribery");
		final AnetBeanList<Tag> searchObjects = graphQLHelper.searchObjects(admin, "tagList", "query", "TagSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Tag>>>() {});
		assertThat(searchObjects).isNotNull();
		assertThat(searchObjects.getList()).isNotEmpty();
	}

}
