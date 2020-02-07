package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.common.collect.ImmutableList;
import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.file.Files;
import java.text.Collator;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.ws.rs.ForbiddenException;
import javax.ws.rs.NotFoundException;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.beans.search.PersonSearchSortBy;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.test.beans.OrganizationTest;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.UtilsTest;
import org.junit.jupiter.api.Test;

public class PersonResourceTest extends AbstractResourceTest {

  private static final String POSITION_FIELDS = "uuid name code type status";
  private static final String PERSON_FIELDS =
      "uuid name status role emailAddress phoneNumber rank biography country avatar code"
          + " gender endOfTourDate domainUsername pendingVerification createdAt updatedAt";
  private static final String FIELDS = PERSON_FIELDS + " position { " + POSITION_FIELDS + " }";
  private static final String DEFAULT_AVATAR_PATH = "src/test/resources/assets/default_avatar.png";

  @Test
  public void testCreatePerson() throws IOException {
    final Person jack = getJackJackson();

    Person retPerson = graphQLHelper.getObjectById(jack, "person", FIELDS, jack.getUuid(),
        new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(retPerson).isEqualTo(jack);
    assertThat(retPerson.getUuid()).isEqualTo(jack.getUuid());

    Person newPerson = new Person();
    newPerson.setName("testCreatePerson Person");
    newPerson.setRole(Role.ADVISOR);
    newPerson.setStatus(PersonStatus.ACTIVE);
    // set HTML of biography
    newPerson.setBiography(UtilsTest.getCombinedTestCase().getInput());
    newPerson.setGender("Female");
    newPerson.setCountry("Canada");
    newPerson.setCode("123456");
    newPerson.setEndOfTourDate(
        ZonedDateTime.of(2020, 4, 1, 0, 0, 0, 0, DaoUtils.getDefaultZoneId()).toInstant());
    String newPersonUuid = graphQLHelper.createObject(admin, "createPerson", "person",
        "PersonInput", newPerson, new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(newPersonUuid).isNotNull();
    newPerson = graphQLHelper.getObjectById(admin, "person", FIELDS, newPersonUuid,
        new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(newPerson.getUuid()).isNotNull();
    assertThat(newPerson.getName()).isEqualTo("testCreatePerson Person");
    // check that HTML of biography is sanitized after create
    assertThat(newPerson.getBiography()).isEqualTo(UtilsTest.getCombinedTestCase().getOutput());

    newPerson.setName("testCreatePerson updated name");
    newPerson.setCountry("The Commonwealth of Canada");
    newPerson.setCode("A123456");

    // update avatar
    byte[] fileContent = Files.readAllBytes(new File(DEFAULT_AVATAR_PATH).toPath());
    String defaultAvatarData = Base64.getEncoder().encodeToString(fileContent);
    newPerson.setAvatar(defaultAvatarData);

    // update HTML of biography
    newPerson.setBiography(UtilsTest.getCombinedTestCase().getInput());

    Integer nrUpdated =
        graphQLHelper.updateObject(admin, "updatePerson", "person", "PersonInput", newPerson);
    assertThat(nrUpdated).isEqualTo(1);

    retPerson = graphQLHelper.getObjectById(jack, "person", FIELDS, newPerson.getUuid(),
        new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(retPerson.getName()).isEqualTo(newPerson.getName());
    assertThat(retPerson.getCode()).isEqualTo(newPerson.getCode());
    assertThat(retPerson.getAvatar()).isNotNull();
    // check that HTML of biography is sanitized after update
    assertThat(retPerson.getBiography()).isEqualTo(UtilsTest.getCombinedTestCase().getOutput());

    // Test creating a person with a position already set.
    final OrganizationSearchQuery query = new OrganizationSearchQuery();
    query.setText("EF 6");
    query.setType(OrganizationType.ADVISOR_ORG);
    final AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(jack, "organizationList",
        "query", "OrganizationSearchQueryInput", "uuid shortName", query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList().size()).isGreaterThan(0);
    Organization org = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("EF 6")).findFirst().get();

    Position newPos = new Position();
    newPos.setType(PositionType.ADVISOR);
    newPos.setName("Test Position");
    newPos.setOrganization(org);
    newPos.setStatus(PositionStatus.ACTIVE);
    String newPosUuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", newPos, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(newPosUuid).isNotNull();
    newPos = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, newPosUuid,
        new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(newPos.getUuid()).isNotNull();

    Person newPerson2 = new Person();
    newPerson2.setName("Namey McNameface");
    newPerson2.setRole(Role.ADVISOR);
    newPerson2.setStatus(PersonStatus.ACTIVE);
    newPerson2.setDomainUsername("namey_" + Instant.now().toEpochMilli());
    newPerson2.setPosition(newPos);
    String newPerson2Uuid = graphQLHelper.createObject(admin, "createPerson", "person",
        "PersonInput", newPerson2, new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(newPerson2Uuid).isNotNull();
    newPerson2 = graphQLHelper.getObjectById(admin, "person", FIELDS, newPerson2Uuid,
        new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(newPerson2.getUuid()).isNotNull();
    assertThat(newPerson2.loadPosition()).isNotNull();
    assertThat(newPerson2.getPosition().getUuid()).isEqualTo(newPos.getUuid());

    // Change this person w/ a new position, and ensure it gets changed.

    Position newPos2 = new Position();
    newPos2.setType(PositionType.ADVISOR);
    newPos2.setName("A Second Test Position");
    newPos2.setOrganization(org);
    newPos2.setStatus(PositionStatus.ACTIVE);
    String newPos2Uuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", newPos2, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(newPos2Uuid).isNotNull();
    newPos2 = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, newPos2Uuid,
        new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(newPos2.getUuid()).isNotNull();

    newPerson2.setName("Changey McChangeface");
    newPerson2.setPosition(newPos2);
    // A person cannot change their own position
    try {
      graphQLHelper.updateObject(newPerson2, "updatePerson", "person", "PersonInput", newPerson2);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    nrUpdated =
        graphQLHelper.updateObject(admin, "updatePerson", "person", "PersonInput", newPerson2);
    assertThat(nrUpdated).isEqualTo(1);

    retPerson = graphQLHelper.getObjectById(admin, "person", FIELDS, newPerson2.getUuid(),
        new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(retPerson).isNotNull();
    assertThat(retPerson.getName()).isEqualTo(newPerson2.getName());
    assertThat(retPerson.loadPosition()).isNotNull();
    assertThat(retPerson.getPosition().getUuid()).isEqualTo(newPos2.getUuid());

    // Now newPerson2 who is a super user, should NOT be able to edit newPerson
    // Because they are not in newPerson2's organization.
    try {
      graphQLHelper.updateObject(newPerson2, "updatePerson", "person", "PersonInput", newPerson);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }

    // Add some scary HTML to newPerson2's profile and ensure it gets stripped out.
    newPerson2.setBiography(
        "<b>Hello world</b>.  I like script tags! <script>window.alert('hello world')</script>");
    nrUpdated =
        graphQLHelper.updateObject(admin, "updatePerson", "person", "PersonInput", newPerson2);
    assertThat(nrUpdated).isEqualTo(1);

    retPerson = graphQLHelper.getObjectById(admin, "person", FIELDS, newPerson2.getUuid(),
        new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(retPerson.getBiography()).contains("<b>Hello world</b>");
    assertThat(retPerson.getBiography()).doesNotContain("<script>window.alert");
  }

  @Test
  public void searchPerson() {
    Person jack = getJackJackson();

    PersonSearchQuery query = new PersonSearchQuery();
    query.setText("bob");

    AnetBeanList<Person> searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(searchResults.getTotalCount()).isGreaterThan(0);
    assertThat(searchResults.getList().stream().filter(p -> p.getName().equals("BOBTOWN, Bob"))
        .findFirst()).isNotEmpty();

    final OrganizationSearchQuery queryOrgs = new OrganizationSearchQuery();
    // FIXME: decide what the search should do in both cases
    queryOrgs.setText(DaoUtils.isPostgresql() ? "\"EF 1\" or \"EF 1.1\"" : "EF 1");
    queryOrgs.setType(OrganizationType.ADVISOR_ORG);
    final AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(jack, "organizationList",
        "query", "OrganizationSearchQueryInput", "uuid shortName", queryOrgs,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList().size()).isGreaterThan(0);
    Organization org = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("EF 1.1")).findFirst().get();

    query.setText(null);
    query.setOrgUuid(org.getUuid());
    searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();

    query.setOrgUuid(null);
    query.setStatus(ImmutableList.of(PersonStatus.INACTIVE));
    searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList().stream().filter(p -> p.getStatus() == PersonStatus.INACTIVE)
        .count()).isEqualTo(searchResults.getList().size());

    // Search with children orgs
    org = orgs.getList().stream().filter(o -> o.getShortName().equalsIgnoreCase("EF 1")).findFirst()
        .get();
    query.setStatus(null);
    query.setOrgUuid(org.getUuid());
    // First don't include child orgs and then increase the scope and verify results increase.
    final AnetBeanList<Person> parentOnlyResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});

    query.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();
    assertThat(searchResults.getList()).containsAll(parentOnlyResults.getList());

    query.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();

    query.setOrgUuid(null);
    query.setText(null);
    query.setRole(Role.ADVISOR);
    searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(searchResults.getList().size()).isGreaterThan(1);

    query.setRole(null);
    query.setText("e");
    query.setSortBy(PersonSearchSortBy.NAME);
    query.setSortOrder(SortOrder.DESC);
    searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    final Collator collator = Collator.getInstance();
    collator.setStrength(Collator.PRIMARY);
    String prevName = null;
    for (Person p : searchResults.getList()) {
      if (prevName != null) {
        assertThat(collator.compare(p.getName(), prevName)).isLessThanOrEqualTo(0);
      }
      prevName = p.getName();
    }

    // Search for a person with the name "A Dvisor"
    query = new PersonSearchQuery();
    query.setText("Dvisor");
    query.setRole(Role.ADVISOR);
    searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    long matchCount =
        searchResults.getList().stream().filter(p -> p.getName().equals("DVISOR, A")).count();
    assertThat(matchCount).isEqualTo(1);

    // Search for same person from an autocomplete box.
    query.setText("Dvisor*");
    searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    matchCount =
        searchResults.getList().stream().filter(p -> p.getName().equals("DVISOR, A")).count();
    assertThat(matchCount).isEqualTo(1);


    // Search by email Address
    query.setText("hunter+arthur@dds.mil");
    searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    matchCount = searchResults.getList().stream()
        .filter(p -> p.getEmailAddress().equals("hunter+arthur@dds.mil")).count();
    assertThat(matchCount).isEqualTo(1);
    // TODO: should we enforce that this query returns ONLY arthur? I think not since we're using
    // the plus addressing for testing..

    // Search for persons with biography filled
    query = new PersonSearchQuery();
    query.setHasBiography(true);
    searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();

    // Search for persons with empty biography
    query = new PersonSearchQuery();
    query.setHasBiography(false);
    searchResults =
        graphQLHelper.searchObjects(jack, "personList", "query", "PersonSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(searchResults.getList()).isNotEmpty();
  }

  @Test
  public void mergePeopleTest() {
    // Create a person
    Person loser = new Person();
    loser.setRole(Role.ADVISOR);
    loser.setName("Loser for Merging");
    String loserUuid = graphQLHelper.createObject(admin, "createPerson", "person", "PersonInput",
        loser, new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(loserUuid).isNotNull();
    loser = graphQLHelper.getObjectById(admin, "person", FIELDS, loserUuid,
        new TypeReference<GraphQlResponse<Person>>() {});

    // Create a Position
    Position test = new Position();
    test.setName("A Test Position created by mergePeopleTest");
    test.setType(PositionType.ADVISOR);
    test.setStatus(PositionStatus.ACTIVE);

    // Assign to an AO
    final String aoUuid = graphQLHelper.createObject(admin, "createOrganization", "organization",
        "OrganizationInput", OrganizationTest.getTestAO(true),
        new TypeReference<GraphQlResponse<Organization>>() {});
    test.setOrganization(createOrganizationWithUuid(aoUuid));

    String createdUuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", test, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(createdUuid).isNotNull();
    Position created = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, createdUuid,
        new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(created.getName()).isEqualTo(test.getName());

    // Assign the loser into the position
    Map<String, Object> variables = new HashMap<>();
    variables.put("uuid", created.getUuid());
    variables.put("person", loser);
    Integer nrUpdated = graphQLHelper.updateObject(admin,
        "mutation ($uuid: String!, $person: PersonInput!) { payload: putPersonInPosition (uuid: $uuid, person: $person) }",
        variables);
    assertThat(nrUpdated).isEqualTo(1);

    // Create a second person
    Person winner = new Person();
    winner.setRole(Role.ADVISOR);
    winner.setName("Winner for Merging");
    String winnerUuid = graphQLHelper.createObject(admin, "createPerson", "person", "PersonInput",
        winner, new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(winnerUuid).isNotNull();
    winner = graphQLHelper.getObjectById(admin, "person", FIELDS, winnerUuid,
        new TypeReference<GraphQlResponse<Person>>() {});

    variables = new HashMap<>();
    variables.put("winnerUuid", winnerUuid);
    variables.put("loserUuid", loserUuid);
    nrUpdated = graphQLHelper.updateObject(admin,
        "mutation ($winnerUuid: String!, $loserUuid: String!) { payload: mergePeople (winnerUuid: $winnerUuid, loserUuid: $loserUuid) }",
        variables);
    assertThat(nrUpdated).isEqualTo(1);

    // Assert that loser is gone.
    try {
      graphQLHelper.getObjectById(admin, "person", FIELDS, loser.getUuid(),
          new TypeReference<GraphQlResponse<Person>>() {});
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }

    // Assert that the position is empty.
    Position winnerPos = graphQLHelper.getObjectById(admin, "position",
        POSITION_FIELDS + " person {" + PERSON_FIELDS + " }", created.getUuid(),
        new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(winnerPos.getPerson()).isNull();

    // Re-create loser and put into the position.
    loser = new Person();
    loser.setRole(Role.ADVISOR);
    loser.setName("Loser for Merging");
    loserUuid = graphQLHelper.createObject(admin, "createPerson", "person", "PersonInput", loser,
        new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(loserUuid).isNotNull();
    loser = graphQLHelper.getObjectById(admin, "person", FIELDS, loserUuid,
        new TypeReference<GraphQlResponse<Person>>() {});

    variables = new HashMap<>();
    variables.put("uuid", created.getUuid());
    variables.put("person", loser);
    nrUpdated = graphQLHelper.updateObject(admin,
        "mutation ($uuid: String!, $person: PersonInput!) { payload: putPersonInPosition (uuid: $uuid, person: $person) }",
        variables);
    assertThat(nrUpdated).isEqualTo(1);

    variables = new HashMap<>();
    variables.put("winnerUuid", winnerUuid);
    variables.put("loserUuid", loserUuid);
    variables.put("copyPosition", true);
    nrUpdated = graphQLHelper.updateObject(admin,
        "mutation ($winnerUuid: String!, $loserUuid: String!, $copyPosition: Boolean!) { payload: mergePeople (winnerUuid: $winnerUuid, loserUuid: $loserUuid, copyPosition: $copyPosition) }",
        variables);
    assertThat(nrUpdated).isEqualTo(1);

    // Assert that loser is gone.
    try {
      graphQLHelper.getObjectById(admin, "person", FIELDS, loser.getUuid(),
          new TypeReference<GraphQlResponse<Person>>() {});
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }

    // Assert that the winner is in the position.
    winnerPos = graphQLHelper.getObjectById(admin, "position",
        POSITION_FIELDS + " person {" + PERSON_FIELDS + " }", created.getUuid(),
        new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(winnerPos.getPerson()).isEqualTo(winner);
  }

  @Test
  public void testInactivatePerson() {
    final Person jack = getJackJackson();
    final OrganizationSearchQuery query = new OrganizationSearchQuery();
    query.setText("EF 6");
    query.setType(OrganizationType.ADVISOR_ORG);
    final AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(jack, "organizationList",
        "query", "OrganizationSearchQueryInput", "uuid shortName", query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList().size()).isGreaterThan(0);
    final Organization org = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("EF 6")).findFirst().get();
    assertThat(org.getUuid()).isNotNull();

    final Position newPos = new Position();
    newPos.setType(PositionType.ADVISOR);
    newPos.setName("Test Position");
    newPos.setOrganization(org);
    newPos.setStatus(PositionStatus.ACTIVE);
    String retPosUuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", newPos, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(retPosUuid).isNotNull();
    Position retPos = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, retPosUuid,
        new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(retPos.getUuid()).isNotNull();

    final Person newPerson = new Person();
    newPerson.setName("Namey McNameface");
    newPerson.setRole(Role.ADVISOR);
    newPerson.setStatus(PersonStatus.ACTIVE);
    newPerson.setDomainUsername("namey_" + Instant.now().toEpochMilli());
    newPerson.setPosition(retPos);
    String retPersonUuid = graphQLHelper.createObject(admin, "createPerson", "person",
        "PersonInput", newPerson, new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(retPersonUuid).isNotNull();
    Person retPerson = graphQLHelper.getObjectById(admin, "person", FIELDS, retPersonUuid,
        new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(retPerson.getUuid()).isNotNull();
    assertThat(retPerson.getPosition()).isNotNull();

    retPerson.setStatus(PersonStatus.INACTIVE);
    Integer nrUpdated =
        graphQLHelper.updateObject(admin, "updatePerson", "person", "PersonInput", retPerson);
    assertThat(nrUpdated).isEqualTo(1);

    final Person retPerson2 = graphQLHelper.getObjectById(admin, "person", FIELDS,
        retPerson.getUuid(), new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(retPerson2.getDomainUsername()).isNull();
    assertThat(retPerson2.getPosition()).isNull();
  }

  @Test
  public void personCreateSuperUserPermissionTest() throws UnsupportedEncodingException {
    createPerson(getSuperUser());
  }

  @Test
  public void personCreateRegularUserPermissionTest() throws UnsupportedEncodingException {
    createPerson(getRegularUser());
  }

  private void createPerson(Person user) {
    final Position position = user.getPosition();
    final boolean isSuperUser = position.getType() == PositionType.SUPER_USER;
    final Organization organization = position.getOrganization();

    // principal
    final Person principal = new Person();
    principal.setName("Namey McNameface");
    principal.setRole(Role.PRINCIPAL);
    principal.setStatus(PersonStatus.ACTIVE);
    principal.setDomainUsername("namey_" + Instant.now().toEpochMilli());

    try {
      final String pUuid = graphQLHelper.createObject(user, "createPerson", "person", "PersonInput",
          principal, new TypeReference<GraphQlResponse<Person>>() {});
      if (isSuperUser) {
        assertThat(pUuid).isNotNull();
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isSuperUser) {
        fail("Unexpected ForbiddenException");
      }
    }

    // advisor with no position
    final Person advisorNoPosition = new Person();
    advisorNoPosition.setName("Namey McNameface");
    advisorNoPosition.setRole(Role.ADVISOR);
    advisorNoPosition.setStatus(PersonStatus.ACTIVE);
    advisorNoPosition.setDomainUsername("namey_" + Instant.now().toEpochMilli());

    try {
      final String anpUuid = graphQLHelper.createObject(user, "createPerson", "person",
          "PersonInput", advisorNoPosition, new TypeReference<GraphQlResponse<Person>>() {});
      if (isSuperUser) {
        assertThat(anpUuid).isNotNull();
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isSuperUser) {
        fail("Unexpected ForbiddenException");
      }
    }

    // advisor with position in own organization
    final PositionSearchQuery query = new PositionSearchQuery();
    query.setOrganizationUuid(organization.getUuid());
    query.setIsFilled(false);
    final AnetBeanList<Position> searchObjects = graphQLHelper.searchObjects(user, "positionList",
        "query", "PositionSearchQueryInput", POSITION_FIELDS, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Position>>>() {});
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final Position freePos = searchObjects.getList().get(0);

    final Person advisorPosition = new Person();
    advisorPosition.setName("Namey McNameface");
    advisorPosition.setRole(Role.ADVISOR);
    advisorPosition.setStatus(PersonStatus.ACTIVE);
    advisorPosition.setDomainUsername("namey_" + Instant.now().toEpochMilli());
    advisorPosition.setPosition(freePos);

    try {
      final String apUuid = graphQLHelper.createObject(user, "createPerson", "person",
          "PersonInput", advisorPosition, new TypeReference<GraphQlResponse<Person>>() {});
      if (isSuperUser) {
        assertThat(apUuid).isNotNull();
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isSuperUser) {
        fail("Unexpected ForbiddenException");
      }
    }

    // advisor with position in other organization
    final PositionSearchQuery query2 = new PositionSearchQuery();
    final List<PositionType> positionTypes = new ArrayList<>();
    positionTypes.add(PositionType.ADVISOR);
    query2.setType(positionTypes);
    query2.setIsFilled(false);
    final AnetBeanList<Position> searchObjects2 = graphQLHelper.searchObjects(user, "positionList",
        "query", "PositionSearchQueryInput", POSITION_FIELDS, query2,
        new TypeReference<GraphQlResponse<AnetBeanList<Position>>>() {});
    assertThat(searchObjects2).isNotNull();
    assertThat(searchObjects2.getList()).isNotEmpty();
    final Optional<Position> foundPos2 = searchObjects2.getList().stream()
        .filter(p -> !organization.getUuid().equals(p.getOrganizationUuid())).findFirst();
    assertThat(foundPos2.isPresent()).isTrue();
    final Position freePos2 = foundPos2.get();

    final Person advisorPosition2 = new Person();
    advisorPosition2.setName("Namey McNameface");
    advisorPosition2.setRole(Role.ADVISOR);
    advisorPosition2.setStatus(PersonStatus.ACTIVE);
    advisorPosition2.setDomainUsername("namey_" + Instant.now().toEpochMilli());
    advisorPosition2.setPosition(freePos2);

    try {
      graphQLHelper.createObject(user, "createPerson", "person", "PersonInput", advisorPosition2,
          new TypeReference<GraphQlResponse<Person>>() {});
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

}
