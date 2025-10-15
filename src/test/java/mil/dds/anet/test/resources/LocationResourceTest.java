package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Location;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.LocationInput;
import mil.dds.anet.test.client.LocationSearchQueryInput;
import mil.dds.anet.test.client.LocationType;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.utils.UtilsTest;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClientResponseException;

public class LocationResourceTest extends AbstractResourceTest {

  public static final String _LOCATION_FIELDS =
      "uuid updatedAt name type description status lat lng customFields";
  public static final String FIELDS = String
      .format("{ %1$s parentLocations { %1$s } childrenLocations { %1$s } }", _LOCATION_FIELDS);

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
        t -> mutationExecutor.updateLocation("", false, getLocationInput(created)));
    assertThat(nrUpdated).isEqualTo(1);
    final Location updated =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, created.getUuid()));
    assertThat(updated.getName()).isEqualTo(created.getName());

    // Update description
    updated.setDescription(UtilsTest.getCombinedHtmlTestCase().getInput());
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateLocation("", false, getLocationInput(updated)));
    assertThat(nrUpdated).isEqualTo(1);
    final Location updated2 =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, created.getUuid()));

    // Add html to description and ensure it gets stripped out
    final LocationInput updatedDescInput = getLocationInput(updated2);
    updatedDescInput.setDescription(
        "<b>Hello world</b>.  I like script tags! <script>window.alert('hello world')</script>");
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateLocation("", false, updatedDescInput));
    assertThat(nrUpdated).isEqualTo(1);
    final Location updatedDesc =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, updatedDescInput.getUuid()));
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
    final Map<String, Object> newDict = new HashMap<>(dict.getDictionary());
    newDict.put("regularUsersCanCreateLocations", false);
    dict.setDictionary(newDict);
    createLocation(getRegularUser(), false);
  }

  private void createLocation(Person user, boolean shouldSucceed) {
    final LocationInput lInput = TestData.createLocationInput("The Boat Dock2", 43.21, -87.65);
    try {
      final Location l = withCredentials(getDomainUsername(user),
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
    final AnetBeanList_Location searchObjects = withCredentials(getDomainUsername(user),
        t -> queryExecutor.locationList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final Location l = searchObjects.getList().get(0);

    try {
      final Integer nrUpdated = withCredentials(getDomainUsername(user),
          t -> mutationExecutor.updateLocation("", false, getLocationInput(l)));
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

  @Test
  void illegalParentLocationTest() {
    final LocationSearchQueryInput query = LocationSearchQueryInput.builder()
        .withType(LocationType.COUNTRY).withText("Canada").build();
    final AnetBeanList_Location searchObjects =
        withCredentials(adminUser, t -> queryExecutor.locationList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final Location topLoc = searchObjects.getList().get(0);

    final LocationSearchQueryInput query2 = LocationSearchQueryInput.builder()
        .withType(LocationType.COUNTRY).withText("Australia").build();
    final AnetBeanList_Location searchObjects2 =
        withCredentials(adminUser, t -> queryExecutor.locationList(getListFields(FIELDS), query2));
    assertThat(searchObjects2).isNotNull();
    assertThat(searchObjects2.getList()).isNotEmpty();
    final Location topLoc2 = searchObjects2.getList().get(0);

    final String testSubLocUuid = "0855fb0a-995e-4a79-a132-4024ee2983ff"; // General Hospital
    final Location subLoc =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, testSubLocUuid));
    assertThat(subLoc).isNotNull();
    assertThat(subLoc.getUuid()).isEqualTo(testSubLocUuid);

    // Set self, topLoc2 as parents
    final LocationInput topLocInput = getLocationInput(topLoc);
    topLocInput.setParentLocations(List.of(getLocationInput(topLoc), getLocationInput(topLoc2)));
    try {
      // Should fail, as it would create a loop
      withCredentials(adminUser, t -> mutationExecutor.updateLocation("", false, topLocInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Set topLoc2, self as parents
    topLocInput.setParentLocations(List.of(getLocationInput(topLoc2), getLocationInput(topLoc)));
    try {
      // Should fail, as it would create a loop
      withCredentials(adminUser, t -> mutationExecutor.updateLocation("", false, topLocInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Set subLoc, topLoc2 as parents
    topLocInput.setParentLocations(List.of(getLocationInput(subLoc), getLocationInput(topLoc2)));
    try {
      // Should fail, as it would create a loop
      withCredentials(adminUser, t -> mutationExecutor.updateLocation("", false, topLocInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Set topLoc2, subLoc as parents
    topLocInput.setParentLocations(List.of(getLocationInput(topLoc2), getLocationInput(subLoc)));
    try {
      // Should fail, as it would create a loop
      withCredentials(adminUser, t -> mutationExecutor.updateLocation("", false, topLocInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void validParentLocationTest() {
    final LocationSearchQueryInput query = LocationSearchQueryInput.builder()
        .withType(LocationType.COUNTRY).withText("Antarctica").build();
    final AnetBeanList_Location searchObjects =
        withCredentials(adminUser, t -> queryExecutor.locationList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final Location topLoc = searchObjects.getList().get(0);

    final LocationSearchQueryInput query2 = LocationSearchQueryInput.builder()
        .withType(LocationType.COUNTRY).withText("Australia").build();
    final AnetBeanList_Location searchObjects2 =
        withCredentials(adminUser, t -> queryExecutor.locationList(getListFields(FIELDS), query2));
    assertThat(searchObjects2).isNotNull();
    assertThat(searchObjects2.getList()).isNotEmpty();
    final Location topLoc2 = searchObjects2.getList().get(0);

    final LocationSearchQueryInput query3 = LocationSearchQueryInput.builder()
        .withType(LocationType.COUNTRY).withText("New Zealand").build();
    final AnetBeanList_Location searchObjects3 =
        withCredentials(adminUser, t -> queryExecutor.locationList(getListFields(FIELDS), query3));
    assertThat(searchObjects3).isNotNull();
    assertThat(searchObjects3.getList()).isNotEmpty();
    final Location topLoc3 = searchObjects3.getList().get(0);

    final String testSubLocUuid = "e5b3a4b9-acf7-4c79-8224-f248b9a7215d"; // Antarctica
    final Location subLoc =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, testSubLocUuid));
    assertThat(subLoc).isNotNull();
    assertThat(subLoc.getUuid()).isEqualTo(testSubLocUuid);

    // Set topLoc, topLoc2, topLoc3 as parents (where topLoc is already a parent)
    final LocationInput subLocInput = getLocationInput(subLoc);
    subLocInput.setParentLocations(
        List.of(getLocationInput(topLoc), getLocationInput(topLoc2), getLocationInput(topLoc3)));
    final Integer nrResults =
        withCredentials(adminUser, t -> mutationExecutor.updateLocation("", false, subLocInput));
    assertThat(nrResults).isOne();

    final Location updatedSubLoc =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, subLoc.getUuid()));
    assertThat(updatedSubLoc).isNotNull();
    final List<String> parentLocationUuids =
        subLocInput.getParentLocations().stream().map(LocationInput::getUuid).toList();
    final List<String> updatedParentLocationUuids =
        updatedSubLoc.getParentLocations().stream().map(Location::getUuid).toList();
    assertThat(updatedParentLocationUuids).hasSameElementsAs(parentLocationUuids);

    // Remove all parents
    updatedSubLoc.setParentLocations(List.of());
    final Integer nrResults2 = withCredentials(adminUser,
        t -> mutationExecutor.updateLocation("", false, getLocationInput(updatedSubLoc)));
    assertThat(nrResults2).isOne();

    final Location updatedSubLoc2 =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, subLoc.getUuid()));
    assertThat(updatedSubLoc2.getParentLocations()).isEmpty();

    // Restore original parent
    updatedSubLoc2.setParentLocations(subLoc.getParentLocations());
    final Integer nrResults3 = withCredentials(adminUser,
        t -> mutationExecutor.updateLocation("", false, getLocationInput(updatedSubLoc2)));
    assertThat(nrResults3).isOne();

    final Location updatedSubLoc3 =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, subLoc.getUuid()));
    final List<String> parentLocationUuids3 =
        updatedSubLoc2.getParentLocations().stream().map(Location::getUuid).toList();
    final List<String> updatedParentLocationUuids3 =
        updatedSubLoc3.getParentLocations().stream().map(Location::getUuid).toList();
    assertThat(updatedParentLocationUuids3).hasSameElementsAs(parentLocationUuids3);
  }

  @Test
  void testUpdateConflict() {
    final String testUuid = "283797ec-7077-49b2-87b8-9afd5499b6f3";
    final Location test = withCredentials(adminUser, t -> queryExecutor.location(FIELDS, testUuid));

    // Update it
    final LocationInput updatedInput = getLocationInput(test);
    final String updatedDescription = UUID.randomUUID().toString();
    updatedInput.setDescription(updatedDescription);
    final Integer nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateLocation("", false, updatedInput));
    assertThat(nrUpdated).isOne();
    final Location updated =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, testUuid));
    assertThat(updated.getUpdatedAt()).isAfter(test.getUpdatedAt());
    assertThat(updated.getDescription()).isEqualTo(updatedDescription);

    // Try to update it again, with the input that is now outdated
    final LocationInput outdatedInput = getLocationInput(test);
    try {
      withCredentials(adminUser, t -> mutationExecutor.updateLocation("", false, outdatedInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      final Throwable rootCause = ExceptionUtils.getRootCause(expectedException);
      if (!(rootCause instanceof WebClientResponseException.Conflict)) {
        fail("Expected WebClientResponseException.Conflict");
      }
    }

    // Now do a force-update
    final Integer nrForceUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateLocation("", true, outdatedInput));
    assertThat(nrForceUpdated).isOne();
    final Location forceUpdated =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, testUuid));
    assertThat(forceUpdated.getUpdatedAt()).isAfter(updated.getUpdatedAt());
    assertThat(forceUpdated.getDescription()).isEqualTo(test.getDescription());
  }
}
