package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import mil.dds.anet.beans.mart.MartImportedReport;

public class MartImportedReportSearchQuery {
  @GraphQLQuery
  @GraphQLInputField
  String personUuid;
  @GraphQLQuery
  @GraphQLInputField
  String reportUuid;
  @GraphQLQuery
  @GraphQLInputField
  MartImportedReport.State state;
  @GraphQLQuery
  @GraphQLInputField
  String sortBy;
  @GraphQLQuery
  @GraphQLInputField
  String sortOrder;
  @GraphQLQuery
  @GraphQLInputField
  Integer pageSize;
  @GraphQLQuery
  @GraphQLInputField
  Integer pageNum;

  public MartImportedReportSearchQuery() {
    this.setPageNum(0);
    this.setPageSize(0);
    this.setSortBy("receivedAt");
    this.setSortOrder("DESC");
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

  public String getSortBy() {
    return sortBy;
  }

  public void setSortBy(String sortBy) {
    this.sortBy = sortBy;
  }

  public String getSortOrder() {
    return sortOrder;
  }

  public void setSortOrder(String sortOrder) {
    this.sortOrder = sortOrder;
  }

  public Integer getPageSize() {
    return pageSize;
  }

  public void setPageSize(Integer pageSize) {
    this.pageSize = pageSize;
  }

  public Integer getPageNum() {
    return pageNum;
  }

  public void setPageNum(Integer pageNum) {
    this.pageNum = pageNum;
  }
}
