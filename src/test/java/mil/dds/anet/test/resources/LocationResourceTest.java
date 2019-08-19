package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import com.fasterxml.jackson.core.type.TypeReference;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.InvocationTargetException;
import javax.ws.rs.ForbiddenException;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import org.junit.Test;

public class LocationResourceTest extends AbstractResourceTest {

  private static final String FIELDS = "uuid name status lat lng";

  @Test
  public void locationTestGraphQL()
      throws IllegalAccessException, InvocationTargetException, InstantiationException {
    // Create
    final Location l = TestData.createLocation("The Boat Dock", 43.21, -87.65);
    final String lUuid = graphQLHelper.createObject(admin, "createLocation", "location",
        "LocationInput", l, new TypeReference<GraphQlResponse<Location>>() {});
    assertThat(lUuid).isNotNull();
    final Location created = graphQLHelper.getObjectById(admin, "location", FIELDS, lUuid,
        new TypeReference<GraphQlResponse<Location>>() {});
    assertThat(created.getName()).isEqualTo(l.getName());
    assertThat(created).isNotEqualTo(l);

    // Search
    // You cannot search for the Boat Dock location, because full-text indexing
    // is done in asynchronously and is not guaranteed to be done
    // so we search for a record in the base data set.
    final LocationSearchQuery query = new LocationSearchQuery();
    query.setText("Police");
    final AnetBeanList<Location> searchObjects =
        graphQLHelper.searchObjects(admin, "locationList", "query", "LocationSearchQueryInput",
            FIELDS, query, new TypeReference<GraphQlResponse<AnetBeanList<Location>>>() {});
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();

    // Update
    created.setName("Down by the Bay");
    final Integer nrUpdated =
        graphQLHelper.updateObject(admin, "updateLocation", "location", "LocationInput", created);
    assertThat(nrUpdated).isEqualTo(1);
    final Location updated = graphQLHelper.getObjectById(admin, "location", FIELDS, lUuid,
        new TypeReference<GraphQlResponse<Location>>() {});
    assertThat(updated).isEqualTo(created);
  }

  @Test
  public void locationCreateSuperUserPermissionTest() throws UnsupportedEncodingException {
    createLocation(getSuperUser());
  }

  @Test
  public void locationCreateRegularUserPermissionTest() throws UnsupportedEncodingException {
    createLocation(getRegularUser());
  }

  private void createLocation(Person user) {
    final Position position = user.getPosition();
    final boolean isSuperUser = position.getType() == PositionType.SUPER_USER;
    final Location l2 = TestData.createLocation("The Boat Dock2", 43.21, -87.65);
    try {
      final String lUuid = graphQLHelper.createObject(user, "createLocation", "location",
          "LocationInput", l2, new TypeReference<GraphQlResponse<Location>>() {});
      if (isSuperUser) {
        assertThat(lUuid).isNotNull();
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isSuperUser) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

  @Test
  public void locationUpdateSuperUserPermissionTest() throws UnsupportedEncodingException {
    updateLocation(getSuperUser());
  }

  @Test
  public void locationUpdateRegularUserPermissionTest() throws UnsupportedEncodingException {
    updateLocation(getRegularUser());
  }

  private void updateLocation(Person user) {
    final Position position = user.getPosition();
    final boolean isSuperUser = position.getType() == PositionType.SUPER_USER;
    final LocationSearchQuery query = new LocationSearchQuery();
    query.setText("Police");
    final AnetBeanList<Location> searchObjects =
        graphQLHelper.searchObjects(admin, "locationList", "query", "LocationSearchQueryInput",
            FIELDS, query, new TypeReference<GraphQlResponse<AnetBeanList<Location>>>() {});
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final Location l = searchObjects.getList().get(0);

    try {
      final Integer nrUpdated =
          graphQLHelper.updateObject(user, "updateLocation", "location", "LocationInput", l);
      if (isSuperUser) {
        assertThat(nrUpdated).isEqualTo(1);
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isSuperUser) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

}
