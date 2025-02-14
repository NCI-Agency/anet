package mil.dds.anet.test.integration.mart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.powermock.api.mockito.PowerMockito.when;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import microsoft.exchange.webservices.data.core.exception.service.local.ServiceLocalException;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;
import microsoft.exchange.webservices.data.property.complex.AttachmentCollection;
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
  private static final String ATTACHMENT_REPORT_JSON = "mart_report.json";

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
    EmailMessage emailMessage5 = createMockEmail(TestData.createMartReportCompletelyWrong(), false);
    EmailMessage emailMessage6 =
        createMockEmail(TestData.createGoodMartReportWithUnknownTask(), true);

    // Mock the mail exchange server
    IMailReceiver iMailReceiverMock = Mockito.mock();
    when(iMailReceiverMock.downloadEmails()).thenReturn(List.of(emailMessage1, emailMessage2,
        emailMessage3, emailMessage4, emailMessage5, emailMessage6));

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
    final AnetBeanList_Person searchResults = withCredentials("arthur",
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

    // Six new records in MartImportedReports, verify them
    final List<MartImportedReport> martImportedReports = martImportedReportDao.getAll();

    List<MartImportedReport> reportList = martImportedReports.stream()
        .filter(martImportedReport -> martImportedReport.isSuccess()
            && martImportedReport.getReportUuid().equals(reportDto.getUuid())
            && martImportedReport.getPersonUuid().equals(person.getUuid())
            && martImportedReport.getErrors() == null)
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    reportList = martImportedReports.stream().filter(martImportedReport -> !martImportedReport
        .isSuccess()
        && martImportedReport.getErrors() != null
        && martImportedReport.getErrors()
            .equals("While importing report 231196f5-3b13-45ea-9d73-524d042b16e7:"
                + "<ul><li>Report with UUID already exists: 231196f5-3b13-45ea-9d73-524d042b16e7</li></ul>"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    reportList = martImportedReports.stream().filter(martImportedReport -> !martImportedReport
        .isSuccess()
        && martImportedReport.getErrors() != null
        && martImportedReport.getErrors()
            .equals("While importing report fb875171-2501-46c9-9246-60dafabb656d:"
                + "<ul><li>Can not find submitter organization: 'does not exist' with uuid: does not exist</li></ul>"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    reportList = martImportedReports.stream().filter(martImportedReport -> !martImportedReport
        .isSuccess()
        && martImportedReport.getErrors() != null
        && martImportedReport.getErrors()
            .equals("While importing report 2d6c7a19-d878-4792-bdaf-7a73dc3bfc83:"
                + "<ul><li>Can not find report location: 'does not exist' with uuid: does not exist</li></ul>"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    reportList = martImportedReports.stream().filter(martImportedReport -> !martImportedReport
        .isSuccess()
        && martImportedReport.getErrors() != null
        && martImportedReport.getErrors()
            .equals("While importing report 68077002-b766-4a79-bcf2-40b7dbffe6e6:"
                + "<ul><li>Can not find submitter organization: 'does not exist' with uuid: does not exist</li>"
                + "<li>Can not find report location: 'does not exist' with uuid: does not exist</li></ul>"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();

    reportList = martImportedReports.stream().filter(martImportedReport -> martImportedReport
        .isSuccess()
        && martImportedReport.getErrors() != null
        && martImportedReport.getErrors()
            .equals("While importing report 34faac7c-8c85-4dec-8e9f-57d9254b5ae2:"
                + "<ul><li>Can not find task: 'does not exist' with uuid: does not exist</li></ul>"))
        .toList();
    assertThat(reportList).hasSize(1);
    assertThat(martImportedReportDao.delete(reportList.get(0))).isOne();
  }

  private EmailMessage createMockEmail(ReportDto reportDto, boolean withAttachment)
      throws ServiceLocalException, IOException {
    final AttachmentCollection attachmentCollection = new AttachmentCollection();
    final EmailMessage emailMessageMock = Mockito.mock();

    attachmentCollection.addFileAttachment(ATTACHMENT_REPORT_JSON,
        ignoringMapper.writeValueAsString(reportDto).getBytes(StandardCharsets.UTF_8));

    if (withAttachment) {
      attachmentCollection.addFileAttachment(ATTACHMENT_NAME,
          IOUtils.toByteArray(Objects.requireNonNull(
              this.getClass().getClassLoader().getResourceAsStream("assets/default_avatar.png"))));
    }
    when(emailMessageMock.getAttachments()).thenReturn(attachmentCollection);
    return emailMessageMock;
  }
}
