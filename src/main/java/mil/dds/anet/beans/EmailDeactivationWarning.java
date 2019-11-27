package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLIgnore;
import java.time.Instant;
import java.util.Objects;
import mil.dds.anet.views.AbstractAnetBean;

@GraphQLIgnore
public class EmailDeactivationWarning extends AbstractAnetBean {

  private String personUuid;
  private Instant sentAt;


  public String getPersonUuid() {
    return personUuid;
  }

  public void setPersonUuid(final String personUuid) {
    this.personUuid = personUuid;
  }

  public Instant getSentAt() {
    return sentAt;
  }

  public void setSentAt(final Instant sentAt) {
    this.sentAt = sentAt;
  }

  @Override
  public boolean equals(final Object o) {
    if (!(o instanceof EmailDeactivationWarning)) {
      return false;
    }

    final EmailDeactivationWarning c = (EmailDeactivationWarning) o;
    return Objects.equals(c.getPersonUuid(), getPersonUuid())
        && Objects.equals(c.getSentAt(), sentAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(personUuid, sentAt);
  }

  @Override
  public String toString() {
    return String.format("[PersonUuid:%s;SentAt:%s]", getPersonUuid(), getSentAt());
  }
}
