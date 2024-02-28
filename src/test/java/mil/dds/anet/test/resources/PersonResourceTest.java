package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.ImmutableList;
import java.text.Collator;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.test.client.AnetBeanList_Organization;
import mil.dds.anet.test.client.AnetBeanList_Person;
import mil.dds.anet.test.client.AnetBeanList_Position;
import mil.dds.anet.test.client.Attachment;
import mil.dds.anet.test.client.CustomSensitiveInformation;
import mil.dds.anet.test.client.CustomSensitiveInformationInput;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonInput;
import mil.dds.anet.test.client.PersonPositionHistory;
import mil.dds.anet.test.client.PersonPositionHistoryInput;
import mil.dds.anet.test.client.PersonSearchQueryInput;
import mil.dds.anet.test.client.PersonSearchSortBy;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionSearchQueryInput;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.RecurseStrategy;
import mil.dds.anet.test.client.SortOrder;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.utils.UtilsTest;
import mil.dds.anet.utils.DaoUtils;
import org.junit.jupiter.api.Test;

public class PersonResourceTest extends AbstractResourceTest {

  private static final String BIRTHDAY_FIELD = "birthday";
  private static final String POLITICAL_POSITION_FIELD = "politicalPosition";
  private static final String _CUSTOM_SENSITIVE_INFORMATION_FIELDS =
      "customSensitiveInformation { uuid customFieldName customFieldValue"
          + " relatedObjectType relatedObjectUuid createdAt updatedAt }";
  private static final String _EMAIL_ADDRESS_FIELDS = "network address";
  private static final String _POSITION_FIELDS =
      "uuid name code type role status organization { uuid }";
  private static final String _PERSON_FIELDS =
      "uuid name status user phoneNumber rank biography country avatarUuid code"
          + " gender endOfTourDate domainUsername openIdSubject pendingVerification createdAt updatedAt"
          + " customFields";
  public static final String PERSON_FIELDS_ONLY_HISTORY =
      "{ uuid previousPositions { startTime endTime position { uuid } } }";
  public static final String POSITION_FIELDS = String.format("{ %s person { %s } %s }",
      _POSITION_FIELDS, _PERSON_FIELDS, _CUSTOM_SENSITIVE_INFORMATION_FIELDS);
  public static final String FIELDS =
      String.format("{ %s emailAddresses { %s } position { %s } attachments %s %s }",
          _PERSON_FIELDS, _EMAIL_ADDRESS_FIELDS, _POSITION_FIELDS,
          AttachmentResourceTest.ATTACHMENT_FIELDS, _CUSTOM_SENSITIVE_INFORMATION_FIELDS);

  @Test
  void testCreatePerson() {
    final Person jack = getJackJackson();

    Person retPerson = withCredentials(jackUser, t -> queryExecutor.person(FIELDS, jack.getUuid()));
    assertThat(retPerson).isNotNull();
    assertThat(retPerson.getUuid()).isEqualTo(jack.getUuid());

    final PersonInput newPersonInput = PersonInput.builder().withName("testCreatePerson Person")
        .withStatus(Status.ACTIVE)
        // set HTML of biography
        .withBiography(UtilsTest.getCombinedHtmlTestCase().getInput())
        // set JSON of customFields
        .withCustomFields(UtilsTest.getCombinedJsonTestCase().getInput()).withGender("Female")
        .withCountry("Canada").withCode("123456")
        .withEndOfTourDate(
            ZonedDateTime.of(2020, 4, 1, 0, 0, 0, 0, DaoUtils.getServerNativeZoneId()).toInstant())
        .build();
    final Person newPerson =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(FIELDS, newPersonInput));
    assertThat(newPerson).isNotNull();
    assertThat(newPerson.getUuid()).isNotNull();
    assertThat(newPerson.getName()).isEqualTo("testCreatePerson Person");
    // check that HTML of biography is sanitized after create
    assertThat(newPerson.getBiography()).isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());
    // check that JSON of customFields is sanitized after create
    assertThat(newPerson.getCustomFields())
        .isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());

    final PersonInput updatedNewPersonInput = getPersonInput(newPerson);
    updatedNewPersonInput.setName("testCreatePerson updated name");
    updatedNewPersonInput.setCountry("The Commonwealth of Canada");
    updatedNewPersonInput.setCode("A123456");

    // update HTML of biography
    updatedNewPersonInput.setBiography(UtilsTest.getCombinedHtmlTestCase().getInput());
    // update JSON of customFields
    updatedNewPersonInput.setCustomFields(UtilsTest.getCombinedJsonTestCase().getInput());

    Integer nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updatePerson("", updatedNewPersonInput));
    assertThat(nrUpdated).isEqualTo(1);

    retPerson = withCredentials(jackUser,
        t -> queryExecutor.person(FIELDS, updatedNewPersonInput.getUuid()));
    assertThat(retPerson.getName()).isEqualTo(updatedNewPersonInput.getName());
    assertThat(retPerson.getCode()).isEqualTo(updatedNewPersonInput.getCode());
    // check that HTML of biography is sanitized after update
    assertThat(retPerson.getBiography()).isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());
    // check that JSON of customFields is sanitized after update
    assertThat(retPerson.getCustomFields())
        .isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());

    // Test creating a person with a position already set.
    final OrganizationSearchQueryInput query =
        OrganizationSearchQueryInput.builder().withText("EF 6").build();
    final AnetBeanList_Organization orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields("{ uuid shortName }"), query));
    assertThat(orgs.getList()).isNotEmpty();
    Organization org = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("EF 6")).findFirst().get();

    final PositionInput newPosInput =
        PositionInput.builder().withType(PositionType.REGULAR).withRole(PositionRole.MEMBER)
            .withName("Test Position").withOrganization(getOrganizationInput(org))
            .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();
    final Position newPos = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, newPosInput));
    assertThat(newPos).isNotNull();
    assertThat(newPos.getUuid()).isNotNull();

    final PersonInput newPerson2Input =
        PersonInput.builder().withName("Namey McNameface").withUser(true).withStatus(Status.ACTIVE)
            .withDomainUsername("testcreateperson").withPosition(getPositionInput(newPos)).build();
    final Person newPerson2 =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(FIELDS, newPerson2Input));
    assertThat(newPerson2).isNotNull();
    assertThat(newPerson2.getUuid()).isNotNull();
    assertThat(newPerson2.getPosition()).isNotNull();
    assertThat(newPerson2.getPosition().getUuid()).isEqualTo(newPos.getUuid());

    // Change this person w/ a new position, and ensure it gets changed.

    final PositionInput newPos2Input =
        PositionInput.builder().withType(PositionType.REGULAR).withRole(PositionRole.MEMBER)
            .withName("A Second Test Position").withOrganization(getOrganizationInput(org))
            .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();
    final Position newPos2 = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, newPos2Input));
    assertThat(newPos2).isNotNull();
    assertThat(newPos2.getUuid()).isNotNull();

    newPerson2.setName("Changey McChangeface");
    newPerson2.setPosition(newPos2);
    // A person cannot change their own position
    try {
      withCredentials(newPerson2.getDomainUsername(),
          t -> mutationExecutor.updatePerson("", getPersonInput(newPerson2)));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updatePerson("", getPersonInput(newPerson2)));
    assertThat(nrUpdated).isEqualTo(1);

    retPerson = withCredentials(adminUser, t -> queryExecutor.person(FIELDS, newPerson2.getUuid()));
    assertThat(retPerson).isNotNull();
    assertThat(retPerson.getName()).isEqualTo(newPerson2.getName());
    assertThat(retPerson.getPosition()).isNotNull();
    assertThat(retPerson.getPosition().getUuid()).isEqualTo(newPos2.getUuid());

    // Now newPerson2 who is a superuser, should NOT be able to edit newPerson
    // Because they are not in newPerson2's organization.
    try {
      withCredentials(newPerson2.getDomainUsername(),
          t -> mutationExecutor.updatePerson("", updatedNewPersonInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Add some scary HTML to newPerson2's profile and ensure it gets stripped out.
    newPerson2.setBiography(
        "<b>Hello world</b>.  I like script tags! <script>window.alert('hello world')</script>");
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updatePerson("", getPersonInput(newPerson2)));
    assertThat(nrUpdated).isEqualTo(1);

    retPerson = withCredentials(adminUser, t -> queryExecutor.person(FIELDS, newPerson2.getUuid()));
    assertThat(retPerson.getBiography()).contains("<b>Hello world</b>");
    assertThat(retPerson.getBiography()).doesNotContain("<script>window.alert");
  }

  @Test
  void searchPerson() {
    final PersonSearchQueryInput query1 = PersonSearchQueryInput.builder().withText("bob").build();

    AnetBeanList_Person searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query1));
    assertThat(searchResults.getTotalCount()).isPositive();
    assertThat(searchResults.getList().stream().filter(p -> p.getName().equals("BOBTOWN, Bob"))
        .findFirst()).isNotEmpty();

    final OrganizationSearchQueryInput queryOrgs =
        OrganizationSearchQueryInput.builder().withText("EF 1").build();
    final AnetBeanList_Organization orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields("{ uuid shortName }"), queryOrgs));
    assertThat(orgs.getList()).isNotEmpty();
    Organization org = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("EF 1.1")).findFirst().get();

    query1.setText(null);
    query1.setOrgUuid(org.getUuid());
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).isNotEmpty();

    query1.setOrgUuid(null);
    query1.setStatus(Status.INACTIVE);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(
        searchResults.getList().stream().filter(p -> p.getStatus() == Status.INACTIVE).count())
        .isEqualTo(searchResults.getList().size());

    // Search with children orgs
    org = orgs.getList().stream().filter(o -> o.getShortName().equalsIgnoreCase("EF 1")).findFirst()
        .get();
    query1.setStatus(null);
    query1.setOrgUuid(org.getUuid());
    // First don't include child orgs and then increase the scope and verify results increase.
    final AnetBeanList_Person parentOnlyResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query1));

    query1.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).isNotEmpty();
    final Set<String> srUuids =
        searchResults.getList().stream().map(Person::getUuid).collect(Collectors.toSet());
    final Set<String> poUuids =
        parentOnlyResults.getList().stream().map(Person::getUuid).collect(Collectors.toSet());
    assertThat(srUuids).containsAll(poUuids);

    query1.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).isNotEmpty();

    query1.setOrgUuid(null);
    query1.setText(null);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query1));
    assertThat(searchResults.getList()).hasSizeGreaterThan(1);

    query1.setText("e");
    query1.setSortBy(PersonSearchSortBy.NAME);
    query1.setSortOrder(SortOrder.DESC);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query1));
    final Collator collator = Collator.getInstance();
    collator.setStrength(Collator.PRIMARY);
    String prevName = null;
    for (final Person p : searchResults.getList()) {
      if (prevName != null) {
        assertThat(collator.compare(p.getName(), prevName)).isNotPositive();
      }
      prevName = p.getName();
    }

    // Search for a person with the name "A Dvisor"
    final PersonSearchQueryInput query2 =
        PersonSearchQueryInput.builder().withText("Dvisor").build();
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query2));
    long matchCount =
        searchResults.getList().stream().filter(p -> p.getName().equals("DVISOR, A")).count();
    assertThat(matchCount).isEqualTo(1);

    // Search for same person from an autocomplete box.
    query2.setText("Dvisor*");
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query2));
    matchCount =
        searchResults.getList().stream().filter(p -> p.getName().equals("DVISOR, A")).count();
    assertThat(matchCount).isEqualTo(1);


    // Search by email Address
    query2.setText("arthur@example.com");
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query2));
    matchCount = searchResults.getList().stream().filter(p -> p.getEmailAddresses().stream()
        .anyMatch(ea -> "arthur@example.com".equals(ea.getAddress()))).count();
    assertThat(matchCount).isEqualTo(1);

    // Search for persons with biography filled
    final PersonSearchQueryInput query3 =
        PersonSearchQueryInput.builder().withHasBiography(true).build();
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query3));
    assertThat(searchResults.getList()).isNotEmpty();

    // Search for persons with empty biography
    final PersonSearchQueryInput query4 =
        PersonSearchQueryInput.builder().withHasBiography(false).build();
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.personList(getListFields(FIELDS), query4));
    assertThat(searchResults.getList()).isNotEmpty();
  }

  @Test
  void testInactivatePerson() {
    final OrganizationSearchQueryInput query =
        OrganizationSearchQueryInput.builder().withText("EF 6").build();
    final AnetBeanList_Organization orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields("{ uuid shortName }"), query));
    assertThat(orgs.getList()).isNotEmpty();
    final Organization org = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("EF 6")).findFirst().get();
    assertThat(org.getUuid()).isNotNull();

    final PositionInput newPosInput =
        PositionInput.builder().withType(PositionType.REGULAR).withRole(PositionRole.MEMBER)
            .withName("Test Position").withOrganization(getOrganizationInput(org))
            .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();
    final Position retPos = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, newPosInput));
    assertThat(retPos).isNotNull();
    assertThat(retPos.getUuid()).isNotNull();

    final PersonInput newPersonInput = PersonInput.builder().withName("Namey McNameface")
        .withStatus(Status.ACTIVE).withDomainUsername("namey_" + Instant.now().toEpochMilli())
        .withPosition(getPositionInput(retPos)).build();
    final Person retPerson =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(FIELDS, newPersonInput));
    assertThat(retPerson).isNotNull();
    assertThat(retPerson.getUuid()).isNotNull();
    assertThat(retPerson.getPosition()).isNotNull();

    retPerson.setStatus(Status.INACTIVE);
    final Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updatePerson("", getPersonInput(retPerson)));
    assertThat(nrUpdated).isEqualTo(1);

    final Person retPerson2 =
        withCredentials(adminUser, t -> queryExecutor.person(FIELDS, retPerson.getUuid()));
    assertThat(retPerson2.getDomainUsername()).isNull();
    assertThat(retPerson2.getOpenIdSubject()).isNull();
    assertThat(retPerson2.getPosition()).isNull();
  }

  @Test
  void testPersonAvatar() {
    final Person erin = getRegularUser();

    Person retPerson = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.person(FIELDS, erin.getUuid()));
    assertThat(retPerson).isNotNull();
    assertThat(retPerson.getAttachments()).isNotEmpty();
    assertThat(retPerson.getAvatarUuid()).isNull();

    final Attachment attachment = retPerson.getAttachments().get(0);
    final PersonInput personWithAvatarInput =
        PersonInput.builder().withUuid(erin.getUuid()).withAvatarUuid(attachment.getUuid()).build();
    final PersonInput personWithoutAvatarInput =
        PersonInput.builder().withUuid(erin.getUuid()).build();

    // Set own avatar
    Integer nrUpdated = withCredentials(erin.getDomainUsername(),
        t -> mutationExecutor.updatePersonAvatar("", personWithAvatarInput));
    assertThat(nrUpdated).isOne();
    retPerson = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.person(FIELDS, erin.getUuid()));
    assertThat(retPerson.getAvatarUuid()).isEqualTo(attachment.getUuid());

    // Update as someone else
    try {
      withCredentials(jackUser,
          t -> mutationExecutor.updatePersonAvatar("", personWithAvatarInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Update as Erin's superuser
    nrUpdated = withCredentials("rebecca",
        t -> mutationExecutor.updatePersonAvatar("", personWithoutAvatarInput));
    assertThat(nrUpdated).isOne();
    retPerson = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.person(FIELDS, erin.getUuid()));
    assertThat(retPerson.getAvatarUuid()).isNull();

    // Update as admin
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updatePersonAvatar("", personWithAvatarInput));
    assertThat(nrUpdated).isOne();
    retPerson = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.person(FIELDS, erin.getUuid()));
    assertThat(retPerson.getAvatarUuid()).isEqualTo(attachment.getUuid());

    // Erase own avatar again
    nrUpdated = withCredentials(erin.getDomainUsername(),
        t -> mutationExecutor.updatePersonAvatar("", personWithoutAvatarInput));
    assertThat(nrUpdated).isOne();
    retPerson = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.person(FIELDS, erin.getUuid()));
    assertThat(retPerson.getAvatarUuid()).isNull();
  }

  @Test
  void personCreateSuperuserPermissionTest() {
    createPerson(getSuperuser());
  }

  @Test
  void personCreateRegularUserPermissionTest() {
    createPerson(getRegularUser());
  }

  private void createPerson(Person user) {
    final Position position = user.getPosition();
    final boolean isSuperuser = position.getType() == PositionType.SUPERUSER;
    final Organization organization = position.getOrganization();

    // interlocutor
    final PersonInput interlocutorInput =
        PersonInput.builder().withName("Namey McNameface").withStatus(Status.ACTIVE)
            .withDomainUsername("namey_" + Instant.now().toEpochMilli()).build();

    try {
      final Person p = withCredentials(user.getDomainUsername(),
          t -> mutationExecutor.createPerson(FIELDS, interlocutorInput));
      if (isSuperuser) {
        assertThat(p).isNotNull();
        assertThat(p.getUuid()).isNotNull();
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isSuperuser) {
        fail("Unexpected Exception", expectedException);
      }
    }

    // advisor with no position
    final PersonInput advisorNoPositionInput =
        PersonInput.builder().withName("Namey McNameface").withStatus(Status.ACTIVE)
            .withDomainUsername("namey_" + Instant.now().toEpochMilli()).build();

    try {
      final Person anp = withCredentials(user.getDomainUsername(),
          t -> mutationExecutor.createPerson(FIELDS, advisorNoPositionInput));
      if (isSuperuser) {
        assertThat(anp).isNotNull();
        assertThat(anp.getUuid()).isNotNull();
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isSuperuser) {
        fail("Unexpected Exception", expectedException);
      }
    }

    // advisor with position in own organization
    final PositionSearchQueryInput query = PositionSearchQueryInput.builder()
        .withOrganizationUuid(List.of(organization.getUuid())).withIsFilled(false).build();
    final AnetBeanList_Position searchObjects = withCredentials(user.getDomainUsername(),
        t -> queryExecutor.positionList(getListFields(POSITION_FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final Position freePos = searchObjects.getList().get(0);

    final PersonInput advisorPositionInput = PersonInput.builder().withName("Namey McNameface")
        .withStatus(Status.ACTIVE).withDomainUsername("namey_" + Instant.now().toEpochMilli())
        .withPosition(getPositionInput(freePos)).build();

    try {
      final Person ap = withCredentials(user.getDomainUsername(),
          t -> mutationExecutor.createPerson(FIELDS, advisorPositionInput));
      if (isSuperuser) {
        assertThat(ap).isNotNull();
        assertThat(ap.getUuid()).isNotNull();
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isSuperuser) {
        fail("Unexpected Exception", expectedException);
      }
    }

    // advisor with position in other organization
    final List<PositionType> positionTypes = new ArrayList<>();
    positionTypes.add(PositionType.REGULAR);
    final PositionSearchQueryInput query2 =
        PositionSearchQueryInput.builder().withType(positionTypes).withIsFilled(false).build();
    final AnetBeanList_Position searchObjects2 = withCredentials(user.getDomainUsername(),
        t -> queryExecutor.positionList(getListFields(POSITION_FIELDS), query2));
    assertThat(searchObjects2).isNotNull();
    assertThat(searchObjects2.getList()).isNotEmpty();
    final Optional<Position> foundPos2 = searchObjects2.getList().stream()
        .filter(p -> !organization.getUuid().equals(p.getOrganization().getUuid())).findFirst();
    assertThat(foundPos2).isPresent();
    final Position freePos2 = foundPos2.get();

    final PersonInput advisorPosition2Input = PersonInput.builder().withName("Namey McNameface")
        .withStatus(Status.ACTIVE).withDomainUsername("namey_" + Instant.now().toEpochMilli())
        .withPosition(getPositionInput(freePos2)).build();

    try {
      withCredentials(user.getDomainUsername(),
          t -> mutationExecutor.createPerson(FIELDS, advisorPosition2Input));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void testReadCustomSensitiveInformation() {
    // Steve already has sensitive data
    final String steveUuid = getSteveSteveson().getUuid();
    // Elizabeth can read all sensitive data of her counterpart Steve
    checkSensitiveInformation(steveUuid, "elizabeth",
        ImmutableList.of(BIRTHDAY_FIELD, POLITICAL_POSITION_FIELD));
    // Jim has no access to Steve's sensitive data
    checkSensitiveInformation(steveUuid, "jim", ImmutableList.of());
  }

  @Test
  void testInsertCustomSensitiveInformation() {
    // Christopf has no sensitive data yet
    final String christopfUuid = getChristopfTopferness().getUuid();
    // Admin has access to everything
    checkSensitiveInformationEdit(christopfUuid, adminUser,
        ImmutableList.of(BIRTHDAY_FIELD, POLITICAL_POSITION_FIELD), true);
    // Henry has access to Christopf's birthday
    checkSensitiveInformationEdit(christopfUuid, "henry", ImmutableList.of(BIRTHDAY_FIELD), true);
    // Bob has access to Christopf's politicalPosition
    checkSensitiveInformationEdit(christopfUuid, "bob", ImmutableList.of(POLITICAL_POSITION_FIELD),
        true);
  }

  @Test
  void testUpdatePersonHistory() {
    final OrganizationSearchQueryInput query =
        OrganizationSearchQueryInput.builder().withText("EF 6").build();
    final AnetBeanList_Organization orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields("{ uuid shortName }"), query));
    assertThat(orgs.getList()).isNotEmpty();
    final Organization org = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("EF 6")).findFirst().get();
    assertThat(org.getUuid()).isNotNull();

    final PersonInput persInput =
        PersonInput.builder().withName("Test person for edit history").build();
    final Person person =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(FIELDS, persInput));
    assertThat(person).isNotNull();
    assertThat(person.getUuid()).isNotNull();
    // Create a Position
    final PositionInput testInput1 = PositionInput.builder().withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withName("Test Position for person history edit  1")
        .withOrganization(getOrganizationInput(org))
        .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();

    final Position createdPos1 = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, testInput1));
    assertThat(createdPos1).isNotNull();
    assertThat(createdPos1.getUuid()).isNotNull();
    assertThat(createdPos1.getName()).isEqualTo(testInput1.getName());
    final PositionInput posInput1 = PositionInput.builder().withUuid(createdPos1.getUuid()).build();
    final PositionInput testInput2 = PositionInput.builder().withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withName("Test Position for person history edit 2")
        .withOrganization(getOrganizationInput(org))
        .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();

    final Position createdPos2 = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, testInput2));
    assertThat(createdPos2).isNotNull();
    assertThat(createdPos2.getUuid()).isNotNull();
    assertThat(createdPos2.getName()).isEqualTo(testInput2.getName());
    final PositionInput posInput2 = PositionInput.builder().withUuid(createdPos2.getUuid()).build();
    final PersonPositionHistoryInput hist1 = PersonPositionHistoryInput.builder()
        .withCreatedAt(Instant.now().minus(100, ChronoUnit.DAYS))
        .withStartTime(Instant.now().minus(100, ChronoUnit.DAYS))
        .withEndTime(Instant.now().minus(50, ChronoUnit.DAYS)).withPosition(posInput1).build();
    final PersonPositionHistoryInput hist2 =
        PersonPositionHistoryInput.builder().withCreatedAt(Instant.now().minus(49, ChronoUnit.DAYS))
            .withStartTime(Instant.now().minus(49, ChronoUnit.DAYS)).withEndTime(Instant.now())
            .withPosition(posInput2).build();

    final List<PersonPositionHistoryInput> historyList = new ArrayList<>();
    historyList.add(hist1);
    historyList.add(hist2);
    final PersonInput personInput = getPersonInput(person);
    personInput.setPreviousPositions(historyList);
    withCredentials(adminUser, t -> mutationExecutor.updatePersonHistory("", personInput));
    final Person personUpdated = withCredentials(adminUser,
        t -> queryExecutor.person(PERSON_FIELDS_ONLY_HISTORY, personInput.getUuid()));
    assertThat(personUpdated).isNotNull();
    final List<PersonPositionHistory> previousPositions = personUpdated.getPreviousPositions();
    assertThat(previousPositions).isNotNull();
    assertThat(previousPositions).hasSize(2);
  }

  @Test
  void testUpdateCustomSensitiveInformation() {
    // Steve already has sensitive data
    final String steveUuid = getSteveSteveson().getUuid();
    // Admin has access to everything
    checkSensitiveInformationEdit(steveUuid, adminUser,
        ImmutableList.of(BIRTHDAY_FIELD, POLITICAL_POSITION_FIELD), false);
    // Henry has access to Steve's birthday
    checkSensitiveInformationEdit(steveUuid, "henry", ImmutableList.of(BIRTHDAY_FIELD), false);
    // Bob has access to Steve's politicalPosition
    checkSensitiveInformationEdit(steveUuid, "bob", ImmutableList.of(POLITICAL_POSITION_FIELD),
        false);
  }

  private Person checkSensitiveInformation(final String personUuid, final String user,
      // List should be in alphabetical order
      final ImmutableList<String> customSensitiveFields) {
    final int size = customSensitiveFields.size();

    final Person person = withCredentials(user, t -> queryExecutor.person(FIELDS, personUuid));
    assertThat(person).isNotNull();
    assertThat(person.getCustomSensitiveInformation()).hasSize(size);
    assertThat(person.getCustomSensitiveInformation())
        .allMatch(csi -> customSensitiveFields.contains(csi.getCustomFieldName()));

    return person;
  }

  private void checkSensitiveInformationEdit(final String personUuid, final String user,
      // List should be in alphabetical order
      final ImmutableList<String> customSensitiveFields, final boolean doInsert) {
    final Person person = checkSensitiveInformation(personUuid, user,
        doInsert ? ImmutableList.of() : customSensitiveFields);

    final int size = customSensitiveFields.size();

    final PersonInput personInput = getInput(person, PersonInput.class);
    if (doInsert) {
      final List<CustomSensitiveInformationInput> csiInput = customSensitiveFields.stream()
          .map(csf -> CustomSensitiveInformationInput.builder().withCustomFieldName(csf)
              .withCustomFieldValue(getCustomFieldValue(csf, UUID.randomUUID().toString())).build())
          .collect(Collectors.toList());
      personInput.setCustomSensitiveInformation(csiInput);
    } else {
      personInput.getCustomSensitiveInformation().forEach(csiInput -> csiInput.setCustomFieldValue(
          getCustomFieldValue(csiInput.getCustomFieldName(), UUID.randomUUID().toString())));
    }
    final Integer nrUpdated =
        withCredentials(user, t -> mutationExecutor.updatePerson("", personInput));
    assertThat(nrUpdated).isEqualTo(1);
    final Person personUpdated =
        withCredentials(user, t -> queryExecutor.person(FIELDS, personInput.getUuid()));
    assertThat(personUpdated).isNotNull();
    assertThat(personUpdated.getCustomSensitiveInformation()).hasSize(size);
    for (int i = 0; i < size; i++) {
      final CustomSensitiveInformationInput csiInput =
          personInput.getCustomSensitiveInformation().get(i);
      final CustomSensitiveInformation csiUpdated =
          personUpdated.getCustomSensitiveInformation().get(i);
      if (doInsert) {
        assertThat(csiUpdated.getUpdatedAt()).isNotNull();
      } else {
        assertThat(csiUpdated.getUpdatedAt()).isAfter(csiInput.getUpdatedAt());
      }
      assertThat(csiUpdated.getCustomFieldValue()).isEqualTo(csiInput.getCustomFieldValue());
    }

    if (doInsert) {
      // Delete customSensitiveInformation again
      final int nrDeleted =
          AnetObjectEngine.getInstance().getCustomSensitiveInformationDao().deleteFor(personUuid);
      assertThat(nrDeleted).isEqualTo(size);
    } else {
      // Restore previous values
      final PersonInput personInputRestore = getInput(person, PersonInput.class);
      personInput.getCustomSensitiveInformation().forEach(csiInput -> csiInput.setCustomFieldValue(
          getCustomFieldValue(csiInput.getCustomFieldName(), UUID.randomUUID().toString())));
      final Integer nrUpdatedRestore =
          withCredentials(user, t -> mutationExecutor.updatePerson("", personInputRestore));
      assertThat(nrUpdatedRestore).isEqualTo(1);
    }
  }

  private String getCustomFieldValue(String fieldName, String value) {
    return String.format("{\"%1$s\":\"%2$s\"}", fieldName, value);
  }

  @Test
  void testUnauthorizedCustomSensitiveInformation() {
    // Try to do some updates that are not allowed
    final String steveUuid = getSteveSteveson().getUuid();
    // Henry only has access to Steve's birthday
    checkUnauthorizedSensitiveInformation(steveUuid, "henry",
        ImmutableList.of(POLITICAL_POSITION_FIELD));
    // Bob only has access to Steve's politicalPosition
    checkUnauthorizedSensitiveInformation(steveUuid, "bob", ImmutableList.of(BIRTHDAY_FIELD));
  }

  private void checkUnauthorizedSensitiveInformation(final String personUuid, final String user,
      // List should be in alphabetical order
      final ImmutableList<String> customSensitiveFields) {

    final Person person = withCredentials(user, t -> queryExecutor.person(FIELDS, personUuid));
    assertThat(person).isNotNull();
    assertThat(person.getCustomSensitiveInformation())
        .noneMatch(csi -> customSensitiveFields.contains(csi.getCustomFieldName()));

    final String customFieldValue = "__UPDATE_NOT_ALLOWED__";
    final PersonInput personInput = getInput(person, PersonInput.class);
    final List<CustomSensitiveInformationInput> csiInput = customSensitiveFields.stream()
        .map(csf -> CustomSensitiveInformationInput.builder().withCustomFieldName(csf)
            .withCustomFieldValue(getCustomFieldValue(csf, customFieldValue)).build())
        .collect(Collectors.toList());
    personInput.setCustomSensitiveInformation(csiInput);
    final Instant beforeUpdate = Instant.now();
    final Integer nrUpdated =
        withCredentials(user, t -> mutationExecutor.updatePerson("", personInput));
    assertThat(nrUpdated).isEqualTo(1);
    final Person personUpdated =
        withCredentials(adminUser, t -> queryExecutor.person(FIELDS, personInput.getUuid()));
    assertThat(personUpdated).isNotNull();
    assertThat(personUpdated.getCustomSensitiveInformation())
        .allMatch(csi -> !customFieldValue.equals(csi.getCustomFieldValue())
            && beforeUpdate.isAfter(csi.getUpdatedAt()));
  }

  @Test
  void testIllegalCustomSensitiveInformation() {
    // Try to do some updates that are illegal
    final String steveUuid = getSteveSteveson().getUuid();
    final Person person = withCredentials(adminUser, t -> queryExecutor.person(FIELDS, steveUuid));
    assertThat(person).isNotNull();
    assertThat(person.getCustomSensitiveInformation()).isNotEmpty();

    // Test with non-existing UUID
    final PersonInput personInput1 = getInput(person, PersonInput.class);
    personInput1.getCustomSensitiveInformation()
        .forEach(csiInput -> csiInput.setUuid(UUID.randomUUID().toString()));
    checkIllegalSensitiveInformation(person, personInput1, personInput1);

    // Test with wrong customFieldName
    final PersonInput personInput2 = getInput(person, PersonInput.class);
    personInput2.getCustomSensitiveInformation()
        .forEach(csiInput -> csiInput.setCustomFieldName(
            BIRTHDAY_FIELD.equals(csiInput.getCustomFieldName()) ? POLITICAL_POSITION_FIELD
                : BIRTHDAY_FIELD));
    checkIllegalSensitiveInformation(person, personInput2, personInput2);

    // Test with wrong relatedObjectUuid
    final PersonInput personInput3 = getInput(person, PersonInput.class);
    final PersonInput otherPersonInput = getInput(getNickNicholson(), PersonInput.class);
    otherPersonInput.setCustomSensitiveInformation(personInput3.getCustomSensitiveInformation());
    checkIllegalSensitiveInformation(person, otherPersonInput, personInput3);
    final Person otherPersonUpdated =
        withCredentials(adminUser, t -> queryExecutor.person(FIELDS, otherPersonInput.getUuid()));
    assertThat(otherPersonUpdated).isNotNull();
    assertThat(otherPersonUpdated.getCustomSensitiveInformation()).isEmpty();

    // Test with wrong relatedObjectType
    final PersonInput personInput4 = getInput(person, PersonInput.class);
    final PositionInput positionInput = personInput4.getPosition();
    positionInput.setCustomSensitiveInformation(personInput4.getCustomSensitiveInformation());
    final Integer nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updatePosition("", positionInput));
    assertThat(nrUpdated).isEqualTo(1);
    final Position positionUpdated = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, positionInput.getUuid()));
    assertThat(positionUpdated).isNotNull();
    assertThat(positionUpdated.getCustomSensitiveInformation()).isEmpty();
    final Person personUpdated =
        withCredentials(adminUser, t -> queryExecutor.person(FIELDS, personInput4.getUuid()));
    assertThat(personUpdated).isNotNull();
    assertCsi(personUpdated.getCustomSensitiveInformation(),
        person.getCustomSensitiveInformation());
  }

  private void checkIllegalSensitiveInformation(final Person person,
      final PersonInput personToUpdate, final PersonInput personToCheck) {
    final Integer nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updatePerson("", personToUpdate));
    assertThat(nrUpdated).isEqualTo(1);
    final Person personUpdated =
        withCredentials(adminUser, t -> queryExecutor.person(FIELDS, personToCheck.getUuid()));
    assertThat(personUpdated).isNotNull();
    assertCsi(personUpdated.getCustomSensitiveInformation(),
        person.getCustomSensitiveInformation());
  }

  private void assertCsi(final List<CustomSensitiveInformation> csiList1,
      List<CustomSensitiveInformation> csiList2) {
    assertThat(csiList1).hasSameSizeAs(csiList2);
    for (int i = 0; i < csiList1.size(); i++) {
      final CustomSensitiveInformation csi1 = csiList1.get(i);
      final CustomSensitiveInformation csi2 = csiList2.get(i);
      assertThat(csi1.getUuid()).isEqualTo(csi2.getUuid());
      assertThat(csi1.getCustomFieldName()).isEqualTo(csi2.getCustomFieldName());
      assertThat(csi1.getCustomFieldValue()).isEqualTo(csi2.getCustomFieldValue());
      assertThat(csi1.getRelatedObjectType()).isEqualTo(csi2.getRelatedObjectType());
      assertThat(csi1.getRelatedObjectUuid()).isEqualTo(csi2.getRelatedObjectUuid());
      assertThat(csi1.getCreatedAt()).isEqualTo(csi2.getCreatedAt());
      assertThat(csi1.getUpdatedAt()).isEqualTo(csi2.getUpdatedAt());
    }
  }

}
