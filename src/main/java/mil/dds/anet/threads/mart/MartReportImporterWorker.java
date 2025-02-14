package mil.dds.anet.threads.mart;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import graphql.GraphQLContext;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;
import microsoft.exchange.webservices.data.property.complex.FileAttachment;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.mart.ReportDto;
import mil.dds.anet.beans.search.LocationSearchQuery;
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
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.threads.AbstractWorker;
import mil.dds.anet.threads.mart.ews.IMailReceiver;
import mil.dds.anet.utils.Utils;
import org.apache.tika.Tika;
import org.apache.tika.io.TikaInputStream;
import org.springframework.beans.BeanUtils;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("not ${anet.no-workers:false} and not ${anet.mart.disabled:true}")
public class MartReportImporterWorker extends AbstractWorker {

  private static final String REPORT_JSON_ATTACHMENT = "report.json";
  private final ObjectMapper ignoringMapper = MapperUtils.getDefaultMapper()
      .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
      .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

  private final OrganizationDao organizationDao;
  private final ReportDao reportDao;
  private final TaskDao taskDao;
  private final PersonDao personDao;
  private final PositionDao positionDao;
  private final LocationDao locationDao;
  private final MartImportedReportDao martImportedReportDao;
  private final AttachmentDao attachmentDao;
  private final EmailAddressDao emailAddressDao;
  private final IMailReceiver iMailReceiver;

  public MartReportImporterWorker(AnetDictionary dict, JobHistoryDao jobHistoryDao,
      ReportDao reportDao, PersonDao personDao, PositionDao positionDao, TaskDao taskDao,
      OrganizationDao organizationDao, LocationDao locationDao,
      MartImportedReportDao martImportedReportDao, AttachmentDao attachmentDao,
      EmailAddressDao emailAddressDao, IMailReceiver iMailReceiver) {
    super(dict, jobHistoryDao, "MartReportImporterWorker waking up to get MART reports!");
    this.reportDao = reportDao;
    this.personDao = personDao;
    this.positionDao = positionDao;
    this.taskDao = taskDao;
    this.organizationDao = organizationDao;
    this.locationDao = locationDao;
    this.martImportedReportDao = martImportedReportDao;
    this.attachmentDao = attachmentDao;
    this.emailAddressDao = emailAddressDao;
    this.iMailReceiver = iMailReceiver;
  }

  @Scheduled(initialDelay = 35, fixedRateString = "${anet.mart.mail-polling-delay-in-seconds:10}",
      timeUnit = TimeUnit.SECONDS)
  @Override
  public void run() {
    super.run();
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context) {
    try {
      for (final EmailMessage email : iMailReceiver.downloadEmails()) {
        processEmailMessage(email);
      }
    } catch (Exception e) {
      logger.error("Could not connect to Exchange server!", e);
    }
  }

  private void processEmailMessage(EmailMessage email) {
    final MartImportedReport martImportedReport = new MartImportedReport();
    ReportDto reportDto = null;
    final List<String> errors = new ArrayList<>();
    try {
      email.load();
      logger.debug("Processing e-mail sent on: {}", email.getDateTimeCreated());
      // Get the report JSON from the attachment
      reportDto = getReportInfoFromAttachment(email, errors);

      final Report anetReport = processReportInfo(reportDto, errors);
      if (anetReport != null) {
        processAttachments(email, anetReport, errors);
        martImportedReport.setSuccess(true);
        martImportedReport.setReport(anetReport);
        martImportedReport.setPerson(anetReport.getReportPeople().get(0));
      }
    } catch (Exception e) {
      errors.add(String.format("Could not process email %s", email));
    }
    if (!errors.isEmpty()) {
      final StringBuilder errorMsg = new StringBuilder();
      if (reportDto != null) {
        errorMsg.append(String.format("While importing report %s:", reportDto.getUuid()));
      }
      errorMsg.append(String.format("<ul><li>%s</li></ul>", String.join("</li><li>", errors)));
      martImportedReport.setErrors(errorMsg.toString());
    }
    martImportedReport.setCreatedAt(Instant.now());
    martImportedReportDao.insert(martImportedReport);
  }

  private ReportDto getReportInfoFromAttachment(EmailMessage email, List<String> errors) {
    ReportDto result = null;
    // Check the message.json attachment is there
    try {
      for (final microsoft.exchange.webservices.data.property.complex.Attachment attachment : email
          .getAttachments()) {
        if (attachment instanceof FileAttachment fileAttachment
            && fileAttachment.getName().equals(REPORT_JSON_ATTACHMENT)) {
          fileAttachment.load();
          result = getReportInfo(new String(fileAttachment.getContent(), StandardCharsets.UTF_8));
        }
      }
    } catch (Exception e) {
      logger.error("Problem processing email report attachment", e);
      errors.add("Problem processing email report attachment");
    }

    return result;
  }

  private void processAttachments(EmailMessage email, Report anetReport, List<String> errors) {
    try {
      for (final microsoft.exchange.webservices.data.property.complex.Attachment attachment : email
          .getAttachments()) {
        if (attachment instanceof FileAttachment fileAttachment) {
          fileAttachment.load();
          final TikaInputStream tikaInputStream = TikaInputStream.get(fileAttachment.getContent());
          final String detectedMimeType =
              new Tika().detect(tikaInputStream, fileAttachment.getName());
          if (assertAllowedMimeType(detectedMimeType)) {
            final GenericRelatedObject genericRelatedObject = new GenericRelatedObject();
            genericRelatedObject.setRelatedObjectType(ReportDao.TABLE_NAME);
            genericRelatedObject.setRelatedObjectUuid(anetReport.getUuid());
            Attachment anetAttachment = new Attachment();
            anetAttachment.setAttachmentRelatedObjects(List.of(genericRelatedObject));
            anetAttachment.setCaption(fileAttachment.getName());
            anetAttachment.setFileName(fileAttachment.getName());
            anetAttachment.setMimeType(detectedMimeType);
            anetAttachment.setContentLength((long) fileAttachment.getContent().length);
            anetAttachment.setAuthor(anetReport.getReportPeople().get(0));
            anetAttachment = attachmentDao.insert(anetAttachment);
            attachmentDao.saveContentBlob(anetAttachment.getUuid(),
                TikaInputStream.get(fileAttachment.getContent()));
          } else {
            errors.add(String.format("Attachment found in e-mail is not valid: %s",
                fileAttachment.getName()));
          }
        }
      }
    } catch (Exception e) {
      errors.add("Could not process report attachments");
    }
  }

  private List<Task> getTasks(Map<String, String> martTasks, List<String> errors) {
    final List<Task> tasks = new ArrayList<>();
    martTasks.forEach((key, value) -> {
      final Task task = taskDao.getByUuid(key);
      if (task != null) {
        tasks.add(task);
      } else {
        errors.add(String.format("Can not find task: '%s' with uuid: %s", value, key));
      }
    });
    return tasks;
  }

  private boolean assertAllowedMimeType(final String mimeType) {
    return AttachmentResource.getAllowedMimeTypes().contains(mimeType);
  }

  private ReportDto getReportInfo(String reportJson) {
    ReportDto report = null;
    try {
      report = ignoringMapper.readValue(reportJson, ReportDto.class);
      if (report.getSubmittedAt() == null) {
        logger.warn("Submitted time not provided in report");
      } else {
        final Duration transportDelay = Duration.between(report.getSubmittedAt(), Instant.now());
        logger.info("Time between report send and reception: {} ms", transportDelay.toMillis());
      }
      logger.debug("Found report with UUID={}", report.getUuid());
    } catch (JsonParseException jsonParseException) {
      logger.error("e-mail does not look like JSON", jsonParseException);
    } catch (JsonMappingException jsonMappingException) {
      logger.error("Invalid JSON format", jsonMappingException);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
    return report;
  }

  private Report processReportInfo(ReportDto martReport, List<String> errors) {
    // Do we have this report already?
    if (reportDao.getByUuid(martReport.getUuid()) != null) {
      logger.info("Report with UUID={} already exists", martReport.getUuid());
      errors.add(String.format("Report with UUID already exists: %s", martReport.getUuid()));
      return null;
    }

    // Try to find the person/s with the email
    final List<Person> matchingPersons = personDao.findByEmailAddress(martReport.getEmail());
    final List<ReportPerson> reportPeople = new ArrayList<>();

    // Validate author organization
    final Organization organization = organizationDao.getByUuid(martReport.getOrganizationUuid());
    if (organization == null) {
      errors.add(String.format("Can not find submitter organization: '%s' with uuid: %s",
          martReport.getOrganizationName(), martReport.getOrganizationUuid()));
    }

    // Validate report location
    final Location location = locationDao.getByUuid(martReport.getLocationUuid());
    if (location == null) {
      errors.add(String.format("Can not find report location: '%s' with uuid: %s",
          martReport.getLocationName(), martReport.getLocationUuid()));
    }

    // Return early if there are errors
    if (!errors.isEmpty()) {
      return null;
    }

    if (matchingPersons.isEmpty()) {
      // This is a new person -> CREATE from MART

      Person person = new Person();
      person.setName(martReport.getLastName().toUpperCase() + ", " + martReport.getFirstName());
      person.setRank(martReport.getRank());
      person.setStatus(WithStatus.Status.ACTIVE);
      getPersonCountry(person, martReport, errors);
      person = personDao.insert(person);

      // Update email address
      final EmailAddress emailAddress = new EmailAddress();
      emailAddress.setNetwork("Internet");
      emailAddress.setAddress(martReport.getEmail());
      emailAddressDao.updateEmailAddresses(PersonDao.TABLE_NAME, person.getUuid(),
          List.of(emailAddress));

      // Create person position
      Position position = new Position();
      position.setName(martReport.getPositionName());
      position.setType(Position.PositionType.REGULAR);
      position.setStatus(WithStatus.Status.ACTIVE);
      position.setRole(Position.PositionRole.MEMBER);
      position.setOrganization(organization);
      position.setOrganizationUuid(organization.getUuid());
      position = positionDao.insert(position);

      positionDao.setPersonInPosition(person.getUuid(), position.getUuid());

      // Add MART person as author
      reportPeople.add(createReportPerson(person));
    } else {
      // Put everybody with this email as report attendee
      matchingPersons.forEach(person -> reportPeople.add(createReportPerson(person)));
    }

    Report anetReport = new Report();

    // Location
    anetReport.setLocation(location);

    // Report people
    anetReport.setReportPeople(reportPeople);

    // Report generic details
    anetReport.setUuid(martReport.getUuid());
    anetReport.setCreatedAt(martReport.getCreatedAt());
    anetReport.setIntent(martReport.getIntent());
    anetReport.setEngagementDate(martReport.getEngagementDate());
    anetReport.setReportText(martReport.getReportText());
    anetReport.setClassification("NKU");

    // Set advisor organization to the organization of the submitter
    anetReport.setAdvisorOrg(organization);

    // Report tasks
    final List<Task> tasks = getTasks(martReport.getTasks(), errors);
    anetReport.setTasks(tasks);
    // Custom fields
    anetReport.setCustomFields(martReport.getCustomFields());
    // Set report to DRAFT
    anetReport.setState(Report.ReportState.DRAFT);

    // Sanitize!
    anetReport.checkAndFixCustomFields();
    anetReport.setReportText(Utils.isEmptyHtml(anetReport.getReportText()) ? null
        : Utils.sanitizeHtml(anetReport.getReportText()));

    // Insert report
    try {
      anetReport = reportDao.insertWithExistingUuid(anetReport);
    } catch (Exception e) {
      logger.info("Report with UUID={} already exists", martReport.getUuid());
      errors.add(String.format("Report with UUID already exists: %s", martReport.getUuid()));
      return null;
    }

    // Submit the report
    reportDao.submit(anetReport, anetReport.getReportPeople().get(0));

    return anetReport;
  }

  private void getPersonCountry(Person person, ReportDto martReport, List<String> errors) {
    final LocationSearchQuery searchQuery = new LocationSearchQuery();
    searchQuery.setText(martReport.getCountry());
    final List<Location> countries = locationDao.search(searchQuery).getList();
    if (countries.isEmpty()) {
      errors.add(String.format("Can not find submitter country '%s'", martReport.getCountry()));
    } else {
      person.setCountry(countries.get(0));
    }
  }

  private ReportPerson createReportPerson(Person person) {
    final ReportPerson rp = new ReportPerson();
    rp.setAuthor(true);
    rp.setUser(true);
    rp.setAttendee(true);
    rp.setPrimary(true);
    rp.setInterlocutor(false);
    BeanUtils.copyProperties(person, rp);
    return rp;
  }
}
