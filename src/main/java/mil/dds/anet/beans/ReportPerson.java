package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;

public class ReportPerson extends Person {

  boolean primary;

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

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof ReportPerson)) {
      return false;
    }
    ReportPerson rp = (ReportPerson) o;
    return super.equals(o) && Objects.equals(rp.isPrimary(), primary);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), primary);
  }

}
