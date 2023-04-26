package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.Lists;
import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import javax.ws.rs.ClientErrorException;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.test.client.AnetBeanList_Subscription;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.ReportState;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.SubscribableObject;
import mil.dds.anet.test.client.Subscription;
import mil.dds.anet.test.client.SubscriptionInput;
import mil.dds.anet.test.client.SubscriptionSearchQueryInput;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.client.util.QueryExecutor;
import org.junit.jupiter.api.Test;

public class SubscriptionResourceTest extends AbstractResourceTest {

  protected static final String FIELDS = "{ uuid createdAt updatedAt subscriber { uuid }"
      + " subscribedObjectType subscribedObjectUuid subscribedObject {"
      + " ... on Location { uuid } ... on Organization { uuid }"
      + " ... on Person { uuid } ... on Position { uuid }"
      + " ... on Report { uuid } ... on Task { uuid } } }";

  protected static final String adminSubscriberUuid = admin.getPosition().getUuid();
  protected static final String jackSubscriberUuid = getJackJackson().getPosition().getUuid();

  @SuppressWarnings("serial")
  protected static final Map<String, String> SUBSCRIPTION_TESTS = new HashMap<String, String>() {
    {
      // Location: Antarctica
      put(LocationDao.TABLE_NAME, "e5b3a4b9-acf7-4c79-8224-f248b9a7215d");
      // Organization: EF 5.1 (Creed's position's organization)
      put(OrganizationDao.TABLE_NAME, "7f939a44-b9e4-48e0-98f5-7d0ea38a6ecf");
      // Person: BRATTON, Creed
      put(PersonDao.TABLE_NAME, "31cba227-f6c6-49e9-9483-fce441bea624");
      // Position: EF 5.1 Advisor Quality Assurance (Creed's position)
      put(PositionDao.TABLE_NAME, "05c42ce0-34a0-4391-8b2f-c4cd85ee6b47");
      // Report: Discuss improvements in Annual Budgeting process
      put(ReportDao.TABLE_NAME, "9bb1861c-1f55-4a1b-bd3d-3c1f56d739b5");
      // Task: EF 5
      put(TaskDao.TABLE_NAME, "242efaa3-d5de-4970-996d-50ca90ef6480");
    }
  };

  @Test
  public void testAdminSubscription() {
    SUBSCRIPTION_TESTS.entrySet().stream()
        .forEach(testCase -> testAdminSubscription(testCase.getKey(), testCase.getValue()));
  }

  private void testAdminSubscription(final String subscribedObjectType,
      final String subscribedObjectUuid) {
    // Subscribe admin
    final Subscription subscription = createSubscription(adminMutationExecutor,
        subscribedObjectType, subscribedObjectUuid, jackSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();
    // Try to subscribe admin to same object again
    createSubscription(adminMutationExecutor, subscribedObjectType, subscribedObjectUuid,
        jackSubscriberUuid, true, false);

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminQueryExecutor);
    assertThat(adminSubscriptions.getList()).anyMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions = getAllSubscriptions(jackQueryExecutor);
    assertThat(jackSubscriptions.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Try to delete admin's subscription as jack
    deleteSubscription(jackMutationExecutor, subscriptionUuid, true);
    // Delete admin's subscription
    deleteSubscription(adminMutationExecutor, subscriptionUuid, false);
    // Try to delete admin's subscription again
    deleteSubscription(adminMutationExecutor, subscriptionUuid, true);

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions2 = getAllSubscriptions(adminQueryExecutor);
    assertThat(adminSubscriptions2.getTotalCount())
        .isEqualTo(adminSubscriptions.getTotalCount() - 1);
    assertThat(adminSubscriptions2.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));
  }

  @Test
  public void testJackSubscription() {
    SUBSCRIPTION_TESTS.entrySet().stream()
        .forEach(testCase -> testJackSubscription(testCase.getKey(), testCase.getValue()));
  }

  private void testJackSubscription(final String subscribedObjectType,
      final String subscribedObjectUuid) {
    // Subscribe jack
    final Subscription subscription = createSubscription(jackMutationExecutor, subscribedObjectType,
        subscribedObjectUuid, adminSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();
    // Try to subscribe jack to same object again
    createSubscription(jackMutationExecutor, subscribedObjectType, subscribedObjectUuid,
        adminSubscriberUuid, true, false);

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions = getAllSubscriptions(jackQueryExecutor);
    assertThat(jackSubscriptions.getList()).anyMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Delete jack's subscription
    deleteSubscription(adminMutationExecutor, subscriptionUuid, false);
    // Try to delete jack's subscription again
    deleteSubscription(jackMutationExecutor, subscriptionUuid, true);

    // Subscribe jack again
    final Subscription subscription2 = createSubscription(jackMutationExecutor,
        subscribedObjectType, subscribedObjectUuid, adminSubscriberUuid, false, false);
    final String subscriptionUuid2 = subscription2.getUuid();

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminQueryExecutor);
    assertThat(adminSubscriptions.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid2));

    // Delete jack's subscription as admin
    deleteSubscription(adminMutationExecutor, subscriptionUuid2, false);
    // Try to delete jack's subscription (already deleted by admin)
    deleteSubscription(jackMutationExecutor, subscriptionUuid2, true);

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions2 = getAllSubscriptions(jackQueryExecutor);
    assertThat(jackSubscriptions2.getTotalCount()).isEqualTo(jackSubscriptions.getTotalCount() - 1);
    assertThat(jackSubscriptions2.getList()).noneMatch(
        s -> s.getUuid().equals(subscriptionUuid) || s.getUuid().equals(subscriptionUuid2));
  }

  @Test
  public void testAdminUnsubscription() {
    SUBSCRIPTION_TESTS.entrySet().stream()
        .forEach(testCase -> testAdminUnsubscription(testCase.getKey(), testCase.getValue()));
  }

  private void testAdminUnsubscription(final String subscribedObjectType,
      final String subscribedObjectUuid) {
    // Subscribe admin
    final Subscription subscription = createSubscription(adminMutationExecutor,
        subscribedObjectType, subscribedObjectUuid, jackSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();
    // Try to subscribe admin to same object again
    createSubscription(adminMutationExecutor, subscribedObjectType, subscribedObjectUuid,
        jackSubscriberUuid, true, false);

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminQueryExecutor);
    assertThat(adminSubscriptions.getList()).anyMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions = getAllSubscriptions(jackQueryExecutor);
    assertThat(jackSubscriptions.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Try to delete admin's object subscription as jack
    deleteObjectSubscription(jackMutationExecutor, subscribedObjectUuid, true);
    // Delete admin's object subscription
    deleteObjectSubscription(adminMutationExecutor, subscribedObjectUuid, false);
    // Try to delete admin's object subscription again
    deleteObjectSubscription(adminMutationExecutor, subscribedObjectUuid, true);

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions2 = getAllSubscriptions(adminQueryExecutor);
    assertThat(adminSubscriptions2.getTotalCount())
        .isEqualTo(adminSubscriptions.getTotalCount() - 1);
    assertThat(adminSubscriptions2.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));
  }

  @Test
  public void testJackUnsubscription() {
    SUBSCRIPTION_TESTS.entrySet().stream()
        .forEach(testCase -> testJackUnsubscription(testCase.getKey(), testCase.getValue()));
  }

  private void testJackUnsubscription(final String subscribedObjectType,
      final String subscribedObjectUuid) {
    // Subscribe jack
    final Subscription subscription = createSubscription(jackMutationExecutor, subscribedObjectType,
        subscribedObjectUuid, adminSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();
    // Try to subscribe jack to same object again
    createSubscription(jackMutationExecutor, subscribedObjectType, subscribedObjectUuid,
        adminSubscriberUuid, true, false);

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions = getAllSubscriptions(jackQueryExecutor);
    assertThat(jackSubscriptions.getList()).anyMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Check admin's subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminQueryExecutor);
    assertThat(adminSubscriptions.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));

    // Try to delete jack's object subscription as admin
    deleteObjectSubscription(adminMutationExecutor, subscribedObjectUuid, true);
    // Delete jack's object subscription
    deleteObjectSubscription(jackMutationExecutor, subscribedObjectUuid, false);
    // Try to delete jack's object subscription again
    deleteObjectSubscription(jackMutationExecutor, subscribedObjectUuid, true);

    // Check jack's subscriptions
    final AnetBeanList_Subscription jackSubscriptions2 = getAllSubscriptions(jackQueryExecutor);
    assertThat(jackSubscriptions2.getTotalCount()).isEqualTo(jackSubscriptions.getTotalCount() - 1);
    assertThat(jackSubscriptions2.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));
  }

  @Test
  public void testUnknownUuidSubscription()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Subscribe to unknown uuid
    final Subscription subscription = createSubscription(adminMutationExecutor,
        PersonDao.TABLE_NAME, UUID.randomUUID().toString(), jackSubscriberUuid, false, true);
    // Delete subscription
    deleteSubscription(adminMutationExecutor, subscription.getUuid(), false);
  }

  @Test
  public void testNoposSubscription()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Try to subscribe user without position
    createSubscription(getMutationExecutor("nopos"), PersonDao.TABLE_NAME,
        getSubscribedObjectUuid(PersonDao.TABLE_NAME), adminSubscriberUuid, true, false);
  }

  @Test
  public void testDeleteSubscribedReport()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    testDeleteSubscribedReport(ReportState.DRAFT);
    testDeleteSubscribedReport(ReportState.PUBLISHED);
    testDeleteSubscribedReport(ReportState.CANCELLED);
  }

  private void testDeleteSubscribedReport(final ReportState reportState)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create report
    final ReportInput reportInput =
        ReportInput.builder().withState(reportState)
            .withIntent("Test report for deleting subscribed object")
            .withReportPeople(
                getReportPeopleInput(Lists.newArrayList(personToPrimaryReportAuthor(admin))))
            .build();
    final Report report = adminMutationExecutor.createReport("{ uuid }", reportInput);

    // Subscribe to report
    final Subscription subscription = createSubscription(adminMutationExecutor,
        ReportDao.TABLE_NAME, report.getUuid(), jackSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();

    // Check subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminQueryExecutor);
    final Optional<Subscription> opt = adminSubscriptions.getList().stream()
        .filter(s -> s.getUuid().equals(subscriptionUuid)).findAny();
    assertThat(opt).isNotEmpty();

    // Delete report
    final Integer nrDeleted = adminMutationExecutor.deleteReport("", report.getUuid());
    assertThat(nrDeleted).isOne();

    // Check subscriptions - deleted report should still be there
    final AnetBeanList_Subscription adminSubscriptions2 = getAllSubscriptions(adminQueryExecutor);
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
    deleteSubscription(adminMutationExecutor, subscriptionUuid, false);

    // Check subscriptions - deleted report should now be gone
    final AnetBeanList_Subscription adminSubscriptions3 = getAllSubscriptions(adminQueryExecutor);
    assertThat(adminSubscriptions3.getTotalCount())
        .isEqualTo(adminSubscriptions.getTotalCount() - 1);
    assertThat(adminSubscriptions3.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));
  }

  @Test
  public void testDeleteSubscribedPosition()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create position
    final PositionInput positionInput =
        PositionInput.builder().withStatus(Status.INACTIVE).withType(PositionType.REGULAR)
            .withRole(PositionRole.MEMBER).withName("Test position for deleting subscribed object")
            .withOrganization(getOrganizationInput(admin.getPosition().getOrganization())).build();
    final Position position = adminMutationExecutor.createPosition("{ uuid }", positionInput);

    // Subscribe to position
    final Subscription subscription = createSubscription(adminMutationExecutor,
        PositionDao.TABLE_NAME, position.getUuid(), jackSubscriberUuid, false, false);
    final String subscriptionUuid = subscription.getUuid();

    // Check subscriptions
    final AnetBeanList_Subscription adminSubscriptions = getAllSubscriptions(adminQueryExecutor);
    final Optional<Subscription> opt = adminSubscriptions.getList().stream()
        .filter(s -> s.getUuid().equals(subscriptionUuid)).findAny();
    assertThat(opt).isNotEmpty();

    // Delete position
    final Integer nrDeleted = adminMutationExecutor.deletePosition("", position.getUuid());
    assertThat(nrDeleted).isOne();

    // Check subscriptions - deleted position should still be there
    final AnetBeanList_Subscription adminSubscriptions2 = getAllSubscriptions(adminQueryExecutor);
    assertThat(adminSubscriptions2.getTotalCount()).isEqualTo(adminSubscriptions.getTotalCount());
    final Optional<Subscription> opt2 = adminSubscriptions2.getList().stream()
        .filter(s -> s.getUuid().equals(subscriptionUuid)).findAny();
    assertThat(opt2).isNotEmpty();

    // Subscription should be updated
    final Subscription foundSubscription = opt.get();
    final Subscription foundSubscription2 = opt2.get();
    assertThat(foundSubscription2.getUpdatedAt()).isAfter(foundSubscription.getUpdatedAt());

    // Delete subscription
    deleteSubscription(adminMutationExecutor, subscriptionUuid, false);

    // Check subscriptions - deleted position should now be gone
    final AnetBeanList_Subscription adminSubscriptions3 = getAllSubscriptions(adminQueryExecutor);
    assertThat(adminSubscriptions3.getTotalCount())
        .isEqualTo(adminSubscriptions.getTotalCount() - 1);
    assertThat(adminSubscriptions3.getList()).noneMatch(s -> s.getUuid().equals(subscriptionUuid));
  }

  // helper methods

  protected static String getSubscribedObjectUuid(final String subscribedObjectType) {
    return SUBSCRIPTION_TESTS.get(subscribedObjectType);
  }

  protected static Subscription createSubscription(final MutationExecutor mutationExecutor,
      final String subscribedObjectType, final String subscribedObjectUuid,
      final String subscriberUuid, final boolean expectException,
      final boolean subscribedObjectIsNull) {
    try {
      final SubscriptionInput subscriptionInput = SubscriptionInput.builder()
          .withSubscribedObjectType(subscribedObjectType)
          .withSubscribedObjectUuid(subscribedObjectUuid).withUuid(UUID.randomUUID().toString())
          .withCreatedAt(Instant.ofEpochSecond(12345)).withUpdatedAt(Instant.ofEpochSecond(67890))
          .withSubscriber(PositionInput.builder().withUuid(subscriberUuid).build()).build();
      final Subscription subscription =
          mutationExecutor.createSubscription(FIELDS, subscriptionInput);
      if (expectException) {
        fail("Expected ClientErrorException");
      }
      assertThat(subscription).isNotNull();
      assertThat(subscription.getUuid()).isNotNull();
      // These should all be set unconditionally on the server-side
      assertThat(subscription.getUuid()).isNotEqualTo(subscriptionInput.getUuid());
      assertThat(subscription.getCreatedAt()).isNotEqualTo(subscriptionInput.getCreatedAt());
      assertThat(subscription.getSubscriber().getUuid())
          .isNotEqualTo(subscriptionInput.getSubscriber().getUuid());
      // These should be our input
      assertThat(subscription.getUpdatedAt()).isEqualTo(subscriptionInput.getUpdatedAt());
      assertThat(subscription.getSubscribedObjectType())
          .isEqualTo(subscriptionInput.getSubscribedObjectType());
      assertThat(subscription.getSubscribedObjectUuid())
          .isEqualTo(subscriptionInput.getSubscribedObjectUuid());
      checkSubscribedObject(subscription, subscribedObjectIsNull);
      return subscription;
    } catch (ClientErrorException expectedException) {
      if (!expectException) {
        fail("Unexpected ClientErrorException");
      }
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
    return null;
  }

  private static void checkSubscribedObject(final Subscription subscription,
      final boolean subscribedObjectIsNull) {
    final SubscribableObject subscribedObject = subscription.getSubscribedObject();
    if (subscribedObjectIsNull) {
      assertThat(subscribedObject).isNull();
      return;
    }

    assertThat(subscribedObject).isNotNull();
    if (subscribedObject instanceof Location) {
      final Location location = (Location) subscribedObject;
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(LocationDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(location.getUuid());
    } else if (subscribedObject instanceof Organization) {
      final Organization organization = (Organization) subscribedObject;
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(OrganizationDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(organization.getUuid());
    } else if (subscribedObject instanceof Person) {
      final Person person = (Person) subscribedObject;
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(PersonDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(person.getUuid());
    } else if (subscribedObject instanceof Position) {
      final Position position = (Position) subscribedObject;
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(PositionDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(position.getUuid());
    } else if (subscribedObject instanceof Report) {
      final Report report = (Report) subscribedObject;
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(ReportDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(report.getUuid());
    } else if (subscribedObject instanceof Task) {
      final Task task = (Task) subscribedObject;
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(TaskDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(task.getUuid());
    } else {
      fail("Unknown subscribedObjectType: {}", subscribedObject);
    }
  }

  protected static AnetBeanList_Subscription getAllSubscriptions(
      final QueryExecutor queryExecutor) {
    try {
      final SubscriptionSearchQueryInput ssqi =
          SubscriptionSearchQueryInput.builder().withPageSize(0).build();
      return queryExecutor.mySubscriptions(getListFields(FIELDS), ssqi);
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  protected static void deleteSubscription(final MutationExecutor mutationExecutor,
      final String subscriptionUuid, final boolean expectException) {
    try {
      final Integer nrDeleted = mutationExecutor.deleteSubscription("", subscriptionUuid);
      if (expectException) {
        fail("Expected ClientErrorException");
      }
      assertThat(nrDeleted).isOne();
    } catch (ClientErrorException expectedException) {
      if (!expectException) {
        fail("Unexpected ClientErrorException");
      }
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private void deleteObjectSubscription(MutationExecutor mutationExecutor,
      String subscribedObjectUuid, boolean expectException) {
    try {
      final Integer nrDeleted = mutationExecutor.deleteObjectSubscription("", subscribedObjectUuid);
      if (expectException) {
        fail("Expected ClientErrorException");
      }
      assertThat(nrDeleted).isOne();
    } catch (ClientErrorException expectedException) {
      if (!expectException) {
        fail("Unexpected ClientErrorException");
      }
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }
}
