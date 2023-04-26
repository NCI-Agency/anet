package mil.dds.anet.test.resources.merge;

import static mil.dds.anet.test.resources.PositionResourceTest.FIELDS;
import static mil.dds.anet.test.resources.PositionResourceTest.ORGANIZATION_FIELDS;
import static mil.dds.anet.test.resources.PositionResourceTest.PERSON_FIELDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.NotFoundException;
import mil.dds.anet.test.client.AnetBeanList_Organization;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonInput;
import mil.dds.anet.test.client.PersonPositionHistoryInput;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.resources.AbstractResourceTest;
import org.junit.jupiter.api.Test;

public class PositionMergeTest extends AbstractResourceTest {

  @Test
  public void testMerge()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a new position and designate the person upfront
    final PersonInput testPersonInput = PersonInput.builder().withName("MergePositionsTest Person")
        .withStatus(Status.ACTIVE).build();

    final Person testPerson = adminMutationExecutor.createPerson(PERSON_FIELDS, testPersonInput);
    assertThat(testPerson).isNotNull();
    assertThat(testPerson.getUuid()).isNotNull();

    final OrganizationSearchQueryInput queryOrgs =
        OrganizationSearchQueryInput.builder().withText("Ministry").build();
    final AnetBeanList_Organization orgs =
        adminQueryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs);
    assertThat(orgs.getList().size()).isPositive();

    final PositionInput firstPositionInput = PositionInput.builder()
        .withName("MergePositionsTest First Position").withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(orgs.getList().get(0)))
        .withStatus(Status.ACTIVE).withPerson(getPersonInput(testPerson)).build();

    final Position firstPosition = adminMutationExecutor.createPosition(FIELDS, firstPositionInput);
    assertThat(firstPosition).isNotNull();
    assertThat(firstPosition.getUuid()).isNotNull();

    final PositionInput secondPositionInput = PositionInput.builder()
        .withName("MergePositionsTest Second Position").withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(orgs.getList().get(0)))
        .withStatus(Status.ACTIVE).build();

    final Position secondPosition =
        adminMutationExecutor.createPosition(FIELDS, secondPositionInput);
    assertThat(secondPosition).isNotNull();
    assertThat(secondPosition.getUuid()).isNotNull();

    final PersonPositionHistoryInput hist =
        PersonPositionHistoryInput.builder().withCreatedAt(Instant.now().minus(49, ChronoUnit.DAYS))
            .withStartTime(Instant.now().minus(49, ChronoUnit.DAYS)).withEndTime(null)
            .withPerson(getPersonInput(testPerson)).withPosition(getPositionInput(secondPosition))
            .build();

    final List<PersonPositionHistoryInput> historyList = new ArrayList<>();
    historyList.add(hist);
    final PositionInput mergedPositionInput = getPositionInput(firstPosition);
    mergedPositionInput.setPreviousPeople(historyList);
    mergedPositionInput.setPerson(getPersonInput(testPerson));
    mergedPositionInput.setStatus(secondPosition.getStatus());
    mergedPositionInput.setType(secondPosition.getType());

    final int nrUpdated =
        adminMutationExecutor.mergePositions("", secondPosition.getUuid(), mergedPositionInput);
    assertThat(nrUpdated).isOne();

    // Assert that loser is gone.
    try {
      adminQueryExecutor.position(FIELDS, secondPosition.getUuid());
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }
  }

}
