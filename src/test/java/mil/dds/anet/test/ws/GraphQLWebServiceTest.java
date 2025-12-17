package mil.dds.anet.test.ws;

import static mil.dds.anet.test.ws.security.BearerToken.VALID_GRAPHQL_TOKEN;
import static mil.dds.anet.test.ws.security.BearerToken.VALID_NVG_TOKEN;
import static org.assertj.core.api.Assertions.assertThat;

import graphql.introspection.IntrospectionQueryBuilder;
import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.ws.GraphQLWebService;
import mil.dds.anet.ws.security.AccessTokenAuthentication;
import mil.dds.anet.ws.security.BearerTokenService;
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
  public static final Map<String, Object> REPORT_QUERY_VARIABLES = Map.of("uuid", REPORT_UUID);

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

  @Test
  void testWithValidToken() {
    setAuthentication(VALID_GRAPHQL_TOKEN);
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

  private AccessTokenAuthentication createAccessTokenAuthentication(String bearerToken) {
    var accessToken = bearerTokenService.getAccessPrincipalFromAuthHeader(bearerToken);
    assertThat(accessToken.isEmpty()).isFalse();
    return new AccessTokenAuthentication(accessToken.get());
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
    setAuthentication(VALID_GRAPHQL_TOKEN);
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

  private Map<String, Object> sendGraphQLRequest(String query, Map<String, Object> variables,
      String value) {
    setAuthentication(VALID_GRAPHQL_TOKEN);

    final GraphQLRequest graphQLRequest = new GraphQLRequest(null, query, null, variables);

    final ResponseEntity<Map<String, Object>> result =
        graphQLWebService.graphqlPostJson(graphQLRequest);

    assertThat(result).isNotNull();

    @SuppressWarnings("unchecked")
    final Map<String, Object> data =
        (Map<String, Object>) Objects.requireNonNull(result.getBody()).get("data");
    final ObjectMapper defaultMapper = MapperUtils.getDefaultMapper();
    return defaultMapper.convertValue(data.get(value), new TypeReference<>() {});
  }
}
