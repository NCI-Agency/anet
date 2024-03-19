package mil.dds.anet.views;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.utils.Utils;

public class AbstractEmailableAnetBean extends AbstractCustomizableAnetBean {
  // annotated below
  private List<EmailAddress> emailAddresses;

  public CompletableFuture<List<EmailAddress>> loadEmailAddresses(Map<String, Object> context,
      String network) {
    final CompletableFuture<List<EmailAddress>> allEmailAddresses;
    if (emailAddresses != null) {
      allEmailAddresses = CompletableFuture.completedFuture(emailAddresses);
    } else {
      allEmailAddresses = AnetObjectEngine.getInstance().getEmailAddressDao()
          .getEmailAddressesForRelatedObject(context, uuid).thenApply(o -> {
            emailAddresses = o;
            return o;
          });
    }
    return allEmailAddresses.thenApply(l -> Utils.isEmptyOrNull(network) ? l
        : l.stream().filter(ea -> network.equals(ea.getNetwork())).toList());
  }

  @JsonIgnore
  public Optional<EmailAddress> getNotificationEmailAddress() {
    if (Utils.isEmptyOrNull(emailAddresses)) {
      return Optional.empty();
    }
    return emailAddresses.stream()
        .filter(ea -> Objects.equals(Utils.getEmailNetworkForNotifications(), ea.getNetwork()))
        .findFirst();
  }

  public List<EmailAddress> getEmailAddresses() {
    return emailAddresses;
  }

  @GraphQLInputField(name = "emailAddresses")
  public void setEmailAddresses(List<EmailAddress> emailAddresses) {
    this.emailAddresses = emailAddresses;
  }
}
