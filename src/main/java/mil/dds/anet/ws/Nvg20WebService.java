package mil.dds.anet.ws;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import jakarta.jws.WebService;
import jakarta.xml.bind.JAXBElement;
import java.math.BigInteger;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;
import javax.xml.datatype.DatatypeFactory;
import javax.xml.datatype.XMLGregorianCalendar;
import javax.xml.namespace.QName;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.beans.AccessToken.TokenScope;
import mil.dds.anet.beans.ConfidentialityRecord;
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
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.resources.GraphQLResource;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import nato.act.tide.wsdl.nvg20.CapabilityItemType;
import nato.act.tide.wsdl.nvg20.ContentType;
import nato.act.tide.wsdl.nvg20.ExtendedDataType;
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
import nato.act.tide.wsdl.nvg20.SchemaType;
import nato.act.tide.wsdl.nvg20.SelectType;
import nato.act.tide.wsdl.nvg20.SelectValueType;
import nato.act.tide.wsdl.nvg20.SimpleDataSectionType;
import nato.act.tide.wsdl.nvg20.SimpleDataType;
import nato.act.tide.wsdl.nvg20.SimpleFieldType;
import nato.stanag4774.confidentialitymetadatalabel10.CategoryType;
import nato.stanag4774.confidentialitymetadatalabel10.ClassificationType;
import nato.stanag4774.confidentialitymetadatalabel10.ConfidentialityInformationType;
import nato.stanag4774.confidentialitymetadatalabel10.ConfidentialityLabelType;
import nato.stanag4774.confidentialitymetadatalabel10.PolicyIdentifierType;
import nato.stanag4778.bindinginformation10.BindingInformationType;
import nato.stanag4778.bindinginformation10.MetadataBindingContainerType;
import nato.stanag4778.bindinginformation10.MetadataBindingType;
import nato.stanag4778.bindinginformation10.MetadataType;
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
  private static final String XSD_STRING = "string";
  private static final String XSD_DATETIME = "dateTime";
  private static final String XSD_DURATION = "duration";
  private static final String URI_NVG_SCHEMA = "https://tide.act.nato.int/schemas/2012/10/nvg";
  private static final String URI_ANET_SCHEMAS = "urn:anet:schemas";
  private static final String URI_ANET_SCHEMAS_REPORT = URI_ANET_SCHEMAS + ":report";
  private static final String ANET_SCHEMA_REPORT_INTENT = "intent";
  private static final String ANET_SCHEMA_REPORT_ENGAGEMENT_DATE = "engagementDate";
  private static final String ANET_SCHEMA_REPORT_ENGAGEMENT_DURATION = "duration";
  private static final String ANET_SCHEMA_REPORT_ENGAGEMENT_STATUS = "engagementStatus";
  private static final TimeZone TZ_UTC = TimeZone.getTimeZone(DaoUtils.getServerNativeZoneId());
  private static final String ANET_SCHEMA_REPORT_PRIMARY_ADVISOR = "primaryAdvisor";
  private static final String ANET_SCHEMA_REPORT_ADVISOR_ORGANIZATION = "advisorOrganization";
  private static final String ANET_SCHEMA_REPORT_PRIMARY_INTERLOCUTOR = "primaryInterlocutor";
  private static final String ANET_SCHEMA_REPORT_INTERLOCUTOR_ORGANIZATION =
      "interlocutorOrganization";
  private static final String ANET_SCHEMA_REPORT_KEY_OUTCOMES = "keyOutcomes";
  private static final String ANET_SCHEMA_REPORT_NEXT_STEPS = "nextSteps";

  static final class App6Symbology {
    static final String SYMBOLOGY_VERSION_APP6B = "app6b";
    // APP-6 prefix to use:
    static final String SYMBOL_PREFIX_APP6B = "app6b:";
    // APP-6 symbol to use:
    // - S = coding scheme: Warfighting
    // - F = affiliation: Friend
    // - G = battle dimension / surface: Ground
    // - %1$s = status: P for Present, A for Anticipated/Planned
    // - U = function id: Unit
    // - ------- = more defaults
    private static final String ACTIVITY_MEETING_APP6B = "SFG%1$sU-------";
    private static final String ACTIVITY_STATUS_PRESENT_APP6B = "P";
    private static final String ACTIVITY_STATUS_PLANNED_APP6B = "A";

    static final String SYMBOLOGY_VERSION_APP6D_UNOFFICIAL = "app6d-old";
    // APP-6 prefix to use:
    // - 10 = version: APP-6D
    static final String SYMBOL_PREFIX_APP6D_UNOFFICIAL = "app6d:10";
    static final String SYMBOLOGY_VERSION_APP6D = "app6d";
    // APP-6 prefix to use:
    // - 10 = version: APP-6D
    static final String SYMBOL_PREFIX_APP6D = "app06:10";
    // APP-6 symbol to use:
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
    private static final String ACTIVITY_MEETING_APP6D = "03400%1$s0013100000000000000000";
    private static final String ACTIVITY_STATUS_PRESENT_APP6D = "0";
    private static final String ACTIVITY_STATUS_PLANNED_APP6D = "1";

    private static final String VERSION_TEXT = "versionText";
    private static final String SYMBOL_PREFIX = "symbolPrefix";
    private static final String SYMBOL_FORMAT = "symbolFormat";
    private static final String STATUS_PRESENT = "statusPresent";
    private static final String STATUS_PLANNED = "statusPlanned";
    private static final Map<String, Map<String, String>> APP6_SETTINGS = Map.of( // -
        SYMBOLOGY_VERSION_APP6B, Map.of( // -
            VERSION_TEXT, "APP-6(B) Standard, with symbol encoded as %s…", // -
            SYMBOL_PREFIX, SYMBOL_PREFIX_APP6B, // -
            SYMBOL_FORMAT, ACTIVITY_MEETING_APP6B, // -
            STATUS_PRESENT, ACTIVITY_STATUS_PRESENT_APP6B, // -
            STATUS_PLANNED, ACTIVITY_STATUS_PLANNED_APP6B),
        SYMBOLOGY_VERSION_APP6D_UNOFFICIAL, Map.of( // -
            VERSION_TEXT, "Unofficial reading of APP-6(D) Standard, with symbol encoded as %s…", // -
            SYMBOL_PREFIX, SYMBOL_PREFIX_APP6D_UNOFFICIAL, // -
            SYMBOL_FORMAT, ACTIVITY_MEETING_APP6D, // -
            STATUS_PRESENT, ACTIVITY_STATUS_PRESENT_APP6D, // -
            STATUS_PLANNED, ACTIVITY_STATUS_PLANNED_APP6D),
        SYMBOLOGY_VERSION_APP6D, Map.of( // -
            VERSION_TEXT, "APP-6(D) Standard, with symbol encoded as %s…", // -
            SYMBOL_PREFIX, SYMBOL_PREFIX_APP6D, // -
            SYMBOL_FORMAT, ACTIVITY_MEETING_APP6D, // -
            STATUS_PRESENT, ACTIVITY_STATUS_PRESENT_APP6D, // -
            STATUS_PLANNED, ACTIVITY_STATUS_PLANNED_APP6D));

    // Not the correct interpretation of the standard, but currently used by external tools
    static final String DEFAULT_APP6_VERSION = SYMBOLOGY_VERSION_APP6D_UNOFFICIAL;
    static final Set<String> VALID_APP6_VERSIONS = Set.of(SYMBOLOGY_VERSION_APP6B,
        SYMBOLOGY_VERSION_APP6D_UNOFFICIAL, SYMBOLOGY_VERSION_APP6D);

    private App6Symbology() {}

    static boolean isValidApp6Version(String app6Version) {
      return VALID_APP6_VERSIONS.contains(app6Version);
    }

    static String getVersionHelp(String app6Version) {
      final Map<String, String> app6Settings = getApp6Settings(app6Version);
      return String.format(app6Settings.get(App6Symbology.VERSION_TEXT),
          app6Settings.get(App6Symbology.SYMBOL_PREFIX));
    }

    static String getApp6Symbol(String app6Version, boolean isPlanned) {
      final Map<String, String> app6Settings = getApp6Settings(app6Version);
      final String app6Status =
          isPlanned ? app6Settings.get(STATUS_PLANNED) : app6Settings.get(STATUS_PRESENT);
      final String app6Symbol = String.format(app6Settings.get(SYMBOL_FORMAT), app6Status);
      return String.format("%1$s%2$s", app6Settings.get(SYMBOL_PREFIX), app6Symbol);
    }

    private static Map<String, String> getApp6Settings(String app6Version) {
      return APP6_SETTINGS.getOrDefault(app6Version, APP6_SETTINGS.get(DEFAULT_APP6_VERSION));
    }
  }

  private static final String REPORT_QUERY = "query ($reportQuery: ReportSearchQueryInput) {" // -
      + " reportList(query: $reportQuery) {" // -
      + " totalCount list {" // -
      + " uuid state intent engagementDate duration" // -
      + " keyOutcomes nextSteps classification updatedAt" // -
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

  public Nvg20WebService(AnetConfig config, AnetDictionary dict, GraphQLResource graphQLResource,
      AccessTokenDao accessTokenDao) {
    this.config = config;
    this.dict = dict;
    this.graphQLResource = graphQLResource;
    this.accessTokenDao = accessTokenDao;
  }

  @Override
  public GetCapabilitiesResponse getCapabilities(GetCapabilities parameters) {
    final GetCapabilitiesResponse response = NVG_OF.createGetCapabilitiesResponse();
    response.setNvgCapabilities(NvgConfig.getCapabilities());
    return response;
  }

  @Override
  public GetNvgResponse getNvg(GetNvg parameters) {
    final NvgFilterType nvgFilter = parameters.getNvgFilter();
    if (nvgFilter != null) {
      final NvgConfig nvgConfig =
          NvgConfig.from(nvgFilter.getInputResponseOrSelectResponseOrMatrixResponse());
      final AccessToken at = getAccessToken(nvgConfig.getAccessToken());
      if (isValidAccessToken(at)) {
        if (!App6Symbology.isValidApp6Version(nvgConfig.getApp6Version())) {
          throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
              "Invalid APP-6 version");
        }
        final GetNvgResponse response = NVG_OF.createGetNvgResponse();
        response.setNvg(makeNvg(at, nvgConfig));
        return response;
      }
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
        "Must provide a valid Web Service Access Token");
  }

  private AccessToken getAccessToken(String accessToken) {
    if (accessToken != null && accessToken.length() == NvgConfig.ACCESS_TOKEN_LENGTH) {
      return accessTokenDao.getByTokenValueAndScope(accessToken, TokenScope.NVG);
    }
    return null;
  }

  private boolean isValidAccessToken(AccessToken at) {
    return at != null && at.isValid();
  }

  private NvgType makeNvg(AccessToken at, NvgConfig nvgConfig) {
    final NvgType nvgType = NVG_OF.createNvgType();
    nvgType.setVersion(NVG_VERSION);
    makeReportSchema(nvgType);
    final List<ContentType> contentTypeList = nvgType.getGOrCompositeOrText();

    // Get the current instant
    final Instant now = Instant.now();
    // Calculate start of period
    final Instant start = now.minus(nvgConfig.getPastDays(), ChronoUnit.DAYS);
    // Calculate end of period
    final Instant end = now.plus(nvgConfig.getFutureDays(), ChronoUnit.DAYS);

    final ConfidentialityRecord defaultConfidentiality =
        ConfidentialityRecord.create(dict, (String) dict.getDictionaryEntry("siteClassification"));
    if (nvgConfig.isIncludeDocumentConfidentialityLabel()) {
      final ExtensionType extensionType = NVG_OF.createExtensionType();
      extensionType.getAny().add(getBindingInformation(defaultConfidentiality));
      if (nvgConfig.isAddDocumentConfidentialityLabelAsMetadata()) {
        nvgType.setMetadata(extensionType);
      } else {
        nvgType.setExtension(extensionType);
      }
    }

    final List<Report> reports = getReportsByPeriod(at, start, end);
    contentTypeList.addAll(reports.stream().filter(this::hasLocationCoordinates)
        .map(r -> reportToNvgPoint(nvgConfig.getApp6Version(),
            nvgConfig.isIncludeElementConfidentialityLabels(),
            nvgConfig.isAddElementConfidentialityLabelsAsMetadata(), defaultConfidentiality, now,
            r))
        .toList());

    return nvgType;
  }

  private boolean hasLocationCoordinates(Report r) {
    final Location location = r.getLocation();
    return location != null && location.getLng() != null && location.getLat() != null;
  }

  private void makeReportSchema(NvgType nvgType) {
    final SchemaType schemaType = NVG_OF.createSchemaType();
    schemaType.setSchemaId(URI_ANET_SCHEMAS_REPORT);

    final String dictPathFormat = "fields.report.%s.label";
    addSchemaField(schemaType, ANET_SCHEMA_REPORT_INTENT,
        getLabelFromDict(dictPathFormat, ANET_SCHEMA_REPORT_INTENT), XSD_STRING);
    addSchemaField(schemaType, ANET_SCHEMA_REPORT_ENGAGEMENT_DATE,
        getLabelFromDict(dictPathFormat, ANET_SCHEMA_REPORT_ENGAGEMENT_DATE), XSD_DATETIME);
    if (Boolean.TRUE.equals(getEngagementsIncludeTimeAndDuration())) {
      addSchemaField(schemaType, ANET_SCHEMA_REPORT_ENGAGEMENT_DURATION,
          getLabelFromDict(dictPathFormat, ANET_SCHEMA_REPORT_ENGAGEMENT_DURATION), XSD_DURATION);
    }
    addSchemaField(schemaType, ANET_SCHEMA_REPORT_ENGAGEMENT_STATUS, "Engagement status",
        XSD_STRING);
    addSchemaField(schemaType, ANET_SCHEMA_REPORT_PRIMARY_ADVISOR, "Primary advisor", XSD_STRING);
    addSchemaField(schemaType, ANET_SCHEMA_REPORT_ADVISOR_ORGANIZATION, "Advisor organization",
        XSD_STRING);
    addSchemaField(schemaType, ANET_SCHEMA_REPORT_PRIMARY_INTERLOCUTOR, "Primary interlocutor",
        XSD_STRING);
    addSchemaField(schemaType, ANET_SCHEMA_REPORT_INTERLOCUTOR_ORGANIZATION,
        "Interlocutor organization", XSD_STRING);
    addSchemaField(schemaType, ANET_SCHEMA_REPORT_KEY_OUTCOMES,
        getLabelFromDict(dictPathFormat, ANET_SCHEMA_REPORT_KEY_OUTCOMES), XSD_STRING);
    addSchemaField(schemaType, ANET_SCHEMA_REPORT_NEXT_STEPS,
        getLabelFromDict(dictPathFormat, ANET_SCHEMA_REPORT_NEXT_STEPS), XSD_STRING);

    nvgType.getSchema().add(schemaType);
  }

  private Boolean getEngagementsIncludeTimeAndDuration() {
    return (Boolean) dict.getDictionaryEntry("engagementsIncludeTimeAndDuration");
  }

  private String getLabelFromDict(String dictPath, String key) {
    return (String) dict.getDictionaryEntry(String.format(dictPath, key));
  }

  private void addSchemaField(SchemaType schemaType, String key, String label, String type) {
    final SimpleFieldType simpleFieldType = NVG_OF.createSimpleFieldType();
    simpleFieldType.setId(new QName(URI_NVG_SCHEMA, key));
    simpleFieldType.setType(type);
    simpleFieldType.setLabel(label);
    schemaType.getSimpleField().add(simpleFieldType);
  }

  private PointType reportToNvgPoint(String app6Version,
      boolean includeElementConfidentialityLabels,
      boolean addElementConfidentialityLabelsAsMetadata,
      ConfidentialityRecord defaultConfidentiality, Instant reportingTime, Report report) {
    final PointType nvgPoint = NVG_OF.createPointType();
    nvgPoint.setLabel(Utils.ellipsizeOnWords(report.getIntent(),
        Utils.orIfNull((Integer) dict.getDictionaryEntry("fields.report.intent.maxLength"), 40)));
    nvgPoint.setUri(String.format("urn:anet:reports:%1$s", report.getUuid()));
    nvgPoint.setTimeStamp(getTimeStamp(report.getUpdatedAt()));
    setLocation(report, nvgPoint);
    setSymbol(app6Version, reportingTime, report, nvgPoint);
    nvgPoint.setHref(String.format("%s/reports/%s", config.getServerUrl(), report.getUuid()));
    setExtendedData(report, nvgPoint);

    if (includeElementConfidentialityLabels) {
      setConfidentialityInformation(addElementConfidentialityLabelsAsMetadata,
          ConfidentialityRecord.create(dict, defaultConfidentiality, report), nvgPoint);
    }

    return nvgPoint;
  }

  private void setExtendedData(Report report, PointType nvgPoint) {
    final ExtendedDataType extendedDataType = NVG_OF.createExtendedDataType();
    final SimpleDataSectionType simpleDataSectionType = NVG_OF.createSimpleDataSectionType();
    simpleDataSectionType.setSchemaRef("#" + URI_ANET_SCHEMAS_REPORT);

    addStringField(simpleDataSectionType, ANET_SCHEMA_REPORT_INTENT, report.getIntent());
    addDateTimeField(simpleDataSectionType, ANET_SCHEMA_REPORT_ENGAGEMENT_DATE,
        report.getEngagementDate());
    if (Boolean.TRUE.equals(getEngagementsIncludeTimeAndDuration())) {
      addDurationField(simpleDataSectionType, ANET_SCHEMA_REPORT_ENGAGEMENT_DURATION,
          report.getDuration());
    }
    addStringField(simpleDataSectionType, ANET_SCHEMA_REPORT_ENGAGEMENT_STATUS,
        getEngagementStatus(report));
    addStringField(simpleDataSectionType, ANET_SCHEMA_REPORT_PRIMARY_ADVISOR,
        getPersonName(report.getPrimaryAdvisor()));
    addStringField(simpleDataSectionType, ANET_SCHEMA_REPORT_ADVISOR_ORGANIZATION,
        getOrganizationName(report.getAdvisorOrg()));
    addStringField(simpleDataSectionType, ANET_SCHEMA_REPORT_PRIMARY_INTERLOCUTOR,
        getPersonName(report.getPrimaryInterlocutor()));
    addStringField(simpleDataSectionType, ANET_SCHEMA_REPORT_INTERLOCUTOR_ORGANIZATION,
        getOrganizationName(report.getInterlocutorOrg()));
    addStringField(simpleDataSectionType, ANET_SCHEMA_REPORT_KEY_OUTCOMES, report.getKeyOutcomes());
    addStringField(simpleDataSectionType, ANET_SCHEMA_REPORT_NEXT_STEPS, report.getNextSteps());
    extendedDataType.getSection().add(simpleDataSectionType);
    nvgPoint.setExtendedData(extendedDataType);
  }

  private String getEngagementStatus(Report report) {
    return report.isFutureEngagement() ? "Planned" : "Past";
  }

  private String getPersonName(Person person) {
    return person == null ? "<Unknown>" : person.getName();
  }

  private String getOrganizationName(Organization organization) {
    return organization == null ? "<Unknown>" : organization.getShortName();
  }

  private void addStringField(SimpleDataSectionType simpleDataSectionType, String key,
      String string) {
    final SimpleDataType stringType = NVG_OF.createSimpleDataType();
    stringType.setKey(new QName(URI_NVG_SCHEMA, key));
    stringType.setValue(string);
    simpleDataSectionType.getSimpleData().add(stringType);
  }

  private void addDateTimeField(SimpleDataSectionType simpleDataSectionType, String key,
      Instant instant) {
    final XMLGregorianCalendar dateTime = getTimeStamp(instant);
    final SimpleDataType dateTimeType = NVG_OF.createSimpleDataType();
    dateTimeType.setKey(new QName(URI_NVG_SCHEMA, key));
    dateTimeType.setValue(dateTime == null ? null : dateTime.toXMLFormat());
    simpleDataSectionType.getSimpleData().add(dateTimeType);
  }

  private void addDurationField(SimpleDataSectionType simpleDataSectionType, String key,
      Integer duration) {
    final SimpleDataType durationType = NVG_OF.createSimpleDataType();
    durationType.setKey(new QName(URI_NVG_SCHEMA, key));
    durationType.setValue(duration == null ? null : String.format("PT%dM", duration));
    simpleDataSectionType.getSimpleData().add(durationType);
  }

  private void setConfidentialityInformation(boolean addAsMetadata,
      ConfidentialityRecord confidentiality, PointType nvgPoint) {
    if (!Utils.isEmptyOrNull(confidentiality.policy())) {
      final ExtensionType extensionType = NVG_OF.createExtensionType();
      extensionType.getAny().add(getBindingInformation(confidentiality));
      if (addAsMetadata) {
        nvgPoint.setMetadata(extensionType);
      } else {
        nvgPoint.setExtension(extensionType);
      }
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

  private XMLGregorianCalendar getTimeStamp(Instant instant) {
    if (instant == null) {
      return null;
    }
    try {
      final GregorianCalendar gc = new GregorianCalendar(TZ_UTC);
      gc.setTimeInMillis(instant.toEpochMilli());
      return DatatypeFactory.newInstance().newXMLGregorianCalendar(gc);
    } catch (Exception ignored) {
      // No timeStamp
      return null;
    }
  }

  private void setLocation(Report report, PointType nvgPoint) {
    final Location location = report.getLocation();
    nvgPoint.setX(location.getLng());
    nvgPoint.setY(location.getLat());
  }

  private List<Report> getReportsByPeriod(AccessToken at, final Instant start, final Instant end) {
    final Map<String, Object> reportQuery = new HashMap<>(DEFAULT_REPORT_QUERY_VARIABLES);
    reportQuery.put("engagementDateStart", start.toEpochMilli());
    reportQuery.put("engagementDateEnd", end.toEpochMilli());
    final GraphQLRequest graphQLRequest =
        new GraphQLRequest("nvgData", REPORT_QUERY, null, Map.of("reportQuery", reportQuery));
    final Map<String, Object> result =
        graphQLResource.graphql(new AccessTokenPrincipal(at), graphQLRequest, null);
    @SuppressWarnings("unchecked")
    final Map<String, Object> data = (Map<String, Object>) result.get("data");
    final TypeReference<AnetBeanList<Report>> typeRef = new TypeReference<>() {};
    final ObjectMapper defaultMapper = MapperUtils.getDefaultMapper();
    final AnetBeanList<Report> anetBeanList =
        defaultMapper.convertValue(data.get("reportList"), typeRef);
    return anetBeanList.getList();
  }

  private static class NvgConfig {
    private static final String NVG_CAPABILITIES_VERSION = "2.0.0";
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
    private static final String ADD_DOCUMENT_CONFIDENTIALITY_LABEL_AS_METADATA =
        "addDocumentConfidentialityLabelAsMetadata";
    private static final boolean DEFAULT_ADD_DOCUMENT_CONFIDENTIALITY_LABEL_AS_METADATA = true;
    private static final String INCLUDE_ELEMENT_CONFIDENTIALITY_LABELS =
        "includeElementConfidentialityLabels";
    private static final boolean DEFAULT_INCLUDE_ELEMENT_CONFIDENTIALITY_LABELS = false;
    private static final String ADD_ELEMENT_CONFIDENTIALITY_LABELS_AS_METADATA =
        "addElementConfidentialityLabelsAsMetadata";
    private static final boolean DEFAULT_ADD_ELEMENT_CONFIDENTIALITY_LABELS_AS_METADATA = true;

    private String accessToken = null;
    private String app6Version = DEFAULT_APP6_VERSION;
    private int pastDays = DEFAULT_PAST_PERIOD_IN_DAYS;
    private int futureDays = DEFAULT_FUTURE_PERIOD_IN_DAYS;
    private boolean includeDocumentConfidentialityLabel =
        DEFAULT_INCLUDE_DOCUMENT_CONFIDENTIALITY_LABEL;
    private boolean addDocumentConfidentialityLabelAsMetadata =
        DEFAULT_ADD_DOCUMENT_CONFIDENTIALITY_LABEL_AS_METADATA;
    private boolean includeElementConfidentialityLabels =
        DEFAULT_INCLUDE_ELEMENT_CONFIDENTIALITY_LABELS;
    private boolean addElementConfidentialityLabelsAsMetadata =
        DEFAULT_ADD_ELEMENT_CONFIDENTIALITY_LABELS_AS_METADATA;

    public static NvgCapabilitiesType getCapabilities() {
      final NvgCapabilitiesType nvgCapabilitiesType = NVG_OF.createNvgCapabilitiesType();
      nvgCapabilitiesType.setVersion(NVG_CAPABILITIES_VERSION);
      final List<CapabilityItemType> capabilityItemTypeList =
          nvgCapabilitiesType.getInputOrSelectOrTable();
      capabilityItemTypeList.add(makeAccessTokenType());
      capabilityItemTypeList.add(makeApp6VersionType());
      capabilityItemTypeList.add(makePastPeriodInDays());
      capabilityItemTypeList.add(makeFuturePeriodInDays());
      capabilityItemTypeList.add(makeIncludeDocumentConfidentialityLabel());
      capabilityItemTypeList.add(makeAddDocumentConfidentialityLabelAsMetadata());
      capabilityItemTypeList.add(makeIncludeElementConfidentialityLabels());
      capabilityItemTypeList.add(makeAddElementConfidentialityLabelsAsMetadata());
      return nvgCapabilitiesType;
    }

    public static NvgConfig from(List<Object> nvgQueryList) throws ResponseStatusException {
      final NvgConfig nvgConfig = new NvgConfig();
      for (final Object object : nvgQueryList) {
        if (object instanceof InputResponseType inputResponse) {
          if (ACCESS_TOKEN_ID.equals(inputResponse.getRefid())) {
            nvgConfig.setAccessToken(inputResponse.getValue());
          } else if (APP6_VERSION_ID.equals(inputResponse.getRefid())) {
            nvgConfig.setApp6Version(inputResponse.getValue());
          } else if (PAST_PERIOD_IN_DAYS_ID.equals(inputResponse.getRefid())) {
            nvgConfig.setPastDays(Integer.parseInt(inputResponse.getValue()));
          } else if (FUTURE_PERIOD_IN_DAYS_ID.equals(inputResponse.getRefid())) {
            nvgConfig.setFutureDays(Integer.parseInt(inputResponse.getValue()));
          } else if (INCLUDE_DOCUMENT_CONFIDENTIALITY_LABEL.equals(inputResponse.getRefid())) {
            nvgConfig.setIncludeDocumentConfidentialityLabel(
                Boolean.parseBoolean(inputResponse.getValue()));
          } else if (ADD_DOCUMENT_CONFIDENTIALITY_LABEL_AS_METADATA
              .equals(inputResponse.getRefid())) {
            nvgConfig.setAddDocumentConfidentialityLabelAsMetadata(
                Boolean.parseBoolean(inputResponse.getValue()));
          } else if (INCLUDE_ELEMENT_CONFIDENTIALITY_LABELS.equals(inputResponse.getRefid())) {
            nvgConfig.setIncludeElementConfidentialityLabels(
                Boolean.parseBoolean(inputResponse.getValue()));
          } else if (ADD_ELEMENT_CONFIDENTIALITY_LABELS_AS_METADATA
              .equals(inputResponse.getRefid())) {
            nvgConfig.setAddElementConfidentialityLabelsAsMetadata(
                Boolean.parseBoolean(inputResponse.getValue()));
          } else {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Unrecognized input_response: " + inputResponse.getRefid());
          }
        }
      }
      return nvgConfig;
    }

    private static InputType makeAccessTokenType() {
      final InputType inputType = NVG_OF.createInputType();
      inputType.setId(ACCESS_TOKEN_ID);
      inputType.setRequired(true);
      inputType.setType(InputTypeType.STRING);
      inputType.setName("Web Service Access Token");
      inputType.setLength(BigInteger.valueOf(ACCESS_TOKEN_LENGTH));
      final HelpType helpType = NVG_OF.createHelpType();
      helpType.setText(
          "The web service access token required for authentication; the token can be provided by the ANET administrator");
      inputType.setHelp(helpType);
      return inputType;
    }

    private static SelectType makeApp6VersionType() {
      final SelectType selectType = NVG_OF.createSelectType();
      selectType.setId(APP6_VERSION_ID);
      selectType.setRequired(false);
      selectType.setName("APP-6 version");
      final SelectType.Values values = NVG_OF.createSelectTypeValues();
      App6Symbology.VALID_APP6_VERSIONS.forEach(app6Version -> values.getValue()
          .add(getSelectValueType(app6Version, App6Symbology.getVersionHelp(app6Version),
              DEFAULT_APP6_VERSION.equals(app6Version))));
      selectType.setValues(values);
      final HelpType helpType = NVG_OF.createHelpType();
      helpType.setText("The APP-6 version to use for the symbology");
      selectType.setHelp(helpType);
      return selectType;
    }

    private static SelectValueType getSelectValueType(String id, String value, boolean selected) {
      final SelectValueType selectValueType = NVG_OF.createSelectValueType();
      selectValueType.setId(id);
      selectValueType.setName(value);
      selectValueType.setSelected(selected);
      return selectValueType;
    }

    private static InputType makePastPeriodInDays() {
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

    private static InputType makeFuturePeriodInDays() {
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

    private static InputType makeIncludeDocumentConfidentialityLabel() {
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

    private static InputType makeAddDocumentConfidentialityLabelAsMetadata() {
      final InputType inputType = NVG_OF.createInputType();
      inputType.setId(ADD_DOCUMENT_CONFIDENTIALITY_LABEL_AS_METADATA);
      inputType.setRequired(false);
      inputType.setType(InputTypeType.BOOLEAN);
      inputType.setName("Where to add document confidentiality label");
      inputType.setDefault(String.valueOf(DEFAULT_ADD_DOCUMENT_CONFIDENTIALITY_LABEL_AS_METADATA));
      final HelpType helpType = NVG_OF.createHelpType();
      helpType.setText(
          "When included, add the document confidentiality label as <nvg:metadata> (default) or <nvg:extension>");
      inputType.setHelp(helpType);
      return inputType;
    }

    private static InputType makeIncludeElementConfidentialityLabels() {
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

    private static InputType makeAddElementConfidentialityLabelsAsMetadata() {
      final InputType inputType = NVG_OF.createInputType();
      inputType.setId(ADD_ELEMENT_CONFIDENTIALITY_LABELS_AS_METADATA);
      inputType.setRequired(false);
      inputType.setType(InputTypeType.BOOLEAN);
      inputType.setName("Where to add point confidentiality labels");
      inputType.setDefault(String.valueOf(DEFAULT_ADD_ELEMENT_CONFIDENTIALITY_LABELS_AS_METADATA));
      final HelpType helpType = NVG_OF.createHelpType();
      helpType.setText(
          "When included, add each point's confidentiality label as <nvg:metadata> (default) or <nvg:extension>");
      inputType.setHelp(helpType);
      return inputType;
    }

    public String getAccessToken() {
      return accessToken;
    }

    public void setAccessToken(String accessToken) {
      this.accessToken = accessToken;
    }

    public String getApp6Version() {
      return app6Version;
    }

    public void setApp6Version(String app6Version) {
      this.app6Version = app6Version;
    }

    public int getPastDays() {
      return pastDays;
    }

    public void setPastDays(int pastDays) {
      this.pastDays = pastDays;
    }

    public int getFutureDays() {
      return futureDays;
    }

    public void setFutureDays(int futureDays) {
      this.futureDays = futureDays;
    }

    public boolean isIncludeDocumentConfidentialityLabel() {
      return includeDocumentConfidentialityLabel;
    }

    public void setIncludeDocumentConfidentialityLabel(
        boolean includeDocumentConfidentialityLabel) {
      this.includeDocumentConfidentialityLabel = includeDocumentConfidentialityLabel;
    }

    public boolean isAddDocumentConfidentialityLabelAsMetadata() {
      return addDocumentConfidentialityLabelAsMetadata;
    }

    public void setAddDocumentConfidentialityLabelAsMetadata(
        boolean addDocumentConfidentialityLabelAsMetadata) {
      this.addDocumentConfidentialityLabelAsMetadata = addDocumentConfidentialityLabelAsMetadata;
    }

    public boolean isIncludeElementConfidentialityLabels() {
      return includeElementConfidentialityLabels;
    }

    public void setIncludeElementConfidentialityLabels(
        boolean includeElementConfidentialityLabels) {
      this.includeElementConfidentialityLabels = includeElementConfidentialityLabels;
    }

    public boolean isAddElementConfidentialityLabelsAsMetadata() {
      return addElementConfidentialityLabelsAsMetadata;
    }

    public void setAddElementConfidentialityLabelsAsMetadata(
        boolean addElementConfidentialityLabelsAsMetadata) {
      this.addElementConfidentialityLabelsAsMetadata = addElementConfidentialityLabelsAsMetadata;
    }
  }
}
