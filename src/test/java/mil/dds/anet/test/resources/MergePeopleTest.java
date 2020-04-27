package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.test.beans.OrganizationTest;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import org.junit.jupiter.api.Test;

public class MergePeopleTest extends AbstractResourceTest {

  private static final String PREVIOUS_POSITION_FIELDS =
      " previousPositions { startTime endTime position { uuid name } }";
  private static final String PREVIOUS_PEOPLE_FIELDS =
      " previousPeople { startTime endTime person { uuid name } }";
  private static final String PERSON_FIELDS = "uuid name" + PREVIOUS_POSITION_FIELDS;
  private static final String POSITION_FIELDS = "uuid name" + PREVIOUS_PEOPLE_FIELDS;

  private Position createPosition(String positionName) {
    // Create Position
    Position test = new Position();
    test.setName(positionName);
    test.setType(PositionType.ADVISOR);
    test.setStatus(PositionStatus.ACTIVE);

    // Assign to an AO
    String organizationUuid = graphQLHelper.createObject(admin, "createOrganization",
        "organization", "OrganizationInput", OrganizationTest.getTestAO(true),
        new TypeReference<GraphQlResponse<Organization>>() {});

    test.setOrganization(createOrganizationWithUuid(organizationUuid));

    String createdUuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", test, new TypeReference<GraphQlResponse<Position>>() {});

    return graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, createdUuid,
        new TypeReference<GraphQlResponse<Position>>() {});
  }

  private Person createPerson(String personName) {
    // Create a person
    Person loser = new Person();
    loser.setRole(Role.ADVISOR);
    loser.setName(personName);
    String personUuid = graphQLHelper.createObject(admin, "createPerson", "person", "PersonInput",
        loser, new TypeReference<GraphQlResponse<Person>>() {});
    return graphQLHelper.getObjectById(admin, "person", PERSON_FIELDS, personUuid,
        new TypeReference<GraphQlResponse<Person>>() {});
  }

  private Person assignPositionPerson(Position position, Person person) {
    // Assign a person into the position
    Map<String, Object> variables = new HashMap<>();
    variables.put("uuid", position.getUuid());
    variables.put("person", person);
    Integer nrUpdated = graphQLHelper.updateObject(admin,
        "mutation ($uuid: String!, $person: PersonInput!) { payload: putPersonInPosition (uuid: $uuid, person: $person) }",
        variables);
    return graphQLHelper.getObjectById(admin, "person", PERSON_FIELDS, person.getUuid(),
        new TypeReference<GraphQlResponse<Person>>() {});
  }

  private Person getPerson(String personUuid) {
    return graphQLHelper.getObjectById(admin, "person", PERSON_FIELDS, personUuid,
        new TypeReference<GraphQlResponse<Person>>() {});
  }

  private void removePositionPerson(Position position) {
    Integer nrDeleted =
        graphQLHelper.deleteObject(admin, "deletePersonFromPosition", position.getUuid());
    assertThat(nrDeleted).isEqualTo(1);
  }

  private Person mergePeople(String loserUuid, String winnerUuid, Boolean copyPosition) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("winnerUuid", winnerUuid);
    variables.put("loserUuid", loserUuid);
    variables.put("copyPosition", copyPosition);
    Integer nrUpdated = graphQLHelper.updateObject(admin,
        "mutation ($winnerUuid: String!, $loserUuid: String!, $copyPosition: Boolean!) { payload: mergePeople (winnerUuid: $winnerUuid, loserUuid: $loserUuid, copyPosition: $copyPosition) }",
        variables);
    return graphQLHelper.getObjectById(admin, "person", PERSON_FIELDS, winnerUuid,
        new TypeReference<GraphQlResponse<Person>>() {});
  }

  @Test
  public void loserHasPositionWinnerHasNoPositionCopyPositionNotSelected() {
    Position positionLoser = createPosition("Loser Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    Person personLoser = createPerson("Loser People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    Person personWinner = createPerson("Winner People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    personLoser = assignPositionPerson(positionLoser, personLoser);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be two position histories, one without position and one with position.
    assertThat(personLoser.getPreviousPositions().size()).isEqualTo(2);

    Person winner = mergePeople(personLoser.getUuid(), personWinner.getUuid(), false);
    // There must be three position histories,
    // one without position full endTime(loser created),
    // one with position full endTime(loser assigned)
    // one without position empty endTime (winner created) -------------- endTime = Null
    assertThat(
        winner.getPreviousPositions().stream().filter(f -> Objects.isNull(f.getEndTime())).count())
            .isEqualTo(1);
    assertThat(winner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);
    assertThat(winner.getPreviousPositions().size()).isGreaterThanOrEqualTo(3);
  }

  @Test
  public void loserHasPositionWinnerHasNoPositionCopyPositionSelected() {
    Position positionLoser = createPosition("Loser Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    Person personLoser = createPerson("Loser People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    Person personWinner = createPerson("Winner People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    personLoser = assignPositionPerson(positionLoser, personLoser);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);

    // There must be two position histories, one without position and one with position.
    assertThat(personLoser.getPreviousPositions().size()).isEqualTo(2);

    Person winner = mergePeople(personLoser.getUuid(), personWinner.getUuid(), true);
    // There must be three position histories,
    // one without position full endTime(loser created),
    // one without position full endTime (winner created)
    // one with position empty endTime(loser assigned) -------------- endTime = Null
    assertThat(
        winner.getPreviousPositions().stream().filter(f -> Objects.isNull(f.getEndTime())).count())
            .isEqualTo(1);
    assertThat(winner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    assertThat(winner.getPreviousPositions().size()).isGreaterThanOrEqualTo(3);
  }

  @Test
  public void loserHasNoPositionWinnerHasPosition() {
    Position positionWinner = createPosition("Winner Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionWinner.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionWinner.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    Person personLoser = createPerson("Loser People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    Person personWinner = createPerson("Winner People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    personWinner = assignPositionPerson(positionWinner, personWinner);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);

    // There must be two position histories, one without position and one with position.
    assertThat(personWinner.getPreviousPositions().size()).isEqualTo(2);

    Person winner = mergePeople(personLoser.getUuid(), personWinner.getUuid(), false);
    // There must be three position histories,
    // one without position full endTime(loser created),
    // one without position full endTime (winner created)
    // one with position empty endTime(winner assigned) -------------- endTime = Null
    assertThat(
        winner.getPreviousPositions().stream().filter(f -> Objects.isNull(f.getEndTime())).count())
            .isEqualTo(1);
    assertThat(winner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    assertThat(winner.getPreviousPositions().size()).isGreaterThanOrEqualTo(3);

  }

  @Test
  public void loserHasPositionWinnerHasPosition() {
    Position positionLoser = createPosition("Loser Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    Position positionWinner = createPosition("Winner Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionWinner.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionWinner.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    Person personLoser = createPerson("Loser People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    Person personWinner = createPerson("Winner People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    personWinner = assignPositionPerson(positionWinner, personWinner);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);

    // There must be two position histories, one without position and one with position.
    assertThat(personWinner.getPreviousPositions().size()).isEqualTo(2);

    personLoser = assignPositionPerson(positionLoser, personLoser);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);

    // There must be two position histories, one without position and one with position.
    assertThat(personLoser.getPreviousPositions().size()).isEqualTo(2);

    Person winner = mergePeople(personLoser.getUuid(), personWinner.getUuid(), false);
    // There must be four position histories,
    // one without position full endTime(loser created),
    // one without position full endTime (winner created)
    // one with position full endTime (loser assigned)
    // one with position empty endTime(winner assigned) -------------- endTime = Null
    assertThat(
        winner.getPreviousPositions().stream().filter(f -> Objects.isNull(f.getEndTime())).count())
            .isEqualTo(1);
    assertThat(winner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    assertThat(winner.getPreviousPositions().size()).isGreaterThanOrEqualTo(4);

  }

  @Test
  public void loserHasNoPositionWinnerHasNoPosition() {
    Person personLoser = createPerson("Loser People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    Person personWinner = createPerson("Winner People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    Person winner = mergePeople(personLoser.getUuid(), personWinner.getUuid(), false);
    // There must be two position histories,
    // one without position full endTime(loser created),
    // one without position empty endTime (winner created) -------------- endTime = Null
    assertThat(
        winner.getPreviousPositions().stream().filter(f -> Objects.isNull(f.getEndTime())).count())
            .isEqualTo(1);
    assertThat(winner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);
    assertThat(winner.getPreviousPositions().size()).isGreaterThanOrEqualTo(2);
  }

  @Test
  public void loserHasNoPositionAndHasPositionHistoryWinnerHasNoPosition() {
    Position positionLoser1 = createPosition("Loser Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser1.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser1.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    Position positionLoser2 = createPosition("Loser Position Two");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser2.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser2.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    Position positionLoser3 = createPosition("Loser Position Three");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser3.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser3.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    Position positionLoser4 = createPosition("Loser Position Four");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser4.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser4.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    Position positionLoser5 = createPosition("Loser Position Five");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser5.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser5.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    Position positionLoser6 = createPosition("Loser Position Six");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser6.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser6.getPreviousPeople().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    Person personLoser = createPerson("Loser People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    Person personWinner = createPerson("Winner People One");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    personLoser = assignPositionPerson(positionLoser1, personLoser);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);

    // There must be two position histories,
    // one without position full endTime(loser created),
    // one with position empty endTime(loser pos1 assigned) -------------- endTime = Null
    assertThat(personLoser.getPreviousPositions().size()).isEqualTo(2);

    personLoser = assignPositionPerson(positionLoser2, personLoser);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);

    // There must be four position histories,
    // one without position full endTime(loser created),
    // one with position full endTime (loser pos1 assigned)
    // one without position full endTime (loser pos1 removed)
    // one with position empty endTime(loser pos2 assigned) -------------- endTime = Null
    assertThat(personLoser.getPreviousPositions().size()).isEqualTo(4);

    personLoser = assignPositionPerson(positionLoser3, personLoser);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);

    // There must be six position histories,
    // one without position full endTime(loser created),
    // one with position full endTime (loser pos1 assigned)
    // one without position full endTime (loser pos1 removed)
    // one with position full endTime(loser pos2 assigned)
    // one without position full endTime (loser pos2 removed)
    // one with position empty endTime(loser pos3 assigned) -------------- endTime = Null
    assertThat(personLoser.getPreviousPositions().size()).isEqualTo(6);

    personLoser = assignPositionPerson(positionLoser4, personLoser);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);

    // There must be eight position histories,
    // one without position full endTime(loser created),
    // one with position full endTime (loser pos1 assigned)
    // one without position full endTime (loser pos1 removed)
    // one with position full endTime(loser pos2 assigned)
    // one without position full endTime (loser pos2 removed)
    // one with position full endTime(loser pos3 assigned)
    // one without position full endTime (loser pos3 removed)
    // one with position empty endTime(loser pos4 assigned) -------------- endTime = Null
    assertThat(personLoser.getPreviousPositions().size()).isEqualTo(8);

    personLoser = assignPositionPerson(positionLoser5, personLoser);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);

    // There must be ten position histories,
    // one without position full endTime(loser created),
    // one with position full endTime (loser pos1 assigned)
    // one without position full endTime (loser pos1 removed)
    // one with position full endTime(loser pos2 assigned)
    // one without position full endTime (loser pos2 removed)
    // one with position full endTime(loser pos3 assigned)
    // one without position full endTime (loser pos3 removed)
    // one with position full endTime(loser pos4 assigned)
    // one without position full endTime (loser pos4 removed)
    // one with position empty endTime(loser pos5 assigned) -------------- endTime = Null
    assertThat(personLoser.getPreviousPositions().size()).isEqualTo(10);

    personLoser = assignPositionPerson(positionLoser6, personLoser);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);

    // There must be twelve position histories,
    // one without position full endTime(loser created),
    // one with position full endTime (loser pos1 assigned)
    // one without position full endTime (loser pos1 removed)
    // one with position full endTime(loser pos2 assigned)
    // one without position full endTime (loser pos2 removed)
    // one with position full endTime(loser pos3 assigned)
    // one without position full endTime (loser pos3 removed)
    // one with position full endTime(loser pos4 assigned)
    // one without position full endTime (loser pos4 removed)
    // one with position full endTime(loser pos5 assigned)
    // one without position full endTime (loser pos5 removed)
    // one with position empty endTime(loser pos6 assigned) -------------- endTime = Null
    assertThat(personLoser.getPreviousPositions().size()).isEqualTo(12);

    removePositionPerson(positionLoser6);
    personLoser = getPerson(personLoser.getUuid());
    // There must be thirteen position histories,
    // one without position full endTime(loser created),
    // one with position full endTime (loser pos1 assigned)
    // one without position full endTime (loser pos1 removed)
    // one with position full endTime(loser pos2 assigned)
    // one without position full endTime (loser pos2 removed)
    // one with position full endTime(loser pos3 assigned)
    // one without position full endTime (loser pos3 removed)
    // one with position full endTime(loser pos4 assigned)
    // one without position full endTime (loser pos4 removed)
    // one with position full endTime(loser pos5 assigned)
    // one without position full endTime (loser pos5 removed)
    // one with position full endTime(loser pos6 assigned)
    // one without position empty endTime (loser pos6 removed) -------------- endTime = Null
    assertThat(personLoser.getPreviousPositions().size()).isEqualTo(13);

    Person winner = mergePeople(personLoser.getUuid(), personWinner.getUuid(), false);
    // There must be thirteen position histories,
    // one without position full endTime(loser created),
    // one with position full endTime (loser pos1 assigned)
    // one without position full endTime (loser pos1 removed)
    // one with position full endTime(loser pos2 assigned)
    // one without position full endTime (loser pos2 removed)
    // one with position full endTime(loser pos3 assigned)
    // one without position full endTime (loser pos3 removed)
    // one with position full endTime(loser pos4 assigned)
    // one without position full endTime (loser pos4 removed)
    // one with position full endTime(loser pos5 assigned)
    // one without position full endTime (loser pos5 removed)
    // one with position full endTime(loser pos6 assigned)
    // one without position full endTime (loser pos6 removed)
    // one without position empty endTime (winner created) -------------- endTime = Null
    assertThat(
        winner.getPreviousPositions().stream().filter(f -> Objects.isNull(f.getEndTime())).count())
            .isEqualTo(1);
    assertThat(winner.getPreviousPositions().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    assertThat(winner.getPreviousPositions().size()).isGreaterThanOrEqualTo(4);
  }
}
