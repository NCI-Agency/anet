package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.Lists;
import java.util.Optional;
import java.util.UUID;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.test.client.AnetBeanList_Subscription;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.ReportState;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.Subscription;
import org.junit.jupiter.api.Test;

class SubscriptionResourceTest extends SubscriptionTestHelper {

  @Test
  void testAdminSubscription() {
    SUBSCRIPTION_TESTS.forEach(this::testAdminSubscription);
  }

  private void testAdminSubscription(final String subscribedObjectType,
      final String subscribedObjectUuid) {
    // Subscribe admin
    final String jackSubscriberUuid = getJackJackson().getPosition().getUuid();
    final Subscription subscription = createSubscription(adminUser, subscribedObjectType,
        subscribedObjectUuid, jackSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();
    // Try to subscribe admin to same object again
    createSubscription(adminUser, subscribedObjectType, subscribedObjectUuid, jackSubscriberUuid,
        true, false);

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminUser);
    assertThat(adminSubscriptions.getList()).anyMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions = getAllSubscriptions(jackUser);
    assertThat(jackSubscriptions.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Try to delete admin's subscription as jack
    deleteSubscription(jackUser, subscriptionUuid, true);
    // Delete admin's subscription
    deleteSubscription(adminUser, subscriptionUuid, false);
    // Try to delete admin's subscription again
    deleteSubscription(adminUser, subscriptionUuid, true);

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions2 = getAllSubscriptions(adminUser);
    assertThat(adminSubscriptions2.getTotalCount())
        .isEqualTo(adminSubscriptions.getTotalCount() - 1);
    assertThat(adminSubscriptions2.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));
  }

  @Test
  void testJackSubscription() {
    SUBSCRIPTION_TESTS.forEach(this::testJackSubscription);
  }

  private void testJackSubscription(final String subscribedObjectType,
      final String subscribedObjectUuid) {
    // Subscribe jack
    final String adminSubscriberUuid = admin.getPosition().getUuid();
    final Subscription subscription = createSubscription(jackUser, subscribedObjectType,
        subscribedObjectUuid, adminSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();
    // Try to subscribe jack to same object again
    createSubscription(jackUser, subscribedObjectType, subscribedObjectUuid, adminSubscriberUuid,
        true, false);

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions = getAllSubscriptions(jackUser);
    assertThat(jackSubscriptions.getList()).anyMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Delete jack's subscription
    deleteSubscription(adminUser, subscriptionUuid, false);
    // Try to delete jack's subscription again
    deleteSubscription(jackUser, subscriptionUuid, true);

    // Subscribe jack again
    final Subscription subscription2 = createSubscription(jackUser, subscribedObjectType,
        subscribedObjectUuid, adminSubscriberUuid, false, false);
    final String subscriptionUuid2 = subscription2.getUuid();

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminUser);
    assertThat(adminSubscriptions.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid2));

    // Delete jack's subscription as admin
    deleteSubscription(adminUser, subscriptionUuid2, false);
    // Try to delete jack's subscription (already deleted by admin)
    deleteSubscription(jackUser, subscriptionUuid2, true);

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions2 = getAllSubscriptions(jackUser);
    assertThat(jackSubscriptions2.getTotalCount()).isEqualTo(jackSubscriptions.getTotalCount() - 1);
    assertThat(jackSubscriptions2.getList()).noneMatch(
        s -> s.getUuid().equals(subscriptionUuid) || s.getUuid().equals(subscriptionUuid2));
  }

  @Test
  void testAdminUnsubscription() {
    SUBSCRIPTION_TESTS.forEach(this::testAdminUnsubscription);
  }

  private void testAdminUnsubscription(final String subscribedObjectType,
      final String subscribedObjectUuid) {
    // Subscribe admin
    final String jackSubscriberUuid = getJackJackson().getPosition().getUuid();
    final Subscription subscription = createSubscription(adminUser, subscribedObjectType,
        subscribedObjectUuid, jackSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();
    // Try to subscribe admin to same object again
    createSubscription(adminUser, subscribedObjectType, subscribedObjectUuid, jackSubscriberUuid,
        true, false);

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminUser);
    assertThat(adminSubscriptions.getList()).anyMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions = getAllSubscriptions(jackUser);
    assertThat(jackSubscriptions.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Try to delete admin's object subscription as jack
    deleteObjectSubscription(jackUser, subscribedObjectUuid, true);
    // Delete admin's object subscription
    deleteObjectSubscription(adminUser, subscribedObjectUuid, false);
    // Try to delete admin's object subscription again
    deleteObjectSubscription(adminUser, subscribedObjectUuid, true);

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions2 = getAllSubscriptions(adminUser);
    assertThat(adminSubscriptions2.getTotalCount())
        .isEqualTo(adminSubscriptions.getTotalCount() - 1);
    assertThat(adminSubscriptions2.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));
  }

  @Test
  void testJackUnsubscription() {
    SUBSCRIPTION_TESTS.forEach(this::testJackUnsubscription);
  }

  private void testJackUnsubscription(final String subscribedObjectType,
      final String subscribedObjectUuid) {
    // Subscribe jack
    final String adminSubscriberUuid = admin.getPosition().getUuid();
    final Subscription subscription = createSubscription(jackUser, subscribedObjectType,
        subscribedObjectUuid, adminSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();
    // Try to subscribe jack to same object again
    createSubscription(jackUser, subscribedObjectType, subscribedObjectUuid, adminSubscriberUuid,
        true, false);

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions = getAllSubscriptions(jackUser);
    assertThat(jackSubscriptions.getList()).anyMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminUser);
    assertThat(adminSubscriptions.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Try to delete jack's object subscription as admin
    deleteObjectSubscription(adminUser, subscribedObjectUuid, true);
    // Delete jack's object subscription
    deleteObjectSubscription(jackUser, subscribedObjectUuid, false);
    // Try to delete jack's object subscription again
    deleteObjectSubscription(jackUser, subscribedObjectUuid, true);

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions2 = getAllSubscriptions(jackUser);
    assertThat(jackSubscriptions2.getTotalCount()).isEqualTo(jackSubscriptions.getTotalCount() - 1);
    assertThat(jackSubscriptions2.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));
  }

  @Test
  void testUnknownUuidSubscription() {
    // Subscribe to unknown uuid
    final String jackSubscriberUuid = getJackJackson().getPosition().getUuid();
    final Subscription subscription = createSubscription(adminUser, PersonDao.TABLE_NAME,
        UUID.randomUUID().toString(), jackSubscriberUuid, false, true);
    // Delete subscription
    deleteSubscription(adminUser, subscription.getUuid(), false);
  }

  @Test
  void testNoposSubscription() {
    // Try to subscribe user without position
    final String adminSubscriberUuid = admin.getPosition().getUuid();
    createSubscription("nopos", PersonDao.TABLE_NAME, getSubscribedObjectUuid(PersonDao.TABLE_NAME),
        adminSubscriberUuid, true, false);
  }

  @Test
  void testDeleteSubscribedReport() {
    testDeleteSubscribedReport(ReportState.DRAFT);
    testDeleteSubscribedReport(ReportState.PUBLISHED);
    testDeleteSubscribedReport(ReportState.CANCELLED);
  }

  private void testDeleteSubscribedReport(final ReportState reportState) {
    // Create report
    final ReportInput reportInput =
        ReportInput.builder().withState(reportState)
            .withIntent("Test report for deleting subscribed object")
            .withReportPeople(
                getReportPeopleInput(Lists.newArrayList(personToPrimaryReportAuthor(admin))))
            .build();
    final Report report =
        withCredentials(adminUser, t -> mutationExecutor.createReport("{ uuid }", reportInput));

    // Subscribe to report
    final String jackSubscriberUuid = getJackJackson().getPosition().getUuid();
    final Subscription subscription = createSubscription(adminUser, ReportDao.TABLE_NAME,
        report.getUuid(), jackSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();

    // Check subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminUser);
    final Optional<Subscription> opt = adminSubscriptions.getList().stream()
        .filter(s -> s.getUuid().equals(subscriptionUuid)).findAny();
    assertThat(opt).isNotEmpty();

    // Delete report
    final Integer nrDeleted =
        withCredentials(adminUser, t -> mutationExecutor.deleteReport("", report.getUuid()));
    assertThat(nrDeleted).isOne();

    // Check subscriptions - deleted report should still be there
    final AnetBeanList_Subscription adminSubscriptions2 = getAllSubscriptions(adminUser);
    assertThat(adminSubscriptions2.getTotalCount()).isEqualTo(adminSubscriptions.getTotalCount());
    final Optional<Subscription> opt2 = adminSubscriptions2.getList().stream()
        .filter(s -> s.getUuid().equals(subscriptionUuid)).findAny();
    assertThat(opt2).isNotEmpty();

    // Check subscription for updates
    final Subscription foundSubscription = opt.get();
    final Subscription foundSubscription2 = opt2.get();
    if (reportState == ReportState.PUBLISHED || reportState == ReportState.CANCELLED) {
      // Should be updated
      assertThat(foundSubscription2.getUpdatedAt()).isAfter(foundSubscription.getUpdatedAt());
    } else {
      // No change
      assertThat(foundSubscription2.getUpdatedAt()).isEqualTo(foundSubscription.getUpdatedAt());
    }

    // Delete subscription
    deleteSubscription(adminUser, subscriptionUuid, false);

    // Check subscriptions - deleted report should now be gone
    final AnetBeanList_Subscription adminSubscriptions3 = getAllSubscriptions(adminUser);
    assertThat(adminSubscriptions3.getTotalCount())
        .isEqualTo(adminSubscriptions.getTotalCount() - 1);
    assertThat(adminSubscriptions3.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));
  }

  @Test
  void testDeleteSubscribedPosition() {
    // Create position
    final PositionInput positionInput =
        PositionInput.builder().withStatus(Status.INACTIVE).withType(PositionType.REGULAR)
            .withRole(PositionRole.MEMBER).withName("Test position for deleting subscribed object")
            .withOrganization(getOrganizationInput(admin.getPosition().getOrganization())).build();
    final Position position =
        withCredentials(adminUser, t -> mutationExecutor.createPosition("{ uuid }", positionInput));

    // Subscribe to position
    final String jackSubscriberUuid = getJackJackson().getPosition().getUuid();
    final Subscription subscription = createSubscription(adminUser, PositionDao.TABLE_NAME,
        position.getUuid(), jackSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();

    // Check subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminUser);
    final Optional<Subscription> opt = adminSubscriptions.getList().stream()
        .filter(s -> s.getUuid().equals(subscriptionUuid)).findAny();
    assertThat(opt).isNotEmpty();

    // Delete position
    final Integer nrDeleted =
        withCredentials(adminUser, t -> mutationExecutor.deletePosition("", position.getUuid()));
    assertThat(nrDeleted).isOne();

    // Check subscriptions - deleted position should still be there
    final AnetBeanList_Subscription adminSubscriptions2 = getAllSubscriptions(adminUser);
    assertThat(adminSubscriptions2.getTotalCount()).isEqualTo(adminSubscriptions.getTotalCount());
    final Optional<Subscription> opt2 = adminSubscriptions2.getList().stream()
        .filter(s -> s.getUuid().equals(subscriptionUuid)).findAny();
    assertThat(opt2).isNotEmpty();

    // Subscription should be updated
    final Subscription foundSubscription = opt.get();
    final Subscription foundSubscription2 = opt2.get();
    assertThat(foundSubscription2.getUpdatedAt()).isAfter(foundSubscription.getUpdatedAt());

    // Delete subscription
    deleteSubscription(adminUser, subscriptionUuid, false);

    // Check subscriptions - deleted position should now be gone
    final AnetBeanList_Subscription adminSubscriptions3 = getAllSubscriptions(adminUser);
    assertThat(adminSubscriptions3.getTotalCount())
        .isEqualTo(adminSubscriptions.getTotalCount() - 1);
    assertThat(adminSubscriptions3.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));
  }

  // helper methods

  private void deleteObjectSubscription(final String username, final String subscribedObjectUuid,
      final boolean expectException) {
    try {
      final Integer nrDeleted = withCredentials(username,
          t -> mutationExecutor.deleteObjectSubscription("", subscribedObjectUuid));
      if (expectException) {
        fail("Expected an Exception");
      }
      assertThat(nrDeleted).isOne();
    } catch (Exception expectedException) {
      if (!expectException) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }
}
