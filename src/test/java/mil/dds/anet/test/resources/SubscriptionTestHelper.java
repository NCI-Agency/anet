package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.time.Instant;
import java.util.Map;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.test.client.AnetBeanList_Subscription;
import mil.dds.anet.test.client.AuthorizationGroup;
import mil.dds.anet.test.client.Event;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.SubscribableObject;
import mil.dds.anet.test.client.Subscription;
import mil.dds.anet.test.client.SubscriptionInput;
import mil.dds.anet.test.client.SubscriptionSearchQueryInput;
import mil.dds.anet.test.client.Task;

public abstract class SubscriptionTestHelper extends AbstractResourceTest {

  protected static final String SUBSCRIPTION_FIELDS =
      "{ uuid createdAt updatedAt subscriber { uuid }"
          + " subscribedObjectType subscribedObjectUuid subscribedObject {"
          + " ... on AuthorizationGroup { uuid } ... on Event { uuid }"
          + " ... on Location { uuid } ... on Organization { uuid }"
          + " ... on Person { uuid } ... on Position { uuid }"
          + " ... on Report { uuid } ... on Task { uuid } } }";

  public static final Map<String, String> SUBSCRIPTION_TESTS = Map.of(
      // Location: Antarctica
      LocationDao.TABLE_NAME, "e5b3a4b9-acf7-4c79-8224-f248b9a7215d",
      // Organization: EF 5.1 (Creed's position's organization)
      OrganizationDao.TABLE_NAME, "7f939a44-b9e4-48e0-98f5-7d0ea38a6ecf",
      // Person: Bratton, Creed
      PersonDao.TABLE_NAME, "31cba227-f6c6-49e9-9483-fce441bea624",
      // Position: EF 5.1 Advisor Quality Assurance (Creed's position)
      PositionDao.TABLE_NAME, "05c42ce0-34a0-4391-8b2f-c4cd85ee6b47",
      // Report: Discuss improvements in Annual Budgeting process
      ReportDao.TABLE_NAME, "9bb1861c-1f55-4a1b-bd3d-3c1f56d739b5",
      // Task: EF 5
      TaskDao.TABLE_NAME, "242efaa3-d5de-4970-996d-50ca90ef6480",
      // AuthorizationGroup: Inactive positions
      AuthorizationGroupDao.TABLE_NAME, "90a5196d-acf3-4a81-8ff9-3a8c7acabdf3",
      // Event: NMI PDT 2024-01
      EventDao.TABLE_NAME, "e850846e-9741-40e8-bc51-4dccc30cf47f");

  public static String getSubscribedObjectUuid(final String subscribedObjectType) {
    return SUBSCRIPTION_TESTS.get(subscribedObjectType);
  }

  public Subscription createSubscription(final String username, final String subscribedObjectType,
      final String subscribedObjectUuid, final boolean expectException,
      final boolean subscribedObjectIsNull) {
    try {
      final SubscriptionInput subscriptionInput =
          SubscriptionInput.builder().withSubscribedObjectType(subscribedObjectType)
              .withSubscribedObjectUuid(subscribedObjectUuid)
              .withCreatedAt(Instant.ofEpochSecond(12345))
              .withUpdatedAt(Instant.ofEpochSecond(67890)).build();
      final Subscription subscription = withCredentials(username,
          t -> mutationExecutor.createSubscription(SUBSCRIPTION_FIELDS, subscriptionInput));
      if (expectException) {
        fail("Expected an Exception");
      }
      assertThat(subscription).isNotNull();
      assertThat(subscription.getUuid()).isNotNull();
      // These should all be set unconditionally on the server-side
      assertThat(subscription.getUuid()).isNotEqualTo(subscriptionInput.getUuid());
      assertThat(subscription.getCreatedAt()).isNotEqualTo(subscriptionInput.getCreatedAt());
      assertThat(subscription.getSubscriber().getUuid()).isNotNull();
      // These should be our input
      assertThat(subscription.getUpdatedAt()).isEqualTo(subscriptionInput.getUpdatedAt());
      assertThat(subscription.getSubscribedObjectType())
          .isEqualTo(subscriptionInput.getSubscribedObjectType());
      assertThat(subscription.getSubscribedObjectUuid())
          .isEqualTo(subscriptionInput.getSubscribedObjectUuid());
      checkSubscribedObject(subscription, subscribedObjectIsNull);
      return subscription;
    } catch (Exception expectedException) {
      if (!expectException) {
        fail("Unexpected Exception", expectedException);
      }
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
    if (subscribedObject instanceof Location location) {
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(LocationDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(location.getUuid());
    } else if (subscribedObject instanceof Organization organization) {
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(OrganizationDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(organization.getUuid());
    } else if (subscribedObject instanceof Person person) {
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(PersonDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(person.getUuid());
    } else if (subscribedObject instanceof Position position) {
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(PositionDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(position.getUuid());
    } else if (subscribedObject instanceof Report report) {
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(ReportDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(report.getUuid());
    } else if (subscribedObject instanceof Task task) {
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(TaskDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(task.getUuid());
    } else if (subscribedObject instanceof AuthorizationGroup authorizationGroup) {
      assertThat(subscription.getSubscribedObjectType())
          .isEqualTo(AuthorizationGroupDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(authorizationGroup.getUuid());
    } else if (subscribedObject instanceof Event event) {
      assertThat(subscription.getSubscribedObjectType()).isEqualTo(EventDao.TABLE_NAME);
      assertThat(subscription.getSubscribedObjectUuid()).isEqualTo(event.getUuid());
    } else {
      fail("Unknown subscribedObjectType: %1$s", subscribedObject);
    }
  }

  public AnetBeanList_Subscription getAllSubscriptions(final String username) {
    final SubscriptionSearchQueryInput ssqi =
        SubscriptionSearchQueryInput.builder().withPageSize(0).build();
    return withCredentials(username,
        t -> queryExecutor.mySubscriptions(getListFields(SUBSCRIPTION_FIELDS), ssqi));
  }

  public void deleteSubscription(final String username, final String subscriptionUuid,
      final boolean expectException) {
    try {
      final Integer nrDeleted =
          withCredentials(username, t -> mutationExecutor.deleteSubscription("", subscriptionUuid));
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
