package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graphql_java_generator.client.GraphQLConfiguration;
import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import io.dropwizard.client.JerseyClientBuilder;
import io.dropwizard.client.JerseyClientConfiguration;
import io.dropwizard.testing.junit5.DropwizardAppExtension;
import io.dropwizard.util.Duration;
import java.lang.invoke.MethodHandles;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.test.client.AnetBeanList_Person;
import mil.dds.anet.test.client.ApprovalStep;
import mil.dds.anet.test.client.ApprovalStepInput;
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
import mil.dds.anet.test.client.PersonSearchQueryInput;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.ReportPerson;
import mil.dds.anet.test.client.ReportPersonInput;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.client.util.GraphQLRequest;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.client.util.QueryExecutor;
import mil.dds.anet.test.integration.utils.TestApp;
import mil.dds.anet.utils.BatchingUtils;
import mil.dds.anet.utils.DaoUtils;
import org.glassfish.jersey.client.authentication.HttpAuthenticationFeature;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;

@ExtendWith(TestApp.class)
public abstract class AbstractResourceTest {

  protected static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final JerseyClientConfiguration config = new JerseyClientConfiguration();
  private static final ObjectMapper ignoringMapper = MapperUtils.getDefaultMapper()
      .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

  static {
    config.setTimeout(Duration.seconds(60L));
    config.setConnectionTimeout(Duration.seconds(30L));
    config.setConnectionRequestTimeout(Duration.seconds(30L));
  }

  protected static final String adminUser = "arthur";
  protected static final QueryExecutor adminQueryExecutor = getQueryExecutor(adminUser);
  protected static final MutationExecutor adminMutationExecutor = getMutationExecutor(adminUser);
  protected static final QueryExecutor jackQueryExecutor = getQueryExecutor("jack");
  protected static final MutationExecutor jackMutationExecutor = getMutationExecutor("jack");

  protected static Client client;
  protected static Person admin;
  protected static Map<String, Object> context;
  private static BatchingUtils batchingUtils;

  private static final String PERSON_FIELDS =
      "{ uuid name domainUsername openIdSubject user emailAddress rank status phoneNumber biography"
          + " pendingVerification createdAt updatedAt position { uuid name type status"
          + " organization { uuid shortName parentOrg { uuid shortName } } } }";

  @BeforeAll
  public static void setUp() {
    if (DaoUtils.isPostgresql()) {
      // Update full-text index
      refreshMaterializedViews();
    }
    final DropwizardAppExtension<AnetConfiguration> app = TestApp.app;
    client = new JerseyClientBuilder(app.getEnvironment()).using(config).build("test client");
    admin = findOrPutPersonInDb(Person.builder().withDomainUsername(adminUser).build());
    context = new HashMap<>();
    batchingUtils = new BatchingUtils(AnetObjectEngine.getInstance(), false, false);
    context.put("dataLoaderRegistry", batchingUtils.getDataLoaderRegistry());
  }

  private static void refreshMaterializedViews() {
    final String[] materializedViews =
        {"mv_fts_authorizationGroups", "mv_fts_locations", "mv_fts_organizations", "mv_fts_people",
            "mv_fts_positions", "mv_fts_reports", "mv_fts_tasks"};
    final AdminDao adminDao = AnetObjectEngine.getInstance().getAdminDao();
    for (final String materializedView : materializedViews) {
      try {
        adminDao.updateMaterializedView(materializedView);
      } catch (Throwable e) {
        fail("Exception in refreshMaterializedViews()", e);
      }
    }
  }

  @AfterAll
  public static void tearDown() {
    client.close();
    batchingUtils.shutdown();
  }

  /*
   * Finds the specified person in the database. If missing, creates them.
   */
  public static Person findOrPutPersonInDb(Person stub) {
    try {
      if (stub.getDomainUsername() != null) {
        final Person user = findPerson(stub);
        if (user != null) {
          return user;
        }
      } else {
        final PersonSearchQueryInput query =
            PersonSearchQueryInput.builder().withText(stub.getName()).build();
        final AnetBeanList_Person searchObjects =
            jackQueryExecutor.personList(getListFields(PERSON_FIELDS), query);
        for (final Person p : searchObjects.getList()) {
          if (p.getName().equals(stub.getName())) {
            return p;
          }
        }
      }

      // Insert into DB
      return adminMutationExecutor.createPerson(PERSON_FIELDS, getPersonInput(stub));
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      logger.error("problems finding user", e);
      return null;
    }
  }

  public static Person findPerson(Person stub)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final QueryExecutor stubQueryExecutor = getQueryExecutor(stub.getDomainUsername());
    return stubQueryExecutor.me(PERSON_FIELDS);
  }

  // Location in the test database
  public static Location getGeneralHospital()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    return adminQueryExecutor.location("{ uuid }", "0855fb0a-995e-4a79-a132-4024ee2983ff");
  }

  // Advisors in the test database
  public static Person getSuperuser() {
    final Person rebecca =
        findOrPutPersonInDb(Person.builder().withDomainUsername("rebecca").build());
    assertThat(rebecca).isNotNull();
    return rebecca;
  }

  public static Person getRegularUser() {
    final Person erin = findOrPutPersonInDb(Person.builder().withDomainUsername("erin").build());
    assertThat(erin).isNotNull();
    return erin;
  }

  public static Person getAndrewAnderson() {
    return findOrPutPersonInDb(Person.builder().withDomainUsername("andrew").build());
  }

  public static Person getBobBobtown() {
    return findOrPutPersonInDb(Person.builder().withDomainUsername("bob").build());
  }

  public static Person getElizabethElizawell() {
    return findOrPutPersonInDb(Person.builder().withDomainUsername("elizabeth").build());
  }

  public static Person getJackJackson() {
    return findOrPutPersonInDb(Person.builder().withDomainUsername("jack").build());
  }

  public static Person getNickNicholson() {
    return findOrPutPersonInDb(Person.builder().withDomainUsername("nick").build());
  }

  public static Person getReinaReinton() {
    return findOrPutPersonInDb(Person.builder().withDomainUsername("reina").build());
  }

  public static Person getYoshieBeau() {
    return findOrPutPersonInDb(Person.builder().withDomainUsername("yoshie").build());
  }

  // Interlocutors in the test database
  public static Person getChristopfTopferness() {
    return findOrPutPersonInDb(Person.builder().withName("TOPFERNESS, Christopf").build());
  }

  public static Person getHunterHuntman() {
    return findOrPutPersonInDb(Person.builder().withName("HUNTMAN, Hunter").build());
  }

  public static Person getRogerRogwell() {
    return findOrPutPersonInDb(Person.builder().withName("ROGWELL, Roger").build());
  }

  public static Person getShardulSharton() {
    return findOrPutPersonInDb(Person.builder().withName("SHARTON, Shardul").build());
  }

  public static Person getSteveSteveson() {
    return findOrPutPersonInDb(Person.builder().withName("STEVESON, Steve").build());
  }

  // Getting the above as a normal bean
  public static mil.dds.anet.beans.Person getSuperuserBean() {
    return getInput(getSuperuser(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getRegularUserBean() {
    return getInput(getRegularUser(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getAndrewAndersonBean() {
    return getInput(getAndrewAnderson(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getBobBobtownBean() {
    return getInput(getBobBobtown(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getElizabethElizawellBean() {
    return getInput(getElizabethElizawell(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getJackJacksonBean() {
    return getInput(getJackJackson(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getNickNicholsonBean() {
    return getInput(getNickNicholson(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getReinaReintonBean() {
    return getInput(getReinaReinton(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getChristopfTopfernessBean() {
    return getInput(getChristopfTopferness(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getHunterHuntmanBean() {
    return getInput(getHunterHuntman(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getRogerRogwellBean() {
    return getInput(getRogerRogwell(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getShardulShartonBean() {
    return getInput(getShardulSharton(), mil.dds.anet.beans.Person.class);
  }

  public static mil.dds.anet.beans.Person getSteveStevesonBean() {
    return getInput(getSteveSteveson(), mil.dds.anet.beans.Person.class);
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
    return approvalSteps.stream().map(as -> getApprovalStepInput(as)).collect(Collectors.toList());
  }

  protected static LocationInput getLocationInput(final Location location) {
    return getInput(location, LocationInput.class);
  }

  protected static NoteInput getNoteInput(final Note note) {
    return getInput(note, NoteInput.class);
  }

  protected static List<NoteInput> getNotesInput(final List<Note> notes) {
    return notes.stream().map(n -> getNoteInput(n)).collect(Collectors.toList());
  }

  protected static OrganizationInput getOrganizationInput(final Organization organization) {
    return getInput(organization, OrganizationInput.class);
  }

  protected static List<OrganizationInput> getOrganizationsInput(
      final List<Organization> organizations) {
    return organizations.stream().map(o -> getOrganizationInput(o)).collect(Collectors.toList());
  }

  protected static List<PersonInput> getPeopleInput(
      final List<mil.dds.anet.test.client.Person> people) {
    return people.stream().map(p -> getPersonInput(p)).collect(Collectors.toList());
  }

  protected static PersonInput getPersonInput(final mil.dds.anet.test.client.Person person) {
    return getInput(person, PersonInput.class);
  }

  protected static List<ReportPersonInput> getReportPeopleInput(
      final List<ReportPerson> reportPeople) {
    return reportPeople.stream().map(rp -> getReportPersonInput(rp)).collect(Collectors.toList());
  }

  protected static ReportPersonInput getReportPersonInput(final ReportPerson reportPerson) {
    return getInput(reportPerson, ReportPersonInput.class);
  }

  protected static PositionInput getPositionInput(final Position position) {
    return getInput(position, PositionInput.class);
  }

  protected static List<PositionInput> getPositionsInput(final List<Position> positions) {
    return positions.stream().map(p -> getPositionInput(p)).collect(Collectors.toList());
  }

  protected static PersonPositionHistoryInput getPersonPositionHistoryInput(
      final PersonPositionHistory pph) {
    return getInput(pph, PersonPositionHistoryInput.class);
  }

  protected static List<PersonPositionHistoryInput> getPersonPositionHistoryInput(
      final List<PersonPositionHistory> history) {
    return history.stream().map(pph -> getPersonPositionHistoryInput(pph))
        .collect(Collectors.toList());
  }

  protected static TaskInput getTaskInput(final Task task) {
    return getInput(task, TaskInput.class);
  }

  protected static ReportInput getReportInput(Report report) {
    return getInput(report, ReportInput.class);
  }

  // Conversions from Person to ReportPerson
  public static ReportPerson personToPrimaryReportPerson(Person p) {
    final ReportPerson rp = personToReportPerson(p);
    rp.setPrimary(true);
    return rp;
  }

  public static ReportPerson personToReportAuthor(Person p) {
    final ReportPerson rp = personToReportPerson(p);
    rp.setAuthor(true);
    rp.setInterlocutor(false);
    return rp;
  }

  public static ReportPerson personToPrimaryReportAuthor(Person p) {
    final ReportPerson rp = personToReportAuthor(p);
    rp.setPrimary(true);
    return rp;
  }

  public static ReportPerson personToReportPerson(Person p) {
    final ReportPerson rp = ReportPerson.builder().withPrimary(false).withAuthor(false)
        .withAttendee(true).withInterlocutor(true).build();
    BeanUtils.copyProperties(p, rp);
    return rp;
  }

  // The above for regular beans
  public static mil.dds.anet.beans.ReportPerson personToPrimaryReportPerson(
      mil.dds.anet.beans.Person p) {
    final mil.dds.anet.beans.ReportPerson rp = personToReportPerson(p);
    rp.setPrimary(true);
    return rp;
  }

  public static mil.dds.anet.beans.ReportPerson personToReportAuthor(mil.dds.anet.beans.Person p) {
    final mil.dds.anet.beans.ReportPerson rp = personToReportPerson(p);
    rp.setAuthor(true);
    rp.setInterlocutor(false);
    return rp;
  }

  public static mil.dds.anet.beans.ReportPerson personToPrimaryReportAuthor(
      mil.dds.anet.beans.Person p) {
    final mil.dds.anet.beans.ReportPerson rp = personToReportAuthor(p);
    rp.setPrimary(true);
    return rp;
  }

  public static mil.dds.anet.beans.ReportPerson personToReportPerson(mil.dds.anet.beans.Person p) {
    final mil.dds.anet.beans.ReportPerson rp = new mil.dds.anet.beans.ReportPerson();
    rp.setPrimary(false);
    rp.setAuthor(false);
    rp.setAttendee(true);
    rp.setInterlocutor(true);
    BeanUtils.copyProperties(p, rp);
    return rp;
  }

  // Return list fields (when e.g. doing a search) for a set of object fields
  protected static String getListFields(String fields) {
    return String.format("{ pageNum pageSize totalCount list %s }", fields);
  }

  // Get GraphQL request executors
  protected static GraphQLRequest getGraphQlRequest(String user, String graphQlRequest)
      throws GraphQLRequestPreparationException {
    final GraphQLRequest req = new GraphQLRequest(graphQlRequest);
    req.setInstanceConfiguration(getGraphQlConfiguration(user));
    return req;
  }

  protected static QueryExecutor getQueryExecutor(String user) {
    return new QueryExecutor(getGraphQlEndpoint(), getClient(user));
  }

  protected static MutationExecutor getMutationExecutor(String user) {
    return new MutationExecutor(getGraphQlEndpoint(), getClient(user));
  }

  @SuppressWarnings("deprecation")
  private static GraphQLConfiguration getGraphQlConfiguration(String user) {
    return new GraphQLConfiguration(getGraphQlEndpoint(), getClient(user));
  }

  private static String getGraphQlEndpoint() {
    return String.format("http://localhost:%1$d/graphql", TestApp.app.getLocalPort());
  }

  private static Client getClient(String user) {
    return ClientBuilder.newBuilder().register(HttpAuthenticationFeature.basic(user, user)).build();
  }

}
