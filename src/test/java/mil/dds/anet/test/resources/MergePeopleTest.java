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

  private static final String PERSON_FIELDS = "uuid name";
  private static final String POSITION_FIELDS = "uuid name";

  private Position createPosition(String positionName) {
    // Create Position
    final Position test = new Position();
    test.setName(positionName);
    test.setType(PositionType.ADVISOR);
    test.setStatus(PositionStatus.ACTIVE);

    // Assign to an AO
    final String organizationUuid = graphQLHelper.createObject(admin, "createOrganization",
        "organization", "OrganizationInput", OrganizationTest.getTestAO(true),
        new TypeReference<GraphQlResponse<Organization>>() {});

    test.setOrganization(createOrganizationWithUuid(organizationUuid));

    final String createdUuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", test, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(createdUuid).isNotNull();

    return graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, createdUuid,
        new TypeReference<GraphQlResponse<Position>>() {});
  }

  private Person createPerson(String personName) {
    // Create a person
    final Person loser = new Person();
    loser.setRole(Role.ADVISOR);
    loser.setName(personName);
    String personUuid = graphQLHelper.createObject(admin, "createPerson", "person", "PersonInput",
        loser, new TypeReference<GraphQlResponse<Person>>() {});
    assertThat(personUuid).isNotNull();
    return getPerson(personUuid);
  }

  private Person assignPositionPerson(Position position, Person person) {
    // Assign a person into the position
    Map<String, Object> variables = new HashMap<>();
    variables.put("uuid", position.getUuid());
    variables.put("person", person);
    Integer nrUpdated = graphQLHelper.updateObject(admin,
        "mutation ($uuid: String!, $person: PersonInput!) { payload: putPersonInPosition (uuid: $uuid, person: $person) }",
        variables);
    assertThat(nrUpdated).isEqualTo(1);
    return getPerson(person.getUuid());
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
    assertThat(nrUpdated).isEqualTo(1);
    return getPerson(winnerUuid);
  }

  @Test
  public void loserHasPositionWinnerHasNoPositionCopyPositionNotSelected() {
    final Position positionLoser1 = createPosition("Loser Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Person personLoser1 = createPerson("Loser Has Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personWinner1 = createPerson("Winner Has No Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personLoser2 = assignPositionPerson(positionLoser1, personLoser1);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be two position histories, one without position and one with position.
    assertThat(personLoser2.getAllPeoplePositionHistory().size()).isEqualTo(2);

    final Person winner = mergePeople(personLoser2.getUuid(), personWinner1.getUuid(), false);
    // There must be three position histories,
    // one without position full endTime(loser created),
    // one with position full endTime(loser assigned)
    // one without position empty endTime (winner created) -------------- endTime = Null
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().size()).isGreaterThanOrEqualTo(3);
  }

  @Test
  public void loserHasPositionWinnerHasNoPositionCopyPositionSelected() {
    final Position positionLoser1 = createPosition("Loser Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Person personLoser1 = createPerson("Loser Has Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personWinner1 = createPerson("Winner Has No Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personLoser2 = assignPositionPerson(positionLoser1, personLoser1);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be two position histories, one without position and one with position.
    assertThat(personLoser2.getAllPeoplePositionHistory().size()).isEqualTo(2);

    final Person winner = mergePeople(personLoser2.getUuid(), personWinner1.getUuid(), true);
    // There must be three position histories,
    // one without position full endTime(loser created),
    // one without position full endTime (winner created)
    // one with position empty endTime(loser assigned) -------------- endTime = Null
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().size()).isGreaterThanOrEqualTo(3);
  }

  @Test
  public void loserHasNoPositionWinnerHasPosition() {
    final Position positionWinner1 = createPosition("Winner Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Person personLoser1 = createPerson("Loser Has No Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personWinner1 = createPerson("Winner Has Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personWinner2 = assignPositionPerson(positionWinner1, personWinner1);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personWinner2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be two position histories, one without position and one with position.
    assertThat(personWinner2.getAllPeoplePositionHistory().size()).isEqualTo(2);

    final Person winner = mergePeople(personLoser1.getUuid(), personWinner2.getUuid(), false);
    // There must be three position histories,
    // one without position full endTime(loser created),
    // one without position full endTime (winner created)
    // one with position empty endTime(winner assigned) -------------- endTime = Null
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().size()).isGreaterThanOrEqualTo(3);
  }

  @Test
  public void loserHasPositionWinnerHasPosition() {
    final Position positionLoser1 = createPosition("Loser Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Position positionWinner1 = createPosition("Winner Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Person personLoser1 = createPerson("Loser Has Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personWinner1 = createPerson("Winner Has Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personWinner2 = assignPositionPerson(positionWinner1, personWinner1);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personWinner2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be two position histories, one without position and one with position.
    assertThat(personWinner2.getAllPeoplePositionHistory().size()).isEqualTo(2);

    final Person personLoser2 = assignPositionPerson(positionLoser1, personLoser1);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be two position histories, one without position and one with position.
    assertThat(personLoser2.getAllPeoplePositionHistory().size()).isEqualTo(2);

    final Person winner = mergePeople(personLoser2.getUuid(), personWinner2.getUuid(), false);
    // There must be four position histories,
    // one without position full endTime(loser created),
    // one without position full endTime (winner created)
    // one with position full endTime (loser assigned)
    // one with position empty endTime(winner assigned) -------------- endTime = Null
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().size()).isGreaterThanOrEqualTo(4);
  }

  @Test
  public void loserHasNoPositionWinnerHasNoPosition() {
    final Person personLoser1 = createPerson("Loser Has No Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personWinner1 = createPerson("Winner Has No Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person winner = mergePeople(personLoser1.getUuid(), personWinner1.getUuid(), false);
    // There must be two position histories,
    // one without position full endTime(loser created),
    // one without position empty endTime (winner created) -------------- endTime = Null
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().size()).isGreaterThanOrEqualTo(2);
  }

  @Test
  public void loserHasNoPositionAndHasPositionHistoryWinnerHasNoPosition() {
    final Position positionLoser1 = createPosition("Loser Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Position positionLoser2 = createPosition("Loser Position Two");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Position positionLoser3 = createPosition("Loser Position Three");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser3.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser3.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Position positionLoser4 = createPosition("Loser Position Four");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser4.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser4.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Position positionLoser5 = createPosition("Loser Position Five");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser5.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser5.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Position positionLoser6 = createPosition("Loser Position Six");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser6.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser6.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Person personLoser1 = createPerson("Loser Has Position History");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personWinner1 = createPerson("Winner Has No Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personLoser2 = assignPositionPerson(positionLoser1, personLoser1);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be two position histories,
    // one without position full endTime(loser created),
    // one with position empty endTime(loser pos1 assigned) -------------- endTime = Null
    assertThat(personLoser2.getAllPeoplePositionHistory().size()).isEqualTo(2);

    final Person personLoser3 = assignPositionPerson(positionLoser2, personLoser2);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser3.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser3.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be four position histories,
    // one without position full endTime(loser created),
    // one with position full endTime (loser pos1 assigned)
    // one without position full endTime (loser pos1 removed)
    // one with position empty endTime(loser pos2 assigned) -------------- endTime = Null
    assertThat(personLoser3.getAllPeoplePositionHistory().size()).isEqualTo(4);

    final Person personLoser4 = assignPositionPerson(positionLoser3, personLoser3);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser4.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser4.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be six position histories,
    // one without position full endTime(loser created),
    // one with position full endTime (loser pos1 assigned)
    // one without position full endTime (loser pos1 removed)
    // one with position full endTime(loser pos2 assigned)
    // one without position full endTime (loser pos2 removed)
    // one with position empty endTime(loser pos3 assigned) -------------- endTime = Null
    assertThat(personLoser4.getAllPeoplePositionHistory().size()).isEqualTo(6);

    final Person personLoser5 = assignPositionPerson(positionLoser4, personLoser4);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser5.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser5.getAllPeoplePositionHistory().stream()
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
    assertThat(personLoser5.getAllPeoplePositionHistory().size()).isEqualTo(8);

    final Person personLoser6 = assignPositionPerson(positionLoser5, personLoser5);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser6.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser6.getAllPeoplePositionHistory().stream()
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
    assertThat(personLoser6.getAllPeoplePositionHistory().size()).isEqualTo(10);

    final Person personLoser7 = assignPositionPerson(positionLoser6, personLoser6);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser7.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser7.getAllPeoplePositionHistory().stream()
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
    assertThat(personLoser7.getAllPeoplePositionHistory().size()).isEqualTo(12);

    removePositionPerson(positionLoser6);
    final Person personLoser8 = getPerson(personLoser7.getUuid());
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
    assertThat(personLoser8.getAllPeoplePositionHistory().size()).isEqualTo(13);

    final Person winner = mergePeople(personLoser8.getUuid(), personWinner1.getUuid(), false);
    // There must be fourteen position histories,
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
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().size()).isEqualTo(14);
  }

  @Test
  public void loserHasPositionWinnerHasNoPositionHasPositionHistoryCopyPositionNotSelected() {
    final Position positionLoser1 = createPosition("Loser Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Position positionWinner1 = createPosition("Winner Position One");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Position positionWinner2 = createPosition("Winner Position Two");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionWinner2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionWinner2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Position positionWinner3 = createPosition("Winner Position Three");
    // Active peoplePosition without person must be created when the position is created.
    assertThat(positionWinner3.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(positionWinner3.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPersonUuid())).count())
            .isEqualTo(1);

    final Person personLoser1 = createPerson("Loser Has Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personWinner1 = createPerson("Winner Has No Position");
    // Active peoplePosition without position must be created when the person is created.
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner1.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);

    final Person personLoser2 = assignPositionPerson(positionLoser1, personLoser1);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personLoser2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be two position histories, one without position and one with position.
    assertThat(personLoser2.getAllPeoplePositionHistory().size()).isEqualTo(2);

    final Person personWinner2 = assignPositionPerson(positionWinner1, personWinner1);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personWinner2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner2.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be two position histories, one without position and one with position.
    assertThat(personWinner2.getAllPeoplePositionHistory().size()).isEqualTo(2);

    final Person personWinner3 = assignPositionPerson(positionWinner2, personWinner2);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personWinner3.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner3.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be four position histories,
    // one without position full endTime(winner created),
    // one with position full endTime (winner pos1 assign)
    // one without position full endTime (winner pos1 remove)
    // one with position empty endTime(winner pos2) -------------- endTime = Null
    assertThat(personWinner3.getAllPeoplePositionHistory().size()).isEqualTo(4);

    final Person personWinner4 = assignPositionPerson(positionWinner3, personWinner3);
    // Active peoplePosition with position must be created when the person is assigned.
    assertThat(personWinner4.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(personWinner4.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.nonNull(f.getPositionUuid()))
        .count()).isEqualTo(1);
    // There must be six position histories,
    // one without position full endTime(winner created),
    // one with position full endTime (winner pos1 assign)
    // one without position full endTime (winner pos1 remove)
    // one with position full endTime (winner pos2 assign)
    // one without position full endTime (winner pos2 remove)
    // one with position empty endTime(winner pos3) -------------- endTime = Null
    assertThat(personWinner4.getAllPeoplePositionHistory().size()).isEqualTo(6);

    removePositionPerson(positionWinner3);
    final Person personWinner5 = getPerson(personWinner4.getUuid());
    // There must be seven position histories,
    // one without position full endTime(winner created),
    // one with position full endTime (winner pos1 assign)
    // one without position full endTime (winner pos1 remove)
    // one with position full endTime (winner pos2 assign)
    // one without position full endTime (winner pos2 remove)
    // one with position full endTime (winner pos3 assign)
    // one without position empty endTime(winner pos3 remove) -------------- endTime = Null
    assertThat(personWinner5.getAllPeoplePositionHistory().size()).isEqualTo(7);

    final Person winner = mergePeople(personLoser2.getUuid(), personWinner5.getUuid(), false);
    // There must be three position histories,
    // one without position full endTime(loser created),
    // one without position full endTime(winner created),
    // one with position full endTime(loser assigned)
    // one with position full endTime (winner pos1 assign)
    // one without position full endTime (winner pos1 remove)
    // one with position full endTime (winner pos2 assign)
    // one without position full endTime (winner pos2 remove)
    // one with position full endTime (winner pos3 assign)
    // one without position full endTime (loser pos remove)
    // one without position full endTime(winner pos3 remove) -------------- endTime = Null
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime())).count()).isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().stream()
        .filter(f -> Objects.isNull(f.getEndTime()) && Objects.isNull(f.getPositionUuid())).count())
            .isEqualTo(1);
    assertThat(winner.getAllPeoplePositionHistory().size()).isEqualTo(10);
  }
}
