package mil.dds.anet.ws;

import jakarta.jws.WebService;
import jakarta.xml.ws.WebServiceException;
import java.math.BigInteger;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Report;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.database.ReportDao;
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

  private static final int ACCESS_TOKEN_LENGTH = 32;
  private static final String ACCESS_TOKEN_ID = "accessToken";
  private static final String PAST_PERIOD_IN_DAY_ID = "pastDays";
  private static final String SYMBOL_PREFIX_APP6D = "app6d";
  private static final int DEFAULT_PAST_PERIOD_IN_DAYS = 7;

  // APP6D:
  // Type: Entity Type
  // Entity: Operation
  // Symbol Set Code: 40
  // Code: 131000
  // Affiliation: friendly
  private static final String ACTIVITY_MEETING = "130340000013100000000000000000";

  private final AnetConfig config;
  private final ReportDao reportDao;

  public Nvg20WebService(AnetConfig config, ReportDao reportDao) {
    this.config = config;
    this.reportDao = reportDao;
  }

  @Override
  public GetCapabilitiesResponse getCapabilities(GetCapabilities parameters) {
    final GetCapabilitiesResponse response = new GetCapabilitiesResponse();
    final NvgCapabilitiesType nvgCapabilitiesType = new NvgCapabilitiesType();
    final List<CapabilityItemType> capabilityItemTypeList =
        nvgCapabilitiesType.getInputOrSelectOrTable();
    capabilityItemTypeList.add(makeAccessTokenType());
    capabilityItemTypeList.add(makePastPeriodInDays());
    response.setNvgCapabilities(nvgCapabilitiesType);
    return response;
  }

  @Override
  public GetNvgResponse getNvg(GetNvg parameters) {
    final GetNvgResponse response = new GetNvgResponse();
    final NvgFilterType nvgFilter = parameters.getNvgFilter();
    if (nvgFilter != null) {
      final List<Object> nvgQueryList =
          nvgFilter.getInputResponseOrSelectResponseOrMatrixResponse();
      String accessToken = null;
      int pastDays = DEFAULT_PAST_PERIOD_IN_DAYS;
      for (Object object : nvgQueryList) {
        if (object instanceof InputResponseType inputResponse) {
          if (ACCESS_TOKEN_ID.equals(inputResponse.getRefid())) {
            accessToken = inputResponse.getValue();
          }
          if (PAST_PERIOD_IN_DAY_ID.equals(inputResponse.getRefid())) {
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
    final NvgType nvgType = new NvgType();
    final List<ContentType> contentTypeList = nvgType.getGOrCompositeOrText();
    // Get the current instant
    final Instant now = Instant.now();

    // Calculate start of period
    final Instant oneWeekAgo = now.minus(pastDays, ChronoUnit.DAYS);

    final List<Report> reports = reportDao.getReportsByPeriod(oneWeekAgo, now);
    contentTypeList.addAll(reports.stream()
        // .filter(report -> report.getLocation() != null)
        .map(this::reportToNvgPoint).toList());

    return nvgType;
  }

  private PointType reportToNvgPoint(Report report) {
    final PointType nvgPoint = new PointType();
    nvgPoint.setLabel(report.getIntent());
    final Location location = report.getLocation();
    if (location != null && location.getLng() != null && location.getLat() != null) {
      nvgPoint.setX(location.getLng());
      nvgPoint.setY(location.getLat());
    }
    nvgPoint.setSymbol(String.format("%s:%s", SYMBOL_PREFIX_APP6D, ACTIVITY_MEETING));
    nvgPoint.setHref(String.format("%s/reports/%s", config.getServerUrl(), report.getUuid()));
    return nvgPoint;
  }

  public static InputType makeAccessTokenType() {
    final InputType inputType = new InputType();
    inputType.setId(ACCESS_TOKEN_ID);
    inputType.setRequired(true);
    inputType.setType(InputTypeType.STRING);
    inputType.setName("Service Access Token");
    inputType.setLength(BigInteger.valueOf(ACCESS_TOKEN_LENGTH));
    final HelpType helpType = new HelpType();
    helpType.setText(
        "The access token required for authentication. The token can be provided by the ANET administrator");
    inputType.setHelp(helpType);
    return inputType;
  }

  public static InputType makePastPeriodInDays() {
    final InputType inputType = new InputType();
    inputType.setId(PAST_PERIOD_IN_DAY_ID);
    inputType.setRequired(true);
    inputType.setType(InputTypeType.INT);
    inputType.setName("Past engagement period in days");
    inputType.setRequired(false);
    inputType.setDefault(String.valueOf(DEFAULT_PAST_PERIOD_IN_DAYS));
    final HelpType helpType = new HelpType();
    helpType.setText("Period over which you want to retrieve engagements");
    inputType.setHelp(helpType);
    return inputType;
  }

}
