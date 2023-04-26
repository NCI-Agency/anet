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
  @GraphQLQuery
  @GraphQLInputField
  boolean attendee;
  @GraphQLQuery
  @GraphQLInputField
  boolean interlocutor;

  public ReportPerson() {
    this.primary = false; // Default
    this.author = false;
    this.attendee = true;
    this.interlocutor = true;
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

  public boolean isAttendee() {
    return attendee;
  }

  public void setAttendee(boolean attendee) {
    this.attendee = attendee;
  }

  public boolean isInterlocutor() {
    return interlocutor;
  }

  public void setInterlocutor(boolean interlocutor) {
    this.interlocutor = interlocutor;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof ReportPerson)) {
      return false;
    }
    ReportPerson rp = (ReportPerson) o;
    return super.equals(o) && Objects.equals(rp.isPrimary(), primary)
        && Objects.equals(rp.isAuthor(), author) && Objects.equals(rp.isAttendee(), attendee)
        && Objects.equals(rp.isInterlocutor(), interlocutor);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), primary, author, attendee, interlocutor);
  }

}
