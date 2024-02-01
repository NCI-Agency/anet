package mil.dds.anet.views;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.graphql.AllowUnverifiedUsers;

public class AbstractEmailableAnetBean extends AbstractCustomizableAnetBean {
  // annotated below
  private List<EmailAddress> emailAddresses;

  @GraphQLQuery(name = "emailAddresses")
  @AllowUnverifiedUsers
  public CompletableFuture<List<EmailAddress>> loadEmailAddresses(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "network") String network) {
    if (emailAddresses != null) {
      return CompletableFuture.completedFuture(emailAddresses);
    }
    return AnetObjectEngine.getInstance().getEmailAddressDao()
        .getEmailAddressesForRelatedObject(context, uuid, network).thenApply(o -> {
          emailAddresses = o;
          return o;
        });
  }

  public List<EmailAddress> getEmailAddresses() {
    return emailAddresses;
  }

  @GraphQLInputField(name = "emailAddresses")
  public void setEmailAddresses(List<EmailAddress> emailAddresses) {
    this.emailAddresses = emailAddresses;
  }
}
