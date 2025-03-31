package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.ReportSearchSortBy;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.resources.GraphQLWebServiceResource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

public class GraphQLWebServiceResourceTest extends AbstractResourceTest {

  private static final Map<String, Object> DEFAULT_QUERY_VARIABLES = Map.of( // -
      "status", "ACTIVE", // -
      "pageSize", 10, // -
      "pageNum", 0, "sortBy", ReportSearchSortBy.ENGAGEMENT_DATE, // -
      "sortOrder", ISearchQuery.SortOrder.DESC);

  private static final String REPORT_QUERY = "query ($reportQuery: ReportSearchQueryInput) {" // -
      + " reportList(query: $reportQuery) {" // -
      + " totalCount list {" // -
      + " uuid intent engagementDate duration keyOutcomes nextSteps classification" // -
      + " primaryAdvisor { uuid name rank }" // -
      + " primaryInterlocutor { uuid name rank }" // -
      + " advisorOrg { uuid shortName longName identificationCode }" // -
      + " interlocutorOrg { uuid shortName longName identificationCode }" // -
      + " location { uuid name lat lng type }" // -
      + " } } }";

  @Autowired
  private GraphQLWebServiceResource graphQLWebServiceResource;

  @Test
  void testGraphQLWebServiceResource() {
    final Map<String, Object> reportQuery = new HashMap<>(DEFAULT_QUERY_VARIABLES);
    final GraphQLRequest graphQLRequest = new GraphQLRequest("graphqlWebService", REPORT_QUERY,
        null, Map.of("reportQuery", reportQuery));
    // Test with wrong token
    try {
      graphQLWebServiceResource.graphqlPostJson(graphQLRequest, "bogus");
    } catch (Exception expectedException) {
      assertThat(expectedException)
          .hasMessage("403 FORBIDDEN \"Must provide a valid Web Service Access Token\"");
    }
    // Test with valid token
    ResponseEntity<Map<String, Object>> result = graphQLWebServiceResource
        .graphqlPostJson(graphQLRequest, "Bearer W+Cs0C6uagyXhcfKOkO8TOGSHRY6ZNXf");
    assertThat(result).isNotNull();
    @SuppressWarnings("unchecked")
    final Map<String, Object> data =
        (Map<String, Object>) Objects.requireNonNull(result.getBody()).get("data");
    final TypeReference<AnetBeanList<Report>> typeRef = new TypeReference<>() {};
    final ObjectMapper defaultMapper = MapperUtils.getDefaultMapper();
    final AnetBeanList<Report> anetBeanList =
        defaultMapper.convertValue(data.get("reportList"), typeRef);
    assertThat(anetBeanList.getList().stream()
        .anyMatch(report -> report.getIntent().equals("A test report from Arthur"))).isTrue();
  }
}
