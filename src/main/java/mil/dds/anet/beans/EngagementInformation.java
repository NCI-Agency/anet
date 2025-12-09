package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import mil.dds.anet.views.AbstractAnetBean;

public class EngagementInformation extends AbstractAnetBean {

  @GraphQLQuery
  @GraphQLInputField
  String reportUuid;

  @GraphQLQuery
  @GraphQLInputField
  Instant engagementDate;

  @GraphQLQuery
  @GraphQLInputField
  GenericRelatedObject advisor;

  @GraphQLQuery
  @GraphQLInputField
  GenericRelatedObject interlocutor;

  public Instant getEngagementDate() {
    return engagementDate;
  }

  public void setEngagementDate(Instant engagementDate) {
    this.engagementDate = engagementDate;
  }

  public GenericRelatedObject getAdvisor() {
    return advisor;
  }

  public void setAdvisor(GenericRelatedObject advisor) {
    this.advisor = advisor;
  }

  public GenericRelatedObject getInterlocutor() {
    return interlocutor;
  }

  public void setInterlocutor(GenericRelatedObject interlocutor) {
    this.interlocutor = interlocutor;
  }

  public String getReportUuid() {
    return reportUuid;
  }

  public void setReportUuid(String reportUuid) {
    this.reportUuid = reportUuid;
  }
}
