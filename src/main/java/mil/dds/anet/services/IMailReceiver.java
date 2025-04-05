package mil.dds.anet.services;

import java.util.List;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;

public interface IMailReceiver {
  void postProcessEmails(List<EmailMessage> emails);

  List<EmailMessage> downloadEmails();
}
