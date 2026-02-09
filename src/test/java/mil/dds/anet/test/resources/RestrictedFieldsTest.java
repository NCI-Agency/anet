package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.util.Lists.list;

import java.util.List;
import java.util.Objects;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.test.client.AnetBeanList_AuthorizationGroup;
import mil.dds.anet.test.client.AnetBeanList_Organization;
import mil.dds.anet.test.client.AnetBeanList_Person;
import mil.dds.anet.test.client.AnetBeanList_Position;
import mil.dds.anet.test.client.AuthorizationGroup;
import mil.dds.anet.test.client.AuthorizationGroupSearchQueryInput;
import mil.dds.anet.test.client.EmailAddress;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonSearchQueryInput;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionSearchQueryInput;
import mil.dds.anet.utils.Utils;
import org.junit.jupiter.api.Test;

class RestrictedFieldsTest extends AbstractResourceTest {
  private static final String EMAIL_NETWORK_INTERNET = "Internet";
  private static final String EMAIL_NETWORK_NS = "NS";
  private static final String EMAIL_NETWORK_PARAMETER = "emailNetwork";
  private static final List<String> MART_EMAIL_ADDRESSES = List.of("mart-user@kfor.nato.int",
      "mart-user-2@kfor.nato.int", "mart-user-3@kfor.nato.int", "mart-user-4@kfor.nato.int");
  private static final String EMAIL_ADDRESSES_FIELDS =
      "emailAddresses(network: ?" + EMAIL_NETWORK_PARAMETER + ") { network address }";
  private static final String PERSON_FIELDS =
      "{ uuid name users { uuid domainUsername } phoneNumber " + EMAIL_ADDRESSES_FIELDS + " }";
  private static final String ORGANIZATION_FIELDS =
      "{ uuid shortName longName identificationCode " + EMAIL_ADDRESSES_FIELDS + " }";
  private static final String POSITION_FIELDS =
      "{ uuid name code type role " + EMAIL_ADDRESSES_FIELDS + " }";
  private static final String AUTHORIZATION_GROUP_FIELDS =
      "{ uuid updatedAt name authorizationGroupRelatedObjects { "
          + "relatedObjectType relatedObjectUuid relatedObject { ... on Organization "
          + ORGANIZATION_FIELDS + "... on Person " + PERSON_FIELDS + "... on Position "
          + POSITION_FIELDS + " } } }";

  @Test
  void testAsRegularUser() {
    // Regular users can only access their own restricted fields
    final String domainUsername = "erin";

    // person search
    final List<String> phoneNumbers = list("+9-23-2323-2323");
    assertPersonSearch(domainUsername, EMAIL_NETWORK_INTERNET, 1, phoneNumbers, 1,
        list("erin@example.com"));
    assertPersonSearch(domainUsername, EMAIL_NETWORK_NS, 1, phoneNumbers, 1,
        list("erin@example.ns"));

    // organization search
    assertOrganizationSearch(domainUsername, EMAIL_NETWORK_INTERNET, 0, list());
    assertOrganizationSearch(domainUsername, EMAIL_NETWORK_NS, 0, list());

    // position search
    assertPositionSearch(domainUsername, EMAIL_NETWORK_INTERNET, 0, list());
    assertPositionSearch(domainUsername, EMAIL_NETWORK_NS, 0, list());

    // authorizationGroup search
    assertAuthorizationGroupSearch(domainUsername, EMAIL_NETWORK_INTERNET, 0, list());
    assertAuthorizationGroupSearch(domainUsername, EMAIL_NETWORK_NS, 0, list());
  }

  @Test
  void testAsSuperuser() {
    // Superuser can access restricted fields in the organization hierarchy they manage,
    // and also access restricted fields on people without a position
    final String domainUsername = "andrew";

    // person search
    final List<String> phoneNumbers = list("+1-111-1111", "+1-412-7324", "+1-412-9314",
        "+1-444-7324", "+1-777-7777", "+444-44-4545", "+99-9999-9999");
    assertPersonSearch(domainUsername, EMAIL_NETWORK_INTERNET, 8, phoneNumbers, 8,
        list("andrew@example.com", "bob@example.com", "hunter@example.com",
            "ima.reportgirl@example.com", "ima.reportguy@example.com", "liz@example.com",
            "selena@example.com", "shardul@example.com"));
    assertPersonSearch(domainUsername, EMAIL_NETWORK_NS, 8, phoneNumbers, 7,
        list("andrew@example.ns", "bob@example.ns", "ima.reportgirl@example.ns",
            "ima.reportguy@example.ns", "liz@example.ns", "selena@example.ns",
            "shardul@example.ns"));

    // organization search
    assertOrganizationSearch(domainUsername, EMAIL_NETWORK_INTERNET, 1, list("ef11@example.com"));
    assertOrganizationSearch(domainUsername, EMAIL_NETWORK_NS, 1, list("ef11@example.ns"));

    // position search
    assertPositionSearch(domainUsername, EMAIL_NETWORK_INTERNET, 2,
        list("ef11advisorG@example.com", "ef12advisor@example.com"));
    assertPositionSearch(domainUsername, EMAIL_NETWORK_NS, 2,
        list("ef11advisorG@example.ns", "ef12advisor@example.ns"));

    // authorizationGroup search
    assertAuthorizationGroupSearch(domainUsername, EMAIL_NETWORK_INTERNET, 1,
        list("ef11@example.com"));
    assertAuthorizationGroupSearch(domainUsername, EMAIL_NETWORK_NS, 1, list("ef11@example.ns"));
  }

  @Test
  void testAsAdmin() {
    // Admin can access all restricted fields
    testAsAuthorizedUser("arthur");
  }

  @Test
  void testAsAuthorizedUser() {
    // Jim is in the EF 5 community which can access all restricted fields
    testAsAuthorizedUser("jim");
  }

  private void testAsAuthorizedUser(final String domainUsername) {
    // person search
    final List<String> phoneNumbers = list("+011-232-12324", "+1-111-1111", "+1-202-7320",
        "+1-234-5678", "+1-264-7324", "+1-412-7324", "+1-412-9314", "+1-422222222", "+1-444-7324",
        "+1-777-7777", "+2-456-7324", "+23-23-11222", "+444-44-4444", "+444-44-4545",
        "+9-23-2323-2323", "+99-9999-9999", "123-456-78960");
    assertPersonSearch(domainUsername, EMAIL_NETWORK_INTERNET, 33, phoneNumbers, 35,
        list("advisor@example.com", "andrew@example.com", "arthur@example.com",
            "bemerged.myposwill@example.com", "ben+rogers@example.com", "bob@example.com",
            "billie.linton@example.com", "christopf@example.com", "chrisville.chris@example.com",
            "creed.bratton@example.com", "dwight.schrute@example.com", "erin@example.com",
            "henry@example.com", "hunter@example.com", "ima.reportgirl@example.com",
            "ima.reportguy@example.com", "inter.preter@example.com", "jack@example.com",
            "jacob@example.com", "jim.halpert@example.com", "kevin.malone@example.com",
            "kevin+rivers@example.com", "kyleson.kyle@example.com", "lin.guist@example.com",
            "liz@example.com", "merged.winner@example.com", "michael.scott@example.com",
            "nick@example.com", "rebecca@example.com", "reina@example.com", "roger@example.com",
            "selena@example.com", "shardul@example.com", "steve@example.com",
            "yoshie@example.com"));
    assertPersonSearch(domainUsername, EMAIL_NETWORK_NS, 33, phoneNumbers, 26,
        list("advisor@example.ns", "andrew@example.ns", "arthur@example.ns",
            "ben+rogers@example.ns", "billie.linton@example.ns", "bob@example.ns",
            "creed.bratton@example.ns", "dwight.schrute@example.ns", "erin@example.ns",
            "henry@example.ns", "ima.reportgirl@example.ns", "ima.reportguy@example.ns",
            "inter.preter@example.ns", "jack@example.ns", "jacob@example.ns",
            "jim.halpert@example.ns", "kevin.malone@example.ns", "kevin+rivers@example.ns",
            "lin.guist@example.ns", "liz@example.ns", "michael.scott@example.ns",
            "rebecca@example.ns", "reina@example.ns", "selena@example.ns", "shardul@example.ns",
            "yoshie@example.ns"));

    // organization search
    assertOrganizationSearch(domainUsername, EMAIL_NETWORK_INTERNET, 4,
        list("ef11@example.com", "ef22@example.com", "ef51@example.com", "lng@example.com"));
    assertOrganizationSearch(domainUsername, EMAIL_NETWORK_NS, 4,
        list("ef11@example.ns", "ef22@example.ns", "ef51@example.ns", "lng@example.ns"));

    // position search
    assertPositionSearch(domainUsername, EMAIL_NETWORK_INTERNET, 17,
        list("chiefOfMergePeopleTest1@moi.example.com", "chiefOfMergePeopleTest2@moi.example.com",
            "chiefOfPolice@moi.example.com", "chiefOfStaff@mod.example.com",
            "chiefOfTests@moi.example.com", "costAdder@mod.example.com",
            "directorOfBudgeting@mod.example.com", "directorOfTests@mod.example.com",
            "ef11advisorG@example.com", "ef12advisor@example.com",
            "ef22advisorSewingFacilities@example.com", "ef51advisorQualityAssurance@example.com",
            "executiveAssistant@mod.example.com", "mergeOne@mod.example.com",
            "minister@mod.example.com", "planningCaptain@mod.example.com",
            "writerOfExpenses@mod.example.com"));
    assertPositionSearch(domainUsername, EMAIL_NETWORK_NS, 4,
        list("ef11advisorG@example.ns", "ef12advisor@example.ns",
            "ef22advisorSewingFacilities@example.ns", "ef51advisorQualityAssurance@example.ns"));

    // authorizationGroup search
    assertAuthorizationGroupSearch(domainUsername, EMAIL_NETWORK_INTERNET, 2,
        list("ef11@example.com", "ef22@example.com"));
    assertAuthorizationGroupSearch(domainUsername, EMAIL_NETWORK_NS, 2,
        list("ef11@example.ns", "ef22@example.ns"));
  }

  private EmailAddress buildEmailAddress(final String network, final String address) {
    return EmailAddress.builder().withNetwork(network).withAddress(address).build();
  }

  private void assertPersonSearch(final String domainUsername, final String emailNetwork,
      final int expectedNrOfPhoneNumbers, final List<String> expectedPhoneNumbers,
      final int expectedNrOfEmailAddresses, final List<String> expectedEmailAddresses) {
    final PersonSearchQueryInput query = PersonSearchQueryInput.builder()
        .withEmailNetwork(EMAIL_NETWORK_INTERNET).withPageSize(0).build();
    final AnetBeanList_Person results = withCredentials(domainUsername, t -> queryExecutor
        .personList(getListFields(PERSON_FIELDS), query, EMAIL_NETWORK_PARAMETER, emailNetwork));
    assertThat(results).isNotNull();
    assertThat(results.getList()).filteredOn(p -> !Utils.isEmptyOrNull(p.getPhoneNumber()))
        .hasSize(expectedNrOfPhoneNumbers).map(Person::getPhoneNumber)
        .containsAll(expectedPhoneNumbers);
    assertThat(results.getList())
        .filteredOn(p -> !Utils.isEmptyOrNull(p.getEmailAddresses()) && p.getEmailAddresses()
            .stream().noneMatch(ea -> MART_EMAIL_ADDRESSES.contains(ea.getAddress())))
        .flatMap(Person::getEmailAddresses).hasSize(expectedNrOfEmailAddresses)
        .usingRecursiveFieldByFieldElementComparator().containsAll(
            expectedEmailAddresses.stream().map(a -> buildEmailAddress(emailNetwork, a)).toList());
  }

  private void assertOrganizationSearch(final String domainUsername, final String emailNetwork,
      final int expectedNrOfEmailAddresses, final List<String> expectedEmailAddresses) {
    final OrganizationSearchQueryInput query = OrganizationSearchQueryInput.builder()
        .withEmailNetwork(EMAIL_NETWORK_INTERNET).withPageSize(0).build();
    final AnetBeanList_Organization results = withCredentials(domainUsername,
        t -> queryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), query,
            EMAIL_NETWORK_PARAMETER, emailNetwork));
    assertThat(results).isNotNull();
    assertThat(results.getList()).filteredOn(o -> !Utils.isEmptyOrNull(o.getEmailAddresses()))
        .flatMap(Organization::getEmailAddresses).hasSize(expectedNrOfEmailAddresses)
        .usingRecursiveFieldByFieldElementComparator().containsAll(
            expectedEmailAddresses.stream().map(a -> buildEmailAddress(emailNetwork, a)).toList());
  }

  private void assertPositionSearch(final String domainUsername, final String emailNetwork,
      final int expectedNrOfEmailAddresses, final List<String> expectedEmailAddresses) {
    final PositionSearchQueryInput query = PositionSearchQueryInput.builder()
        .withEmailNetwork(EMAIL_NETWORK_INTERNET).withPageSize(0).build();
    final AnetBeanList_Position results = withCredentials(domainUsername,
        t -> queryExecutor.positionList(getListFields(POSITION_FIELDS), query,
            EMAIL_NETWORK_PARAMETER, emailNetwork));
    assertThat(results).isNotNull();
    assertThat(results.getList()).filteredOn(p -> !Utils.isEmptyOrNull(p.getEmailAddresses()))
        .flatMap(Position::getEmailAddresses).hasSize(expectedNrOfEmailAddresses)
        .usingRecursiveFieldByFieldElementComparator().containsAll(
            expectedEmailAddresses.stream().map(a -> buildEmailAddress(emailNetwork, a)).toList());
  }

  private void assertAuthorizationGroupSearch(final String domainUsername,
      final String emailNetwork, final int expectedNrOfEmailAddresses,
      final List<String> expectedEmailAddresses) {
    final AuthorizationGroupSearchQueryInput query = AuthorizationGroupSearchQueryInput.builder()
        .withEmailNetwork(EMAIL_NETWORK_INTERNET).withPageSize(0).build();
    final AnetBeanList_AuthorizationGroup results = withCredentials(domainUsername,
        t -> queryExecutor.authorizationGroupList(getListFields(AUTHORIZATION_GROUP_FIELDS), query,
            EMAIL_NETWORK_PARAMETER, emailNetwork));
    assertThat(results).isNotNull();
    assertThat(results.getList())
        .filteredOn(p -> !Utils.isEmptyOrNull(p.getAuthorizationGroupRelatedObjects()))
        .flatMap(AuthorizationGroup::getAuthorizationGroupRelatedObjects)
        .flatMap(ag -> Objects.requireNonNullElse(switch (ag.getRelatedObjectType()) {
          case OrganizationDao.TABLE_NAME ->
            ((Organization) ag.getRelatedObject()).getEmailAddresses();
          case PersonDao.TABLE_NAME -> ((Person) ag.getRelatedObject()).getEmailAddresses();
          case PositionDao.TABLE_NAME -> ((Position) ag.getRelatedObject()).getEmailAddresses();
          default -> list();
        }, list())).hasSize(expectedNrOfEmailAddresses)
        .usingRecursiveFieldByFieldElementComparator().containsAll(
            expectedEmailAddresses.stream().map(a -> buildEmailAddress(emailNetwork, a)).toList());
  }
}
