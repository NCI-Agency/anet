package mil.dds.anet.test.resources;

import static mil.dds.anet.utils.ResourceUtils.getAllowedClassifications;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.test.GraphQLPluginConfiguration;
import mil.dds.anet.test.SpringTestConfig;
import mil.dds.anet.test.client.AnetBeanList_Person;
import mil.dds.anet.test.client.AnetBeanList_Subscription;
import mil.dds.anet.test.client.AnetBeanList_SubscriptionUpdate;
import mil.dds.anet.test.client.ApprovalStep;
import mil.dds.anet.test.client.ApprovalStepInput;
import mil.dds.anet.test.client.Assessment;
import mil.dds.anet.test.client.AssessmentInput;
import mil.dds.anet.test.client.AuthorizationGroup;
import mil.dds.anet.test.client.AuthorizationGroupInput;
import mil.dds.anet.test.client.Event;
import mil.dds.anet.test.client.EventInput;
import mil.dds.anet.test.client.EventSeries;
import mil.dds.anet.test.client.EventSeriesInput;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.LocationInput;
import mil.dds.anet.test.client.Note;
import mil.dds.anet.test.client.NoteInput;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonInput;
import mil.dds.anet.test.client.PersonPositionHistory;
import mil.dds.anet.test.client.PersonPositionHistoryInput;
import mil.dds.anet.test.client.PersonPreferenceInput;
import mil.dds.anet.test.client.PersonSearchQueryInput;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PreferenceInput;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.ReportPerson;
import mil.dds.anet.test.client.ReportPersonInput;
import mil.dds.anet.test.client.SortOrder;
import mil.dds.anet.test.client.Subscription;
import mil.dds.anet.test.client.SubscriptionInput;
import mil.dds.anet.test.client.SubscriptionSearchQueryInput;
import mil.dds.anet.test.client.SubscriptionUpdate;
import mil.dds.anet.test.client.SubscriptionUpdateSearchQueryInput;
import mil.dds.anet.test.client.SubscriptionUpdateSearchSortBy;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.client.util.QueryExecutor;
import mil.dds.anet.threads.MaterializedViewForLinksRefreshWorker;
import mil.dds.anet.threads.MaterializedViewRefreshWorker;
import mil.dds.anet.utils.Utils;
import org.apache.commons.lang3.ArrayUtils;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.provider.Arguments;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = SpringTestConfig.class,
    useMainMethod = SpringBootTest.UseMainMethod.ALWAYS,
    webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class AbstractResourceTest {

  @Autowired
  protected QueryExecutor queryExecutor;

  @Autowired
  protected MutationExecutor mutationExecutor;

  @Autowired
  protected GraphQLPluginConfiguration.AuthenticationInjector authenticationInjector;

  @Autowired
  protected AnetConfig config;

  @Autowired
  protected AnetDictionary dict;

  @Autowired
  protected AdminDao adminDao;

  protected static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final ObjectMapper ignoringMapper = MapperUtils.getDefaultMapper()
      .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

  protected static final String adminUser = "arthur";
  protected static final String jackUser = "jack";

  protected Person admin;

  private static final String PERSON_FIELDS =
      "{ uuid name user users { uuid domainUsername } rank status phoneNumber biography"
          + " pendingVerification createdAt updatedAt position { uuid name type superuserType status"
          + " organization { uuid shortName parentOrg { uuid shortName } } } "
          + " emailAddresses { network address } }";

  @BeforeAll
  void setUp() {
    // Update full-text index
    refreshMaterializedViews();
    admin = findOrPutPersonInDb(adminUser, Person.builder().build());
  }

  private void refreshMaterializedViews() {
    final String[] allMaterializedViews =
        ArrayUtils.addAll(MaterializedViewForLinksRefreshWorker.materializedViews,
            MaterializedViewRefreshWorker.materializedViews);
    for (final String materializedView : allMaterializedViews) {
      try {
        adminDao.updateMaterializedView(materializedView);
      } catch (Throwable e) {
        fail("Exception in refreshMaterializedViews()", e);
      }
    }
  }

  public Person findOrPutPersonInDb(Person stub) {
    return findOrPutPersonInDb(null, stub);
  }

  /*
   * Finds the specified person in the database. If missing, creates them.
   */
  public Person findOrPutPersonInDb(String domainUsername, Person stub) {
    try {
      if (domainUsername != null) {
        final Person user = findPerson(domainUsername);
        if (user != null) {
          return user;
        }
      } else {
        final PersonSearchQueryInput query =
            PersonSearchQueryInput.builder().withText(stub.getName()).build();
        final AnetBeanList_Person searchObjects = withCredentials(jackUser,
            t -> queryExecutor.personList(getListFields(PERSON_FIELDS), query));
        for (final Person p : searchObjects.getList()) {
          if (p.getName().equals(stub.getName())) {
            return p;
          }
        }
      }

      // Insert into DB
      return withCredentials(adminUser,
          t -> mutationExecutor.createPerson(PERSON_FIELDS, getPersonInput(stub)));
    } catch (Exception e) {
      logger.error("problems finding user", e);
      return null;
    }
  }

  public Person findPerson(String domainUsername) {
    return withCredentials(domainUsername, t -> queryExecutor.me(PERSON_FIELDS));
  }

  // Location in the test database
  public Location getGeneralHospital() {
    return withCredentials(getDomainUsername(admin),
        t -> queryExecutor.location("{ uuid }", "0855fb0a-995e-4a79-a132-4024ee2983ff"));
  }

  // Advisors in the test database
  public Person getSuperuser() {
    final Person rebecca = findOrPutPersonInDb("rebecca", Person.builder().build());
    assertThat(rebecca).isNotNull();
    return rebecca;
  }

  public Person getRegularUser() {
    final Person erin = findOrPutPersonInDb("erin", Person.builder().build());
    assertThat(erin).isNotNull();
    return erin;
  }

  public Person getAndrewAnderson() {
    return findOrPutPersonInDb("andrew", Person.builder().build());
  }

  public Person getBobBobtown() {
    return findOrPutPersonInDb("bob", Person.builder().build());
  }

  public Person getCreedBratton() {
    return findOrPutPersonInDb("henry", Person.builder().build());
  }

  public Person getElizabethElizawell() {
    return findOrPutPersonInDb("elizabeth", Person.builder().build());
  }

  public Person getHenryHenderson() {
    return findOrPutPersonInDb("henry", Person.builder().build());
  }

  public Person getJackJackson() {
    return findOrPutPersonInDb(jackUser, Person.builder().build());
  }

  public Person getKevinMalone() {
    return findOrPutPersonInDb("henry", Person.builder().build());
  }

  public Person getNickNicholson() {
    return findOrPutPersonInDb("nick", Person.builder().build());
  }

  public Person getReinaReinton() {
    return findOrPutPersonInDb("reina", Person.builder().build());
  }

  public Person getYoshieBeau() {
    return findOrPutPersonInDb("yoshie", Person.builder().build());
  }

  public Person getBenRogers() {
    return findOrPutPersonInDb(Person.builder().withName("Rogers, Ben").build());
  }

  // Interlocutors in the test database
  public Person getChristopfTopferness() {
    return findOrPutPersonInDb(Person.builder().withName("Topferness, Christopf").build());
  }

  public Person getHunterHuntman() {
    return findOrPutPersonInDb(Person.builder().withName("Huntman, Hunter").build());
  }

  public Person getRogerRogwell() {
    return findOrPutPersonInDb(Person.builder().withName("Rogwell, Roger").build());
  }

  public Person getShardulSharton() {
    return findOrPutPersonInDb(Person.builder().withName("Sharton, Shardul").build());
  }

  public Person getSteveSteveson() {
    return findOrPutPersonInDb(Person.builder().withName("Steveson, Steve").build());
  }

  // Getting the above as a normal bean
  public mil.dds.anet.beans.Person getAdminBean() {
    return getInput(admin, mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getSuperuserBean() {
    return getInput(getSuperuser(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getRegularUserBean() {
    return getInput(getRegularUser(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getAndrewAndersonBean() {
    return getInput(getAndrewAnderson(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getBobBobtownBean() {
    return getInput(getBobBobtown(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getElizabethElizawellBean() {
    return getInput(getElizabethElizawell(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getJackJacksonBean() {
    return getInput(getJackJackson(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getNickNicholsonBean() {
    return getInput(getNickNicholson(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getReinaReintonBean() {
    return getInput(getReinaReinton(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getChristopfTopfernessBean() {
    return getInput(getChristopfTopferness(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getHunterHuntmanBean() {
    return getInput(getHunterHuntman(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getRogerRogwellBean() {
    return getInput(getRogerRogwell(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getShardulShartonBean() {
    return getInput(getShardulSharton(), mil.dds.anet.beans.Person.class);
  }

  public mil.dds.anet.beans.Person getSteveStevesonBean() {
    return getInput(getSteveSteveson(), mil.dds.anet.beans.Person.class);
  }

  protected String getDomainUsername(Person person) {
    if (!Utils.isEmptyOrNull(person.getUsers())) {
      return person.getUsers().get(0).getDomainUsername();
    }
    return null;
  }

  protected String getDomainUsername(PersonInput person) {
    if (!Utils.isEmptyOrNull(person.getUsers())) {
      return person.getUsers().get(0).getDomainUsername();
    }
    return null;
  }

  protected String getDomainUsername(mil.dds.anet.beans.Person person) {
    if (!Utils.isEmptyOrNull(person.getUsers())) {
      return person.getUsers().get(0).getDomainUsername();
    }
    return null;
  }

  // Convert from GraphQL type to input type
  protected static <T> T getInput(Object object, Class<T> clazz) {
    try {
      final String jsonString = ignoringMapper.writeValueAsString(object);
      return ignoringMapper.readValue(jsonString, clazz);
    } catch (JsonProcessingException e) {
      logger.error("conversion to input type failed", e);
      return null;
    }
  }

  protected static ApprovalStepInput getApprovalStepInput(final ApprovalStep approvalStep) {
    return getInput(approvalStep, ApprovalStepInput.class);
  }

  protected static List<ApprovalStepInput> getApprovalStepsInput(
      final List<ApprovalStep> approvalSteps) {
    return approvalSteps.stream().map(AbstractResourceTest::getApprovalStepInput).toList();
  }

  protected static AssessmentInput getAssessmentInput(final Assessment assessment) {
    return getInput(assessment, AssessmentInput.class);
  }

  protected static List<AssessmentInput> getAssessmentsInput(final List<Assessment> assessments) {
    // List should be mutable, as it gets reversed during the tests!
    return assessments.stream().map(AbstractResourceTest::getAssessmentInput)
        .collect(Collectors.toList());
  }

  protected static AuthorizationGroupInput getAuthorizationGroupInput(
      final AuthorizationGroup authorizationGroup) {
    return getInput(authorizationGroup, AuthorizationGroupInput.class);
  }

  protected static LocationInput getLocationInput(final Location location) {
    return getInput(location, LocationInput.class);
  }

  protected static NoteInput getNoteInput(final Note note) {
    return getInput(note, NoteInput.class);
  }

  protected static List<NoteInput> getNotesInput(final List<Note> notes) {
    // List should be mutable, as it gets reversed during the tests!
    return notes.stream().map(AbstractResourceTest::getNoteInput).collect(Collectors.toList());
  }

  protected static OrganizationInput getOrganizationInput(final Organization organization) {
    return getInput(organization, OrganizationInput.class);
  }

  protected static List<OrganizationInput> getOrganizationsInput(
      final List<Organization> organizations) {
    return organizations.stream().map(AbstractResourceTest::getOrganizationInput).toList();
  }

  protected static List<PersonInput> getPeopleInput(
      final List<mil.dds.anet.test.client.Person> people) {
    return people.stream().map(AbstractResourceTest::getPersonInput).toList();
  }

  protected static PersonInput getPersonInput(final mil.dds.anet.test.client.Person person) {
    return getInput(person, PersonInput.class);
  }

  protected static PersonPreferenceInput getPersonPreferenceInput(final String personUuid,
      final String preferenceUuid, final String value) {
    return PersonPreferenceInput.builder().withValue(value)
        .withPerson(PersonInput.builder().withUuid(personUuid).build())
        .withPreference(PreferenceInput.builder().withUuid(preferenceUuid).build()).build();
  }

  protected static List<ReportPersonInput> getReportPeopleInput(
      final List<ReportPerson> reportPeople) {
    return reportPeople.stream().map(AbstractResourceTest::getReportPersonInput).toList();
  }

  protected static ReportPersonInput getReportPersonInput(final ReportPerson reportPerson) {
    return getInput(reportPerson, ReportPersonInput.class);
  }

  protected static PositionInput getPositionInput(final Position position) {
    return getInput(position, PositionInput.class);
  }

  protected static EventInput getEventInput(final Event event) {
    return getInput(event, EventInput.class);
  }

  protected static EventSeriesInput getEventSeriesInput(final EventSeries eventSeries) {
    return getInput(eventSeries, EventSeriesInput.class);
  }

  protected static List<PositionInput> getPositionsInput(final List<Position> positions) {
    return positions.stream().map(AbstractResourceTest::getPositionInput).toList();
  }

  protected static PersonPositionHistoryInput getPersonPositionHistoryInput(
      final PersonPositionHistory pph) {
    return getInput(pph, PersonPositionHistoryInput.class);
  }

  protected static List<PersonPositionHistoryInput> getPersonPositionHistoryInput(
      final List<PersonPositionHistory> history) {
    return history.stream().map(AbstractResourceTest::getPersonPositionHistoryInput).toList();
  }

  protected static TaskInput getTaskInput(final Task task) {
    return getInput(task, TaskInput.class);
  }

  protected static ReportInput getReportInput(Report report) {
    return getInput(report, ReportInput.class);
  }

  // Conversions from Person to ReportPerson
  public static ReportPerson personToPrimaryReportPerson(Person p, boolean interlocutor) {
    final ReportPerson rp = personToReportPerson(p, interlocutor);
    rp.setPrimary(true);
    return rp;
  }

  public static ReportPerson personToReportAuthor(Person p) {
    final ReportPerson rp = personToReportPerson(p, false);
    rp.setAuthor(true);
    return rp;
  }

  public static ReportPerson personToPrimaryReportAuthor(Person p) {
    final ReportPerson rp = personToReportAuthor(p);
    rp.setPrimary(true);
    return rp;
  }

  public static ReportPerson personToReportPerson(Person p, boolean interlocutor) {
    final ReportPerson rp = ReportPerson.builder().withPrimary(false).withAuthor(false)
        .withAttendee(true).withInterlocutor(interlocutor).build();
    BeanUtils.copyProperties(p, rp);
    return rp;
  }

  // The above for regular beans
  public static mil.dds.anet.beans.ReportPerson personToPrimaryReportPerson(
      mil.dds.anet.beans.Person p, boolean interlocutor) {
    final mil.dds.anet.beans.ReportPerson rp = personToReportPerson(p, interlocutor);
    rp.setPrimary(true);
    return rp;
  }

  public static mil.dds.anet.beans.ReportPerson personToReportAuthor(mil.dds.anet.beans.Person p) {
    final mil.dds.anet.beans.ReportPerson rp = personToReportPerson(p, false);
    rp.setAuthor(true);
    return rp;
  }

  public static mil.dds.anet.beans.ReportPerson personToPrimaryReportAuthor(
      mil.dds.anet.beans.Person p) {
    final mil.dds.anet.beans.ReportPerson rp = personToReportAuthor(p);
    rp.setPrimary(true);
    return rp;
  }

  public static mil.dds.anet.beans.ReportPerson personToReportPerson(mil.dds.anet.beans.Person p,
      boolean interlocutor) {
    final mil.dds.anet.beans.ReportPerson rp = new mil.dds.anet.beans.ReportPerson();
    rp.setPrimary(false);
    rp.setAuthor(false);
    rp.setAttendee(true);
    rp.setInterlocutor(interlocutor);
    BeanUtils.copyProperties(p, rp);
    return rp;
  }

  // Return list fields (when e.g. doing a search) for a set of object fields
  protected static String getListFields(String fields) {
    return String.format("{ pageNum pageSize totalCount list %s }", fields);
  }

  /**
   * Extension of {@link Function} that allows the passed function to throw {@link Exception}s.
   * These exceptions will be caught and re-thrown as {@link RuntimeException}s.
   */
  @FunctionalInterface
  public interface ThrowingFunction<T, R> extends Function<T, R> {
    @Override
    default R apply(final T t) {
      try {
        return applyThrows(t);
      } catch (final Exception e) {
        throw new RuntimeException(e);
      }
    }

    R applyThrows(final T t) throws Exception;
  }

  public synchronized <R> R withCredentials(final String userNameAndPassword,
      final ThrowingFunction<Object, R> authenticatedCallback) throws RuntimeException {
    authenticationInjector.setCredentials(userNameAndPassword);
    try {
      return authenticatedCallback.apply(null);
    } finally {
      authenticationInjector.setCredentials(null);
    }
  }

  protected String getFirstClassification() {
    return getAllowedClassifications().iterator().next();
  }

  protected Stream<Arguments> provideMergeTestParameters() {
    return Stream.of( // -
        Arguments.of(false, false), // don't subscribe
        Arguments.of(true, false), // subscribe to loser
        Arguments.of(false, true), // subscribe to winner
        Arguments.of(true, true) // subscribe to both
    );
  }

  protected String addSubscription(boolean subscribe, String objectType, String objectUuid,
      ThrowingFunction<Object, Integer> updateCallback) {
    if (!subscribe) {
      return null;
    }
    // Subscribe to the object
    final SubscriptionInput subscriptionInput = SubscriptionInput.builder()
        .withSubscribedObjectType(objectType).withSubscribedObjectUuid(objectUuid).build();
    final Subscription subscription = withCredentials(adminUser,
        t -> mutationExecutor.createSubscription("{ uuid }", subscriptionInput));
    assertThat(subscription).isNotNull();
    assertThat(subscription.getUuid()).isNotNull();
    // Edit the object so we get a subscriptionUpdate
    final Integer n = withCredentials(adminUser, updateCallback);
    assertThat(n).isOne();
    // Get the subscriptionUpdates
    final SubscriptionUpdateSearchQueryInput subscriptionUpdateSearchQueryInput =
        SubscriptionUpdateSearchQueryInput.builder()
            .withSortBy(SubscriptionUpdateSearchSortBy.CREATED_AT).withSortOrder(SortOrder.DESC)
            .withPageSize(1).build();
    final AnetBeanList_SubscriptionUpdate subscriptionUpdates = withCredentials(adminUser,
        t -> queryExecutor.mySubscriptionUpdates(
            getListFields("{ updatedObjectType updatedObjectUuid }"),
            subscriptionUpdateSearchQueryInput));
    assertThat(subscriptionUpdates).isNotNull();
    assertThat(subscriptionUpdates.getList()).isNotEmpty().hasSize(1);
    final SubscriptionUpdate subscriptionUpdate = subscriptionUpdates.getList().get(0);
    assertThat(subscriptionUpdate.getUpdatedObjectType()).isEqualTo(objectType);
    assertThat(subscriptionUpdate.getUpdatedObjectUuid()).isEqualTo(objectUuid);
    return subscription.getUuid();
  }

  protected void checkSubscriptionsAndUpdatesAfterMerge(boolean subscribed, String objectType,
      String loserUuid, String winnerUuid) {
    final int expectedNrOfSubscriptions = subscribed ? 1 : 0;
    final int expectedNrOfSubscriptionUpdates = subscribed ? 2 : 0;
    // Check the subscriptions to the object
    final AnetBeanList_Subscription subscriptions = withCredentials(adminUser,
        t -> queryExecutor.mySubscriptions(
            getListFields("{ subscribedObjectType subscribedObjectUuid }"),
            SubscriptionSearchQueryInput.builder().withPageSize(0).build()));
    assertThat(subscriptions).isNotNull();
    assertThat(subscriptions.getList()).hasSize(expectedNrOfSubscriptions);
    assertThat(subscriptions.getList())
        .filteredOn(s -> objectType.equals(s.getSubscribedObjectType()))
        .noneMatch(s -> loserUuid.equals(s.getSubscribedObjectUuid()))
        .filteredOn(s -> winnerUuid.equals(s.getSubscribedObjectUuid()))
        .hasSize(expectedNrOfSubscriptions);
    // Check the subscriptionUpdates for the object
    final AnetBeanList_SubscriptionUpdate subscriptionUpdates = withCredentials(adminUser,
        t -> queryExecutor.mySubscriptionUpdates(
            getListFields("{ updatedObjectType updatedObjectUuid }"),
            SubscriptionUpdateSearchQueryInput.builder().withPageSize(0).build()));
    assertThat(subscriptionUpdates).isNotNull();
    assertThat(subscriptionUpdates.getList()).hasSize(expectedNrOfSubscriptionUpdates);
    assertThat(subscriptionUpdates.getList())
        .filteredOn(s -> objectType.equals(s.getUpdatedObjectType()))
        .noneMatch(s -> loserUuid.equals(s.getUpdatedObjectUuid()))
        .filteredOn(s -> winnerUuid.equals(s.getUpdatedObjectUuid()))
        .hasSize(expectedNrOfSubscriptionUpdates);
  }

  protected void deleteSubscription(boolean expectException, String subscriptionUuid) {
    if (subscriptionUuid != null) {
      // Unsubscribe from the object
      try {
        final Integer n = withCredentials(adminUser,
            t -> mutationExecutor.deleteSubscription("", subscriptionUuid));
        if (expectException) {
          fail("Expected an exception");
        }
        assertThat(n).isOne();
      } catch (Exception e) {
        if (!expectException) {
          fail("Unexpected exception", e);
        }
      }
    }
  }
}
