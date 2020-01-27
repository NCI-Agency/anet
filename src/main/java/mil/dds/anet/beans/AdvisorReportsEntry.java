package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.List;

public class AdvisorReportsEntry {

  @GraphQLQuery
  @GraphQLInputField
  String uuid;
  @GraphQLQuery
  @GraphQLInputField
  String name;
  @GraphQLQuery
  @GraphQLInputField
  List<AdvisorReportsStats> stats;

  public String getUuid() {
    return uuid;
  }

  public void setUuid(String uuid) {
    this.uuid = uuid;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public List<AdvisorReportsStats> getStats() {
    return stats;
  }

  public void setStats(List<AdvisorReportsStats> stats) {
    this.stats = stats;
  }

}
