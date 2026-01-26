package mil.dds.anet.test.ws;

import static mil.dds.anet.test.ws.security.BearerToken.VALID_GRAPHQL_TOKEN;
import static mil.dds.anet.test.ws.security.BearerToken.VALID_NVG_TOKEN;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import graphql.introspection.IntrospectionQueryBuilder;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.graphql.GraphQLRequest;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.ws.GraphQLWebService;
import mil.dds.anet.ws.security.AccessTokenAuthentication;
import mil.dds.anet.ws.security.BearerTokenService;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

class GraphQLWebServiceTest extends AbstractResourceTest {

  private static final String REPORT_QUERY = // -
      "query ($uuid: String!) {" + // -
          " report(uuid: $uuid)  {" // -
          + " uuid intent engagementDate duration keyOutcomes nextSteps classification" // -
          + " primaryAdvisor { uuid name rank }" // -
          + " primaryInterlocutor { uuid name rank }" // -
          + " advisorOrg { uuid shortName longName identificationCode }" // -
          + " interlocutorOrg { uuid shortName longName identificationCode }" // -
          + " location { uuid name lat lng type }" // -
          + " reportSensitiveInformation { uuid text }" // -
          + " } }";
  // Report "Look for Budget Controls", contains reportSensitiveInformation
  private static final String REPORT_UUID = "a766b3f1-4705-43c1-b62a-ca4e3bb4dce3";
  private static final Map<String, Object> REPORT_QUERY_VARIABLES = Map.of("uuid", REPORT_UUID);

  private final ObjectMapper defaultMapper = MapperUtils.getDefaultMapper();

  @Autowired
  private GraphQLWebService graphQLWebService;

  @Autowired
  private BearerTokenService bearerTokenService;

  @AfterEach
  void clearSecurity() {
    SecurityContextHolder.clearContext();
  }

  private void setAuthentication(String bearerToken) {
    var accessTokenAuthentication = createAccessTokenAuthentication(bearerToken);
    SecurityContextHolder.getContext().setAuthentication(accessTokenAuthentication);
  }

  private AccessTokenAuthentication createAccessTokenAuthentication(String bearerToken) {
    var accessToken = bearerTokenService.getAccessPrincipalFromAuthHeader(bearerToken);
    assertThat(accessToken).isPresent();
    return new AccessTokenAuthentication(accessToken.get());
  }

  @Test
  void testWithValidToken() {
    final Map<String, Object> report =
        sendGraphQLRequest(REPORT_QUERY, REPORT_QUERY_VARIABLES, "report");
    assertThat(report).isNotNull().containsEntry("uuid", REPORT_UUID)
        .containsEntry("reportSensitiveInformation", null);
  }

  @Test
  void testSensitiveInformation() {
    final String personQuery = // -
        "query ($uuid: String!) {" // -
            + " person(uuid: $uuid) {" // -
            + " uuid phoneNumber emailAddresses { network address }" // -
            + " customSensitiveInformation { uuid customFieldName customFieldValue }" // -
            + " assessments { uuid assessmentKey assessmentValues }" // -
            + " } }";
    // Rogwell, Roger; has sensitive fields, custom sensitive information and sensitive assessments
    final String uuid = "6866ce4d-1f8c-4f78-bdc2-4767e9a859b0";
    final Map<String, Object> variables = Map.of("uuid", uuid);

    final Map<String, Object> person = sendGraphQLRequest(personQuery, variables, "person");
    assertThat(person).isNotNull().containsEntry("uuid", uuid)
        // Should not be able to retrieve sensitive fields
        .containsEntry("phoneNumber", null).containsEntry("emailAddresses", null);

    // Should not be able to retrieve custom sensitive information
    @SuppressWarnings("unchecked")
    final List<Map<String, Object>> customSensitiveInformation =
        (List<Map<String, Object>>) person.get("customSensitiveInformation");
    assertThat(customSensitiveInformation).isEmpty();

    // Should be able to retrieve non-sensitive assessments
    @SuppressWarnings("unchecked")
    final List<Map<String, Object>> assessments =
        (List<Map<String, Object>>) person.get("assessments");
    assertThat(assessments).isNotEmpty();
    assertThat(assessments)
        .filteredOn(a -> "fields.regular.person.assessments.interlocutorQuarterly"
            .equals(a.get("assessmentKey")))
        .isNotEmpty();

    // Should not be able to retrieve sensitive assessments
    assertThat(assessments).filteredOn(
        a -> "fields.regular.person.assessments.interlocutorMonthly".equals(a.get("assessmentKey")))
        .isEmpty();
  }

  @Test
  void testIntrospectionWithWrongScope() {
    try {
      setAuthentication(VALID_NVG_TOKEN);
      graphQLWebService
          .graphqlPostJson(new GraphQLRequest(null, IntrospectionQueryBuilder.build(), null, null));
    } catch (Exception expectedException) {
      assertThat(expectedException).hasMessage("Access Denied");
    }
  }

  @Test
  void testIntrospectionWithValidToken() {
    setAuthentication(VALID_GRAPHQL_TOKEN);
    final ResponseEntity<Map<String, Object>> result = graphQLWebService
        .graphqlPostJson(new GraphQLRequest(null, IntrospectionQueryBuilder.build(), null, null));
    assertThat(result).isNotNull();
  }

  @Test
  void testMutation() {
    final String createReportMutation =
        "mutation ($report: ReportInput!) { createReport(report: $report) {"
            + " uuid state authors { uuid } reportSensitiveInformation { uuid text } } }";
    final Map<String, Object> variables = Map.of("report", Map.of( // -
        "reportPeople", List.of(Map.of( // -
            "uuid", "87fdbc6a-3109-4e11-9702-a894d6ca31ef", // -
            "primary", true, // -
            "author", true, // -
            "attendee", true, // -
            "interlocutor", false))));

    final Map<String, Object> report =
        sendGraphQLRequest(createReportMutation, variables, "createReport");
    assertThat(report).isNull();
  }

  @Test
  void testMcpOperations() {
    // Test the MCP operations from src/test/resources/operations
    final File testDir = new File(this.getClass().getResource("/operations").getFile());
    assertThat(testDir.getAbsolutePath()).isNotNull();
    assertThat(testDir).isDirectory();

    final File[] fileList = testDir.listFiles();
    assertThat(fileList).isNotNull();
    for (final File f : fileList) {
      if (f.isFile()) {
        try (final FileInputStream input = new FileInputStream(f)) {
          final String query = IOUtils.toString(input, StandardCharsets.UTF_8);
          final Map<String, Object> variables = getVariablesForFile(f);
          final String value = getValueForFile(f);
          if (variables != null && value != null) {
            logger.debug("Processing file={} with variables={} and value={}", f, variables, value);
            final Map<String, Object> result = sendGraphQLRequest(query, variables);
            logger.debug("Result is {}", result);
            assertThat(result).containsKey(value);
            assertThat(result.get(value)).isNotNull();
          }
        } catch (IOException e) {
          fail("Unable to read file ", e);
        }
      }
    }
  }

  private Map<String, Object> getVariablesForFile(final File f) {
    return switch (FilenameUtils.getBaseName(f.getName())) {
      case "adminSettings" -> Map.of();
      case "recentReports" -> Map.of(// -
          "startDate", Instant.now().toEpochMilli() - 864000, // 10 days ago
          "endDate", Instant.now().toEpochMilli(), // now
          "excludeTaskUuids", List.of("1145e584-4485-4ce0-89c4-2fa2e1fe846a")); // task EF 1
      case "searchReports" -> Map.of("text", "telescope");
      default -> fail(String.format("Missing test data for %s", f));
    };
  }

  private String getValueForFile(final File f) {
    return switch (FilenameUtils.getBaseName(f.getName())) {
      case "adminSettings" -> "adminSettings";
      case "recentReports", "searchReports" -> "reportList";
      default -> fail(String.format("Missing test data for %s", f));
    };
  }

  private Map<String, Object> sendGraphQLRequest(String query, Map<String, Object> variables) {
    setAuthentication(VALID_GRAPHQL_TOKEN);
    final GraphQLRequest graphQLRequest = new GraphQLRequest(null, query, null, variables);
    final ResponseEntity<Map<String, Object>> result =
        graphQLWebService.graphqlPostJson(graphQLRequest);
    assertThat(result).isNotNull();
    @SuppressWarnings("unchecked")
    final Map<String, Object> data =
        (Map<String, Object>) Objects.requireNonNull(result.getBody()).get("data");
    assertThat(data).isNotNull();
    return data;
  }

  private Map<String, Object> sendGraphQLRequest(String query, Map<String, Object> variables,
      String value) {
    return defaultMapper.convertValue(sendGraphQLRequest(query, variables).get(value),
        new TypeReference<>() {});
  }
}
