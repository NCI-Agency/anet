package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import com.fasterxml.jackson.core.type.TypeReference;
import java.io.UnsupportedEncodingException;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.NotFoundException;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import org.junit.Test;

public class TagResourceTest extends AbstractResourceTest {

  private static final String FIELDS = "uuid name description createdAt";

  @Test
  public void tagCreateTest() throws UnsupportedEncodingException {
    final Tag t = new Tag();
    t.setName("name");
    t.setDescription("desc");

    // Create
    final String tUuid = graphQLHelper.createObject(admin, "createTag", "tag", "TagInput", t,
        new TypeReference<GraphQlResponse<Tag>>() {});
    assertThat(tUuid).isNotNull();
    final Tag created = graphQLHelper.getObjectById(admin, "tag", FIELDS, tUuid,
        new TypeReference<GraphQlResponse<Tag>>() {});
    assertThat(created.getName()).isEqualTo(t.getName());
    assertThat(created.getDescription()).isEqualTo(t.getDescription());
    assertThat(created.getCreatedAt()).isNotNull();
    assertThat(created).isNotEqualTo(t);

    // Update
    created.setName("eman");
    final Integer nrUpdated =
        graphQLHelper.updateObject(admin, "updateTag", "tag", "TagInput", created);
    assertThat(nrUpdated).isEqualTo(1);

    // Get
    final Tag updated = graphQLHelper.getObjectById(admin, "tag", FIELDS, tUuid,
        new TypeReference<GraphQlResponse<Tag>>() {});
    assertThat(updated).isEqualTo(created);
  }

  @Test
  public void tagExceptionTest() throws UnsupportedEncodingException {
    // Get with unknown uuid
    try {
      graphQLHelper.getObjectById(admin, "tag", FIELDS, "-1",
          new TypeReference<GraphQlResponse<Tag>>() {});
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }

    // Create with empty name
    try {
      graphQLHelper.createObject(admin, "createTag", "tag", "TagInput", new Tag(),
          new TypeReference<GraphQlResponse<Tag>>() {});
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }
  }

  @Test
  public void tagSearchTest() throws UnsupportedEncodingException {
    // Search for a tag from the initial data
    final TagSearchQuery query = new TagSearchQuery();
    query.setText("bribery");
    final AnetBeanList<Tag> searchObjects =
        graphQLHelper.searchObjects(admin, "tagList", "query", "TagSearchQueryInput", FIELDS, query,
            new TypeReference<GraphQlResponse<AnetBeanList<Tag>>>() {});
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
  }

}
