package mil.dds.anet.beans.recentActivity;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Comparator;
import java.util.Objects;
import mil.dds.anet.beans.Person;

public class RecentUserActivity implements Comparable<RecentUserActivity> {

  private static final Comparator<RecentUserActivity> COMPARATOR = Comparator
      .comparing(RecentUserActivity::getActivity).thenComparing(RecentUserActivity::getUser);
  @GraphQLQuery
  private Person user;
  @GraphQLQuery
  private Activity activity;

  public RecentUserActivity() {}

  public RecentUserActivity(Person user, Activity activity) {
    this.user = user;
    this.activity = activity;
  }

  public Person getUser() {
    return user;
  }

  public void setUser(Person user) {
    this.user = user;
  }

  public Activity getActivity() {
    return activity;
  }

  public void setActivity(Activity activity) {
    this.activity = activity;
  }

  @Override
  public int compareTo(RecentUserActivity o) {
    // Used by Collections.sort() in AdminResource::userActivities
    return COMPARATOR.compare(this, o);
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof RecentUserActivity)) {
      return false;
    }
    final RecentUserActivity other = (RecentUserActivity) o;
    return Objects.equals(user, other.getUser()) && Objects.equals(activity, other.getActivity());
  }

  @Override
  public int hashCode() {
    return Objects.hash(user, activity);
  }

}
