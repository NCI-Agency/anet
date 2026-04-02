package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;

public class AuthorizationGroupRelatedObject extends GenericRelatedObject {

  @GraphQLQuery
  @GraphQLInputField
  private Double priority;

  public Double getPriority() {
    return priority;
  }

  public void setPriority(Double priority) {
    this.priority = priority;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (!(o instanceof AuthorizationGroupRelatedObject that))
      return false;
    if (!super.equals(o))
      return false;
    return Objects.equals(priority, that.priority);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), priority);
  }
}
