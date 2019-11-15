package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.type.TypeReference;
import java.io.UnsupportedEncodingException;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.ForbiddenException;
import javax.ws.rs.NotFoundException;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import org.junit.Test;

public class TagResourceTest extends AbstractResourceTest {

  private static final String FIELDS = "uuid name description createdAt";

  @Test
  public void tagCreateUpdateAdminSuperUserTest() throws UnsupportedEncodingException {
    // Check admin
    createTag(admin, "name", "desc");
    // Check super-user
    createTag(getSuperUser(), "name2", "desc2");
  }

  private void createTag(Person user, String name, String description) {
    final Tag t = new Tag();
    t.setName(name);
    t.setDescription(description);

    // Create
    final String tUuid = graphQLHelper.createObject(user, "createTag", "tag", "TagInput", t,
        new TypeReference<GraphQlResponse<Tag>>() {});
    assertThat(tUuid).isNotNull();
    final Tag created = graphQLHelper.getObjectById(user, "tag", FIELDS, tUuid,
        new TypeReference<GraphQlResponse<Tag>>() {});
    assertThat(created.getName()).isEqualTo(t.getName());
    assertThat(created.getDescription()).isEqualTo(t.getDescription());
    assertThat(created.getCreatedAt()).isNotNull();
    assertThat(created).isNotEqualTo(t);

    // Update
    created.setName("eman");
    final Integer nrUpdated =
        graphQLHelper.updateObject(user, "updateTag", "tag", "TagInput", created);
    assertThat(nrUpdated).isEqualTo(1);

    // Get
    final Tag updated = graphQLHelper.getObjectById(user, "tag", FIELDS, tUuid,
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

  @Test
  public void tagCreateRegularUserPermissionTest() throws UnsupportedEncodingException {
    final Tag t = new Tag();
    t.setName("name3");
    t.setDescription("desc3");

    try {
      graphQLHelper.createObject(getRegularUser(), "createTag", "tag", "TagInput", t,
          new TypeReference<GraphQlResponse<Tag>>() {});
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

  @Test
  public void tagUpdateRegularUserPermissionTest() throws UnsupportedEncodingException {
    // Search for a tag from the initial data
    final TagSearchQuery query = new TagSearchQuery();
    query.setText("bribery");
    final AnetBeanList<Tag> searchObjects =
        graphQLHelper.searchObjects(admin, "tagList", "query", "TagSearchQueryInput", FIELDS, query,
            new TypeReference<GraphQlResponse<AnetBeanList<Tag>>>() {});
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final Tag t = searchObjects.getList().get(0);
    t.setName(t.getName() + "_update");

    try {
      graphQLHelper.updateObject(getRegularUser(), "updateTag", "tag", "TagInput", t);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

}
