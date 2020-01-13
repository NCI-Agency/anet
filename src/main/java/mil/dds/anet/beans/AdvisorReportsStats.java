package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;

public class AdvisorReportsStats {

  @GraphQLQuery
  @GraphQLInputField
  int week;
  @GraphQLQuery
  @GraphQLInputField
  int nrReportsSubmitted;
  @GraphQLQuery
  @GraphQLInputField
  int nrEngagementsAttended;

  public int getWeek() {
    return week;
  }

  public void setWeek(int week) {
    this.week = week;
  }

  public int getNrReportsSubmitted() {
    return nrReportsSubmitted;
  }

  public void setNrReportsSubmitted(int nrReportsSubmitted) {
    this.nrReportsSubmitted = nrReportsSubmitted;
  }

  public int getNrEngagementsAttended() {
    return nrEngagementsAttended;
  }

  public void setNrEngagementsAttended(int nrEngagementsAttended) {
    this.nrEngagementsAttended = nrEngagementsAttended;
  }
}
