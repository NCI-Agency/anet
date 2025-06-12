package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import graphql.introspection.IntrospectionQueryBuilder;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Query;
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.client.WebClient;

class GraphQlResourceTest extends AbstractResourceTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Autowired
  private WebClient webClient;

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
      withCredentials(getDomainUsername(getSuperuser()),
          t -> queryExecutor.exec(introspectionQuery));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
    try {
      withCredentials(getDomainUsername(getRegularUser()),
          t -> queryExecutor.exec(introspectionQuery));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void testGraphQlFiles() {
    final Map<String, Object> variables = getVariables();
    final File testDir = new File(GraphQlResourceTest.class.getResource("/graphQLTests").getFile());
    assertThat(testDir.getAbsolutePath()).isNotNull();
    assertThat(testDir).isDirectory();

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
          query.put("variables", Map.of());
          logger.info("Processing file {}", f);

          // Test POST request
          final Map<String, Object> respPost =
              withCredentials(adminUser, t -> webClient.post().bodyValue(query).retrieve()
                  .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {}).block());
          doAsserts(f, respPost);

          // Test POST request over XML
          query.put("output", "xml");
          final String respPostXml = withCredentials(adminUser,
              t -> webClient.post().bodyValue(query).retrieve().bodyToMono(String.class).block());
          assertThat(respPostXml).isNotNull();
          assertThat(respPostXml).isNotEmpty();

          // Test POST request over XLSX
          query.put("output", "xlsx");
          final String respPostXlsx = withCredentials(adminUser,
              t -> webClient.post().bodyValue(query).retrieve().bodyToMono(String.class).block());
          assertThat(respPostXlsx).isNotNull();
          assertThat(respPostXlsx).isNotEmpty();
        } catch (IOException e) {
          fail("Unable to read file ", e);
        }
      }
    }
  }

  private Map<String, Object> getVariables() {
    final Person jack = withCredentials(jackUser,
        t -> queryExecutor.me("{ uuid attendedReports { list { uuid } } }"));
    final Person steve = getSteveSteveson();
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
    return variables;
  }

  private void doAsserts(File f, Map<String, Object> resp) {
    assertThat(resp).isNotNull();
    assertThat(resp.containsKey("errors"))
        .as("Has Errors on %s : %s, %s", f.getName(), resp.get("errors"), resp.values().toString())
        .isFalse();
    assertThat(resp.containsKey("data")).as("Missing Data on " + f.getName(), resp).isTrue();
  }

}
