package mil.dds.anet.beans.recentActivity;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.List;

public class RecentActivities {
  @GraphQLQuery
  private List<RecentUserActivity> byActivity;
  @GraphQLQuery
  private List<RecentUserActivity> byUser;

  public RecentActivities() {}

  public RecentActivities(List<RecentUserActivity> byActivity, List<RecentUserActivity> byUser) {
    this.byActivity = byActivity;
    this.byUser = byUser;
  }

  public List<RecentUserActivity> getByActivity() {
    return byActivity;
  }

  public void setByActivity(List<RecentUserActivity> byActivity) {
    this.byActivity = byActivity;
  }

  public List<RecentUserActivity> getByUser() {
    return byUser;
  }

  public void setByUser(List<RecentUserActivity> byUser) {
    this.byUser = byUser;
  }
}
