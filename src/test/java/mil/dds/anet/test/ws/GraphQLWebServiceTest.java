package mil.dds.anet.test.ws;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import graphql.introspection.IntrospectionQueryBuilder;
import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.ws.GraphQLWebService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

class GraphQLWebServiceTest extends AbstractResourceTest {

  public static final String VALID_TOKEN = "Bearer W+Cs0C6uagyXhcfKOkO8TOGSHRY6ZNXf";

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

  @ParameterizedTest
  @ValueSource(strings = { // -
      "bogus", // wrong token
      "Bearer 8ESgHLxLxh7VStAAgn9hpEIDo0CYOiGn", // expired token
      "Bearer XfayXIGGC4vKu5j9UEgAAbZYj50v88Zv" // wrong scope
  })
  void testWithWrongToken(String authHeader) {
    final GraphQLRequest graphQLRequest =
        new GraphQLRequest(null, REPORT_QUERY, null, REPORT_QUERY_VARIABLES);

    try {
      graphQLWebService.graphqlPostJson(graphQLRequest, authHeader);
    } catch (Exception expectedException) {
      assertThat(expectedException)
          .hasMessage("403 FORBIDDEN \"Must provide a valid Web Service Access Token\"");
    }
  }

  @Test
  void testWithValidToken() {
    final Map<String, Object> report =
        sendGraphQLRequest(REPORT_QUERY, REPORT_QUERY_VARIABLES, "report");
    assertThat(report).isNotNull().containsEntry("uuid", REPORT_UUID)
        // Should not be able to retrieve sensitive information
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
      graphQLWebService.graphqlPostJson(
          new GraphQLRequest(null, IntrospectionQueryBuilder.build(), null, null),
          "Bearer XfayXIGGC4vKu5j9UEgAAbZYj50v88Zv");
    } catch (Exception expectedException) {
      assertThat(expectedException)
          .hasMessage("403 FORBIDDEN \"Must provide a valid Web Service Access Token\"");
    }
  }

  @Test
  void testIntrospectionWithValidToken() {
    final ResponseEntity<Map<String, Object>> result = graphQLWebService.graphqlPostJson(
        new GraphQLRequest(null, IntrospectionQueryBuilder.build(), null, null), VALID_TOKEN);
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

  private Map<String, Object> sendGraphQLRequest(String createReportMutation,
      Map<String, Object> variables, String value) {
    final GraphQLRequest graphQLRequest =
        new GraphQLRequest(null, createReportMutation, null, variables);
    final ResponseEntity<Map<String, Object>> result =
        graphQLWebService.graphqlPostJson(graphQLRequest, VALID_TOKEN);
    assertThat(result).isNotNull();

    @SuppressWarnings("unchecked")
    final Map<String, Object> data =
        (Map<String, Object>) Objects.requireNonNull(result.getBody()).get("data");
    final ObjectMapper defaultMapper = MapperUtils.getDefaultMapper();
    return defaultMapper.convertValue(data.get(value), new TypeReference<>() {});
  }
}
