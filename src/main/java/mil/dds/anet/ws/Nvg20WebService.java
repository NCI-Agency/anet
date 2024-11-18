package mil.dds.anet.ws;

import jakarta.jws.WebService;
import jakarta.xml.ws.WebServiceException;
import java.math.BigInteger;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Report;
import mil.dds.anet.config.AnetConfig;
import nato.act.tide.wsdl.nvg20.CapabilityItemType;
import nato.act.tide.wsdl.nvg20.ContentType;
import nato.act.tide.wsdl.nvg20.GetCapabilities;
import nato.act.tide.wsdl.nvg20.GetCapabilitiesResponse;
import nato.act.tide.wsdl.nvg20.GetNvg;
import nato.act.tide.wsdl.nvg20.GetNvgResponse;
import nato.act.tide.wsdl.nvg20.HelpType;
import nato.act.tide.wsdl.nvg20.InputResponseType;
import nato.act.tide.wsdl.nvg20.InputType;
import nato.act.tide.wsdl.nvg20.InputTypeType;
import nato.act.tide.wsdl.nvg20.NVGPortType2012;
import nato.act.tide.wsdl.nvg20.NvgCapabilitiesType;
import nato.act.tide.wsdl.nvg20.NvgFilterType;
import nato.act.tide.wsdl.nvg20.NvgType;
import nato.act.tide.wsdl.nvg20.PointType;
import org.springframework.stereotype.Component;

@Component
@WebService(serviceName = "NvgService", targetNamespace = "urn:nato:common:wsdl:nvg20",
    portName = "NvgPort20", endpointInterface = "nato.act.tide.wsdl.nvg20.NVGPortType2012")
public class Nvg20WebService implements NVGPortType2012 {

  public final static int AccessTokenLength = 32;
  public final static String AccessTokenId = "accessToken";
  public final static String PastPeriodInDayId = "pastDays";
  private final static int PastPeriodInDayDefault = 7;
  public final static String SymbolPrefixApp6d = "app6d";
  private final AnetObjectEngine anetObjectEngine;
  private final AnetConfig config;

  // APP6D:
  // Type: Entity Type
  // Entity: Operation
  // Symbol Set Code: 40
  // Code: 131000
  // Affiliation: friendly
  protected final static String activityMeeting = "130340000013100000000000000000";

  public Nvg20WebService(AnetObjectEngine anetObjectEngine, AnetConfig config) {
    this.anetObjectEngine = anetObjectEngine;
    this.config = config;
  }

  @Override
  public GetCapabilitiesResponse getCapabilities(GetCapabilities parameters) {
    GetCapabilitiesResponse response = new GetCapabilitiesResponse();
    NvgCapabilitiesType nvgCapabilitiesType = new NvgCapabilitiesType();
    final List<CapabilityItemType> capabilityItemTypeList =
        nvgCapabilitiesType.getInputOrSelectOrTable();
    capabilityItemTypeList.add(makeAccessTokenType());
    capabilityItemTypeList.add(makePastPeriodInDays());
    response.setNvgCapabilities(nvgCapabilitiesType);
    return response;
  }

  @Override
  public GetNvgResponse getNvg(GetNvg parameters) {

    GetNvgResponse response = new GetNvgResponse();

    NvgFilterType nvgFilter = parameters.getNvgFilter();
    if (nvgFilter != null) {
      List<Object> nvgQueryList = nvgFilter.getInputResponseOrSelectResponseOrMatrixResponse();
      String accessToken = null;
      int pastDays = 7;
      for (Object object : nvgQueryList) {
        if (object instanceof InputResponseType inputResponse) {
          if (AccessTokenId.equals(inputResponse.getRefid())) {
            accessToken = inputResponse.getValue();
          }
          if (PastPeriodInDayId.equals(inputResponse.getRefid())) {
            pastDays = Integer.parseInt(inputResponse.getValue());
          }
        }
      }
      if (accessToken != null && accessToken.length() == 32) {
        response.setNvg(makeNvg(pastDays));
        return response;
      }
    }
    throw new WebServiceException("Must provide a Service Access Token");
  }

  private NvgType makeNvg(int pastDays) {
    NvgType nvgType = new NvgType();
    List<ContentType> contentTypeList = nvgType.getGOrCompositeOrText();
    // Get the current instant
    Instant now = Instant.now();

    // Calculate start of period
    Instant oneWeekAgo = now.minus(pastDays, ChronoUnit.DAYS);

    List<Report> reports =
        anetObjectEngine.getReportDao().getReportByPeriod(oneWeekAgo, Instant.now());
    contentTypeList.addAll(reports.stream()
        // .filter(report -> report.getLocation() != null)
        .map(this::reportToNvgPoint).toList());

    return nvgType;
  }

  private PointType reportToNvgPoint(Report report) {
    PointType nvgPoint = new PointType();
    nvgPoint.setLabel(report.getIntent());
    Location location = report.getLocation();
    if (location != null && location.getLng() != null && location.getLat() != null) {
      nvgPoint.setX(location.getLng());
      nvgPoint.setY(location.getLat());
    }
    nvgPoint.setSymbol(String.format("%s:%s", SymbolPrefixApp6d, activityMeeting));
    nvgPoint.setHref(String.format("%s/reports/%s", this.config.getServerUrl(), report.getUuid()));
    return nvgPoint;
  }

  public static InputType makeAccessTokenType() {
    InputType inputType = new InputType();
    inputType.setId(AccessTokenId);
    inputType.setRequired(true);
    inputType.setType(InputTypeType.STRING);
    inputType.setName("Service Access Token");
    inputType.setLength(BigInteger.valueOf(AccessTokenLength));
    HelpType helpType = new HelpType();
    helpType.setText(
        "The access token required for authentication. The token can be provided by the ANET administrator");
    inputType.setHelp(helpType);
    return inputType;
  }

  public static InputType makePastPeriodInDays() {
    InputType inputType = new InputType();
    inputType.setId(PastPeriodInDayId);
    inputType.setRequired(true);
    inputType.setType(InputTypeType.INT);
    inputType.setName("Past engagement period in days");
    inputType.setRequired(false);
    inputType.setDefault(String.valueOf(PastPeriodInDayDefault));
    HelpType helpType = new HelpType();
    helpType.setText("Period over which you want to retrieve engagements");
    inputType.setHelp(helpType);
    return inputType;
  }


}
