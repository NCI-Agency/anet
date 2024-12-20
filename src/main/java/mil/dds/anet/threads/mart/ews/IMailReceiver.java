package mil.dds.anet.threads.mart.ews;

import java.util.List;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;

public interface IMailReceiver {
  List<EmailMessage> downloadEmails() throws ReadMailException;
}
