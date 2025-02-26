package mil.dds.anet.threads.mart.services;

import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.List;
import microsoft.exchange.webservices.data.core.ExchangeService;
import microsoft.exchange.webservices.data.core.PropertySet;
import microsoft.exchange.webservices.data.core.enumeration.property.BasePropertySet;
import microsoft.exchange.webservices.data.core.enumeration.property.BodyType;
import microsoft.exchange.webservices.data.core.enumeration.property.WellKnownFolderName;
import microsoft.exchange.webservices.data.core.enumeration.search.LogicalOperator;
import microsoft.exchange.webservices.data.core.enumeration.search.SortDirection;
import microsoft.exchange.webservices.data.core.enumeration.service.ConflictResolutionMode;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;
import microsoft.exchange.webservices.data.core.service.item.Item;
import microsoft.exchange.webservices.data.core.service.schema.EmailMessageSchema;
import microsoft.exchange.webservices.data.core.service.schema.ItemSchema;
import microsoft.exchange.webservices.data.search.FindItemsResults;
import microsoft.exchange.webservices.data.search.ItemView;
import microsoft.exchange.webservices.data.search.filter.SearchFilter;
import mil.dds.anet.config.AnetConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class EwsReceiver implements IMailReceiver {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final ExchangeService exchangeService;
  private final AnetConfig.MartExchangeConfiguration mailClientConfiguration;

  public EwsReceiver(AnetConfig config) {
    final ExchangeServiceFactory exchangeServiceFactory =
        new ExchangeServiceFactory(config.getMart());
    this.exchangeService = exchangeServiceFactory.getExchangeService();
    this.mailClientConfiguration = config.getMart();
  }

  public void markEmailsAsRead(List<EmailMessage> emails) {
    for (EmailMessage email : emails) {
      if (mailClientConfiguration.isMarkAsRead()) {
        try {
          email.setIsRead(true);
          email.update(ConflictResolutionMode.AlwaysOverwrite);
        } catch (Exception e) {
          logger.error("Could not mark email as read", e);
        }
      }
    }
  }

  public List<EmailMessage> downloadEmails() {
    try {
      final PropertySet itemPropertySet = new PropertySet(BasePropertySet.FirstClassProperties);
      itemPropertySet.setRequestedBodyType(BodyType.Text);

      final ItemView view = new ItemView(mailClientConfiguration.getMaxNumberEmailsPulled());
      view.setPropertySet(itemPropertySet);
      // Filter to only pull unread e-mails (to prevent un-parsable mails to be read over and over)
      final SearchFilter filterUnreadEmails = new SearchFilter.SearchFilterCollection(
          LogicalOperator.And, new SearchFilter.IsEqualTo(EmailMessageSchema.IsRead, false),
          new SearchFilter.IsEqualTo(EmailMessageSchema.From,
              mailClientConfiguration.getTrustedSender()));

      // Get oldest e-mails first, process in sequence
      view.getOrderBy().add(ItemSchema.DateTimeReceived, SortDirection.Ascending);
      final FindItemsResults<Item> findResults =
          exchangeService.findItems(WellKnownFolderName.Inbox, filterUnreadEmails, view);

      final List<EmailMessage> result = new ArrayList<>();
      for (final Item item : findResults.getItems()) {
        if (item instanceof EmailMessage emailMessage) {
          emailMessage.load(itemPropertySet);
          result.add(emailMessage);
        }
      }
      return result;
    } catch (Exception e) {
      logger.error("Could not connect to MART exchange server, returning empty list of emails", e);
      return new ArrayList<>();
    }
  }
}
