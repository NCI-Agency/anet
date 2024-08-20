package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.LinkedList;
import java.util.List;
import mil.dds.anet.emails.AnetEmailAction;

public class AnetEmail {
  @GraphQLQuery
  private Integer id;
  private AnetEmailAction action;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> toAddresses;
  @GraphQLQuery
  @GraphQLInputField
  private Instant createdAt;
  @GraphQLQuery
  @GraphQLInputField
  private String comment;
  @GraphQLQuery
  private String errorMessage;

  public Integer getId() {
    return id;
  }

  public void setId(Integer id) {
    this.id = id;
  }

  public AnetEmailAction getAction() {
    return action;
  }

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
      toAddresses = new LinkedList<>();
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

  @JsonIgnore
  public String getErrorMessage() {
    return errorMessage;
  }

  public void setErrorMessage(final String errorMessage) {
    this.errorMessage = errorMessage;
  }

  @JsonIgnore
  @GraphQLQuery(name = "type")
  public String getType() {
    return action == null ? "" : action.getClass().getSimpleName();
  }
}
