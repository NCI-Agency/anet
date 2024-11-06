package mil.dds.anet.threads.mart;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import graphql.GraphQLContext;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;
import microsoft.exchange.webservices.data.property.complex.FileAttachment;
import mil.dds.anet.beans.*;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.mart.ReportDto;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.*;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.threads.AbstractWorker;
import mil.dds.anet.threads.mart.ews.IMailReceiver;
import mil.dds.anet.utils.DaoUtils;
import org.apache.tika.Tika;
import org.apache.tika.io.TikaInputStream;
import org.springframework.beans.BeanUtils;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("not ${anet.no-workers:false} and ${anet.import-mart-reports:false}")
public class MartReportImporterWorker extends AbstractWorker {

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
    super(dict, jobHistoryDao, "AnetMartImporter waking up to get MART reports!");
    this.personDao = personDao;
    this.reportDao = reportDao;
    this.taskDao = taskDao;
    this.locationDao = locationDao;
    this.martImportedReportDao = martImportedReportDao;
    this.attachmentDao = attachmentDao;
    this.organizationDao = organizationDao;
    this.positionDao = positionDao;
    this.emailAddressDao = emailAddressDao;
    this.iMailReceiver = iMailReceiver;
  }

  @Scheduled(initialDelay = 1, fixedRate = 10, timeUnit = TimeUnit.SECONDS)
  @Override
  public void run() {
    super.run();
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context) {
    try {
      for (EmailMessage email : iMailReceiver.downloadEmails()) {
        processEmailMessage(email);
      }
    } catch (Exception e) {
      logger.error("Could not connect to Exchange server!", e);
    }
  }

  private void processEmailMessage(EmailMessage email) {
    MartImportedReport martImportedReport = new MartImportedReport();
    StringBuffer errors = new StringBuffer();
    try {
      email.load();
      logger.debug("Processing e-mail sent on: {}", email.getDateTimeCreated());
      // Get the report JSON
      Report anetReport = processReportInfo(getReportInfo(email.getBody().toString()), errors);
      if (anetReport != null) {
        processAttachments(email, anetReport, errors);
        martImportedReport.setSuccess(true);
        martImportedReport.setReport(anetReport);
        martImportedReport.setPerson(anetReport.getReportPeople().get(0));
      }
    } catch (Exception e) {
      errors.append("Could not process email").append(email.toString());
    }
    martImportedReport.setErrors(errors.toString());
    martImportedReport.setCreatedAt(Instant.now());
    martImportedReportDao.insert(martImportedReport);
  }

  private void processAttachments(EmailMessage email, Report anetReport, StringBuffer errors) {
    try {
      for (microsoft.exchange.webservices.data.property.complex.Attachment attachment : email
          .getAttachments()) {
        if (attachment instanceof FileAttachment fileAttachment) {
          final TikaInputStream tikaInputStream = TikaInputStream.get(fileAttachment.getContent());
          final String detectedMimeType =
              new Tika().detect(tikaInputStream, fileAttachment.getName());
          if (assertAllowedMimeType(detectedMimeType)) {
            GenericRelatedObject genericRelatedObject = new GenericRelatedObject();
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
            errors.append("Attachment found in e-mail is not valid: ")
                .append(fileAttachment.getName());
          }
        }
      }
    } catch (Exception e) {
      errors.append("Could not process report attachments");
    }
  }

  private void getTasks(Map<String, String> martTasks, List<Task> tasks, StringBuffer errors) {
    martTasks.keySet().forEach(martTask -> {
      Task task = taskDao.getByUuid(martTask);
      if (task != null) {
        tasks.add(task);
      } else {
        errors.append("Can not find task: '").append(martTasks.get(martTask))
            .append("' with uuid: ").append(martTask).append("<br>");
      }
    });
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
    } catch (JsonParseException jsonMappingException) {
      logger.error("e-mail does not look like JSON", jsonMappingException);
    } catch (JsonMappingException jsonMappingException) {
      logger.error("Invalid JSON format", jsonMappingException);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
    return report;
  }

  public Report processReportInfo(ReportDto martReport, StringBuffer errors) {
    // Do we have this report already?
    if (reportDao.getByUuid(martReport.getUuid()) != null) {
      logger.info("Report with UUID={} already exists", martReport.getUuid());
      errors.append("Report with UUID already exists: ").append(martReport.getUuid());
      return null;
    }

    // Try to find the person/s with the email
    List<Person> matchingPersons = personDao.findByEmailAddress(martReport.getEmail());
    List<ReportPerson> reportPeople = new ArrayList<>();

    // Validate author organization, if not valid finish
    Organization organization = organizationDao.getByUuid(martReport.getOrganizationUuid());
    if (organization == null) {
      errors.append("Can not find submitter organization: '")
          .append(martReport.getOrganizationName()).append("' with uuid: ")
          .append(martReport.getOrganizationUuid());
      return null;
    }

    // Validate report location, it not valid finish
    Location location = locationDao.getByUuid(martReport.getLocationUuid());
    if (location == null) {
      errors.append("Can not find report location: ").append(martReport.getLocationUuid());
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
      EmailAddress emailAddress = new EmailAddress();
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
    anetReport.setEngagementDate(DaoUtils.handleRelativeDate(martReport.getEngagementDate()));
    anetReport.setReportText(martReport.getReportText());
    anetReport.setClassification("NKU");

    // Set advisor organization to the organization of the submitter
    anetReport.setAdvisorOrg(organization);

    // Report tasks
    List<Task> tasks = new ArrayList<>();
    getTasks(martReport.getTasks(), tasks, errors);
    anetReport.setTasks(tasks);
    // Custom fields
    anetReport.setCustomFields(martReport.getCustomFields());
    // Set report to DRAFT
    anetReport.setState(Report.ReportState.DRAFT);

    // Insert report
    try {
      anetReport = reportDao.insertWithExistingUuid(anetReport);
    } catch (Exception e) {
      logger.info("Report with UUID={} already exists", martReport.getUuid());
      errors.append("Report with UUID already exists: ").append(martReport.getUuid());
      return null;
    }


    // Submit the report
    reportDao.submit(anetReport, anetReport.getReportPeople().get(0));

    return anetReport;
  }

  private void getPersonCountry(Person person, ReportDto martReport, StringBuffer errors) {
    LocationSearchQuery searchQuery = new LocationSearchQuery();
    searchQuery.setText(martReport.getCountry());
    List<Location> countries = locationDao.search(searchQuery).getList();
    if (countries.isEmpty()) {
      errors.append("Can not find submitter country '").append(martReport.getCountry())
          .append("<br>");
    } else {
      person.setCountry(countries.get(0));
    }
  }

  private ReportPerson createReportPerson(Person person) {
    ReportPerson rp = new ReportPerson();
    rp.setAuthor(true);
    rp.setUser(true);
    rp.setAttendee(true);
    rp.setPrimary(true);
    rp.setInterlocutor(false);
    BeanUtils.copyProperties(person, rp);
    return rp;
  }
}
