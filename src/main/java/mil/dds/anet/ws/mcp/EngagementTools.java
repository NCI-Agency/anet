package mil.dds.anet.ws.mcp;

import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import java.lang.invoke.MethodHandles;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.ReportSearchSortBy;
import mil.dds.anet.resources.GraphQLResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

@Component
public class EngagementTools {

  private final GraphQLResource graphQLAccessService;
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String REPORT_QUERY = """
      query ($reportQuery: ReportSearchQueryInput) {
        reportList(query: $reportQuery) {
          pageNum
              pageSize
          totalCount
          list {
            uuid
                intent
            engagementDate
                duration
            keyOutcomes
                nextSteps
            cancelledReason
                atmosphere
            atmosphereDetails
                state
            reportText
            primaryAdvisor {
              uuid
                  name
              rank
              entityAvatar {
                attachmentUuid
                    applyCrop
                cropLeft
                    cropTop
                cropWidth
                    cropHeight
                __typename
              }
              __typename
            }
            primaryInterlocutor {
              uuid
                  name
              rank
              entityAvatar {
                attachmentUuid
                    applyCrop
                cropLeft
                    cropTop
                cropWidth
                    cropHeight
                __typename
              }
              __typename
            }
            advisorOrg {
              uuid
                  shortName
              longName
                  identificationCode
              entityAvatar {
                attachmentUuid
                    applyCrop
                cropLeft
                    cropTop
                cropWidth
                    cropHeight
                __typename
              }
              __typename
            }
            interlocutorOrg {
              uuid
                  shortName
              longName
                  identificationCode
              entityAvatar {
                attachmentUuid
                    applyCrop
                cropLeft
                    cropTop
                cropWidth
                    cropHeight
                __typename
              }
              __typename
            }
            location {
              uuid
                  name
              lat
                  lng
              type
              entityAvatar {
                attachmentUuid
                    applyCrop
                cropLeft
                    cropTop
                cropWidth
                    cropHeight
                __typename
              }
              __typename
            }
            tasks {
              uuid
                  shortName
              parentTask {
                uuid
                    shortName
                __typename
              }
              ascendantTasks {
                uuid
                    shortName
                parentTask {
                  uuid
                      __typename
                }
                __typename
              }
              __typename
            }
            workflow {
              type
                  createdAt
              step {
                uuid
                    name
                approvers {
                  uuid
                      name
                  person {
                    uuid
                        name
                    rank
                    entityAvatar {
                      attachmentUuid
                          applyCrop
                      cropLeft
                          cropTop
                      cropWidth
                          cropHeight
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
                __typename
              }
              person {
                uuid
                    name
                rank
                entityAvatar {
                  attachmentUuid
                      applyCrop
                  cropLeft
                      cropTop
                  cropWidth
                      cropHeight
                  __typename
                }
                __typename
              }
              __typename
            }
            updatedAt
            attachments {
              uuid
                  __typename
            }
            __typename
          }
          __typename
        }
      }
      """;


  private static final Map<String, Object> DEFAULT_REPORT_QUERY_VARIABLES = Map.of( // -
      "state", new Report.ReportState[] {Report.ReportState.APPROVED, Report.ReportState.PUBLISHED}, // -
      "pageSize", 0, // -
      "sortBy", ReportSearchSortBy.ENGAGEMENT_DATE, // -
      "sortOrder", ISearchQuery.SortOrder.DESC);

  public static String McpOperationId = "MCP";

  public EngagementTools(GraphQLResource graphQLAccessService) {
    logger.info("Constructing engagement tools");
    this.graphQLAccessService = graphQLAccessService;
  }


  @McpTool(name = "query_engagement_reports",
      description = "Get an ordered list (most recent first) of engagement reports, matching keywords provided in the search query")
  public List<Map<String, Object>> queryEngagementReports(@McpToolParam(
      description = "database keyword search query", required = false) String reportQueryText) {

    logger.info("MCP request: get_reports(query={})", reportQueryText);

    final Map<String, Object> variables = new HashMap<>(DEFAULT_REPORT_QUERY_VARIABLES);
    if (reportQueryText != null && !reportQueryText.isEmpty()) {
      variables.put("text", reportQueryText);
    }

    final GraphQLRequest request =
        new GraphQLRequest(McpOperationId, REPORT_QUERY, null, Map.of("reportQuery", variables));
    Map<String, Object> result = this.graphQLAccessService.graphql(request, null);

    // Extract the report list from the GraphQL response
    Map<String, Object> data = (Map<String, Object>) result.get("data");
    if (data == null) {
      logger.warn("GraphQL returned no data");
      return List.of();
    }

    Map<String, Object> reportList = (Map<String, Object>) data.get("reportList");
    if (reportList == null) {
      logger.warn("GraphQL returned no reportList");
      return List.of();
    }

    List<Map<String, Object>> list = (List<Map<String, Object>>) reportList.get("list");
    logger.info("Fetched {} engagement reports", list != null ? list.size() : 0);
    return list != null ? list : List.of();

  }

}
