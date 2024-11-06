package mil.dds.anet.threads.mart.ews;

import java.security.GeneralSecurityException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import javax.net.ssl.SSLContext;
import microsoft.exchange.webservices.data.EWSConstants;
import microsoft.exchange.webservices.data.core.ExchangeService;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.ssl.SSLContextBuilder;

/**
 * Overrides socket factory to disable certificate check and trust any EWS end-point
 */
public class TrustEveryoneExchangeService extends ExchangeService {

  /**
   * Create registry with configured {@link ConnectionSocketFactory} instances. Override this method
   * to change how to work with different schemas.
   *
   * @return registry object
   */
  protected Registry<ConnectionSocketFactory> createConnectionSocketFactoryRegistry() {

    try {
      return RegistryBuilder.<ConnectionSocketFactory>create()
          .register(EWSConstants.HTTP_SCHEME, new PlainConnectionSocketFactory())
          .register(EWSConstants.HTTPS_SCHEME, makeInsecureSSLProtocolSocketFactory()).build();
    } catch (GeneralSecurityException e) {
      throw new RuntimeException(
          "Could not initialize ConnectionSocketFactory instances for HttpClientConnectionManager",
          e);
    }
  }

  private SSLConnectionSocketFactory makeInsecureSSLProtocolSocketFactory()
      throws NoSuchAlgorithmException, KeyStoreException, KeyManagementException {
    final SSLContext sslContext =
        new SSLContextBuilder().loadTrustMaterial(null, (x509CertChain, authType) -> true).build();
    return new SSLConnectionSocketFactory(sslContext, NoopHostnameVerifier.INSTANCE);
  }
}
