package mil.dds.anet.beans.userActivity;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.Comparator;
import java.util.Objects;

public class Activity implements Comparable<Activity> {

  private static final Comparator<Activity> COMPARATOR =
      Comparator.comparing(Activity::getTime).reversed();

  @GraphQLQuery
  private String ip;
  @GraphQLQuery
  private String request;
  @GraphQLQuery
  private Instant time;

  public Activity() {}

  public Activity(String ip, String request, Instant time) {
    this.ip = ip;
    this.request = request;
    this.time = time;
  }

  public String getIp() {
    return ip;
  }

  public void setIp(String ip) {
    this.ip = ip;
  }

  public String getRequest() {
    return request;
  }

  public void setRequest(String request) {
    this.request = request;
  }

  public Instant getTime() {
    return time;
  }

  public void setTime(Instant time) {
    this.time = time;
  }

  @Override
  public int compareTo(Activity o) {
    // Used by Collections.sort() in AdminResource::userActivities
    return COMPARATOR.compare(this, o);
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Activity)) {
      return false;
    }
    final Activity other = (Activity) o;
    return Objects.equals(ip, other.getIp()) && Objects.equals(request, other.getRequest())
        && Objects.equals(time, other.getTime());
  }

  @Override
  public int hashCode() {
    return Objects.hash(ip, request, time);
  }

}
