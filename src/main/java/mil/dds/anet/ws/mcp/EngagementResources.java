package mil.dds.anet.ws.mcp;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import io.modelcontextprotocol.spec.McpSchema;
import java.lang.invoke.MethodHandles;
import java.util.Map;
import mil.dds.anet.resources.GraphQLResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springaicommunity.mcp.annotation.McpResource;
import org.springframework.stereotype.Component;

@Component
public class EngagementResources {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String FETCH_REPORT_QUERY = """
      query ($uuid: String!) {
        report(uuid: $uuid) {
          uuid
          intent
          classification
          engagementDate
          duration
          atmosphere
          atmosphereDetails
          keyOutcomes
          reportText
          nextSteps
          cancelledReason
          releasedAt
          state
          isSubscribed
          updatedAt
          location { uuid name lat lng __typename }
          authors { uuid name rank __typename }
          primaryAdvisor { uuid __typename }
          primaryInterlocutor { uuid __typename }
          tasks { uuid shortName longName __typename }
          interlocutorOrg { uuid shortName longName identificationCode __typename }
          advisorOrg { uuid shortName longName identificationCode __typename }
          comments { uuid text createdAt author { uuid name } __typename }
          __typename
        }
      }
      """;

  private final GraphQLResource graphQLResource;
  private final ObjectMapper objectMapper;

  public EngagementResources(GraphQLResource graphQLResource, ObjectMapper objectMapper) {
    logger.info("Constructing EngagementResources");
    this.graphQLResource = graphQLResource;
    this.objectMapper = objectMapper;
  }

  /**
   * Retrieves an engagement report by UUID and exposes it as an MCP resource.
   */
  @McpResource(name = "report", description = "Access stored engagement reports by UUID",
      mimeType = "application/json", uri = "anet:report:{uuid}")
  public McpSchema.ResourceContents getReport(String uuid) {
    logger.info("MCP/resources anet:report:{}", uuid);

    try {
      GraphQLRequest request = new GraphQLRequest(EngagementTools.McpOperationId,
          FETCH_REPORT_QUERY, null, Map.of("uuid", uuid));
      var result = graphQLResource.graphql(request, null);

      Map<String, Object> data = castToMap(result.get("data"));
      if (data == null || !data.containsKey("report")) {
        logger.warn("No engagement report found for uuid={}", uuid);
        return null;
      }

      String json = objectMapper.writeValueAsString(data.get("report"));
      return new McpSchema.TextResourceContents("anet:report:" + uuid, "application/json", json);

    } catch (JsonProcessingException e) {
      logger.error("Failed to serialize report for uuid={}", uuid, e);
      throw new RuntimeException("Serialization error", e);
    } catch (Exception e) {
      logger.error("Error retrieving engagement report for uuid={}", uuid, e);
      throw new RuntimeException("Failed to retrieve engagement report", e);
    }
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> castToMap(Object value) {
    return (value instanceof Map<?, ?> map) ? (Map<String, Object>) map : null;
  }
}
