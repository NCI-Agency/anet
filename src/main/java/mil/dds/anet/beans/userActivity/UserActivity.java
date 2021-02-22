package mil.dds.anet.beans.userActivity;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Comparator;
import java.util.Objects;
import mil.dds.anet.beans.Person;

public class UserActivity implements Comparable<UserActivity> {

  private static final Comparator<UserActivity> COMPARATOR =
      Comparator.comparing(UserActivity::getActivity).thenComparing(UserActivity::getUser);

  @GraphQLQuery
  private Person user;
  @GraphQLQuery
  private Activity activity;

  public UserActivity() {}

  public UserActivity(Person user, Activity activity) {
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
  public int compareTo(UserActivity o) {
    // Used by Collections.sort() in AdminResource::userActivities
    return COMPARATOR.compare(this, o);
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Activity)) {
      return false;
    }
    final UserActivity other = (UserActivity) o;
    return Objects.equals(user, other.getUser()) && Objects.equals(activity, other.getActivity());
  }

  @Override
  public int hashCode() {
    return Objects.hash(user, activity);
  }

}
