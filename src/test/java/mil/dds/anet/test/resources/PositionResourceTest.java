package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.ImmutableList;
import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.text.Collator;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.ClientErrorException;
import javax.ws.rs.ForbiddenException;
import javax.ws.rs.NotFoundException;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Organization;
import mil.dds.anet.test.client.AnetBeanList_Position;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
import mil.dds.anet.test.client.OrganizationType;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonInput;
import mil.dds.anet.test.client.PersonPositionHistory;
import mil.dds.anet.test.client.PersonPositionHistoryInput;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionSearchQueryInput;
import mil.dds.anet.test.client.PositionSearchSortBy;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.RecurseStrategy;
import mil.dds.anet.test.client.Role;
import mil.dds.anet.test.client.SortOrder;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.TaskSearchQueryInput;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.client.util.QueryExecutor;
import mil.dds.anet.utils.Utils;
import org.junit.jupiter.api.Test;

public class PositionResourceTest extends AbstractResourceTest {
  private static final String _ORGANIZATION_FIELDS = "uuid shortName";
  private static final String _PERSON_FIELDS = "uuid name role";
  private static final String _POSITION_FIELDS = "uuid name code type role status customFields";
  public static final String ORGANIZATION_FIELDS =
      String.format("{ %1$s positions { %2$s organization { uuid } location { uuid } } }",
          _ORGANIZATION_FIELDS, _POSITION_FIELDS);
  public static final String PERSON_FIELDS =
      String.format("{ %1$s position { %2$s } }", _PERSON_FIELDS, _POSITION_FIELDS);
  public static final String FIELDS = String.format(
      "{ %1$s person { %2$s } organization { %3$s } associatedPositions { uuid }"
          + " previousPeople { createdAt startTime endTime position { uuid }"
          + " person { uuid name rank role } } }",
      _POSITION_FIELDS, _PERSON_FIELDS, _ORGANIZATION_FIELDS);
  private static final String PA_FIELDS = String
      .format("{ uuid associatedPositions { uuid } responsibleTasks(query: ?responsibleTasksQuery)"
          + " { uuid } }");

  @Test
  public void positionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person jack = getJackJackson();
    assertThat(jack.getUuid()).isNotNull();
    assertThat(jack.getPosition()).isNotNull();
    final Position jacksOldPosition = jack.getPosition();

    // Create Position assigned to an AO
    final Organization ao = adminMutationExecutor.createOrganization(ORGANIZATION_FIELDS,
        TestData.createAdvisorOrganizationInput(true));
    final PositionInput testInput =
        PositionInput.builder().withName("A Test Position created by PositionResourceTest")
            .withType(PositionType.ADVISOR).withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE)
            .withOrganization(getOrganizationInput(ao))
            .withLocation(getLocationInput(getGeneralHospital())).build();

    Position created = adminMutationExecutor.createPosition(FIELDS, testInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getName()).isEqualTo(testInput.getName());
    assertThat(created.getOrganization().getUuid()).isEqualTo(ao.getUuid());

    // Assign a person into the position
    Integer nrUpdated =
        adminMutationExecutor.putPersonInPosition("", getPersonInput(jack), created.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    Position currPos = adminQueryExecutor.position(FIELDS, created.getUuid());
    assertThat(currPos).isNotNull();
    assertThat(currPos.getPerson()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isEqualTo(jack.getUuid());

    final Instant jacksTime = Instant.now();
    try {
      Thread.sleep(500); // just slow me down a bit...
    } catch (InterruptedException ignore) {
      /* ignore */
    }

    // change the person in this position
    final Person steve = getSteveSteveson();
    final Position stevesCurrentPosition = steve.getPosition();
    assertThat(stevesCurrentPosition).isNotNull();
    nrUpdated =
        adminMutationExecutor.putPersonInPosition("", getPersonInput(steve), created.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    // Verify that the new person is in the position
    currPos = jackQueryExecutor.position(FIELDS, created.getUuid());
    assertThat(currPos.getPerson()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isEqualTo(steve.getUuid());

    // Verify that the previous person is now no longer in a position
    final Person returnedPerson = jackQueryExecutor.person(PERSON_FIELDS, jack.getUuid());
    assertThat(returnedPerson.getPosition()).isNull();

    // delete the person from this position
    Integer nrDeleted = adminMutationExecutor.deletePersonFromPosition("", created.getUuid());
    assertThat(nrDeleted).isEqualTo(1);

    currPos = jackQueryExecutor.position(FIELDS, created.getUuid());
    assertThat(currPos.getPerson()).isNull();

    // Put steve back in his old position
    nrUpdated = adminMutationExecutor.putPersonInPosition("", getPersonInput(steve),
        stevesCurrentPosition.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    currPos = jackQueryExecutor.position(FIELDS, stevesCurrentPosition.getUuid());
    assertThat(currPos.getPerson()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isEqualTo(steve.getUuid());

    // pull for the person at a previous time.
    created = jackQueryExecutor.position(FIELDS, created.getUuid());
    final List<PersonPositionHistory> history = created.getPreviousPeople();
    assertThat(history).isNotEmpty();
    assertThat(history.size()).isEqualTo(2);
    assertThat(history.get(0).getPosition().getUuid()).isEqualTo(created.getUuid());
    assertThat(history.get(0).getPerson().getUuid()).isEqualTo(jack.getUuid());
    assertThat(history.get(0).getStartTime()).isNotNull();
    assertThat(history.get(0).getEndTime()).isNotNull();
    assertThat(history.get(0).getStartTime()).isBefore(history.get(0).getEndTime());
    assertThat(history.get(1).getPerson().getUuid()).isEqualTo(steve.getUuid());
    assertThat(history.get(1).getEndTime()).isNotNull();
    assertThat(history.get(1).getStartTime()).isBefore(history.get(1).getEndTime());
    PersonPositionHistory last = null;
    for (final PersonPositionHistory personPositionHistory : history) {
      if (personPositionHistory.getCreatedAt().isBefore(jacksTime)
          && (last == null || personPositionHistory.getCreatedAt().isAfter(last.getCreatedAt()))) {
        last = personPositionHistory;
      }
    }
    assertThat(last).isNotNull();
    assertThat(last.getPerson()).isNotNull();
    assertThat(last.getPerson().getUuid()).isEqualTo(jack.getUuid());

    // Create a principal
    final OrganizationSearchQueryInput queryOrgs = OrganizationSearchQueryInput.builder()
        .withText("Ministry").withType(OrganizationType.PRINCIPAL_ORG).build();
    final AnetBeanList_Organization orgs =
        adminQueryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs);
    assertThat(orgs.getList().size()).isGreaterThan(0);

    final PositionInput prinPosInput =
        PositionInput.builder().withName("A Principal Position created by PositionResourceTest")
            .withType(PositionType.PRINCIPAL).withRole(PositionRole.MEMBER)
            .withOrganization(getOrganizationInput(orgs.getList().get(0))).withStatus(Status.ACTIVE)
            .build();

    final Person roger = getRogerRogwell();
    final Position rogersOldPosition = roger.getPosition();
    assertThat(roger.getUuid()).isNotNull();
    final Position tashkil = adminMutationExecutor.createPosition(FIELDS, prinPosInput);
    assertThat(tashkil).isNotNull();
    assertThat(tashkil.getUuid()).isNotNull();

    // put the principal in a tashkil
    nrUpdated =
        adminMutationExecutor.putPersonInPosition("", getPersonInput(roger), tashkil.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    // assign the tashkil to the position
    final List<Position> associatedPositions = new ArrayList<>();
    associatedPositions.add(tashkil);
    created.setAssociatedPositions(associatedPositions);
    nrUpdated = adminMutationExecutor.updateAssociatedPosition("", getPositionInput(created));
    assertThat(nrUpdated).isEqualTo(1);

    // verify that we can pull the tashkil from the position
    Position retPos = jackQueryExecutor.position(FIELDS, created.getUuid());
    final List<Position> associatedPositions2 = retPos.getAssociatedPositions();
    assertThat(associatedPositions2.size()).isEqualTo(1);
    assertThat(associatedPositions2).anyMatch(p -> p.getUuid().equals(tashkil.getUuid()));

    // delete the tashkil from this position
    retPos.setAssociatedPositions(associatedPositions2.stream()
        .filter(p -> !p.getUuid().equals(tashkil.getUuid())).collect(Collectors.toList()));
    nrUpdated = adminMutationExecutor.updateAssociatedPosition("", getPositionInput(retPos));
    assertThat(nrUpdated).isEqualTo(1);

    // verify that it's now gone.
    retPos = jackQueryExecutor.position(FIELDS, created.getUuid());
    assertThat(retPos.getAssociatedPositions().size()).isEqualTo(0);

    // remove the principal from the tashkil
    nrDeleted = adminMutationExecutor.deletePersonFromPosition("", tashkil.getUuid());
    assertThat(nrDeleted).isEqualTo(1);

    // Try to delete this position, it should fail because the tashkil is active
    try {
      adminMutationExecutor.deletePosition("", tashkil.getUuid());
      fail("Expected BadRequestException");
    } catch (BadRequestException expectedException) {
    }

    tashkil.setStatus(Status.INACTIVE);
    nrUpdated = adminMutationExecutor.updatePosition("", getPositionInput(tashkil));
    assertThat(nrUpdated).isEqualTo(1);

    nrDeleted = adminMutationExecutor.deletePosition("", tashkil.getUuid());
    assertThat(nrDeleted).isEqualTo(1);

    try {
      jackQueryExecutor.position(FIELDS, tashkil.getUuid());
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }

    // Put jack back in his old position
    nrUpdated = adminMutationExecutor.putPersonInPosition("", getPersonInput(jack),
        jacksOldPosition.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    currPos = adminQueryExecutor.position(FIELDS, jacksOldPosition.getUuid());
    assertThat(currPos.getPerson()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isEqualTo(jack.getUuid());

    // Put roger back in his old position
    nrUpdated = adminMutationExecutor.putPersonInPosition("", getPersonInput(roger),
        rogersOldPosition.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    currPos = adminQueryExecutor.position(FIELDS, rogersOldPosition.getUuid());
    assertThat(currPos.getPerson()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isEqualTo(roger.getUuid());
  }

  @Test
  public void tashkilTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final OrganizationSearchQueryInput queryOrgs = OrganizationSearchQueryInput.builder()
        .withText("Ministry").withType(OrganizationType.PRINCIPAL_ORG).build();
    final AnetBeanList_Organization orgs =
        adminQueryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs);
    assertThat(orgs.getList().size()).isGreaterThan(0);

    // Create Position
    final PositionInput testInput = TestData.createPositionInput();
    testInput.setCode(testInput.getCode() + "_" + Instant.now().toEpochMilli());
    testInput.setOrganization(getOrganizationInput(orgs.getList().get(0)));
    testInput.setLocation(getLocationInput(getGeneralHospital()));
    final Position created = adminMutationExecutor.createPosition(FIELDS, testInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getName()).isEqualTo(testInput.getName());
    assertThat(created.getCode()).isEqualTo(testInput.getCode());

    // Change Name/Code
    created.setName("Deputy Chief of Donuts");
    Integer nrUpdated = adminMutationExecutor.updatePosition("", getPositionInput(created));
    assertThat(nrUpdated).isEqualTo(1);
    Position returned = jackQueryExecutor.position(FIELDS, created.getUuid());
    assertThat(returned.getName()).isEqualTo(created.getName());
    assertThat(returned.getCode()).isEqualTo(created.getCode());

    // Assign Principal
    final Person steve = getSteveSteveson();
    final Position stevesCurrPos = steve.getPosition();
    assertThat(stevesCurrPos).isNotNull();

    nrUpdated =
        adminMutationExecutor.putPersonInPosition("", getPersonInput(steve), created.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    Position principalPos = adminQueryExecutor.position(FIELDS, created.getUuid());
    assertThat(principalPos.getPerson()).isNotNull();
    assertThat(principalPos.getPerson().getUuid()).isEqualTo(steve.getUuid());

    // Put steve back in his originial position
    nrUpdated = adminMutationExecutor.putPersonInPosition("", getPersonInput(steve),
        stevesCurrPos.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    // Ensure the old position is now empty
    principalPos = adminQueryExecutor.position(FIELDS, created.getUuid());
    assertThat(principalPos.getPerson()).isNull();
  }

  @Test
  public void searchTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    PositionSearchQueryInput query = PositionSearchQueryInput.builder()
        // Search by name
        .withText("Advisor").build();
    List<Position> searchResults =
        jackQueryExecutor.positionList(getListFields(FIELDS), query).getList();
    assertThat(searchResults).isNotEmpty();

    // Search by name & is not filled
    query.setIsFilled(false);
    searchResults = jackQueryExecutor.positionList(getListFields(FIELDS), query).getList();
    assertThat(searchResults).isNotEmpty();
    assertThat(
        searchResults.stream().filter(p -> (p.getPerson() == null)).collect(Collectors.toList()))
        .hasSameElementsAs(searchResults);

    // Search by name and is filled and type
    query.setIsFilled(true);
    query.setType(ImmutableList.of(PositionType.ADVISOR));
    searchResults = jackQueryExecutor.positionList(getListFields(FIELDS), query).getList();
    assertThat(searchResults).isNotEmpty();
    assertThat(searchResults.stream().filter(p -> (p.getPerson() != null))
        .filter(p -> p.getType().equals(PositionType.ADVISOR)).collect(Collectors.toList()))
        .hasSameElementsAs(searchResults);

    // Search for text= advisor and type = admin should be empty.
    query.setType(ImmutableList.of(PositionType.ADMINISTRATOR));
    searchResults = jackQueryExecutor.positionList(getListFields(FIELDS), query).getList();
    assertThat(searchResults).isEmpty();

    query.setText("Administrator");
    searchResults = jackQueryExecutor.positionList(getListFields(FIELDS), query).getList();
    assertThat(searchResults).isNotEmpty();

    // Search by organization
    final OrganizationSearchQueryInput queryOrgs = OrganizationSearchQueryInput.builder()
        .withText("ef 1").withType(OrganizationType.ADVISOR_ORG).build();
    final AnetBeanList_Organization orgs =
        jackQueryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs);
    assertThat(orgs.getList().size()).isGreaterThan(0);
    Organization ef11 = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("ef 1.1")).findFirst().get();
    Organization ef1 = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("ef 1")).findFirst().get();
    assertThat(ef11.getShortName()).isEqualToIgnoringCase("EF 1.1");
    assertThat(ef1.getShortName()).isEqualTo("EF 1");

    query.setText("Advisor");
    query.setType(null);
    query.setOrganizationUuid(ef1.getUuid());
    searchResults = jackQueryExecutor.positionList(getListFields(FIELDS), query).getList();
    assertThat(searchResults.stream().filter(p -> p.getOrganization().getUuid() == ef1.getUuid())
        .collect(Collectors.toList())).hasSameElementsAs(searchResults);

    query.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    searchResults = jackQueryExecutor.positionList(getListFields(FIELDS), query).getList();
    assertThat(searchResults).isNotEmpty();

    query.setOrgRecurseStrategy(RecurseStrategy.NONE);
    query.setText("a");
    query.setSortBy(PositionSearchSortBy.NAME);
    query.setSortOrder(SortOrder.DESC);
    searchResults = jackQueryExecutor.positionList(getListFields(FIELDS), query).getList();
    final Collator collator = Collator.getInstance();
    collator.setStrength(Collator.PRIMARY);
    String prevName = null;
    for (Position p : searchResults) {
      if (prevName != null) {
        assertThat(collator.compare(p.getName(), prevName)).isLessThanOrEqualTo(0);
      }
      prevName = p.getName();
    }

    query.setSortBy(PositionSearchSortBy.CODE);
    query.setSortOrder(SortOrder.ASC);
    searchResults = jackQueryExecutor.positionList(getListFields(FIELDS), query).getList();
    String prevCode = null;
    for (Position p : searchResults) {
      if (prevCode != null) {
        assertThat(p.getCode().compareToIgnoreCase(prevCode)).isGreaterThanOrEqualTo(0);
      }
      prevCode = p.getCode();
    }

    // search by status.
    query = PositionSearchQueryInput.builder().withStatus(Status.INACTIVE).build();
    searchResults = jackQueryExecutor.positionList(getListFields(FIELDS), query).getList();
    assertThat(searchResults.size()).isGreaterThan(0);
    assertThat(searchResults.stream().filter(p -> p.getStatus().equals(Status.INACTIVE)).count())
        .isEqualTo(searchResults.size());
  }

  @Test
  public void searchPendingAssessmentsTestAll()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person erin = getRegularUser();
    // Search all organizations
    final PositionSearchQueryInput query =
        PositionSearchQueryInput.builder().withHasPendingAssessments(true).build();
    final TaskSearchQueryInput responsibleTasksQuery =
        TaskSearchQueryInput.builder().withStatus(Status.ACTIVE).build();
    final AnetBeanList_Position searchResults =
        getQueryExecutor(getRegularUser().getDomainUsername()).positionList(
            getListFields(PA_FIELDS), query, "responsibleTasksQuery", responsibleTasksQuery);
    assertThat(searchResults).isNotNull();
    final List<Position> list = searchResults.getList();
    assertThat(list).isNotEmpty();
    final Set<String> uuids = list.stream().map(p -> p.getUuid()).collect(Collectors.toSet());
    // EF 1
    assertThat(uuids).contains(getAndrewAnderson().getPosition().getUuid());
    // EF 1.1
    assertThat(uuids).contains(getBobBobtown().getPosition().getUuid());
    // EF 2.1
    assertThat(uuids).contains(getJackJackson().getPosition().getUuid());
    // EF 2.2
    assertThat(uuids).contains(erin.getPosition().getUuid());
    // Each entry should have associatedPositions or responsibleTasks (or both)
    assertThat(list.stream().filter(p -> !Utils.isEmptyOrNull(p.getAssociatedPositions())
        || !Utils.isEmptyOrNull(p.getResponsibleTasks()))).hasSameSizeAs(list);
  }

  @Test
  public void searchPendingAssessmentsTestEf1()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person erin = getRegularUser();
    // Search EF 1 and below
    final PositionSearchQueryInput query =
        PositionSearchQueryInput.builder().withHasPendingAssessments(true)
            .withOrganizationUuid(getAndrewAnderson().getPosition().getOrganization().getUuid())
            .withOrgRecurseStrategy(RecurseStrategy.CHILDREN).build();
    final TaskSearchQueryInput responsibleTasksQuery =
        TaskSearchQueryInput.builder().withStatus(Status.ACTIVE).build();
    final AnetBeanList_Position searchResults =
        getQueryExecutor(getRegularUser().getDomainUsername()).positionList(
            getListFields(PA_FIELDS), query, "responsibleTasksQuery", responsibleTasksQuery);
    assertThat(searchResults).isNotNull();
    final List<Position> list = searchResults.getList();
    assertThat(list).isNotEmpty();
    final Set<String> uuids = list.stream().map(p -> p.getUuid()).collect(Collectors.toSet());
    // EF 1
    assertThat(uuids).contains(getAndrewAnderson().getPosition().getUuid());
    // EF 1.1
    assertThat(uuids).contains(getBobBobtown().getPosition().getUuid());
    // EF 2.1
    assertThat(uuids).doesNotContain(getJackJackson().getPosition().getUuid());
    // EF 2.2
    assertThat(uuids).doesNotContain(erin.getPosition().getUuid());
    // Each entry should have associatedPositions or responsibleTasks (or both)
    assertThat(list.stream().filter(p -> !Utils.isEmptyOrNull(p.getAssociatedPositions())
        || !Utils.isEmptyOrNull(p.getResponsibleTasks()))).hasSameSizeAs(list);
  }

  @Test
  public void createPositionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a new position and designate the person upfront
    final PersonInput newbInput = PersonInput.builder().withName("PositionTest Person")
        .withRole(Role.PRINCIPAL).withStatus(Status.ACTIVE).build();

    Person newb = adminMutationExecutor.createPerson(PERSON_FIELDS, newbInput);
    assertThat(newb).isNotNull();
    assertThat(newb.getUuid()).isNotNull();

    final OrganizationSearchQueryInput queryOrgs = OrganizationSearchQueryInput.builder()
        .withText("Ministry").withType(OrganizationType.PRINCIPAL_ORG).build();
    final AnetBeanList_Organization orgs =
        adminQueryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs);
    assertThat(orgs.getList().size()).isGreaterThan(0);

    final String positionCode = UUID.randomUUID().toString();
    final PositionInput newbPositionInput = PositionInput.builder()
        .withName("PositionTest Position for Newb").withType(PositionType.PRINCIPAL)
        .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(orgs.getList().get(0)))
        .withStatus(Status.ACTIVE).withPerson(getPersonInput(newb)).withCode(positionCode).build();

    final Position newbPosition = adminMutationExecutor.createPosition(FIELDS, newbPositionInput);
    assertThat(newbPosition).isNotNull();
    assertThat(newbPosition.getUuid()).isNotNull();
    // Ensure that the position contains the person
    final Person returnedPerson = newbPosition.getPerson();
    assertThat(returnedPerson).isNotNull();
    assertThat(returnedPerson.getUuid()).isEqualTo(newb.getUuid());

    // Ensure that the person is assigned to this position.
    newb = adminQueryExecutor.person(PERSON_FIELDS, newb.getUuid());
    assertThat(newb.getPosition()).isNotNull();
    assertThat(newb.getPosition().getUuid()).isEqualTo(newbPosition.getUuid());

    // Assign somebody else to this position.
    final PersonInput prin2Input = PersonInput.builder().withName("2nd Principal in PrincipalTest")
        .withRole(Role.PRINCIPAL).build();
    Person prin2 = adminMutationExecutor.createPerson(PERSON_FIELDS, prin2Input);
    assertThat(prin2).isNotNull();
    assertThat(prin2.getUuid()).isNotNull();
    assertThat(prin2.getPosition()).isNull();

    final PositionInput prin2PositionInput =
        PositionInput.builder().withUuid(newbPosition.getUuid()).build();
    final PersonInput prin2UpdateInput = getPersonInput(prin2);
    prin2UpdateInput.setPosition(prin2PositionInput);
    Integer nrUpdated = adminMutationExecutor.updatePerson("", prin2UpdateInput);
    assertThat(nrUpdated).isEqualTo(1);

    // Reload this person to check their position was set.
    prin2 = adminQueryExecutor.person(PERSON_FIELDS, prin2.getUuid());
    assertThat(prin2).isNotNull();
    assertThat(prin2.getPosition()).isNotNull();
    assertThat(prin2.getPosition().getUuid()).isEqualTo(newbPosition.getUuid());

    // Check with a different API endpoint.
    Position currPos = adminQueryExecutor.position(FIELDS, newbPosition.getUuid());
    assertThat(currPos).isNotNull();
    assertThat(currPos.getPerson()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isEqualTo(prin2.getUuid());

    // Slow the test down a bit
    try {
      Thread.sleep(10);
    } catch (InterruptedException ignore) {
      // just continue
    }

    // Create a new position and move prin2 there on CREATE.
    final PositionInput pos2Input = PositionInput.builder().withName("Created by PositionTest")
        .withType(PositionType.PRINCIPAL).withRole(PositionRole.MEMBER)
        .withOrganization(getOrganizationInput(orgs.getList().get(0)))
        .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE)
        .withPerson(getPersonInput(prin2)).build();

    final Position pos2 = adminMutationExecutor.createPosition(FIELDS, pos2Input);
    assertThat(pos2).isNotNull();
    assertThat(pos2.getUuid()).isNotNull();
    assertThat(pos2.getName()).isEqualTo(pos2Input.getName());
    final Person returnedPerson2 = pos2.getPerson();
    assertThat(returnedPerson2).isNotNull();
    assertThat(returnedPerson2.getUuid()).isEqualTo(prin2.getUuid());

    // Make sure prin2 got moved out of newbPosition
    currPos = adminQueryExecutor.position(FIELDS, newbPosition.getUuid());
    assertThat(currPos.getPerson()).isNull();

    // Check the history of newbPosition
    final List<PersonPositionHistory> history = currPos.getPreviousPeople();
    assertThat(history.size()).isEqualTo(2);
    assertThat(history.get(0).getPerson().getUuid()).isEqualTo(newb.getUuid());
    assertThat(history.get(1).getPerson().getUuid()).isEqualTo(prin2.getUuid());

    // Try to create another position with the same code
    final PositionInput dupCodePositionInput = PositionInput.builder()
        .withName("PositionTest Position for duplicate code").withType(PositionType.PRINCIPAL)
        .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(orgs.getList().get(0)))
        .withStatus(Status.ACTIVE).withCode(positionCode).build();
    try {
      adminMutationExecutor.createPosition(FIELDS, dupCodePositionInput);
      fail("Expected ClientErrorException");
    } catch (ClientErrorException expectedException) {
    }
  }

  @Test
  public void positionUpdateAdminPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    updatePosition(admin);
  }

  @Test
  public void positionUpdateSuperuserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    updatePosition(getSuperuser());
  }

  @Test
  public void positionUpdateRegularUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    updatePosition(getRegularUser());
  }

  private void updatePosition(Person user)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final QueryExecutor userQueryExecutor = getQueryExecutor(user.getDomainUsername());
    final MutationExecutor userMutationExecutor = getMutationExecutor(user.getDomainUsername());
    final Position position = user.getPosition();
    final boolean isSuperuser = position.getType() == PositionType.SUPERUSER;
    final boolean isAdmin = position.getType() == PositionType.ADMINISTRATOR;

    // try to update a position from the user's org
    final Organization userOrg =
        userQueryExecutor.organization(ORGANIZATION_FIELDS, position.getOrganization().getUuid());
    final List<Position> userOrgPositions = userOrg.getPositions();
    assertThat(userOrgPositions).isNotNull();
    assertThat(userOrgPositions).isNotEmpty();
    final Position p1 = userOrgPositions.get(0);
    try {
      final Integer nrUpdated = userMutationExecutor.updatePosition("", getPositionInput(p1));
      if (isAdmin) {
        assertThat(nrUpdated).isEqualTo(1);
      } else if (isSuperuser) {
        assertThat(nrUpdated).isEqualTo(1);
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin || isSuperuser) {
        fail("Unexpected ForbiddenException");
      }
    }

    // create a regular position not related to the user's organization
    final Organization ao = adminMutationExecutor.createOrganization(ORGANIZATION_FIELDS,
        TestData.createAdvisorOrganizationInput(true));
    final PositionInput newPositionInput =
        PositionInput.builder().withName("A Test Position not related to the user's organization")
            .withType(PositionType.ADVISOR).withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE)
            .withOrganization(getOrganizationInput(ao))
            .withLocation(getLocationInput(getGeneralHospital())).build();
    final Position newPosition = adminMutationExecutor.createPosition(FIELDS, newPositionInput);

    // try to update the new position (not related to the user's organization)
    try {
      final Integer nrUpdated =
          userMutationExecutor.updatePosition("", getPositionInput(newPosition));
      if (isAdmin) {
        assertThat(nrUpdated).isEqualTo(1);
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }

    // try to update a regular user position and make it superuser
    final PositionInput p3 = getPositionInput(newPosition);
    try {
      p3.setType(PositionType.SUPERUSER);
      final Integer nrUpdated = userMutationExecutor.updatePosition("", p3);
      if (isAdmin) {
        assertThat(nrUpdated).isEqualTo(1);
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

  @Test
  public void testUpdatePositionHistory()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Organization ao = adminMutationExecutor.createOrganization(ORGANIZATION_FIELDS,
        TestData.createAdvisorOrganizationInput(true));
    final PositionInput testInput1 =
        PositionInput.builder().withName("A Test Position for edittting history")
            .withType(PositionType.ADVISOR).withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE)
            .withOrganization(getOrganizationInput(ao))
            .withLocation(getLocationInput(getGeneralHospital())).build();

    final Position createdPos = adminMutationExecutor.createPosition(FIELDS, testInput1);
    assertThat(createdPos).isNotNull();
    assertThat(createdPos.getUuid()).isNotNull();
    assertThat(createdPos.getName()).isEqualTo(testInput1.getName());

    final PersonInput persInput1 = PersonInput.builder().withRole(Role.ADVISOR)
        .withName("Test person for edit history").build();
    final Person person1 = adminMutationExecutor.createPerson(PERSON_FIELDS, persInput1);
    assertThat(person1).isNotNull();
    assertThat(person1.getUuid()).isNotNull();
    final PersonInput persInput2 = PersonInput.builder().withRole(Role.ADVISOR)
        .withName("Test person for edit history").build();
    final Person person2 = adminMutationExecutor.createPerson(PERSON_FIELDS, persInput2);
    assertThat(person2).isNotNull();
    assertThat(person2.getUuid()).isNotNull();
    final List<PersonPositionHistoryInput> prevPersons =
        new ArrayList<PersonPositionHistoryInput>();
    final PersonPositionHistoryInput histInput1 = PersonPositionHistoryInput.builder()
        .withCreatedAt(Instant.now().minus(100, ChronoUnit.DAYS))
        .withStartTime(Instant.now().minus(100, ChronoUnit.DAYS))
        .withEndTime(Instant.now().minus(50, ChronoUnit.DAYS)).withPerson(getPersonInput(person1))
        .build();
    final PersonPositionHistoryInput histInput2 =
        PersonPositionHistoryInput.builder().withCreatedAt(Instant.now().minus(49, ChronoUnit.DAYS))
            .withStartTime(Instant.now().minus(49, ChronoUnit.DAYS)).withEndTime(Instant.now())
            .withPerson(getPersonInput(person2)).build();
    prevPersons.add(histInput1);
    prevPersons.add(histInput2);
    final PositionInput inputForTest = PositionInput.builder().withUuid(createdPos.getUuid())
        .withPreviousPeople(prevPersons).build();
    adminMutationExecutor.updatePositionHistory("", inputForTest);
    final Position positionUpdated =
        adminQueryExecutor.position(FIELDS, getPositionInput(createdPos).getUuid());
    assertThat(positionUpdated).isNotNull();
    assertThat(positionUpdated.getPreviousPeople().size() == 2);
  }

}
