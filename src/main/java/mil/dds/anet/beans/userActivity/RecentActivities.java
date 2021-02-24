package mil.dds.anet.beans.userActivity;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.List;

public class RecentActivities {
  @GraphQLQuery
  private List<UserActivity> byActivity;
  @GraphQLQuery
  private List<UserActivity> byUser;

  public RecentActivities() {}

  public RecentActivities(List<UserActivity> byActivity, List<UserActivity> byUser) {
    this.byActivity = byActivity;
    this.byUser = byUser;
  }

  public List<UserActivity> getByActivity() {
    return byActivity;
  }

  public void setByActivity(List<UserActivity> byActivity) {
    this.byActivity = byActivity;
  }

  public List<UserActivity> getByUser() {
    return byUser;
  }

  public void setByUser(List<UserActivity> byUser) {
    this.byUser = byUser;
  }
}
