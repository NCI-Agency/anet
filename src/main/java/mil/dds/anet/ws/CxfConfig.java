package mil.dds.anet.ws;

import jakarta.xml.ws.Endpoint;
import org.apache.cxf.Bus;
import org.apache.cxf.jaxws.EndpointImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CxfConfig {

  private final Bus bus;
  private final Nvg20WebService nvg20WebService;

  public CxfConfig(Bus bus, Nvg20WebService nvg20WebService) {
    this.bus = bus;
    this.nvg20WebService = nvg20WebService;
  }

  @Bean
  public Endpoint nvg20Endpoint() {
    EndpointImpl endpoint = new EndpointImpl(bus, nvg20WebService);
    endpoint.publish("/nvg/20");
    return endpoint;
  }
}
