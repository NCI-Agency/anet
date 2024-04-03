package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.util.HashMap;
import java.util.Map;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Location;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.LocationInput;
import mil.dds.anet.test.client.LocationSearchQueryInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.utils.UtilsTest;
import org.junit.jupiter.api.Test;

public class LocationResourceTest extends AbstractResourceTest {

  public static final String FIELDS = "{ uuid name type description status lat lng customFields }";

  @Test
  void locationTestGraphQL() {
    // Create
    final LocationInput lInput = TestData.createLocationInput("The Boat Dock", 43.21, -87.65);
    final Location created =
        withCredentials(adminUser, t -> mutationExecutor.createLocation(FIELDS, lInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getName()).isEqualTo(lInput.getName());

    // Search
    // You cannot search for the Boat Dock location, because full-text indexing
    // is done asynchronously and is not guaranteed to be done,
    // so we search for a record in the base data set.
    final LocationSearchQueryInput query =
        LocationSearchQueryInput.builder().withText("Police").build();
    final AnetBeanList_Location searchObjects =
        withCredentials(adminUser, t -> queryExecutor.locationList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();

    // Update
    created.setName("Down by the Bay");
    Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateLocation("", getLocationInput(created)));
    assertThat(nrUpdated).isEqualTo(1);
    final Location updated =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, created.getUuid()));
    assertThat(updated.getName()).isEqualTo(created.getName());

    // Update description
    updated.setDescription(UtilsTest.getCombinedHtmlTestCase().getInput());
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateLocation("", getLocationInput(updated)));
    assertThat(nrUpdated).isEqualTo(1);


    // Add html to description and ensure it gets stripped out
    final LocationInput updatedDescInput = getLocationInput(updated);
    updatedDescInput.setDescription(
        "<b>Hello world</b>.  I like script tags! <script>window.alert('hello world')</script>");
    nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateLocation("", updatedDescInput));
    assertThat(nrUpdated).isEqualTo(1);
    final Location updatedDesc =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, updated.getUuid()));
    assertThat(updatedDesc.getDescription()).contains("<b>Hello world</b>");
    assertThat(updatedDesc.getDescription()).doesNotContain("<script>window.alert");

  }

  @Test
  void locationCreateSuperuserPermissionTest() {
    createLocation(getSuperuser(), true);
  }

  @Test
  void locationCreateRegularUserPermissionTest() {
    // By default, the test dictionary allows regular users to create locations
    createLocation(getRegularUser(), true);
    // Now test when they are not allowed
    final AnetConfiguration config = dropwizardApp.getConfiguration();
    final Map<String, Object> dict = new HashMap<>(config.getDictionary());
    dict.put("regularUsersCanCreateLocations", false);
    config.setDictionary(dict);
    createLocation(getRegularUser(), false);
  }

  private void createLocation(Person user, boolean shouldSucceed) {
    final LocationInput lInput = TestData.createLocationInput("The Boat Dock2", 43.21, -87.65);
    try {
      final Location l = withCredentials(user.getDomainUsername(),
          t -> mutationExecutor.createLocation(FIELDS, lInput));
      if (shouldSucceed) {
        assertThat(l).isNotNull();
        assertThat(l.getUuid()).isNotNull();
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (shouldSucceed) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }

  @Test
  void locationUpdateSuperuserPermissionTest() {
    updateLocation(getSuperuser());
  }

  @Test
  void locationUpdateRegularUserPermissionTest() {
    updateLocation(getRegularUser());
  }

  private void updateLocation(Person user) {
    final Position position = user.getPosition();
    final boolean isSuperuser = position.getType() == PositionType.SUPERUSER;
    final LocationSearchQueryInput query =
        LocationSearchQueryInput.builder().withText("Police").build();
    final AnetBeanList_Location searchObjects = withCredentials(user.getDomainUsername(),
        t -> queryExecutor.locationList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final Location l = searchObjects.getList().get(0);

    try {
      final Integer nrUpdated = withCredentials(user.getDomainUsername(),
          t -> mutationExecutor.updateLocation("", getLocationInput(l)));
      if (isSuperuser) {
        assertThat(nrUpdated).isEqualTo(1);
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isSuperuser) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }

  @Test
  void shouldBeSearchableViaCustomFields() {
    final var searchText = "consectetur";
    final LocationSearchQueryInput query =
        LocationSearchQueryInput.builder().withText(searchText).build();
    final AnetBeanList_Location searchObjects =
        withCredentials(adminUser, t -> queryExecutor.locationList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getTotalCount()).isOne();
    assertThat(searchObjects.getList()).allSatisfy(
        searchResult -> assertThat(searchResult.getCustomFields()).contains(searchText));
  }
}
