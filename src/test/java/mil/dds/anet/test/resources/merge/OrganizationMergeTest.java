package mil.dds.anet.test.resources.merge;

import static mil.dds.anet.test.client.Status.ACTIVE;
import static mil.dds.anet.test.client.Status.INACTIVE;
import static mil.dds.anet.test.resources.OrganizationResourceTest.FIELDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationInput;
import mil.dds.anet.test.resources.AbstractResourceTest;
import org.junit.jupiter.api.Test;

class OrganizationMergeTest extends AbstractResourceTest {
  @Test
  void shouldMerge() {
    final var loserInput = OrganizationInput.builder().withShortName("LM1")
        .withLongName("Loser for Merge").withStatus(INACTIVE).build();
    final var loser =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, loserInput));
    assertThat(loser).isNotNull().extracting(Organization::getUuid).isNotNull();

    final var winnerInput = OrganizationInput.builder().withShortName("WM1")
        .withLongName("Winner for Merge").withStatus(ACTIVE).build();
    final var winner =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, winnerInput));

    final var mergeInput = getOrganizationInput(winner);
    mergeInput.setStatus(loser.getStatus());
    final var updated = withCredentials(adminUser,
        t -> mutationExecutor.mergeOrganizations("", loser.getUuid(), mergeInput));
    assertThat(updated).isOne();

    assertThatThrownBy(
        () -> withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, loser.getUuid())))
        .isInstanceOf(Exception.class);
  }
}
