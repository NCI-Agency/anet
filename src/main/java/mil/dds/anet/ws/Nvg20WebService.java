package mil.dds.anet.ws;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import jakarta.jws.WebService;
import jakarta.xml.bind.JAXBElement;
import java.math.BigInteger;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;
import java.util.regex.Pattern;
import javax.xml.datatype.DatatypeFactory;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.ReportSearchSortBy;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.AccessTokenDao;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.resources.GraphQLResource;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import nato.act.tide.wsdl.nvg20.CapabilityItemType;
import nato.act.tide.wsdl.nvg20.ContentType;
import nato.act.tide.wsdl.nvg20.ExtensionType;
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
import nato.act.tide.wsdl.nvg20.SelectType;
import nato.act.tide.wsdl.nvg20.SelectValueType;
import nato.stanag4774.confidentialitymetadatalabel10.CategoryType;
import nato.stanag4774.confidentialitymetadatalabel10.ClassificationType;
import nato.stanag4774.confidentialitymetadatalabel10.ConfidentialityInformationType;
import nato.stanag4774.confidentialitymetadatalabel10.ConfidentialityLabelType;
import nato.stanag4774.confidentialitymetadatalabel10.PolicyIdentifierType;
import nato.stanag4778.bindinginformation10.BindingInformationType;
import nato.stanag4778.bindinginformation10.MetadataBindingContainerType;
import nato.stanag4778.bindinginformation10.MetadataBindingType;
import nato.stanag4778.bindinginformation10.MetadataType;
import org.apache.commons.lang3.RegExUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@WebService(serviceName = "NvgService", targetNamespace = "urn:nato:common:wsdl:nvg20",
    portName = "NvgPort20", endpointInterface = "nato.act.tide.wsdl.nvg20.NVGPortType2012")
public class Nvg20WebService implements NVGPortType2012 {

  private static final String NVG_VERSION = "2.0.2";
  private static final nato.act.tide.wsdl.nvg20.ObjectFactory NVG_OF =
      new nato.act.tide.wsdl.nvg20.ObjectFactory();
  private static final nato.stanag4774.confidentialitymetadatalabel10.ObjectFactory CML_OF =
      new nato.stanag4774.confidentialitymetadatalabel10.ObjectFactory();
  private static final nato.stanag4778.bindinginformation10.ObjectFactory BI_OF =
      new nato.stanag4778.bindinginformation10.ObjectFactory();
  private static final TimeZone TZ_UTC = TimeZone.getTimeZone(DaoUtils.getServerNativeZoneId());

  static final class App6Symbology {
    static final String SYMBOL_PREFIX_APP6B = "app6b";
    // APP-6 symbol to use:
    // - S = version: APP-6B
    // - F = affiliation: Friend
    // - G = battle dimension / surface: Ground
    // - %1$s = status: P for Present, A for Anticipated/Planned
    // - U = symbol indicator: Unit
    // - ------- = more defaults
    private static final String ACTIVITY_MEETING_APP6B = "SFG%1$sU-------";
    private static final String ACTIVITY_STATUS_PRESENT_APP6B = "P";
    private static final String ACTIVITY_STATUS_PLANNED_APP6B = "A";

    static final String SYMBOL_PREFIX_APP6D = "app6d";
    // APP-6 symbol to use:
    // - 13 = version: APP-6D
    // - 0 = context: Reality
    // - 3 = standard identity: Friend
    // - 40 = symbol set: Activity/Event
    // - %1$s = status: 0 for Present, 1 for Planned/Anticipated
    // - 0 = hq: Not Applicable
    // - 00 = echelon: Not Applicable
    // - 131000 = main icon: Operation - Meeting
    // - 00 = modifier 1: Unspecified
    // - 00 = modifier 2: Unspecified
    // - 0000000000 = more defaults
    private static final String ACTIVITY_MEETING_APP6D = "1303400%1$s0013100000000000000000";
    private static final String ACTIVITY_STATUS_PRESENT_APP6D = "0";
    private static final String ACTIVITY_STATUS_PLANNED_APP6D = "1";

    private static final String SYMBOL_FORMAT = "symbolFormat";
    private static final String STATUS_PRESENT = "statusPresent";
    private static final String STATUS_PLANNED = "statusPlanned";
    private static final Map<String, Map<String, String>> APP6_SETTINGS = Map.of( // -
        SYMBOL_PREFIX_APP6B, Map.of(SYMBOL_FORMAT, ACTIVITY_MEETING_APP6B, // -
            STATUS_PRESENT, ACTIVITY_STATUS_PRESENT_APP6B, // -
            STATUS_PLANNED, ACTIVITY_STATUS_PLANNED_APP6B),
        SYMBOL_PREFIX_APP6D, Map.of(SYMBOL_FORMAT, ACTIVITY_MEETING_APP6D, // -
            STATUS_PRESENT, ACTIVITY_STATUS_PRESENT_APP6D, // -
            STATUS_PLANNED, ACTIVITY_STATUS_PLANNED_APP6D));

    static final String DEFAULT_APP6_VERSION = SYMBOL_PREFIX_APP6D;
    static final Set<String> VALID_APP6_VERSIONS = Set.of(SYMBOL_PREFIX_APP6B, SYMBOL_PREFIX_APP6D);

    private App6Symbology() {}

    static boolean isValidApp6Version(String app6Version) {
      return VALID_APP6_VERSIONS.contains(app6Version);
    }

    static String getApp6Symbol(String app6Version, boolean isPlanned) {
      final Map<String, String> app6Settings =
          APP6_SETTINGS.getOrDefault(app6Version, APP6_SETTINGS.get(DEFAULT_APP6_VERSION));
      final String app6Status =
          isPlanned ? app6Settings.get(STATUS_PLANNED) : app6Settings.get(STATUS_PRESENT);
      final String app6Symbol = String.format(app6Settings.get(SYMBOL_FORMAT), app6Status);
      return String.format("%1$s:%2$s", app6Version, app6Symbol);
    }
  }

  private static final String ACCESS_TOKEN_ID = "accessToken";
  private static final int ACCESS_TOKEN_LENGTH = 32;
  private static final String APP6_VERSION_ID = "app6Version";
  private static final String DEFAULT_APP6_VERSION = App6Symbology.DEFAULT_APP6_VERSION;
  private static final String PAST_PERIOD_IN_DAYS_ID = "pastDays";
  private static final int DEFAULT_PAST_PERIOD_IN_DAYS = 7;
  private static final String FUTURE_PERIOD_IN_DAYS_ID = "futureDays";
  private static final int DEFAULT_FUTURE_PERIOD_IN_DAYS = 0;
  private static final String INCLUDE_DOCUMENT_CONFIDENTIALITY_LABEL =
      "includeDocumentConfidentialityLabel";
  private static final boolean DEFAULT_INCLUDE_DOCUMENT_CONFIDENTIALITY_LABEL = false;
  private static final String INCLUDE_ELEMENT_CONFIDENTIALITY_LABELS =
      "includeElementConfidentialityLabels";
  private static final boolean DEFAULT_INCLUDE_ELEMENT_CONFIDENTIALITY_LABELS = false;

  private static final String REPORT_QUERY = "query ($reportQuery: ReportSearchQueryInput) {" // -
      + " reportList(query: $reportQuery) {" // -
      + " totalCount list {" // -
      + " uuid intent engagementDate duration keyOutcomes nextSteps classification" // -
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
  private final AnetDictionary dict;
  private final GraphQLResource graphQLResource;
  private final AccessTokenDao accessTokenDao;
  private final AdminDao adminDao;

  public Nvg20WebService(AnetConfig config, AnetDictionary dict, GraphQLResource graphQLResource,
      AccessTokenDao accessTokenDao, AdminDao adminDao) {
    this.config = config;
    this.dict = dict;
    this.graphQLResource = graphQLResource;
    this.accessTokenDao = accessTokenDao;
    this.adminDao = adminDao;
  }

  @Override
  public GetCapabilitiesResponse getCapabilities(GetCapabilities parameters) {
    final GetCapabilitiesResponse response = NVG_OF.createGetCapabilitiesResponse();
    final NvgCapabilitiesType nvgCapabilitiesType = NVG_OF.createNvgCapabilitiesType();
    final List<CapabilityItemType> capabilityItemTypeList =
        nvgCapabilitiesType.getInputOrSelectOrTable();
    capabilityItemTypeList.add(makeAccessTokenType());
    capabilityItemTypeList.add(makeApp6VersionType());
    capabilityItemTypeList.add(makePastPeriodInDays());
    capabilityItemTypeList.add(makeFuturePeriodInDays());
    capabilityItemTypeList.add(makeIncludeDocumentConfidentialityLabel());
    capabilityItemTypeList.add(makeIncludeElementConfidentialityLabels());
    response.setNvgCapabilities(nvgCapabilitiesType);
    return response;
  }

  @Override
  public GetNvgResponse getNvg(GetNvg parameters) {
    final NvgFilterType nvgFilter = parameters.getNvgFilter();
    if (nvgFilter != null) {
      final List<Object> nvgQueryList =
          nvgFilter.getInputResponseOrSelectResponseOrMatrixResponse();
      String accessToken = null;
      String app6Version = DEFAULT_APP6_VERSION;
      int pastDays = DEFAULT_PAST_PERIOD_IN_DAYS;
      int futureDays = DEFAULT_FUTURE_PERIOD_IN_DAYS;
      boolean includeDocumentConfidentialityLabel = DEFAULT_INCLUDE_DOCUMENT_CONFIDENTIALITY_LABEL;
      boolean includeElementConfidentialityLabels = DEFAULT_INCLUDE_ELEMENT_CONFIDENTIALITY_LABELS;
      for (final Object object : nvgQueryList) {
        if (object instanceof InputResponseType inputResponse) {
          if (ACCESS_TOKEN_ID.equals(inputResponse.getRefid())) {
            accessToken = inputResponse.getValue();
          } else if (APP6_VERSION_ID.equals(inputResponse.getRefid())) {
            app6Version = inputResponse.getValue();
          } else if (PAST_PERIOD_IN_DAYS_ID.equals(inputResponse.getRefid())) {
            pastDays = Integer.parseInt(inputResponse.getValue());
          } else if (FUTURE_PERIOD_IN_DAYS_ID.equals(inputResponse.getRefid())) {
            futureDays = Integer.parseInt(inputResponse.getValue());
          } else if (INCLUDE_DOCUMENT_CONFIDENTIALITY_LABEL.equals(inputResponse.getRefid())) {
            includeDocumentConfidentialityLabel = Boolean.parseBoolean(inputResponse.getValue());
          } else if (INCLUDE_ELEMENT_CONFIDENTIALITY_LABELS.equals(inputResponse.getRefid())) {
            includeElementConfidentialityLabels = Boolean.parseBoolean(inputResponse.getValue());
          } else {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Unrecognized input_response: " + inputResponse.getRefid());
          }
        }
      }
      if (accessToken != null && accessToken.length() == ACCESS_TOKEN_LENGTH) {
        final AccessToken at = accessTokenDao.getByTokenValue(accessToken);
        if (at != null && at.isValid()) {
          if (!App6Symbology.isValidApp6Version(app6Version)) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Invalid APP-6 version");
          }
          final GetNvgResponse response = NVG_OF.createGetNvgResponse();
          response.setNvg(makeNvg(app6Version, pastDays, futureDays,
              includeDocumentConfidentialityLabel, includeElementConfidentialityLabels));
          return response;
        }
      }
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
        "Must provide a valid Service Access Token");
  }

  private NvgType makeNvg(String app6Version, int pastDays, int futureDays,
      boolean includeDocumentConfidentialityLabel, boolean includeElementConfidentialityLabels) {
    final NvgType nvgType = NVG_OF.createNvgType();
    nvgType.setVersion(NVG_VERSION);
    final List<ContentType> contentTypeList = nvgType.getGOrCompositeOrText();

    // Get the current instant
    final Instant now = Instant.now();
    // Calculate start of period
    final Instant start = now.minus(pastDays, ChronoUnit.DAYS);
    // Calculate end of period
    final Instant end = now.plus(futureDays, ChronoUnit.DAYS);

    final ConfidentialityRecord defaultConfidentiality = ConfidentialityRecord.create(
        adminDao.getSetting(AdminDao.AdminSettingKeys.SECURITY_BANNER_CLASSIFICATION),
        adminDao.getSetting(AdminDao.AdminSettingKeys.SECURITY_BANNER_RELEASABILITY));
    if (includeDocumentConfidentialityLabel) {
      final ExtensionType extensionType = NVG_OF.createExtensionType();
      extensionType.getAny().add(getBindingInformation(defaultConfidentiality));
      nvgType.setExtension(extensionType);
    }

    final List<Report> reports = getReportsByPeriod(start, end);
    contentTypeList.addAll(reports.stream().map(r -> reportToNvgPoint(app6Version,
        includeElementConfidentialityLabels, defaultConfidentiality, now, r)).toList());

    return nvgType;
  }

  private PointType reportToNvgPoint(String app6Version,
      boolean includeElementConfidentialityLabels, ConfidentialityRecord defaultConfidentiality,
      Instant reportingTime, Report report) {
    final PointType nvgPoint = NVG_OF.createPointType();
    nvgPoint.setLabel(report.getIntent());
    nvgPoint.setUri(String.format("urn:anet:reports:%1$s", report.getUuid()));
    setTimeStamp(report, nvgPoint);
    setLocation(report, nvgPoint);
    setSymbol(app6Version, reportingTime, report, nvgPoint);
    nvgPoint.setHref(String.format("%s/reports/%s", config.getServerUrl(), report.getUuid()));
    setTextInfo(report, nvgPoint);
    if (includeElementConfidentialityLabels) {
      setConfidentialityInformation(determineConfidentiality(defaultConfidentiality, report),
          nvgPoint);
    }
    return nvgPoint;
  }

  private void setConfidentialityInformation(ConfidentialityRecord confidentiality,
      PointType nvgPoint) {
    if (!Utils.isEmptyOrNull(confidentiality.policy())) {
      final ExtensionType extensionType = NVG_OF.createExtensionType();
      extensionType.getAny().add(getBindingInformation(confidentiality));
      nvgPoint.setExtension(extensionType);
    }
  }

  private JAXBElement<ConfidentialityLabelType> getOriginatorConfidentialityLabel(
      ConfidentialityRecord confidentiality) {
    final ConfidentialityInformationType confidentialityInformationType =
        CML_OF.createConfidentialityInformationType();
    final PolicyIdentifierType policyIdentifierType = CML_OF.createPolicyIdentifierType();
    policyIdentifierType.setValue(confidentiality.policy());
    confidentialityInformationType.setPolicyIdentifier(policyIdentifierType);

    if (!Utils.isEmptyOrNull(confidentiality.classification())) {
      final ClassificationType classificationType = CML_OF.createClassificationType();
      classificationType.setValue(confidentiality.classification());
      confidentialityInformationType.setClassification(classificationType);
    }

    if (!Utils.isEmptyOrNull(confidentiality.releasableTo())) {
      final CategoryType categoryType = CML_OF.createCategoryType();
      categoryType.setTagName("Releasable to");
      categoryType.setType("PERMISSIVE");
      categoryType.getCategoryValue()
          .addAll(confidentiality.releasableTo().stream().map(CML_OF::createGenericValue).toList());
      confidentialityInformationType.getCategory().add(categoryType);
    }

    final ConfidentialityLabelType confidentialityLabelType =
        CML_OF.createConfidentialityLabelType();
    confidentialityLabelType.setConfidentialityInformation(confidentialityInformationType);
    return CML_OF.createOriginatorConfidentialityLabel(confidentialityLabelType);
  }

  private JAXBElement<BindingInformationType> getBindingInformation(
      ConfidentialityRecord confidentiality) {
    final JAXBElement<ConfidentialityLabelType> originatorConfidentialityLabel =
        getOriginatorConfidentialityLabel(confidentiality);
    return getBindingInformation(originatorConfidentialityLabel);
  }

  private JAXBElement<BindingInformationType> getBindingInformation(
      JAXBElement<ConfidentialityLabelType> confidentialityLabel) {
    final MetadataType metadataType = BI_OF.createMetadataType();
    metadataType.getContent().add(confidentialityLabel);
    final MetadataBindingType metadataBindingType = BI_OF.createMetadataBindingType();
    metadataBindingType.getMetadataOrMetadataReference().add(metadataType);
    final MetadataBindingContainerType metadataBindingContainerType =
        BI_OF.createMetadataBindingContainerType();
    metadataBindingContainerType.getMetadataBinding().add(metadataBindingType);
    final BindingInformationType bindingInformationType = BI_OF.createBindingInformationType();
    bindingInformationType.getMetadataBindingContainer().add(metadataBindingContainerType);
    return BI_OF.createBindingInformation(bindingInformationType);
  }

  private void setSymbol(String app6Version, Instant reportingTime, Report report,
      PointType nvgPoint) {
    nvgPoint.setSymbol(App6Symbology.getApp6Symbol(app6Version,
        report.getEngagementDate() != null && report.getEngagementDate().isAfter(reportingTime)));
  }

  private void setTimeStamp(Report report, PointType nvgPoint) {
    try {
      final GregorianCalendar gc = new GregorianCalendar(TZ_UTC);
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

  private InputType makeAccessTokenType() {
    final InputType inputType = NVG_OF.createInputType();
    inputType.setId(ACCESS_TOKEN_ID);
    inputType.setRequired(true);
    inputType.setType(InputTypeType.STRING);
    inputType.setName("Service Access Token");
    inputType.setLength(BigInteger.valueOf(ACCESS_TOKEN_LENGTH));
    final HelpType helpType = NVG_OF.createHelpType();
    helpType.setText(
        "The access token required for authentication; the token can be provided by the ANET administrator");
    inputType.setHelp(helpType);
    return inputType;
  }

  private SelectType makeApp6VersionType() {
    final SelectType selectType = NVG_OF.createSelectType();
    selectType.setId(APP6_VERSION_ID);
    selectType.setRequired(false);
    selectType.setName("APP-6 version");
    final SelectType.Values values = NVG_OF.createSelectTypeValues();
    values.getValue().add(getSelectValueType(App6Symbology.SYMBOL_PREFIX_APP6B, "APP-6(B)", false));
    values.getValue().add(getSelectValueType(App6Symbology.SYMBOL_PREFIX_APP6D, "APP-6(D)", true));
    selectType.setValues(values);
    final HelpType helpType = NVG_OF.createHelpType();
    helpType.setText("The APP-6 version to use for the symbology");
    selectType.setHelp(helpType);
    return selectType;
  }

  private SelectValueType getSelectValueType(String id, String value, boolean selected) {
    final SelectValueType selectValueType = NVG_OF.createSelectValueType();
    selectValueType.setId(id);
    selectValueType.setName(value);
    selectValueType.setSelected(selected);
    return selectValueType;
  }

  private InputType makePastPeriodInDays() {
    final InputType inputType = NVG_OF.createInputType();
    inputType.setId(PAST_PERIOD_IN_DAYS_ID);
    inputType.setRequired(false);
    inputType.setType(InputTypeType.INT);
    inputType.setName("Past engagement period in days");
    inputType.setDefault(String.valueOf(DEFAULT_PAST_PERIOD_IN_DAYS));
    final HelpType helpType = NVG_OF.createHelpType();
    helpType.setText("Past period over which you want to retrieve engagements");
    inputType.setHelp(helpType);
    return inputType;
  }

  private InputType makeFuturePeriodInDays() {
    final InputType inputType = NVG_OF.createInputType();
    inputType.setId(FUTURE_PERIOD_IN_DAYS_ID);
    inputType.setRequired(false);
    inputType.setType(InputTypeType.INT);
    inputType.setName("Future engagement period in days");
    inputType.setDefault(String.valueOf(DEFAULT_FUTURE_PERIOD_IN_DAYS));
    final HelpType helpType = NVG_OF.createHelpType();
    helpType.setText("Future period over which you want to retrieve engagements");
    inputType.setHelp(helpType);
    return inputType;
  }

  private InputType makeIncludeDocumentConfidentialityLabel() {
    final InputType inputType = NVG_OF.createInputType();
    inputType.setId(INCLUDE_DOCUMENT_CONFIDENTIALITY_LABEL);
    inputType.setRequired(false);
    inputType.setType(InputTypeType.BOOLEAN);
    inputType.setName("Include document confidentiality label");
    inputType.setDefault(String.valueOf(DEFAULT_INCLUDE_DOCUMENT_CONFIDENTIALITY_LABEL));
    final HelpType helpType = NVG_OF.createHelpType();
    helpType.setText("Whether the document will have a confidentiality label or not");
    inputType.setHelp(helpType);
    return inputType;
  }

  private InputType makeIncludeElementConfidentialityLabels() {
    final InputType inputType = NVG_OF.createInputType();
    inputType.setId(INCLUDE_ELEMENT_CONFIDENTIALITY_LABELS);
    inputType.setRequired(false);
    inputType.setType(InputTypeType.BOOLEAN);
    inputType.setName("Include point confidentiality labels");
    inputType.setDefault(String.valueOf(DEFAULT_INCLUDE_ELEMENT_CONFIDENTIALITY_LABELS));
    final HelpType helpType = NVG_OF.createHelpType();
    helpType.setText("Whether each point will have a confidentiality label or not");
    inputType.setHelp(helpType);
    return inputType;
  }

  private List<Report> getReportsByPeriod(final Instant start, final Instant end) {
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

  private ConfidentialityRecord determineConfidentiality(
      ConfidentialityRecord defaultConfidentiality, Report report) {
    @SuppressWarnings("unchecked")
    final Map<String, String> classificationChoices =
        (Map<String, String>) dict.getDictionaryEntry("classification.choices");
    final String reportClassification = classificationChoices.get(report.getClassification());
    return reportClassification == null ? defaultConfidentiality
        : ConfidentialityRecord.create(reportClassification);
  }

  private record ConfidentialityRecord(String policy, String classification, List<String> releasableTo) {

    static ConfidentialityRecord create(
        String siteClassification, String siteReleasability) {
      // Try to split site classification
      final String[] policyAndClassification = siteClassification.trim().split("\\s+", 2);
      final List<String> releasableTo;
      if ( Utils.isEmptyOrNull(siteReleasability)) {
        releasableTo = null;
      } else {
        releasableTo = getReleasableTo(siteReleasability);
      }
      return new ConfidentialityRecord(
          toUpper(policyAndClassification[0]), toUpper(policyAndClassification[1]), toUpper(releasableTo));
    }

    static ConfidentialityRecord create(String reportClassification) {
      // Try to split report classification
      final String[] policyAndRest = reportClassification.trim().split("\\s+", 2);
      final String classification;
      final List<String> releasableTo;
      if (policyAndRest.length < 2) {
        classification = null;
        releasableTo = null;
      } else {
        final String[] classificationAndReleasability = policyAndRest[1].split("\\s+", 2);
        classification = classificationAndReleasability[0];
        if (classificationAndReleasability.length < 2) {
          releasableTo = null;
        } else {
          releasableTo = getReleasableTo(classificationAndReleasability[1]);
        }
      }
      return new ConfidentialityRecord(toUpper(policyAndRest[0]), toUpper(classification), toUpper(releasableTo));
    }

    private static List<String> getReleasableTo(String releasability) {
      // Try to strip off "releasable to"
      final String releasableTo = RegExUtils.removeFirst(
          releasability, Pattern.compile("^releasable to\\s+", Pattern.CASE_INSENSITIVE));
      return Arrays.asList(releasableTo.split(",\\s*"));
    }

    private static String toUpper(String s) {
      return s == null ? null : s.toUpperCase();
    }

    private static List<String> toUpper(List<String> s) {
      return s == null ? null : s.stream().map(String::toUpperCase).toList();
    }

  }

}
