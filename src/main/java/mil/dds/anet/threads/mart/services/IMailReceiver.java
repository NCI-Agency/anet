package mil.dds.anet.threads.mart.services;

import java.util.List;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;

public interface IMailReceiver {
  void markEmailsAsRead(List<EmailMessage> emails);
  List<EmailMessage> downloadEmails();
}
