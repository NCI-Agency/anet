package mil.dds.anet.threads.mart.ews;

import java.lang.invoke.MethodHandles;
import java.net.URI;
import microsoft.exchange.webservices.data.core.ExchangeService;
import microsoft.exchange.webservices.data.credential.ExchangeCredentials;
import microsoft.exchange.webservices.data.credential.WebCredentials;
import mil.dds.anet.config.AnetConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ExchangeServiceFactory {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final AnetConfig.MartExchangeConfiguration mailClientConfiguration;
  private final boolean disableCertificateCheck;

  public ExchangeServiceFactory(AnetConfig.MartExchangeConfiguration mailClientConfiguration) {
    this.disableCertificateCheck = mailClientConfiguration.isDisableCertificateValidation();
    this.mailClientConfiguration = mailClientConfiguration;
  }

  public ExchangeService getExchangeService() {
    if (disableCertificateCheck) {
      logger.warn(
          "Security warning: EWS SSL X.509 certificate check has been disabled! Do not use this option in production / operations / on high side.");
    }
    final ExchangeService service =
        disableCertificateCheck ? new TrustEveryoneExchangeService() : new ExchangeService();

    final ExchangeCredentials credentials = new WebCredentials(
        this.mailClientConfiguration.getUserName(), mailClientConfiguration.getPassword());
    service.setCredentials(credentials);
    final URI ewsUrl = makeEwsUrl(mailClientConfiguration.getHostname());
    logger.info("EWS-URL {}", ewsUrl);
    service.setUrl(ewsUrl);
    return service;
  }

  public static URI makeEwsUrl(String host) {
    return URI.create("https://" + host + "/EWS/Exchange.asmx");
  }

}
