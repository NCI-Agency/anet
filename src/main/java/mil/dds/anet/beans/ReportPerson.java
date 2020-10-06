package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;

public class ReportPerson extends Person {

  @GraphQLQuery
  @GraphQLInputField
  boolean primary;
  @GraphQLQuery
  @GraphQLInputField
  boolean author;

  public ReportPerson() {
    this.primary = false; // Default
    this.author = false;
  }

  public boolean isPrimary() {
    return primary;
  }

  public void setPrimary(boolean primary) {
    this.primary = primary;
  }

  public boolean isAuthor() {
    return author;
  }

  public void setAuthor(boolean author) {
    this.author = author;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof ReportPerson)) {
      return false;
    }
    ReportPerson rp = (ReportPerson) o;
    return super.equals(o) && Objects.equals(rp.isPrimary(), primary)
        && Objects.equals(rp.isAuthor(), author);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), primary, author);
  }

}
