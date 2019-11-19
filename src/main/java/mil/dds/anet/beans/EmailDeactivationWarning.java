package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import java.time.Instant;
import java.util.Objects;
import mil.dds.anet.views.AbstractAnetBean;

public class EmailDeactivationWarning extends AbstractAnetBean {

  private ForeignObjectHolder<Person> person = new ForeignObjectHolder<>();
  private Instant sentAt;

  @JsonIgnore
  @GraphQLIgnore
  public Person getPerson() {
    return person.getForeignObject();
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setPerson(final String personUuid) {
    this.person = new ForeignObjectHolder<>(personUuid);
  }

  @GraphQLIgnore
  public String getPersonUuid() {
    return person.getForeignUuid();
  }

  public void setPersonUuid(final String personUuid) {
    this.person = new ForeignObjectHolder<>(personUuid);
  }

  @GraphQLIgnore
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
    return Objects.equals(c.getUuid(), uuid) && Objects.equals(c.getPersonUuid(), getPersonUuid())
        && Objects.equals(c.getSentAt(), sentAt) && Objects.equals(c.getUpdatedAt(), updatedAt)
        && Objects.equals(c.getCreatedAt(), createdAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, person, sentAt);
  }

  @Override
  public String toString() {
    return String.format("[%s] - [Person:%s,SentAt:%d]", uuid, getPersonUuid(), sentAt);
  }
}
