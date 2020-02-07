package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.type.TypeReference;
import io.dropwizard.client.JerseyClientBuilder;
import io.dropwizard.client.JerseyClientConfiguration;
import io.dropwizard.testing.junit5.DropwizardAppExtension;
import io.dropwizard.testing.junit5.DropwizardExtensionsSupport;
import io.dropwizard.util.Duration;
import java.lang.invoke.MethodHandles;
import java.util.HashMap;
import java.util.Map;
import javax.ws.rs.client.Client;
import mil.dds.anet.AnetApplication;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.test.beans.PersonTest;
import mil.dds.anet.test.resources.utils.GraphQlHelper;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import mil.dds.anet.utils.BatchingUtils;
import mil.dds.anet.utils.DaoUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ExtendWith(DropwizardExtensionsSupport.class)
public abstract class AbstractResourceTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public static final DropwizardAppExtension<AnetConfiguration> RULE =
      new DropwizardAppExtension<AnetConfiguration>(AnetApplication.class, "anet.yml");

  private static JerseyClientConfiguration config = new JerseyClientConfiguration();

  static {
    config.setTimeout(Duration.seconds(60L));
    config.setConnectionTimeout(Duration.seconds(30L));
    config.setConnectionRequestTimeout(Duration.seconds(30L));
  }

  protected static Client client;
  protected static GraphQlHelper graphQLHelper;
  protected static Person admin;
  protected static Map<String, Object> context;
  private static BatchingUtils batchingUtils;

  private static final String PERSON_FIELDS =
      "uuid name domainUsername role emailAddress rank status phoneNumber biography pendingVerification createdAt updatedAt"
          + " position { uuid name type status "
          + "   organization { uuid shortName parentOrg { uuid shortName } } }";

  @BeforeAll
  public static void setUp() {
    if (DaoUtils.isPostgresql()) {
      // Update full-text index
      refreshMaterializedViews();
    }
    client = new JerseyClientBuilder(RULE.getEnvironment()).using(config).build("test client");
    graphQLHelper = new GraphQlHelper(client, RULE.getLocalPort());
    admin = findOrPutPersonInDb(PersonTest.getArthurDmin());
    context = new HashMap<>();
    batchingUtils = new BatchingUtils(AnetObjectEngine.getInstance(), false, false);
    context.put("dataLoaderRegistry", batchingUtils.getDataLoaderRegistry());
  }

  private static void refreshMaterializedViews() {
    final String[] materializedViews =
        {"mv_fts_authorizationGroups", "mv_fts_locations", "mv_fts_organizations", "mv_fts_people",
            "mv_fts_positions", "mv_fts_reports", "mv_fts_tags", "mv_fts_tasks"};
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
    if (stub.getDomainUsername() != null) {
      final Person user = findPerson(stub);
      if (user != null) {
        return user;
      }
    } else {
      PersonSearchQuery query = new PersonSearchQuery();
      query.setText(stub.getName());
      final AnetBeanList<Person> searchObjects = graphQLHelper.searchObjects(
          PersonTest.getJackJacksonStub(), "personList", "query", "PersonSearchQueryInput",
          PERSON_FIELDS, query, new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
      for (Person p : searchObjects.getList()) {
        if (p.getEmailAddress().equals(stub.getEmailAddress())) {
          return p;
        }
      }
    }

    // Create insert into DB
    final String newPersonUuid = graphQLHelper.createObject(admin, "createPerson", "person",
        "PersonInput", stub, new TypeReference<GraphQlResponse<Person>>() {});
    return graphQLHelper.getObjectById(admin, "person", PERSON_FIELDS, newPersonUuid,
        new TypeReference<GraphQlResponse<Person>>() {});
  }

  public static Person findPerson(Person stub) {
    try {
      return graphQLHelper.getObject(stub, "me", PERSON_FIELDS,
          new TypeReference<GraphQlResponse<Person>>() {});
    } catch (Exception e) {
      logger.error("error getting user", e);
      return null;
    }
  }

  public static Person getSuperUser() {
    final Person rebeccaStub = new Person();
    rebeccaStub.setDomainUsername("rebecca"); // super-user from the demo data
    final Person rebecca = findPerson(rebeccaStub);
    assertThat(rebecca).isNotNull();
    return rebecca;
  }

  public static Person getRegularUser() {
    final Person erinStub = new Person();
    erinStub.setDomainUsername("erin"); // regular user from the demo data
    final Person erin = findPerson(erinStub);
    assertThat(erin).isNotNull();
    return erin;
  }

  public Person getJackJackson() {
    return findOrPutPersonInDb(PersonTest.getJackJacksonStub());
  }

  public Person getSteveSteveson() {
    return findOrPutPersonInDb(PersonTest.getSteveStevesonStub());
  }

  public Person getRogerRogwell() {
    return findOrPutPersonInDb(PersonTest.getRogerRogwell());
  }

  public Person getElizabethElizawell() {
    return findOrPutPersonInDb(PersonTest.getElizabethElizawell());
  }

  public Person getNickNicholson() {
    return findOrPutPersonInDb(PersonTest.getNickNicholson());
  }

  public Person getBobBobtown() {
    return findOrPutPersonInDb(PersonTest.getBobBobtown());
  }

  public Organization createOrganizationWithUuid(String uuid) {
    final Organization ao = new Organization();
    ao.setUuid(uuid);
    return ao;
  }

}
