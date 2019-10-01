package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;

public class ReportPerson extends Person {

  boolean primary;
  boolean sensitive;

  public ReportPerson() {
    this.primary = false; // Default
  }

  @GraphQLQuery(name = "primary")
  public boolean isPrimary() {
    return primary;
  }

  public void setPrimary(boolean primary) {
    this.primary = primary;
  }

  @GraphQLQuery(name = "sensitive")
  public boolean isSensitive() {
    return sensitive;
  }

  public void setSensitive(boolean sensitive) {
    this.sensitive = sensitive;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof ReportPerson)) {
      return false;
    }
    ReportPerson rp = (ReportPerson) o;
    return super.equals(o) && Objects.equals(rp.isPrimary(), primary)
        && Objects.equals(rp.isSensitive(), sensitive);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), primary, sensitive);
  }

}
