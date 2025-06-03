package mil.dds.anet.test.integration.mart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import microsoft.exchange.webservices.data.core.exception.service.local.ServiceLocalException;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;
import microsoft.exchange.webservices.data.core.service.item.Item;
import microsoft.exchange.webservices.data.property.complex.Attachment;
import microsoft.exchange.webservices.data.property.complex.AttachmentCollection;
import microsoft.exchange.webservices.data.property.complex.FileAttachment;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
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
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
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
  private Set<Long> existingSequences = Set.of();

  private final String missingReportUuid1 = "missingReportUuid1";
  private final String missingReportUuid2 = "missingReportUuid2";

  @BeforeAll
  void setUp() throws Exception {
    final boolean executeMartReportImporterTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("martReportImporterTestsExecute").toString());
    assumeTrue(executeMartReportImporterTests, "Mart importer tests configured to be skipped.");

    existingSequences =
        martImportedReportDao.getMartImportedReports(new MartImportedReportSearchQuery()).getList()
            .stream().map(MartImportedReport::getSequence).collect(Collectors.toSet());
    long sequence = getMaxExistingSequence();

    // Good report
    final EmailMessage reportMessage1 =
        createReportMockEmail(TestData.createGoodMartReport(++sequence), true);
    // Retransmit of good report
    final EmailMessage reportMessage1dup =
        createReportMockEmail(TestData.createGoodMartReport(sequence), true);
    // Several reports with errors
    final EmailMessage reportMessage2 =
        createReportMockEmail(TestData.createMartReportWrongOrganization(++sequence), false);
    final EmailMessage reportMessage3 =
        createReportMockEmail(TestData.createMartReportWrongLocation(++sequence), false);
    final EmailMessage reportMessage4 =
        createReportMockEmail(TestData.createMartReportCompletelyWrong(++sequence), false);
    final EmailMessage reportMessage5 = createReportMockEmail(
        TestData.createGoodMartReportWithUnknownTaskAndMissingSecurityMarking(++sequence), true);
    final EmailMessage reportMessage6 = createReportMockEmail(
        TestData.createMartReportWithSecurityMarkingNotInDictionary(++sequence), false);
    // Transmission log
    final EmailMessage transmissionLogMessage = createTransmissionLogMockEmail(sequence);
    // Send a new report
    final EmailMessage reportMessage8 = createReportMockEmail(
        TestData.createRetryOfMissingReport(sequence + 2, missingReportUuid2), true);

    // Mock the mail exchange server
    final IMailReceiver mailReceiverMock = Mockito.mock();
    when(mailReceiverMock.downloadEmails()).thenReturn(
        // reports and a transmission log (for 8 reports)
        List.of(reportMessage1, reportMessage1dup, reportMessage2, reportMessage3, reportMessage4,
            reportMessage5, reportMessage6, transmissionLogMessage),
        // 8th report
        List.of(reportMessage8));

    martReportImporterWorker = new MartImporterWorker(dict, jobHistoryDao, mailReceiverMock,
        martReportImporterService, martTransmissionLogImporterService);
  }

  @BeforeEach
  @AfterEach
  void cleanImportLog() {
    martImportedReportDao.getMartImportedReports(new MartImportedReportSearchQuery()).getList()
        .forEach(r -> {
          if (!existingSequences.contains(r.getSequence())) {
            martImportedReportDao.delete(r);
          }
        });
  }

  private Long getMaxExistingSequence() {
    return existingSequences.stream().max(Long::compareTo).orElse(0L);
  }

  /**
   * Test the worker
   *
   */
  @Test
  void testWorker() {
    martReportImporterWorker.run();
    ReportDto goodReport = TestData.createGoodMartReport(1);
    ReportDto reportWithWarnings =
        TestData.createGoodMartReportWithUnknownTaskAndMissingSecurityMarking(2);
    // We have a person
    final PersonSearchQueryInput queryPerson =
        PersonSearchQueryInput.builder().withOrgUuid(List.of(goodReport.getOrganizationUuid()))
            .withEmailNetwork("Internet").withHasBiography(false).withRank("OF-6").build();
    final AnetBeanList_Person searchResults = withCredentials("arthur",
        t -> queryExecutor.personList(getListFields(PersonResourceTest.FIELDS), queryPerson));
    assertThat(searchResults.getTotalCount()).isPositive();
    Person person = searchResults.getList().get(0);
    assertThat(person.getPosition().getName()).isEqualTo(goodReport.getPositionName());

    // We imported one report when everything was fine
    mil.dds.anet.test.client.Report createdReport = withCredentials("arthur",
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
    assertThat(createdReport.getClassification()).isEqualTo("NU");
    // Validate comments in report submitted with warnings
    createdReport = withCredentials("arthur",
        t -> queryExecutor.report(ReportResourceTest.FIELDS, reportWithWarnings.getUuid()));
    assertThat(createdReport.getComments().size()).isOne();
    assertThat(createdReport.getComments().get(0).getText()).isEqualTo(
        "While importing report 34faac7c-8c85-4dec-8e9f-57d9254b5ae2:<ul><li>Security marking is missing</li><li>Can not find task: 'does not exist' with uuid: does not exist</li></ul>");
    // New records in MartImportedReports, verify them
    AnetBeanList<MartImportedReport> martImportedReportsList =
        martImportedReportDao.getMartImportedReports(new MartImportedReportSearchQuery());
    assertThat(martImportedReportsList.getTotalCount()).isEqualTo(9);

    List<MartImportedReport> martImportedReports = martImportedReportsList.getList();
    long sequence = getMaxExistingSequence();

    assertReportSubmittedOK(martImportedReports, ++sequence, goodReport.getUuid(),
        person.getUuid());

    assertReportNotSubmitted(martImportedReports, ++sequence,
        "While importing report fb875171-2501-46c9-9246-60dafabb656d:"
            + "<ul><li>Can not find submitter organization: 'does not exist' with uuid: does not exist</li></ul>");

    assertReportSubmittedWithWarnings(martImportedReports, ++sequence,
        "While importing report 2d6c7a19-d878-4792-bdaf-7a73dc3bfc83:"
            + "<ul><li>Can not find report location: 'does not exist' with uuid: does not exist</li></ul>");

    assertReportNotSubmitted(martImportedReports, ++sequence,
        "While importing report 68077002-b766-4a79-bcf2-40b7dbffe6e6:"
            + "<ul><li>Can not find submitter organization: 'does not exist' with uuid: does not exist</li>"
            + "<li>Can not find report location: 'does not exist' with uuid: does not exist</li></ul>");

    assertReportSubmittedWithWarnings(martImportedReports, ++sequence,
        "While importing report 34faac7c-8c85-4dec-8e9f-57d9254b5ae2:"
            + "<ul><li>Security marking is missing</li>"
            + "<li>Can not find task: 'does not exist' with uuid: does not exist</li></ul>");

    assertReportSubmittedWithWarnings(martImportedReports, ++sequence,
        "While importing report 58e0ff9b-4908-4f2d-8cab-8d64aefff929:"
            + "<ul><li>Can not find report security marking: 'random'</li></ul>");

    // The transmission log has also been processed resulting in two MART imported reports added
    // only once
    assertReportWithUuidAndNotReceived(martImportedReports, ++sequence, missingReportUuid1,
        String.format(
            "MART was unable to send this report: %s due to this error: SMTP error sending email in MART",
            missingReportUuid1));

    assertReportWithUuidAndNotReceived(martImportedReports, ++sequence, missingReportUuid2,
        String.format("This report was lost in transmission: %s", missingReportUuid2));

    // Now we will run again and will pick up the report with the same sequence that has been marked
    // as lost when processing the transmission log, but finally came
    martReportImporterWorker.run();
    martImportedReportsList =
        martImportedReportDao.getMartImportedReports(new MartImportedReportSearchQuery());
    assertThat(martImportedReportsList.getTotalCount()).isEqualTo(9);
    martImportedReports = martImportedReportsList.getList();
    assertReportSubmittedOK(martImportedReports, sequence, missingReportUuid2, person.getUuid());
    // Test history of missingReportUuid2
    MartImportedReportSearchQuery martImportedReportSearchQuery =
        new MartImportedReportSearchQuery();
    martImportedReportSearchQuery.setReportUuid(missingReportUuid2);
    martImportedReportsList =
        martImportedReportDao.getMartImportedReportHistory(martImportedReportSearchQuery);
    assertThat(martImportedReportsList.getTotalCount()).isEqualTo(1);

    // Test the unique methods
    AnetBeanList<Report> uniqueReports = martImportedReportDao.getUniqueMartReportReports();
    assertThat(uniqueReports.getTotalCount()).isEqualTo(8);
    AnetBeanList<mil.dds.anet.beans.Person> uniqueAuthors =
        martImportedReportDao.getUniqueMartReportAuthors();
    assertThat(uniqueAuthors.getTotalCount()).isEqualTo(2);

    // Test filters
    martImportedReportSearchQuery = new MartImportedReportSearchQuery();
    martImportedReportSearchQuery.setReportUuid(missingReportUuid1);
    martImportedReportSearchQuery.setState(MartImportedReport.State.NOT_RECEIVED);
    martImportedReportsList =
        martImportedReportDao.getMartImportedReports(martImportedReportSearchQuery);
    assertThat(martImportedReportsList.getTotalCount()).isEqualTo(1);
  }

  private static void assertReportSubmittedOK(List<MartImportedReport> martImportedReports,
      long sequence, String reportUuid, String personUuid) {
    final List<MartImportedReport> reportList = martImportedReports.stream().filter(
        martImportedReport -> martImportedReport.getState() == MartImportedReport.State.SUBMITTED_OK
            && martImportedReport.getSequence().equals(sequence)
            && martImportedReport.getReportUuid().equals(reportUuid)
            && martImportedReport.getPersonUuid().equals(personUuid)
            && martImportedReport.getErrors() == null)
        .toList();
    assertThat(reportList).hasSize(1);
  }

  private void assertReportSubmittedWithWarnings(List<MartImportedReport> martImportedReports,
      long sequence, String errors) {
    final List<MartImportedReport> reportList = martImportedReports.stream()
        .filter(martImportedReport -> martImportedReport
            .getState() == MartImportedReport.State.SUBMITTED_WARNINGS
            && martImportedReport.getSequence().equals(sequence)
            && martImportedReport.getErrors() != null
            && martImportedReport.getErrors().equals(errors))
        .toList();
    assertThat(reportList).hasSize(1);
  }

  private void assertReportNotSubmitted(List<MartImportedReport> martImportedReports, long sequence,
      String errors) {
    final List<MartImportedReport> reportList = martImportedReports.stream()
        .filter(martImportedReport -> martImportedReport
            .getState() == MartImportedReport.State.NOT_SUBMITTED
            && martImportedReport.getSequence().equals(sequence)
            && martImportedReport.getErrors() != null
            && martImportedReport.getErrors().equals(errors))
        .toList();
    assertThat(reportList).hasSize(1);
  }

  private void assertReportWithUuidAndNotReceived(List<MartImportedReport> martImportedReports,
      long sequence, String reportUuid, String errors) {
    final List<MartImportedReport> reportList = martImportedReports.stream().filter(
        martImportedReport -> martImportedReport.getState() == MartImportedReport.State.NOT_RECEIVED
            && martImportedReport.getSequence().equals(sequence)
            && martImportedReport.getReportUuid().equals(reportUuid)
            && martImportedReport.getErrors() != null
            && martImportedReport.getErrors().equals(errors))
        .toList();
    assertThat(reportList).hasSize(1);
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

  private EmailMessage createTransmissionLogMockEmail(long maxSequence)
      throws ServiceLocalException, IOException {
    final AttachmentCollection attachmentCollection = Mockito.mock(AttachmentCollection.class);
    final EmailMessage emailMessageMock = Mockito.mock();

    FileAttachment mockAttachmentJson = Mockito.mock(FileAttachment.class);
    when(mockAttachmentJson.getOwner()).thenReturn(Mockito.mock(Item.class));
    when(mockAttachmentJson.getContent()).thenReturn(ignoringMapper
        .writeValueAsString(
            TestData.createTransmissionLog(maxSequence, missingReportUuid1, missingReportUuid2))
        .getBytes(StandardCharsets.UTF_8));
    when(mockAttachmentJson.getName()).thenReturn(MartImporterWorker.TRANSMISSION_LOG_ATTACHMENT);

    List<Attachment> attachmentList = new ArrayList<>();
    attachmentList.add(mockAttachmentJson);

    when(attachmentCollection.iterator()).thenReturn(attachmentList.iterator());

    when(emailMessageMock.getAttachments()).thenReturn(attachmentCollection, attachmentCollection);
    return emailMessageMock;
  }
}
