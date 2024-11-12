package mil.dds.anet.ws;

import jakarta.jws.WebService;
import nato.act.tide.wsdl.nvg20.*;
import org.springframework.stereotype.Component;

@Component
@WebService(serviceName = "NvgService", targetNamespace = "urn:nato:common:wsdl:nvg20",
    portName = "NvgPort20", endpointInterface = "nato.act.tide.wsdl.nvg20.NVGPortType2012")
public class Nvg20WebService implements NVGPortType2012 {

  @Override
  public GetCapabilitiesResponse getCapabilities(GetCapabilities parameters) {
    return null;
  }

  @Override
  public GetNvgResponse getNvg(GetNvg parameters) {
    return null;
  }
}
