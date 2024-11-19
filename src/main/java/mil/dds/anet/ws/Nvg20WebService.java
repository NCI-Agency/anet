package mil.dds.anet.ws;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import jakarta.jws.WebService;
import jakarta.xml.ws.WebServiceException;
import java.math.BigInteger;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.xml.datatype.DatatypeFactory;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.ReportSearchSortBy;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.resources.GraphQLResource;
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
  private static final String NVG_VERSION = "2.0.2";

  // 13 = version: APP-6D
  // 0 = context: Reality
  // 3 = standard identity: Friend
  // 40 = symbol set: Activity/Event
  // 0 = status: Present
  // 0 = hq: Not Applicable
  // 00 = echelon: Not Applicable
  // 131000 = main icon: Operation - Meeting
  // 00 = modifier 1: Unspecified
  // 00 = modifier 2: Unspecified
  // 0000000000 = more defaults
  private static final String ACTIVITY_MEETING = "130340000013100000000000000000";

  private static final String REPORT_QUERY = "query ($reportQuery: ReportSearchQueryInput) {" // -
      + " reportList(query: $reportQuery) {" // -
      + " totalCount list {" // -
      + " uuid intent engagementDate duration keyOutcomes nextSteps" // -
      + " primaryAdvisor { uuid name rank }" // -
      + " primaryInterlocutor { uuid name rank }" // -
      + " advisorOrg { uuid shortName longName identificationCode }" // -
      + " interlocutorOrg { uuid shortName longName identificationCode }" // -
      + " location { uuid name lat lng type }" // -
      + " } } }";
  private static final Map<String, Object> DEFAULT_REPORT_QUERY_VARIABLES = Map.of( // -
      "state", new Report.ReportState[] {Report.ReportState.APPROVED, Report.ReportState.PUBLISHED}, // -
      "pageSize", 0, // -
      "sortBy", ReportSearchSortBy.ENGAGEMENT_DATE, // -
      "sortOrder", ISearchQuery.SortOrder.DESC);

  private final AnetConfig config;
  private final GraphQLResource graphQLResource;

  public Nvg20WebService(AnetConfig config, GraphQLResource graphQLResource) {
    this.config = config;
    this.graphQLResource = graphQLResource;
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
    nvgType.setVersion(NVG_VERSION);
    final List<ContentType> contentTypeList = nvgType.getGOrCompositeOrText();
    // Get the current instant
    final Instant now = Instant.now();

    // Calculate start of period
    final Instant oneWeekAgo = now.minus(pastDays, ChronoUnit.DAYS);

    final List<Report> reports = getReportsByPeriod(oneWeekAgo, now);
    contentTypeList.addAll(reports.stream()
        // .filter(report -> report.getLocation() != null)
        .map(this::reportToNvgPoint).toList());

    return nvgType;
  }

  private PointType reportToNvgPoint(Report report) {
    final PointType nvgPoint = new PointType();
    nvgPoint.setLabel(report.getIntent());
    nvgPoint.setUri(String.format("urn:anet:reports:%1$s", report.getUuid()));
    setTimeStamp(report, nvgPoint);
    setLocation(report, nvgPoint);
    nvgPoint.setSymbol(String.format("%s:%s", SYMBOL_PREFIX_APP6D, ACTIVITY_MEETING));
    nvgPoint.setHref(String.format("%s/reports/%s", config.getServerUrl(), report.getUuid()));
    setTextInfo(report, nvgPoint);
    return nvgPoint;
  }

  private void setTimeStamp(Report report, PointType nvgPoint) {
    try {
      final GregorianCalendar gc = new GregorianCalendar();
      // TODO: Should we be using `updatedAt` here?
      gc.setTimeInMillis(report.getEngagementDate().toEpochMilli());
      nvgPoint.setTimeStamp(DatatypeFactory.newInstance().newXMLGregorianCalendar(gc));
    } catch (Exception ignored) {
      // We don't set the timeStamp
    }
  }

  private void setLocation(Report report, PointType nvgPoint) {
    final Location location = report.getLocation();
    if (location != null && location.getLng() != null && location.getLat() != null) {
      nvgPoint.setX(location.getLng());
      nvgPoint.setY(location.getLat());
    }
  }

  private void setTextInfo(Report report, PointType nvgPoint) {
    nvgPoint.setTextInfo(String.format(
        "Engagement between primary advisor %1$s @ %2$s and primary interlocutor %3$s @ %4$s"
            + "%5$s%6$s",
        getPersonName(report.getPrimaryAdvisor()), getOrganizationName(report.getAdvisorOrg()),
        getPersonName(report.getPrimaryInterlocutor()),
        getOrganizationName(report.getInterlocutorOrg()),
        getOptionalText("\n\nwith key outcomes: \n%s", report.getKeyOutcomes()),
        getOptionalText("\n\nwith next steps: \n%s", report.getNextSteps())));
  }

  private String getPersonName(Person person) {
    return person == null ? "<Unknown>" : person.getName();
  }

  private String getOrganizationName(Organization organization) {
    return organization == null ? "<Unknown>" : organization.getShortName();
  }

  private Object getOptionalText(String format, String text) {
    return (text == null) ? "" : String.format(format, text);
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

  public List<Report> getReportsByPeriod(final Instant start, final Instant end) {
    final Map<String, Object> reportQuery = new HashMap<>(DEFAULT_REPORT_QUERY_VARIABLES);
    reportQuery.put("engagementDateStart", start.toEpochMilli());
    reportQuery.put("engagementDateEnd", end.toEpochMilli());
    final GraphQLRequest graphQLRequest =
        new GraphQLRequest("nvgData", REPORT_QUERY, null, Map.of("reportQuery", reportQuery));
    final Map<String, Object> result = graphQLResource.graphql(null, graphQLRequest, null);
    @SuppressWarnings("unchecked")
    final Map<String, Object> data = (Map<String, Object>) result.get("data");
    final TypeReference<AnetBeanList<Report>> typeRef = new TypeReference<>() {};
    final ObjectMapper defaultMapper = MapperUtils.getDefaultMapper();
    final AnetBeanList<Report> anetBeanList =
        defaultMapper.convertValue(data.get("reportList"), typeRef);
    return anetBeanList.getList();
  }

}
