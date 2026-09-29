package mil.dds.anet.services;

import java.util.List;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;
import mil.dds.anet.config.AnetConfig;

public interface IMailReceiver {
  void postProcessEmails(List<EmailMessage> emails);

  List<EmailMessage> downloadEmails(AnetConfig.TenantProperties tenantProperties);
}
