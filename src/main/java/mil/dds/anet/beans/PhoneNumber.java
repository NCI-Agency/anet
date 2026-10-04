package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;
import mil.dds.anet.utils.Utils;

public class PhoneNumber {

  @GraphQLQuery
  @GraphQLInputField
  private String type;
  @GraphQLQuery
  @GraphQLInputField
  private String details;

  public PhoneNumber() {}

  public PhoneNumber(final String type, final String details) {
    this.type = Utils.trimStringReturnNull(type);
    this.details = Utils.trimStringReturnNull(details);
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = Utils.trimStringReturnNull(type);
  }

  public String getDetails() {
    return details;
  }

  public void setDetails(String details) {
    this.details = Utils.trimStringReturnNull(details);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof PhoneNumber that)) {
      return false;
    }
    return Objects.equals(type, that.type) && Objects.equals(details, that.details);
  }

  @Override
  public int hashCode() {
    return Objects.hash(type, details);
  }
}
