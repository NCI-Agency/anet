package mil.dds.anet.test.integration.mart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import microsoft.exchange.webservices.data.core.exception.service.local.ServiceLocalException;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;
import microsoft.exchange.webservices.data.core.service.item.Item;
import microsoft.exchange.webservices.data.property.complex.Attachment;
import microsoft.exchange.webservices.data.property.complex.AttachmentCollection;
import microsoft.exchange.webservices.data.property.complex.FileAttachment;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.LogDto;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.mart.ReportDto;
import mil.dds.anet.beans.search.MartImportedReportSearchQuery;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.MartImportedReportDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.services.IMailReceiver;
import mil.dds.anet.services.IMartReportImporterService;
import mil.dds.anet.services.IMartTransmissionLogImporterService;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.threads.mart.MartImporterWorker;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.cfg.DateTimeFeature;

class MartTransmissionLogImporterWorkerTest extends AbstractResourceTest {
  private final ObjectMapper ignoringMapper = MapperUtils.getDefaultMapper().rebuild()
      .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
      .disable(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS).build();

  @Autowired
  protected AnetConfig config;
  @Autowired
  protected AnetDictionary dict;
  @Autowired
  private JobHistoryDao jobHistoryDao;
  @Autowired
  private MartImportedReportDao martImportedReportDao;
  @Autowired
  private IMartReportImporterService martReportImporterService;
  @Autowired
  private IMartTransmissionLogImporterService martTransmissionLogImporterService;

  private MartImporterWorker martReportImporterWorker = null;

  private static final String TEST_REPORT_UUID = "transmissionLogTestReportUuid";
  private static final long SEQUENCE_ERROR = 2137;
  private static final long SEQUENCE_OK = 2138;

  @BeforeAll
  void setUp() throws Exception {
    final boolean executeMartReportImporterTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("martReportImporterTestsExecute").toString());
    assumeTrue(executeMartReportImporterTests, "Mart importer tests configured to be skipped.");

    // Transmission logs
    final EmailMessage reportMessage1 =
        createReportMockEmail(createMartReportForTransmissionLogTest());
    final EmailMessage transmissionLogMessage = createTransmissionLogMockEmail(
        createTransmissionLog(Instant.now().minus(2, ChronoUnit.DAYS)));
    final EmailMessage transmissionLogMessage2 = createTransmissionLogMockEmail(
        createTransmissionLog(Instant.now().minus(3, ChronoUnit.DAYS)));
    final EmailMessage transmissionLogMessage3 = createTransmissionLogMockEmail(
        createTransmissionLog(Instant.now().minus(4, ChronoUnit.DAYS)));
    final EmailMessage transmissionLogMessage4 = createTransmissionLogMockEmail(
        createTransmissionLog(Instant.now().minus(5, ChronoUnit.DAYS)));
    // Mock the mail exchange server
    final IMailReceiver mailReceiverMock = Mockito.mock();
    when(mailReceiverMock.downloadEmails())
        .thenReturn(List.of(reportMessage1, transmissionLogMessage, transmissionLogMessage2,
            transmissionLogMessage3, transmissionLogMessage4));

    martReportImporterWorker = new MartImporterWorker(dict, jobHistoryDao, mailReceiverMock,
        martReportImporterService, martTransmissionLogImporterService);
  }

  @AfterEach
  void cleanImportLog() {
    final MartImportedReportSearchQuery query = new MartImportedReportSearchQuery();
    query.setSequences(List.of(SEQUENCE_ERROR, SEQUENCE_OK));
    martImportedReportDao.search(query).getList().forEach(r -> {
      martImportedReportDao.delete(r);
    });
  }

  @Test
  void testWorker() {
    martReportImporterWorker.run();

    AnetBeanList<MartImportedReport> martImportedReportsList =
        martImportedReportDao.search(new MartImportedReportSearchQuery());
    Optional<MartImportedReport> martImportedReportOpt = martImportedReportsList.getList().stream()
        .filter(mir -> mir.getReportUuid().equals(TEST_REPORT_UUID)).findFirst();
    assertThat(martImportedReportOpt.isPresent());
    MartImportedReport martImportedReport = martImportedReportOpt.get();
    assertThat(martImportedReport.getSequence()).isEqualTo(SEQUENCE_OK);
    assertThat(martImportedReport.getHistoryCount()).isEqualTo(2);

    MartImportedReportSearchQuery searchQuery = new MartImportedReportSearchQuery();
    searchQuery.setReportUuid(TEST_REPORT_UUID);
    martImportedReportsList = martImportedReportDao.search(searchQuery);
    assertThat(martImportedReportsList.getTotalCount()).isEqualTo(2);
  }

  private EmailMessage createTransmissionLogMockEmail(List<LogDto> transmissionLog)
      throws ServiceLocalException {
    final AttachmentCollection attachmentCollection = Mockito.mock(AttachmentCollection.class);
    final EmailMessage emailMessageMock = Mockito.mock();

    FileAttachment mockAttachmentJson = Mockito.mock(FileAttachment.class);
    when(mockAttachmentJson.getOwner()).thenReturn(Mockito.mock(Item.class));
    when(mockAttachmentJson.getContent()).thenReturn(
        ignoringMapper.writeValueAsString(transmissionLog).getBytes(StandardCharsets.UTF_8));
    when(mockAttachmentJson.getName()).thenReturn(MartImporterWorker.TRANSMISSION_LOG_ATTACHMENT);

    List<Attachment> attachmentList = new ArrayList<>();
    attachmentList.add(mockAttachmentJson);

    when(attachmentCollection.iterator()).thenReturn(attachmentList.iterator());

    when(emailMessageMock.getAttachments()).thenReturn(attachmentCollection, attachmentCollection);
    return emailMessageMock;
  }

  private EmailMessage createReportMockEmail(ReportDto reportDto) throws ServiceLocalException {
    final AttachmentCollection attachmentCollection = Mockito.mock(AttachmentCollection.class);
    final EmailMessage emailMessageMock = Mockito.mock();
    FileAttachment mockAttachmentJson = Mockito.mock(FileAttachment.class);
    when(mockAttachmentJson.getOwner()).thenReturn(Mockito.mock(Item.class));
    when(mockAttachmentJson.getContent())
        .thenReturn(ignoringMapper.writeValueAsString(reportDto).getBytes(StandardCharsets.UTF_8));
    when(mockAttachmentJson.getName()).thenReturn(MartImporterWorker.REPORT_JSON_ATTACHMENT);
    List<Attachment> attachmentList = new ArrayList<>();
    attachmentList.add(mockAttachmentJson);
    when(attachmentCollection.iterator()).thenReturn(attachmentList.iterator());
    when(emailMessageMock.getAttachments()).thenReturn(attachmentCollection, attachmentCollection);
    return emailMessageMock;
  }

  public static List<LogDto> createTransmissionLog(Instant submittedAt) {
    final List<LogDto> transmissionLog = new ArrayList<>();
    final LogDto logDto1 = new LogDto();
    logDto1.setState(LogDto.LogState.SENT.getCode());
    logDto1.setSequence(SEQUENCE_ERROR);
    logDto1.setErrors("SMTP error sending email in MART");
    logDto1.setSubmittedAt(submittedAt);
    logDto1.setReportUuid(TEST_REPORT_UUID);
    final LogDto logDto2 = new LogDto();
    logDto2.setState(LogDto.LogState.SENT.getCode());
    logDto2.setSequence(SEQUENCE_OK);
    logDto2.setSubmittedAt(submittedAt);
    logDto2.setReportUuid(TEST_REPORT_UUID);
    transmissionLog.add(logDto1);
    transmissionLog.add(logDto2);
    return transmissionLog;
  }

  public static ReportDto createMartReportForTransmissionLogTest() {
    final ReportDto reportDto = new ReportDto();
    // User Info
    reportDto.setSequence(SEQUENCE_OK);
    reportDto.setUuid(TEST_REPORT_UUID);
    reportDto.setOrganizationUuid("9a35caa7-a095-4963-ac7b-b784fde4d583");
    reportDto.setOrganizationName("Planning Programming, Budgeting and Execution");
    reportDto.setRank("OF-6");
    reportDto.setEmail("mart-user@kfor.nato.int");
    reportDto.setFirstName("Larry");
    reportDto.setLastName("Bird");
    reportDto.setPositionName("MART Team Member");
    return reportDto;
  }
}
