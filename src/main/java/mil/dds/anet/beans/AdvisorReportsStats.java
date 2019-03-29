package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLQuery;

public class AdvisorReportsStats {

  int week;
  int nrReportsSubmitted;
  int nrEngagementsAttended;


  @GraphQLQuery(name = "week")
  public int getWeek() {
    return week;
  }

  public void setWeek(int week) {
    this.week = week;
  }

  @GraphQLQuery(name = "nrReportsSubmitted")
  public int getNrReportsSubmitted() {
    return nrReportsSubmitted;
  }

  public void setNrReportsSubmitted(int nrReportsSubmitted) {
    this.nrReportsSubmitted = nrReportsSubmitted;
  }

  @GraphQLQuery(name = "nrEngagementsAttended")
  public int getNrEngagementsAttended() {
    return nrEngagementsAttended;
  }

  public void setNrEngagementsAttended(int nrEngagementsAttended) {
    this.nrEngagementsAttended = nrEngagementsAttended;
  }
}
