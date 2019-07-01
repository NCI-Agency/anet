package mil.dds.anet.beans;

import java.time.Instant;
import java.util.LinkedList;
import java.util.List;

import io.leangen.graphql.annotations.GraphQLIgnore;
import mil.dds.anet.emails.AnetEmailAction;

public class AnetEmail {
  private Integer id;
  private AnetEmailAction action;
  private List<String> toAddresses;
  private Instant createdAt;
  private String comment;

  @GraphQLIgnore
  public Integer getId() {
    return id;
  }

  @GraphQLIgnore
  public void setId(Integer id) {
    this.id = id;
  }

  @GraphQLIgnore
  public AnetEmailAction getAction() {
    return action;
  }

  @GraphQLIgnore
  public void setAction(AnetEmailAction action) {
    this.action = action;
  }

  public List<String> getToAddresses() {
    return toAddresses;
  }

  public void setToAddresses(List<String> toAddresses) {
    this.toAddresses = toAddresses;
  }

  public void addToAddress(String toAddress) {
    if (toAddresses == null) {
      toAddresses = new LinkedList<String>();
    }
    toAddresses.add(toAddress);
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public String getComment() {
    return comment;
  }

  public void setComment(String comment) {
    this.comment = comment;
  }
}
