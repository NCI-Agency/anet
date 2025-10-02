package mil.dds.anet.test.resources.merge;

import static mil.dds.anet.test.client.Status.ACTIVE;
import static mil.dds.anet.test.client.Status.INACTIVE;
import static mil.dds.anet.test.resources.OrganizationResourceTest.FIELDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationInput;
import mil.dds.anet.test.resources.AbstractResourceTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class OrganizationMergeTest extends AbstractResourceTest {
  @Test
  void testMergeLoop() {
    // EF 1.1
    final Organization childOrg = withCredentials(adminUser,
        t -> queryExecutor.organization(FIELDS, "04614b0f-7e8e-4bf1-8bc5-13abaffeab8a"));
    // EF 1
    final Organization parentOrg = childOrg.getParentOrg();
    assertThatThrownBy(() -> withCredentials(adminUser, t -> mutationExecutor.mergeOrganizations("",
        parentOrg.getUuid(), getOrganizationInput(childOrg)))).isInstanceOf(Exception.class);
  }

  @ParameterizedTest
  @MethodSource("provideMergeTestParameters")
  void testMerge(boolean subscribeToLoser, boolean subscribeToWinner) {
    final String objectType = OrganizationDao.TABLE_NAME;

    final var loserInput = OrganizationInput.builder().withShortName("LM1")
        .withLongName("Loser for Merge").withStatus(INACTIVE).build();
    final var loser =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, loserInput));
    assertThat(loser).isNotNull().extracting(Organization::getUuid).isNotNull();

    // Subscribe to the organization
    final String loserSubscriptionUuid = addSubscription(subscribeToLoser, objectType,
        loser.getUuid(), t -> mutationExecutor.updateOrganization("", getOrganizationInput(loser)));

    final var winnerInput = OrganizationInput.builder().withShortName("WM1")
        .withLongName("Winner for Merge").withStatus(ACTIVE).build();
    final var winner =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, winnerInput));

    // Subscribe to the organization
    final String winnerSubscriptionUuid =
        addSubscription(subscribeToWinner, objectType, winner.getUuid(),
            t -> mutationExecutor.updateOrganization("", getOrganizationInput(winner)));

    // Merge the two organizations
    final var mergeInput = getOrganizationInput(winner);
    mergeInput.setStatus(loser.getStatus());
    final var updated = withCredentials(adminUser,
        t -> mutationExecutor.mergeOrganizations("", loser.getUuid(), mergeInput));
    assertThat(updated).isOne();

    // Assert that loser is gone.
    assertThatThrownBy(
        () -> withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, loser.getUuid())))
        .isInstanceOf(Exception.class);

    // Check the subscriptions and updates
    checkSubscriptionsAndUpdatesAfterMerge(subscribeToLoser || subscribeToWinner, objectType,
        loser.getUuid(), winner.getUuid());
    // And unsubscribe
    deleteSubscription(subscribeToWinner, loserSubscriptionUuid);
    deleteSubscription(false, winnerSubscriptionUuid);
  }
}
