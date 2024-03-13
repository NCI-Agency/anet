package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.ImmutableList;
import java.text.Collator;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Organization;
import mil.dds.anet.test.client.AnetBeanList_Position;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
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
import mil.dds.anet.test.client.SortOrder;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.TaskSearchQueryInput;
import mil.dds.anet.utils.Utils;
import org.junit.jupiter.api.Test;

public class PositionResourceTest extends AbstractResourceTest {
  private static final String _ORGANIZATION_FIELDS = "uuid shortName";
  private static final String _PERSON_FIELDS = "uuid name";
  private static final String _POSITION_FIELDS = "uuid name code type role status customFields";
  public static final String ORGANIZATION_FIELDS =
      String.format("{ %1$s positions { %2$s organization { uuid } location { uuid } } }",
          _ORGANIZATION_FIELDS, _POSITION_FIELDS);
  public static final String PERSON_FIELDS =
      String.format("{ %1$s position { %2$s } }", _PERSON_FIELDS, _POSITION_FIELDS);
  public static final String FIELDS = String.format(
      "{ %1$s person { %2$s } organization { %3$s } associatedPositions { uuid }"
          + " previousPeople { createdAt startTime endTime position { uuid }"
          + " person { uuid name rank } } }",
      _POSITION_FIELDS, _PERSON_FIELDS, _ORGANIZATION_FIELDS);
  private static final String PA_FIELDS =
      "{ uuid associatedPositions { uuid } responsibleTasks(query: ?responsibleTasksQuery) { uuid } }";

  @Test
  void positionTest() {
    final Person jack = getJackJackson();
    assertThat(jack.getUuid()).isNotNull();
    assertThat(jack.getPosition()).isNotNull();
    final Position jacksOldPosition = jack.getPosition();

    // Create Position assigned to an AO
    final Organization ao = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    final PositionInput testInput =
        PositionInput.builder().withName("A Test Position created by PositionResourceTest")
            .withType(PositionType.REGULAR).withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE)
            .withOrganization(getOrganizationInput(ao))
            .withLocation(getLocationInput(getGeneralHospital())).build();

    final Position created1 =
        withCredentials(adminUser, t -> mutationExecutor.createPosition(FIELDS, testInput));
    assertThat(created1).isNotNull();
    assertThat(created1.getUuid()).isNotNull();
    assertThat(created1.getName()).isEqualTo(testInput.getName());
    assertThat(created1.getOrganization().getUuid()).isEqualTo(ao.getUuid());

    // Assign a person into the position
    Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.putPersonInPosition("", getPersonInput(jack), created1.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    Position currPos =
        withCredentials(adminUser, t -> queryExecutor.position(FIELDS, created1.getUuid()));
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
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.putPersonInPosition("", getPersonInput(steve), created1.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    // Verify that the new person is in the position
    currPos = withCredentials(jackUser, t -> queryExecutor.position(FIELDS, created1.getUuid()));
    assertThat(currPos.getPerson()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isEqualTo(steve.getUuid());

    // Verify that the previous person is now no longer in a position
    final Person returnedPerson =
        withCredentials(jackUser, t -> queryExecutor.person(PERSON_FIELDS, jack.getUuid()));
    assertThat(returnedPerson.getPosition()).isNull();

    // delete the person from this position
    Integer nrDeleted = withCredentials(adminUser,
        t -> mutationExecutor.deletePersonFromPosition("", created1.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);

    currPos = withCredentials(jackUser, t -> queryExecutor.position(FIELDS, created1.getUuid()));
    assertThat(currPos.getPerson()).isNull();

    // Put steve back in his old position
    nrUpdated = withCredentials(adminUser, t -> mutationExecutor.putPersonInPosition("",
        getPersonInput(steve), stevesCurrentPosition.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    currPos = withCredentials(jackUser,
        t -> queryExecutor.position(FIELDS, stevesCurrentPosition.getUuid()));
    assertThat(currPos.getPerson()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isEqualTo(steve.getUuid());

    // pull for the person at a previous time.
    final Position created2 =
        withCredentials(jackUser, t -> queryExecutor.position(FIELDS, created1.getUuid()));
    final List<PersonPositionHistory> history = created2.getPreviousPeople();
    assertThat(history).isNotEmpty();
    assertThat(history).hasSize(2);
    assertThat(history.get(0).getPosition().getUuid()).isEqualTo(created2.getUuid());
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

    // Create an interlocutor
    final OrganizationSearchQueryInput queryOrgs =
        OrganizationSearchQueryInput.builder().withText("Ministry").build();
    final AnetBeanList_Organization orgs = withCredentials(adminUser,
        t -> queryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs));
    assertThat(orgs.getList()).isNotEmpty();

    final PositionInput prinPosInput =
        PositionInput.builder().withName("A Principal Position created by PositionResourceTest")
            .withType(PositionType.REGULAR).withRole(PositionRole.MEMBER)
            .withOrganization(getOrganizationInput(orgs.getList().get(0))).withStatus(Status.ACTIVE)
            .build();

    final Person roger = getRogerRogwell();
    final Position rogersOldPosition = roger.getPosition();
    assertThat(roger.getUuid()).isNotNull();
    final Position tashkil =
        withCredentials(adminUser, t -> mutationExecutor.createPosition(FIELDS, prinPosInput));
    assertThat(tashkil).isNotNull();
    assertThat(tashkil.getUuid()).isNotNull();

    // put the interlocutor in a tashkil
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.putPersonInPosition("", getPersonInput(roger), tashkil.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    // assign the tashkil to the position
    final List<Position> associatedPositions = new ArrayList<>();
    associatedPositions.add(tashkil);
    created1.setAssociatedPositions(associatedPositions);
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateAssociatedPosition("", getPositionInput(created1)));
    assertThat(nrUpdated).isEqualTo(1);

    // verify that we can pull the tashkil from the position
    final Position retPos1 =
        withCredentials(jackUser, t -> queryExecutor.position(FIELDS, created1.getUuid()));
    final List<Position> associatedPositions2 = retPos1.getAssociatedPositions();
    assertThat(associatedPositions2).hasSize(1);
    assertThat(associatedPositions2).anyMatch(p -> p.getUuid().equals(tashkil.getUuid()));

    // delete the tashkil from this position
    retPos1.setAssociatedPositions(associatedPositions2.stream()
        .filter(p -> !p.getUuid().equals(tashkil.getUuid())).collect(Collectors.toList()));
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateAssociatedPosition("", getPositionInput(retPos1)));
    assertThat(nrUpdated).isEqualTo(1);

    // verify that it's now gone.
    final Position retPos2 =
        withCredentials(jackUser, t -> queryExecutor.position(FIELDS, created1.getUuid()));
    assertThat(retPos2.getAssociatedPositions()).isEmpty();

    // remove the interlocutor from the tashkil
    nrDeleted = withCredentials(adminUser,
        t -> mutationExecutor.deletePersonFromPosition("", tashkil.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);

    // Try to delete this position, it should fail because the tashkil is active
    try {
      withCredentials(adminUser, t -> mutationExecutor.deletePosition("", tashkil.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    tashkil.setStatus(Status.INACTIVE);
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updatePosition("", getPositionInput(tashkil)));
    assertThat(nrUpdated).isEqualTo(1);

    nrDeleted =
        withCredentials(adminUser, t -> mutationExecutor.deletePosition("", tashkil.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);

    try {
      withCredentials(jackUser, t -> queryExecutor.position(FIELDS, tashkil.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Put jack back in his old position
    nrUpdated = withCredentials(adminUser, t -> mutationExecutor.putPersonInPosition("",
        getPersonInput(jack), jacksOldPosition.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    currPos =
        withCredentials(adminUser, t -> queryExecutor.position(FIELDS, jacksOldPosition.getUuid()));
    assertThat(currPos.getPerson()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isEqualTo(jack.getUuid());

    // Put roger back in his old position
    nrUpdated = withCredentials(adminUser, t -> mutationExecutor.putPersonInPosition("",
        getPersonInput(roger), rogersOldPosition.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    currPos = withCredentials(adminUser,
        t -> queryExecutor.position(FIELDS, rogersOldPosition.getUuid()));
    assertThat(currPos.getPerson()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isEqualTo(roger.getUuid());
  }

  @Test
  void tashkilTest() {
    final OrganizationSearchQueryInput queryOrgs =
        OrganizationSearchQueryInput.builder().withText("Ministry").build();
    final AnetBeanList_Organization orgs = withCredentials(adminUser,
        t -> queryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs));
    assertThat(orgs.getList()).isNotEmpty();

    // Create Position
    final PositionInput testInput = TestData.createPositionInput();
    testInput.setCode(testInput.getCode() + "_" + Instant.now().toEpochMilli());
    testInput.setOrganization(getOrganizationInput(orgs.getList().get(0)));
    testInput.setLocation(getLocationInput(getGeneralHospital()));
    final Position created =
        withCredentials(adminUser, t -> mutationExecutor.createPosition(FIELDS, testInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getName()).isEqualTo(testInput.getName());
    assertThat(created.getCode()).isEqualTo(testInput.getCode());

    // Change Name/Code
    created.setName("Deputy Chief of Donuts");
    Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updatePosition("", getPositionInput(created)));
    assertThat(nrUpdated).isEqualTo(1);
    Position returned =
        withCredentials(jackUser, t -> queryExecutor.position(FIELDS, created.getUuid()));
    assertThat(returned.getName()).isEqualTo(created.getName());
    assertThat(returned.getCode()).isEqualTo(created.getCode());

    // Assign Interlocutor
    final Person steve = getSteveSteveson();
    final Position stevesCurrPos = steve.getPosition();
    assertThat(stevesCurrPos).isNotNull();

    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.putPersonInPosition("", getPersonInput(steve), created.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    Position interlocutorPos =
        withCredentials(adminUser, t -> queryExecutor.position(FIELDS, created.getUuid()));
    assertThat(interlocutorPos.getPerson()).isNotNull();
    assertThat(interlocutorPos.getPerson().getUuid()).isEqualTo(steve.getUuid());

    // Put steve back in his originial position
    nrUpdated = withCredentials(adminUser, t -> mutationExecutor.putPersonInPosition("",
        getPersonInput(steve), stevesCurrPos.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    // Ensure the old position is now empty
    interlocutorPos =
        withCredentials(adminUser, t -> queryExecutor.position(FIELDS, created.getUuid()));
    assertThat(interlocutorPos.getPerson()).isNull();
  }

  @Test
  void searchTest() {
    final PositionSearchQueryInput query1 = PositionSearchQueryInput.builder()
        // Search by name
        .withText("Advisor").build();
    List<Position> searchResults =
        withCredentials(jackUser, t -> queryExecutor.positionList(getListFields(FIELDS), query1))
            .getList();
    assertThat(searchResults).isNotEmpty();

    // Search by name & is not filled
    query1.setIsFilled(false);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.positionList(getListFields(FIELDS), query1))
            .getList();
    assertThat(searchResults).isNotEmpty();
    assertThat(
        searchResults.stream().filter(p -> (p.getPerson() == null)).collect(Collectors.toList()))
        .hasSameElementsAs(searchResults);

    // Search by name and is filled and type
    query1.setIsFilled(true);
    query1.setType(ImmutableList.of(PositionType.REGULAR));
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.positionList(getListFields(FIELDS), query1))
            .getList();
    assertThat(searchResults).isNotEmpty();
    assertThat(searchResults.stream().filter(p -> (p.getPerson() != null))
        .filter(p -> p.getType().equals(PositionType.REGULAR)).collect(Collectors.toList()))
        .hasSameElementsAs(searchResults);

    // Search for text= advisor and type = admin should be empty.
    query1.setType(ImmutableList.of(PositionType.ADMINISTRATOR));
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.positionList(getListFields(FIELDS), query1))
            .getList();
    assertThat(searchResults).isEmpty();

    query1.setText("Administrator");
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.positionList(getListFields(FIELDS), query1))
            .getList();
    assertThat(searchResults).isNotEmpty();

    // Search by organization
    final OrganizationSearchQueryInput queryOrgs =
        OrganizationSearchQueryInput.builder().withText("ef 1").build();
    final AnetBeanList_Organization orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs));
    assertThat(orgs.getList()).isNotEmpty();
    Organization ef11 = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("ef 1.1")).findFirst().get();
    Organization ef1 = orgs.getList().stream()
        .filter(o -> o.getShortName().equalsIgnoreCase("ef 1")).findFirst().get();
    assertThat(ef11.getShortName()).isEqualToIgnoringCase("EF 1.1");
    assertThat(ef1.getShortName()).isEqualTo("EF 1");

    query1.setText("Advisor");
    query1.setType(null);
    query1.setOrganizationUuid(List.of(ef1.getUuid()));
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.positionList(getListFields(FIELDS), query1))
            .getList();
    assertThat(
        searchResults.stream().filter(p -> p.getOrganization().getUuid().equals(ef1.getUuid()))
            .collect(Collectors.toList()))
        .hasSameElementsAs(searchResults);

    query1.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.positionList(getListFields(FIELDS), query1))
            .getList();
    assertThat(searchResults).isNotEmpty();

    query1.setOrgRecurseStrategy(RecurseStrategy.NONE);
    query1.setText("a");
    query1.setSortBy(PositionSearchSortBy.NAME);
    query1.setSortOrder(SortOrder.DESC);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.positionList(getListFields(FIELDS), query1))
            .getList();
    final Collator collator = Collator.getInstance();
    collator.setStrength(Collator.PRIMARY);
    String prevName = null;
    for (Position p : searchResults) {
      if (prevName != null) {
        assertThat(collator.compare(p.getName(), prevName)).isNotPositive();
      }
      prevName = p.getName();
    }

    query1.setSortBy(PositionSearchSortBy.CODE);
    query1.setSortOrder(SortOrder.ASC);
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.positionList(getListFields(FIELDS), query1))
            .getList();
    String prevCode = null;
    for (Position p : searchResults) {
      if (prevCode != null) {
        assertThat(p.getCode().compareToIgnoreCase(prevCode)).isNotNegative();
      }
      prevCode = p.getCode();
    }

    // search by status.
    final PositionSearchQueryInput query2 =
        PositionSearchQueryInput.builder().withStatus(Status.INACTIVE).build();
    searchResults =
        withCredentials(jackUser, t -> queryExecutor.positionList(getListFields(FIELDS), query2))
            .getList();
    assertThat(searchResults).isNotEmpty();
    assertThat(searchResults.stream().filter(p -> p.getStatus().equals(Status.INACTIVE)).count())
        .isEqualTo(searchResults.size());
  }

  @Test
  void searchPendingAssessmentsTestAll() {
    final Person erin = getRegularUser();
    // Search all organizations
    final PositionSearchQueryInput query =
        PositionSearchQueryInput.builder().withHasPendingAssessments(true).build();
    final TaskSearchQueryInput responsibleTasksQuery =
        TaskSearchQueryInput.builder().withStatus(Status.ACTIVE).build();
    final AnetBeanList_Position searchResults =
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.positionList(getListFields(PA_FIELDS), query,
                "responsibleTasksQuery", responsibleTasksQuery));
    assertThat(searchResults).isNotNull();
    final List<Position> list = searchResults.getList();
    assertThat(list).isNotEmpty();
    final Set<String> uuids = list.stream().map(Position::getUuid).collect(Collectors.toSet());
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
  void searchPendingAssessmentsTestEf1() {
    final Person erin = getRegularUser();
    // Search EF 1 and below
    final PositionSearchQueryInput query =
        PositionSearchQueryInput.builder().withHasPendingAssessments(true)
            .withOrganizationUuid(
                List.of(getAndrewAnderson().getPosition().getOrganization().getUuid()))
            .withOrgRecurseStrategy(RecurseStrategy.CHILDREN).build();
    final TaskSearchQueryInput responsibleTasksQuery =
        TaskSearchQueryInput.builder().withStatus(Status.ACTIVE).build();
    final AnetBeanList_Position searchResults =
        withCredentials(getRegularUser().getDomainUsername(),
            t -> queryExecutor.positionList(getListFields(PA_FIELDS), query,
                "responsibleTasksQuery", responsibleTasksQuery));
    assertThat(searchResults).isNotNull();
    final List<Position> list = searchResults.getList();
    assertThat(list).isNotEmpty();
    final Set<String> uuids = list.stream().map(Position::getUuid).collect(Collectors.toSet());
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
  void createPositionTest() {
    // Create a new position and designate the person upfront
    final PersonInput newbInput =
        PersonInput.builder().withName("PositionTest Person").withStatus(Status.ACTIVE).build();

    final Person newb1 =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(PERSON_FIELDS, newbInput));
    assertThat(newb1).isNotNull();
    assertThat(newb1.getUuid()).isNotNull();

    final OrganizationSearchQueryInput queryOrgs =
        OrganizationSearchQueryInput.builder().withText("Ministry").build();
    final AnetBeanList_Organization orgs = withCredentials(adminUser,
        t -> queryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs));
    assertThat(orgs.getList()).isNotEmpty();

    final String positionCode = UUID.randomUUID().toString();
    final PositionInput newbPositionInput = PositionInput.builder()
        .withName("PositionTest Position for Newb").withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(orgs.getList().get(0)))
        .withStatus(Status.ACTIVE).withPerson(getPersonInput(newb1)).withCode(positionCode).build();

    final Position newbPosition =
        withCredentials(adminUser, t -> mutationExecutor.createPosition(FIELDS, newbPositionInput));
    assertThat(newbPosition).isNotNull();
    assertThat(newbPosition.getUuid()).isNotNull();
    // Ensure that the position contains the person
    final Person returnedPerson = newbPosition.getPerson();
    assertThat(returnedPerson).isNotNull();
    assertThat(returnedPerson.getUuid()).isEqualTo(newb1.getUuid());

    // Ensure that the person is assigned to this position.
    final Person newb2 =
        withCredentials(adminUser, t -> queryExecutor.person(PERSON_FIELDS, newb1.getUuid()));
    assertThat(newb2.getPosition()).isNotNull();
    assertThat(newb2.getPosition().getUuid()).isEqualTo(newbPosition.getUuid());

    // Assign somebody else to this position.
    final PersonInput prin2Input =
        PersonInput.builder().withName("2nd Interlocutor in InterlocutorTest").build();
    final Person prin2 =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(PERSON_FIELDS, prin2Input));
    assertThat(prin2).isNotNull();
    assertThat(prin2.getUuid()).isNotNull();
    assertThat(prin2.getPosition()).isNull();

    final PositionInput prin2PositionInput =
        PositionInput.builder().withUuid(newbPosition.getUuid()).build();
    final PersonInput prin2UpdateInput = getPersonInput(prin2);
    prin2UpdateInput.setPosition(prin2PositionInput);
    Integer nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updatePerson("", prin2UpdateInput));
    assertThat(nrUpdated).isEqualTo(1);

    // Reload this person to check their position was set.
    final Person prin3 =
        withCredentials(adminUser, t -> queryExecutor.person(PERSON_FIELDS, prin2.getUuid()));
    assertThat(prin3).isNotNull();
    assertThat(prin3.getPosition()).isNotNull();
    assertThat(prin3.getPosition().getUuid()).isEqualTo(newbPosition.getUuid());

    // Check with a different API endpoint.
    Position currPos =
        withCredentials(adminUser, t -> queryExecutor.position(FIELDS, newbPosition.getUuid()));
    assertThat(currPos).isNotNull();
    assertThat(currPos.getPerson()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isNotNull();
    assertThat(currPos.getPerson().getUuid()).isEqualTo(prin3.getUuid());

    // Slow the test down a bit
    try {
      Thread.sleep(10);
    } catch (InterruptedException ignore) {
      // just continue
    }

    // Create a new position and move prin2 there on CREATE.
    final PositionInput pos2Input = PositionInput.builder().withName("Created by PositionTest")
        .withType(PositionType.REGULAR).withRole(PositionRole.MEMBER)
        .withOrganization(getOrganizationInput(orgs.getList().get(0)))
        .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE)
        .withPerson(getPersonInput(prin2)).build();

    final Position pos2 =
        withCredentials(adminUser, t -> mutationExecutor.createPosition(FIELDS, pos2Input));
    assertThat(pos2).isNotNull();
    assertThat(pos2.getUuid()).isNotNull();
    assertThat(pos2.getName()).isEqualTo(pos2Input.getName());
    final Person returnedPerson2 = pos2.getPerson();
    assertThat(returnedPerson2).isNotNull();
    assertThat(returnedPerson2.getUuid()).isEqualTo(prin2.getUuid());

    // Make sure prin2 got moved out of newbPosition
    currPos =
        withCredentials(adminUser, t -> queryExecutor.position(FIELDS, newbPosition.getUuid()));
    assertThat(currPos.getPerson()).isNull();

    // Check the history of newbPosition
    final List<PersonPositionHistory> history = currPos.getPreviousPeople();
    assertThat(history).hasSize(2);
    assertThat(history.get(0).getPerson().getUuid()).isEqualTo(newb1.getUuid());
    assertThat(history.get(1).getPerson().getUuid()).isEqualTo(prin2.getUuid());

    // Try to create another position with the same code
    final PositionInput dupCodePositionInput = PositionInput.builder()
        .withName("PositionTest Position for duplicate code").withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(orgs.getList().get(0)))
        .withStatus(Status.ACTIVE).withCode(positionCode).build();
    try {
      withCredentials(adminUser,
          t -> mutationExecutor.createPosition(FIELDS, dupCodePositionInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void positionUpdateAdminPermissionTest() {
    updatePosition(admin);
  }

  @Test
  void positionUpdateSuperuserPermissionTest() {
    updatePosition(getSuperuser());
  }

  @Test
  void positionUpdateRegularUserPermissionTest() {
    updatePosition(getRegularUser());
  }

  private void updatePosition(Person user) {
    final Position position = user.getPosition();
    final boolean isSuperuser = position.getType() == PositionType.SUPERUSER;
    final boolean isAdmin = position.getType() == PositionType.ADMINISTRATOR;

    // try to update a position from the user's org
    final Organization userOrg = withCredentials(user.getDomainUsername(),
        t -> queryExecutor.organization(ORGANIZATION_FIELDS, position.getOrganization().getUuid()));
    final List<Position> userOrgPositions = userOrg.getPositions();
    assertThat(userOrgPositions).isNotNull();
    assertThat(userOrgPositions).isNotEmpty();
    final Position p1 = userOrgPositions.get(0);
    try {
      final Integer nrUpdated = withCredentials(user.getDomainUsername(),
          t -> mutationExecutor.updatePosition("", getPositionInput(p1)));
      if (isAdmin) {
        assertThat(nrUpdated).isEqualTo(1);
      } else if (isSuperuser) {
        assertThat(nrUpdated).isEqualTo(1);
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isAdmin || isSuperuser) {
        fail("Unexpected Exception", expectedException);
      }
    }

    // create a regular position not related to the user's organization
    final Organization ao = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    final PositionInput newPositionInput =
        PositionInput.builder().withName("A Test Position not related to the user's organization")
            .withType(PositionType.REGULAR).withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE)
            .withOrganization(getOrganizationInput(ao))
            .withLocation(getLocationInput(getGeneralHospital())).build();
    final Position newPosition =
        withCredentials(adminUser, t -> mutationExecutor.createPosition(FIELDS, newPositionInput));

    // try to update the new position (not related to the user's organization)
    try {
      final Integer nrUpdated = withCredentials(user.getDomainUsername(),
          t -> mutationExecutor.updatePosition("", getPositionInput(newPosition)));
      if (isAdmin) {
        assertThat(nrUpdated).isEqualTo(1);
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }

    // try to update a regular user position and make it superuser
    final PositionInput p3 = getPositionInput(newPosition);
    try {
      p3.setType(PositionType.SUPERUSER);
      final Integer nrUpdated =
          withCredentials(user.getDomainUsername(), t -> mutationExecutor.updatePosition("", p3));
      if (isAdmin) {
        assertThat(nrUpdated).isEqualTo(1);
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }

  @Test
  void testUpdatePositionHistory() {
    final Organization ao = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    final PositionInput testInput1 =
        PositionInput.builder().withName("A Test Position for edittting history")
            .withType(PositionType.REGULAR).withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE)
            .withOrganization(getOrganizationInput(ao))
            .withLocation(getLocationInput(getGeneralHospital())).build();

    final Position createdPos =
        withCredentials(adminUser, t -> mutationExecutor.createPosition(FIELDS, testInput1));
    assertThat(createdPos).isNotNull();
    assertThat(createdPos.getUuid()).isNotNull();
    assertThat(createdPos.getName()).isEqualTo(testInput1.getName());

    final PersonInput persInput1 =
        PersonInput.builder().withName("Test person for edit history").build();
    final Person person1 =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(PERSON_FIELDS, persInput1));
    assertThat(person1).isNotNull();
    assertThat(person1.getUuid()).isNotNull();
    final PersonInput persInput2 =
        PersonInput.builder().withName("Test person for edit history").build();
    final Person person2 =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(PERSON_FIELDS, persInput2));
    assertThat(person2).isNotNull();
    assertThat(person2.getUuid()).isNotNull();
    final List<PersonPositionHistoryInput> prevPersons = new ArrayList<>();
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
    withCredentials(adminUser, t -> mutationExecutor.updatePositionHistory("", inputForTest));
    final Position positionUpdated = withCredentials(adminUser,
        t -> queryExecutor.position(FIELDS, getPositionInput(createdPos).getUuid()));
    assertThat(positionUpdated).isNotNull();
    assertThat(positionUpdated.getPreviousPeople()).hasSize(2);
  }

}
