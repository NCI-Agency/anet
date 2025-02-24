package mil.dds.anet.test.integration.mart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.powermock.api.mockito.PowerMockito.when;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import microsoft.exchange.webservices.data.core.exception.service.local.ServiceLocalException;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;
import microsoft.exchange.webservices.data.core.service.item.Item;
import microsoft.exchange.webservices.data.property.complex.Attachment;
import microsoft.exchange.webservices.data.property.complex.AttachmentCollection;
import microsoft.exchange.webservices.data.property.complex.FileAttachment;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.mart.ReportDto;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.MartImportedReportDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Person;
import mil.dds.anet.test.client.Atmosphere;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonSearchQueryInput;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.test.resources.PersonResourceTest;
import mil.dds.anet.test.resources.ReportResourceTest;
import mil.dds.anet.threads.mart.MartImporterWorker;
import mil.dds.anet.threads.mart.services.IMailReceiver;
import mil.dds.anet.threads.mart.services.IMartReportImporterService;
import mil.dds.anet.threads.mart.services.IMartTransmissionLogImporterService;
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;

class MartReportImporterWorkerTest extends AbstractResourceTest {
  private static final String ATTACHMENT_NAME = "default_avatar.png";
  private static final ObjectMapper ignoringMapper = MapperUtils.getDefaultMapper()
      .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

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

  @BeforeAll
  void setUp() throws Exception {
    final boolean executeMartReportImporterTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("martReportImporterTestsExecute").toString());
    assumeTrue(executeMartReportImporterTests, "Mart importer tests configured to be skipped.");

    EmailMessage emailMessage1 = createReportMockEmail(TestData.createGoodMartReport(1), true);
    EmailMessage emailMessage2 = createReportMockEmail(TestData.createGoodMartReport(2), true);
    EmailMessage emailMessage3 =
        createReportMockEmail(TestData.createMartReportWrongOrganization(3), false);
    EmailMessage emailMessage4 =
        createReportMockEmail(TestData.createMartReportWrongLocation(4), false);
    EmailMessage emailMessage5 =
        createReportMockEmail(TestData.createMartReportCompletelyWrong(5), false);
    EmailMessage emailMessage6 =
        createReportMockEmail(TestData.createGoodMartReportWithUnknownTask(6), true);
    EmailMessage emailMessage7 = createTransmissionLogMockEmail();

    EmailMessage emailMessage8 =
        createReportMockEmail(TestData.createRetryOfMissingReport(8), true);

    // Mock the mail exchange server
    // First six emails are reports
    // Then transmission log is received twice - should only result in one new record in
    // MartImportedReports
    IMailReceiver iMailReceiverMock = Mockito.mock();
    when(iMailReceiverMock.downloadEmails()).thenReturn(List.of(emailMessage1, emailMessage2,
        emailMessage3, emailMessage4, emailMessage5, emailMessage6, emailMessage7, emailMessage7),
        List.of(emailMessage8));

    martReportImporterWorker = new MartImporterWorker(dict, jobHistoryDao, iMailReceiverMock,
        martReportImporterService, martTransmissionLogImporterService);
  }

  /**
   * Test the worker
   *
   */
  @Test
  void testWorker() {
    martReportImporterWorker.run();
    ReportDto goodReport = TestData.createGoodMartReport(1);
    // We have a person
    final PersonSearchQueryInput queryPerson =
        PersonSearchQueryInput.builder().withOrgUuid(List.of(goodReport.getOrganizationUuid()))
            .withEmailNetwork("Internet").withHasBiography(false).withRank("OF-6").build();
    final AnetBeanList_Person searchResults = withCredentials("arthur",
        t -> queryExecutor.personList(getListFields(PersonResourceTest.FIELDS), queryPerson));
    assertThat(searchResults.getTotalCount()).isPositive();
    Person person = searchResults.getList().get(0);
    assertThat(person.getPosition().getName()).isEqualTo(goodReport.getPositionName());

    // We successfully imported one report
    final mil.dds.anet.test.client.Report createdReport = withCredentials("arthur",
        t -> queryExecutor.report(ReportResourceTest.FIELDS, goodReport.getUuid()));
    assertThat(createdReport).isNotNull();
    assertThat(createdReport.getUuid()).isEqualTo(goodReport.getUuid());
    assertThat(createdReport.getIntent()).isEqualTo(goodReport.getIntent());
    assertThat(createdReport.getAtmosphere()).isEqualTo(Atmosphere.POSITIVE);
    assertThat(createdReport.getLocation().getUuid()).isEqualTo(goodReport.getLocationUuid());
    assertThat(createdReport.getAdvisorOrg().getUuid()).isEqualTo(goodReport.getOrganizationUuid());
    assertThat(createdReport.getAuthors()).hasSize(1);
    assertThat(createdReport.getAuthors().get(0).getName()).isEqualTo(person.getName());
    assertThat(createdReport.getTasks()).hasSize(1);
    assertThat(createdReport.getAttachments()).hasSize(1);
    assertThat(createdReport.getAttachments().get(0).getFileName()).isEqualTo(ATTACHMENT_NAME);
    assertThat(createdReport.getTasks().get(0).getLongName()).isEqualTo("Intelligence");

    // Eight new records in MartImportedReports, verify them
    List<MartImportedReport> martImportedReports = martImportedReportDao.getAll();

    List<MartImportedReport> reportList = martImportedReports.stream()
        .filter(martImportedReport -> martImportedReport.isSuccess()
            && martImportedReport.getSequence().equals(1L)
            && martImportedReport.getReportUuid().equals(goodReport.getUuid())
            && martImportedReport.getPersonUuid().equals(person.getUuid())
            && martImportedReport.getErrors() == null)
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    reportList = martImportedReports.stream()
        .filter(martImportedReport -> !martImportedReport.isSuccess()
            && martImportedReport.getSequence().equals(2L) && martImportedReport.getErrors() != null
            && martImportedReport.getErrors().equals(
                "Report with UUID 231196f5-3b13-45ea-9d73-524d042b16e7 has already been imported"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    reportList = martImportedReports.stream().filter(martImportedReport -> !martImportedReport
        .isSuccess() && martImportedReport.getSequence().equals(3L)
        && martImportedReport.getErrors() != null
        && martImportedReport.getErrors()
            .equals("While importing report fb875171-2501-46c9-9246-60dafabb656d:"
                + "<ul><li>Can not find submitter organization: 'does not exist' with uuid: does not exist</li></ul>"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    reportList = martImportedReports.stream().filter(martImportedReport -> !martImportedReport
        .isSuccess() && martImportedReport.getSequence().equals(4L)
        && martImportedReport.getErrors() != null
        && martImportedReport.getErrors()
            .equals("While importing report 2d6c7a19-d878-4792-bdaf-7a73dc3bfc83:"
                + "<ul><li>Can not find report location: 'does not exist' with uuid: does not exist</li></ul>"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    reportList = martImportedReports.stream().filter(martImportedReport -> !martImportedReport
        .isSuccess() && martImportedReport.getSequence().equals(5L)
        && martImportedReport.getErrors() != null
        && martImportedReport.getErrors()
            .equals("While importing report 68077002-b766-4a79-bcf2-40b7dbffe6e6:"
                + "<ul><li>Can not find submitter organization: 'does not exist' with uuid: does not exist</li>"
                + "<li>Can not find report location: 'does not exist' with uuid: does not exist</li></ul>"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    reportList = martImportedReports.stream().filter(martImportedReport -> martImportedReport
        .isSuccess() && martImportedReport.getSequence().equals(6L)
        && martImportedReport.getErrors() != null
        && martImportedReport.getErrors()
            .equals("While importing report 34faac7c-8c85-4dec-8e9f-57d9254b5ae2:"
                + "<ul><li>Can not find task: 'does not exist' with uuid: does not exist</li></ul>"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    // The transmission log has also been processed resulting in two MART imported reports added
    // only once
    reportList = martImportedReports.stream().filter(martImportedReport -> !martImportedReport
        .isSuccess() && martImportedReport.getSequence().equals(7L)
        && martImportedReport.getErrors() != null
        && martImportedReport.getReportUuid().equals("missingReportUuid")
        && martImportedReport.getErrors().equals(
            "MART was unable to send this report: missingReportUuid due to this error: SMTP error sending email in MART"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();
    reportList = martImportedReports.stream()
        .filter(martImportedReport -> !martImportedReport.isSuccess()
            && martImportedReport.getSequence().equals(8L) && martImportedReport.getErrors() != null
            && martImportedReport.getReportUuid().equals("missingReportUuid2") && martImportedReport
                .getErrors().equals("This report was lost in transmission: missingReportUuid2"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    // Now we will run again and will pick up the report with sequence 8 that have been marked as
    // lost processing the transmission log
    // but finally came
    martReportImporterWorker.run();
    martImportedReports = martImportedReportDao.getAll();
    reportList = martImportedReports.stream()
        .filter(martImportedReport -> martImportedReport.isSuccess()
            && martImportedReport.getSequence().equals(8L) && martImportedReport.getErrors() == null
            && martImportedReport.getReportUuid().equals("missingReportUuid2"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();
  }

  private EmailMessage createReportMockEmail(ReportDto reportDto, boolean withAttachment)
      throws ServiceLocalException, IOException {
    final AttachmentCollection attachmentCollection = Mockito.mock(AttachmentCollection.class);
    final EmailMessage emailMessageMock = Mockito.mock();

    FileAttachment mockAttachmentJson = Mockito.mock(FileAttachment.class);
    when(mockAttachmentJson.getOwner()).thenReturn(Mockito.mock(Item.class));
    when(mockAttachmentJson.getContent())
        .thenReturn(ignoringMapper.writeValueAsString(reportDto).getBytes(StandardCharsets.UTF_8));
    when(mockAttachmentJson.getName()).thenReturn(MartImporterWorker.REPORT_JSON_ATTACHMENT);

    List<Attachment> attachmentList = new ArrayList<>();
    attachmentList.add(mockAttachmentJson);
    if (withAttachment) {
      FileAttachment mockAttachmentImage = Mockito.mock(FileAttachment.class);
      when(mockAttachmentImage.getOwner()).thenReturn(Mockito.mock(Item.class));
      when(mockAttachmentImage.getContent()).thenReturn(IOUtils.toByteArray(Objects.requireNonNull(
          this.getClass().getClassLoader().getResourceAsStream("assets/default_avatar.png"))));
      when(mockAttachmentImage.getName()).thenReturn(ATTACHMENT_NAME);
      when(mockAttachmentImage.getContentType()).thenReturn("image/png");
      attachmentList.add(mockAttachmentImage);
    }

    when(attachmentCollection.iterator()).thenReturn(attachmentList.iterator());
    when(emailMessageMock.getAttachments()).thenReturn(attachmentCollection, attachmentCollection);

    return emailMessageMock;
  }

  private EmailMessage createTransmissionLogMockEmail() throws ServiceLocalException, IOException {
    final AttachmentCollection attachmentCollection = Mockito.mock(AttachmentCollection.class);
    final EmailMessage emailMessageMock = Mockito.mock();

    FileAttachment mockAttachmentJson = Mockito.mock(FileAttachment.class);
    when(mockAttachmentJson.getOwner()).thenReturn(Mockito.mock(Item.class));
    when(mockAttachmentJson.getContent()).thenReturn(ignoringMapper
        .writeValueAsString(TestData.createTransmissionLog()).getBytes(StandardCharsets.UTF_8));
    when(mockAttachmentJson.getName()).thenReturn(MartImporterWorker.TRANSMISSION_LOG_ATTACHMENT);

    List<Attachment> attachmentList = new ArrayList<>();
    attachmentList.add(mockAttachmentJson);

    when(attachmentCollection.iterator()).thenReturn(attachmentList.iterator());

    when(emailMessageMock.getAttachments()).thenReturn(attachmentCollection, attachmentCollection);
    return emailMessageMock;
  }
}
