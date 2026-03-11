package mil.dds.anet.ws;

import jakarta.xml.ws.Endpoint;
import mil.dds.anet.database.AccessTokenActivityDao;
import mil.dds.anet.database.AccessTokenDao;
import mil.dds.anet.ws.security.AuthorizationHeaderInterceptor;
import org.apache.cxf.Bus;
import org.apache.cxf.jaxws.EndpointImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CxfConfig {

  private final Bus bus;
  private final Nvg20WebService nvg20WebService;
  private final AccessTokenDao accessTokenDao;
  private final AccessTokenActivityDao accessTokenActivityDao;

  public CxfConfig(Bus bus, Nvg20WebService nvg20WebService, AccessTokenDao accessTokenDao,
      AccessTokenActivityDao accessTokenActivityDao) {
    this.bus = bus;
    this.nvg20WebService = nvg20WebService;
    this.accessTokenDao = accessTokenDao;
    this.accessTokenActivityDao = accessTokenActivityDao;
  }

  @Bean
  public Endpoint nvg20Endpoint() {
    EndpointImpl endpoint = new EndpointImpl(bus, nvg20WebService);
    endpoint.getInInterceptors()
        .add(new AuthorizationHeaderInterceptor(accessTokenDao, accessTokenActivityDao));
    endpoint.publish("/nvg/20");
    return endpoint;
  }
}
