package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.ImmutableMap;
import graphql.introspection.IntrospectionQueryBuilder;
import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.client.Invocation.Builder;
import jakarta.ws.rs.core.GenericType;
import jakarta.ws.rs.core.MediaType;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Query;
import mil.dds.anet.utils.Utils;
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class GraphQlResourceTest extends AbstractResourceTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Test
  void testIntrospection() {
    // With oneOf=true (the default), the graphql-java-generator throws an exception
    final IntrospectionQueryBuilder.Options introspectionOptions =
        IntrospectionQueryBuilder.Options.defaultOptions().isOneOf(false);
    final String introspectionQuery = IntrospectionQueryBuilder.build(introspectionOptions);

    // only admin can do introspection query
    try {
      final Query resp = withCredentials(adminUser, t -> queryExecutor.exec(introspectionQuery));
      assertThat(resp).isNotNull(); // we could check a million things here
    } catch (Exception e) {
      fail("Unexpected Exception", e);
    }
    try {
      withCredentials(getSuperuser().getDomainUsername(),
          t -> queryExecutor.exec(introspectionQuery));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
    try {
      withCredentials(getRegularUser().getDomainUsername(),
          t -> queryExecutor.exec(introspectionQuery));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void testGraphQlFiles() {
    final Person jack = withCredentials(jackUser,
        t -> queryExecutor.me("{ uuid attendedReports { list { uuid } } }"));
    final Person steve = getSteveSteveson();
    final File testDir = new File(GraphQlResourceTest.class.getResource("/graphQLTests").getFile());
    assertThat(testDir.getAbsolutePath()).isNotNull();
    assertThat(testDir).isDirectory();

    Map<String, Object> variables = new HashMap<>();
    variables.put("personUuid", jack.getUuid());
    variables.put("positionUuid", steve.getPosition().getUuid());
    variables.put("orgUuid", steve.getPosition().getOrganization().getUuid());
    variables.put("taskUuid", "7b2ad5c3-018b-48f5-b679-61fbbda21693"); // 1.1.A
    variables.put("searchQuery", "hospital");
    variables.put("reportUuid", jack.getAttendedReports().getList().get(0).getUuid());
    variables.put("pageNum", 0);
    variables.put("pageSize", 10);
    variables.put("maxResults", 6);
    logger.info("Using variables {}", variables);

    final File[] fileList = testDir.listFiles();
    assertThat(fileList).isNotNull();
    for (final File f : fileList) {
      if (f.isFile()) {
        try (final FileInputStream input = new FileInputStream(f)) {
          String raw = IOUtils.toString(input, StandardCharsets.UTF_8);
          final Map<String, Object> query = new HashMap<>();
          for (final Map.Entry<String, Object> entry : variables.entrySet()) {
            raw = raw.replace("${" + entry.getKey() + "}", entry.getValue().toString());
          }
          query.put("query", "query { " + raw + "}");
          query.put("variables", ImmutableMap.of());
          logger.info("Processing file {}", f);

          // Test POST request
          final Map<String, Object> respPost =
              httpQuery(null, admin).post(Entity.json(query), new GenericType<>() {});
          doAsserts(f, respPost);

          // Test GET request
          final Map<String, Object> respGet =
              httpQuery("query=" + URLEncoder.encode("{" + raw + "}", StandardCharsets.UTF_8),
                  admin).get(new GenericType<>() {});
          doAsserts(f, respGet);

          // POST and GET responses should be equal
          assertThat(respPost.get("data")).isEqualTo(respGet.get("data"));

          // Test GET request over XML
          final String respGetXml = httpQuery(
              "output=xml&query=" + URLEncoder.encode("{" + raw + "}", StandardCharsets.UTF_8),
              admin).get(new GenericType<>() {});
          assertThat(respGetXml).isNotNull();
          int len = respGetXml.length();
          assertThat(len).isPositive();
          assertThat(respGetXml.substring(0, 1)).isEqualTo("<");
          String xmlHeader = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>";
          assertThat(respGetXml.substring(0, xmlHeader.length())).isEqualTo(xmlHeader);
          assertThat(respGetXml.substring(len - 2, len)).isEqualTo(">\n");

          // Test POST request over XML
          query.put("output", "xml");
          final String respPostXml =
              httpQuery(null, admin).post(Entity.json(query), new GenericType<>() {});

          // POST and GET responses over XML should be equal
          assertThat(respPostXml).isEqualTo(respGetXml);

          // Test GET request over XLSX
          // Note: getting the resulting XLSX as String is a quick & easy hack
          final String respGetXlsx = httpQuery(
              "output=xlsx&query=" + URLEncoder.encode("{" + raw + "}", StandardCharsets.UTF_8),
              admin).get(new GenericType<>() {});
          assertThat(respGetXlsx).isNotNull();
          assertThat(respGetXlsx).isNotEmpty();

          // Test POST request over XLSX
          query.put("output", "xlsx");
          final String respPostXlsx =
              httpQuery(null, admin).post(Entity.json(query), new GenericType<>() {});
          assertThat(respPostXlsx).isNotNull();
          assertThat(respPostXlsx).isNotEmpty();
          // Note: can't compare respGetXlsx and respPostXlsx directly, as they will be different,
          // unfortunately
        } catch (IOException e) {
          fail("Unable to read file ", e);
        }
      }
    }
  }

  private void doAsserts(File f, Map<String, Object> resp) {
    assertThat(resp).isNotNull();
    assertThat(resp.containsKey("errors"))
        .as("Has Errors on %s : %s, %s", f.getName(), resp.get("errors"), resp.values().toString())
        .isFalse();
    assertThat(resp.containsKey("data")).as("Missing Data on " + f.getName(), resp).isTrue();
  }

  /*
   * Helper method to build httpQuery with authentication and Accept headers.
   */
  private Builder httpQuery(String query, Person authUser) {
    final String authString = Base64.getEncoder().encodeToString(
        (authUser.getDomainUsername() + ":" + authUser.getDomainUsername()).getBytes());
    final StringBuilder url = new StringBuilder(graphqlEndpoint);
    if (!Utils.isEmptyOrNull(query)) {
      url.append("?");
      url.append(query);
    }
    return testClient.target(url.toString()).request()
        .header("Authorization", "Basic " + authString)
        .header("Accept", MediaType.APPLICATION_JSON_TYPE.toString());
  }

}
