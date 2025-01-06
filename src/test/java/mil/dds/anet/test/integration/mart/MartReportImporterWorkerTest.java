package mil.dds.anet.test.integration.mart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.powermock.api.mockito.PowerMockito.when;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Objects;
import microsoft.exchange.webservices.data.core.exception.service.local.ServiceLocalException;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;
import microsoft.exchange.webservices.data.property.complex.AttachmentCollection;
import microsoft.exchange.webservices.data.property.complex.MessageBody;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.mart.ReportDto;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.EmailAddressDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.MartImportedReportDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Person;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonSearchQueryInput;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.test.resources.PersonResourceTest;
import mil.dds.anet.test.resources.ReportResourceTest;
import mil.dds.anet.threads.mart.MartReportImporterWorker;
import mil.dds.anet.threads.mart.ews.IMailReceiver;
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
  private PersonDao personDao;
  @Autowired
  private ReportDao reportDao;
  @Autowired
  private PositionDao positionDao;
  @Autowired
  private TaskDao taskDao;
  @Autowired
  private OrganizationDao organizationDao;
  @Autowired
  private MartImportedReportDao martImportedReportDao;
  @Autowired
  private AttachmentDao attachmentDao;
  @Autowired
  private LocationDao locationDao;
  @Autowired
  private EmailAddressDao emailAddressDao;

  private MartReportImporterWorker martReportImporterWorker = null;

  private ReportDto reportDto;

  @BeforeAll
  void setUp() throws Exception {
    final boolean executeMartReportImporterTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("martReportImporterTestsExecute").toString());
    assumeTrue(executeMartReportImporterTests, "Mart importer tests configured to be skipped.");

    reportDto = TestData.createGoodMartReport();

    EmailMessage emailMessage1 = createMockEmail(reportDto, true);
    EmailMessage emailMessage2 = createMockEmail(reportDto, true);
    EmailMessage emailMessage3 =
        createMockEmail(TestData.createMartReportWrongOrganization(), false);
    EmailMessage emailMessage4 = createMockEmail(TestData.createMartReportWrongLocation(), false);

    // Mock the mail exchange server
    IMailReceiver iMailReceiverMock = Mockito.mock();
    when(iMailReceiverMock.downloadEmails())
        .thenReturn(List.of(emailMessage1, emailMessage2, emailMessage3, emailMessage4));

    martReportImporterWorker = new MartReportImporterWorker(dict, jobHistoryDao, reportDao,
        personDao, positionDao, taskDao, organizationDao, locationDao, martImportedReportDao,
        attachmentDao, emailAddressDao, iMailReceiverMock);
  }

  /**
   * Test the worker
   *
   */
  @Test
  void testWorker() {
    martReportImporterWorker.run();
    // We have a person
    final PersonSearchQueryInput queryPerson =
        PersonSearchQueryInput.builder().withOrgUuid(List.of(reportDto.getOrganizationUuid()))
            .withEmailNetwork("Internet").withHasBiography(false).withRank("OF-6").build();
    AnetBeanList_Person searchResults = withCredentials("arthur",
        t -> queryExecutor.personList(getListFields(PersonResourceTest.FIELDS), queryPerson));
    assertThat(searchResults.getTotalCount()).isPositive();
    Person person = searchResults.getList().get(0);
    assertThat(person.getPosition().getName()).isEqualTo(reportDto.getPositionName());

    // We successfully imported one report
    final mil.dds.anet.test.client.Report createdReport = withCredentials("arthur",
        t -> queryExecutor.report(ReportResourceTest.FIELDS, reportDto.getUuid()));
    assertThat(createdReport).isNotNull();
    assertThat(createdReport.getUuid()).isEqualTo(reportDto.getUuid());
    assertThat(createdReport.getIntent()).isEqualTo(reportDto.getIntent());
    assertThat(createdReport.getLocation().getUuid()).isEqualTo(reportDto.getLocationUuid());
    assertThat(createdReport.getAdvisorOrg().getUuid()).isEqualTo(reportDto.getOrganizationUuid());
    assertThat(createdReport.getAuthors()).hasSize(1);
    assertThat(createdReport.getAuthors().get(0).getName()).isEqualTo(person.getName());
    assertThat(createdReport.getTasks()).hasSize(1);
    assertThat(createdReport.getAttachments()).hasSize(1);
    assertThat(createdReport.getAttachments().get(0).getFileName()).isEqualTo(ATTACHMENT_NAME);
    assertThat(createdReport.getTasks().get(0).getLongName()).isEqualTo("Intelligence");


    // Four new records in MartImportedReports, verify then
    List<MartImportedReport> martImportedReports = martImportedReportDao.getAll();

    assertThat(martImportedReports.stream()
        .filter(martImportedReport -> !martImportedReport.isSuccess() && martImportedReport
            .getErrors().equals("Can not find report location: does not exist")))
        .hasSize(1);

    assertThat(martImportedReports.stream()
        .filter(martImportedReport -> !martImportedReport.isSuccess()
            && martImportedReport.getErrors().equals(
                "Can not find submitter organization: 'does not exist' with uuid: does not exist")))
        .hasSize(1);

    assertThat(martImportedReports.stream()
        .filter(martImportedReport -> !martImportedReport.isSuccess() && martImportedReport
            .getErrors().equals("Report with UUID already exists: " + reportDto.getUuid())))
        .hasSize(1);

    assertThat(martImportedReports.stream()
        .filter(martImportedReport -> martImportedReport.isSuccess()
            && martImportedReport.getReportUuid().equals(reportDto.getUuid())
            && martImportedReport.getPersonUuid().equals(person.getUuid())
            && martImportedReport.getErrors()
                .equals("Can not find task: 'does not exist' with uuid: does not exist<br>")))
        .hasSize(1);
  }

  private EmailMessage createMockEmail(ReportDto reportDto, boolean withAttachment)
      throws ServiceLocalException, IOException {
    EmailMessage emailMessageMock = Mockito.mock();
    MessageBody messageBody = new MessageBody();
    messageBody.setText(ignoringMapper.writeValueAsString(reportDto));
    when(emailMessageMock.getBody()).thenReturn(messageBody);
    if (withAttachment) {
      AttachmentCollection attachmentCollection = new AttachmentCollection();
      attachmentCollection.addFileAttachment(ATTACHMENT_NAME,
          IOUtils.toByteArray(Objects.requireNonNull(
              this.getClass().getClassLoader().getResourceAsStream("mart/default_avatar.png"))));
      when(emailMessageMock.getAttachments()).thenReturn(attachmentCollection);
    }
    return emailMessageMock;
  }
}
