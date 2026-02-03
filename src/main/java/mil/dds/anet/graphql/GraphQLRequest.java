package mil.dds.anet.graphql;

import java.util.Collections;
import java.util.Map;

public record GraphQLRequest(String id, String query, String operationName,
    Map<String, Object> variables) {

  public GraphQLRequest(String id, String query, String operationName,
      Map<String, Object> variables) {
    this.id = id;
    this.query = query;
    this.operationName = operationName;
    this.variables = variables != null ? variables : Collections.emptyMap();
  }

}
