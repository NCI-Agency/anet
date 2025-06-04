package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.List;
import mil.dds.anet.beans.mart.MartImportedReport;

public class MartImportedReportSearchQuery
    extends AbstractSearchQuery<MartImportedReportSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private String personUuid;
  @GraphQLQuery
  @GraphQLInputField
  private String reportUuid;
  @GraphQLQuery
  @GraphQLInputField
  private MartImportedReport.State state;
  @GraphQLQuery
  @GraphQLInputField
  private List<Long> sequences;

  public MartImportedReportSearchQuery() {
    super(MartImportedReportSearchSortBy.RECEIVED_AT);
    this.setSortOrder(SortOrder.DESC);
    this.setPageSize(0);
  }

  public String getPersonUuid() {
    return personUuid;
  }

  public void setPersonUuid(String personUuid) {
    this.personUuid = personUuid;
  }

  public String getReportUuid() {
    return reportUuid;
  }

  public void setReportUuid(String reportUuid) {
    this.reportUuid = reportUuid;
  }

  public MartImportedReport.State getState() {
    return state;
  }

  public void setState(MartImportedReport.State state) {
    this.state = state;
  }

  public List<Long> getSequences() {
    return sequences;
  }

  public void setSequences(List<Long> sequences) {
    this.sequences = sequences;
  }

}
