package mil.dds.anet.threads.mart.services;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import microsoft.exchange.webservices.data.property.complex.FileAttachment;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.GenericRelatedObject;
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
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.EmailAddressDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.MartImportedReportDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.utils.ResourceUtils;
import mil.dds.anet.utils.Utils;
import org.apache.tika.Tika;
import org.apache.tika.io.TikaInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

@Component
public class MartReportImporterService implements IMartReportImporterService {
  protected final Logger logger = LoggerFactory.getLogger(this.getClass());

  public static final String REPORT_JSON_ATTACHMENT = "mart_report.json";
  private static final String SECURITY_MARKING_JSON_PROPERTY = "securityMarking";

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

  public MartReportImporterService(ReportDao reportDao, PersonDao personDao,
      PositionDao positionDao, TaskDao taskDao, OrganizationDao organizationDao,
      LocationDao locationDao, MartImportedReportDao martImportedReportDao,
      AttachmentDao attachmentDao, EmailAddressDao emailAddressDao) {
    this.reportDao = reportDao;
    this.personDao = personDao;
    this.positionDao = positionDao;
    this.taskDao = taskDao;
    this.organizationDao = organizationDao;
    this.locationDao = locationDao;
    this.martImportedReportDao = martImportedReportDao;
    this.attachmentDao = attachmentDao;
    this.emailAddressDao = emailAddressDao;
  }

  @Override
  public void processMartReport(List<FileAttachment> attachments) {
    Optional<FileAttachment> martReportAttachmentOpt = attachments.stream()
        .filter(attachment -> attachment.getName().equalsIgnoreCase(REPORT_JSON_ATTACHMENT))
        .findFirst();

    // Do we have a MART report in this email?
    if (martReportAttachmentOpt.isEmpty()) {
      return;
    }

    // Get the report JSON from the attachment
    try {
      final FileAttachment martReportAttachment = martReportAttachmentOpt.get();
      martReportAttachment.load();
      final ReportDto reportDto =
          getReportInfo(new String(martReportAttachment.getContent(), StandardCharsets.UTF_8));

      final MartImportedReport newMartImportedReport = new MartImportedReport();
      newMartImportedReport.setSequence(reportDto.getSequence());
      newMartImportedReport.setReportUuid(reportDto.getUuid());
      newMartImportedReport.setSubmittedAt(reportDto.getSubmittedAt());
      newMartImportedReport.setReceivedAt(Instant.now());

      // First check, is this report uuid in MartImportedReports table already?
      final MartImportedReport existingMartImportedReport =
          martImportedReportDao.getByReportUuid(reportDto.getUuid());

      if (existingMartImportedReport == null) {
        // New report, import
        processReportInfo(reportDto, newMartImportedReport, attachments);
        martImportedReportDao.insert(newMartImportedReport);
      } else if (existingMartImportedReport.isSuccess()) {
          // If it was successfully imported it is a duplicate, do not import again
          logger.info("Report with UUID={} has already been imported", reportDto.getUuid());
          newMartImportedReport.setErrors(String
              .format("Report with UUID %s has already been imported", reportDto.getUuid()));
          martImportedReportDao.insert(newMartImportedReport);
      } else if (!existingMartImportedReport.isSuccess() && Objects.equals(
            existingMartImportedReport.getSequence(), newMartImportedReport.getSequence())) {
          // This report was marked as failed or missing earlier, import now and replace the
          // existing martImportedReport
          processReportInfo(reportDto, newMartImportedReport, attachments);
          martImportedReportDao.delete(existingMartImportedReport);
          martImportedReportDao.insert(newMartImportedReport);
      }
    } catch (Exception e) {
      logger.error("Error loading MartImportedReport from {}", REPORT_JSON_ATTACHMENT, e);
    }
  }

  private void processAttachments(List<FileAttachment> attachments, Report anetReport,
      List<String> errors) {
    try {
      for (FileAttachment fileAttachment : attachments) {
        fileAttachment.load();
        final TikaInputStream tikaInputStream = TikaInputStream.get(fileAttachment.getContent());
        final String detectedMimeType =
            new Tika().detect(tikaInputStream, fileAttachment.getName());

        if (!detectedMimeType.equalsIgnoreCase(fileAttachment.getContentType())) {
          errors.add(String.format(
              "Attachment with name %s found in e-mail has a different mime type: %s than specified: %s",
              fileAttachment.getName(), detectedMimeType, fileAttachment.getContentType()));
        } else if (!assertAllowedMimeType(detectedMimeType)) {
          errors.add(String.format(
              "Attachment with name %s found in e-mail is a not allowed mime type: %s",
              fileAttachment.getName(), fileAttachment.getContentType()));
        } else {
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
        }
      }
    } catch (Exception e) {
      logger.error("Could not process report attachments from email", e);
      errors.add(
          String.format("Could not process report attachments due to error: %s", e.getMessage()));
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

  private void processReportInfo(ReportDto martReport, MartImportedReport martImportedReport,
      List<FileAttachment> attachments) {
    List<String> errors = new ArrayList<>();

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

    if (organization != null && location != null) {
      // Move on with the report
      Report anetReport = new Report();
      // Location
      anetReport.setLocation(location);
      List<ReportPerson> reportPeople = handleReportPeople(martReport, organization, errors);
      // Report people
      anetReport.setReportPeople(reportPeople);
      // Report generic details
      anetReport.setUuid(martReport.getUuid());
      anetReport.setCreatedAt(martReport.getCreatedAt());
      anetReport.setIntent(martReport.getIntent());
      if (martReport.getAtmosphere() != null) {
        anetReport
            .setAtmosphere(Report.Atmosphere.valueOf(martReport.getAtmosphere().toUpperCase()));
      }
      anetReport.setEngagementDate(martReport.getEngagementDate());
      anetReport.setReportText(martReport.getReportText());
      // Get classification from securityMarking property in MART custom fields
      anetReport.setClassification(getClassificationFromReport(martReport, errors));
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
        logger.info("Error persisting report with UUID={} ", martReport.getUuid());
        errors.add(String.format("Error persisting report with UUID: %s error: %s ",
            martReport.getUuid(), e.getMessage()));
      }

      // Process attachments
      processAttachments(attachments.stream()
          .filter(attachment -> !attachment.getName().equalsIgnoreCase(REPORT_JSON_ATTACHMENT))
          .toList(), anetReport, errors);

      // Submit the report
      try {
        reportDao.submit(anetReport, anetReport.getReportPeople().get(0));
      } catch (Exception e) {
        logger.error("Could not submit report with UUID={}", martReport.getUuid(), e);
        errors.add(String.format("Could not submit report with UUID: %s error: %s",
            martReport.getUuid(), e.getMessage()));
      }

      martImportedReport.setSuccess(true);
      martImportedReport.setReport(anetReport);
      martImportedReport.setPerson(anetReport.getReportPeople().get(0));
    }

    // Set errors
    if (!errors.isEmpty()) {
      String errorMsg = String.format("While importing report %s:", martReport.getUuid())
          + String.format("<ul><li>%s</li></ul>", String.join("</li><li>", errors));
      martImportedReport.setErrors(errorMsg);
    }
  }

  private String getClassificationFromReport(ReportDto martReport, List<String> errors) {
    try {
      final JsonNode jsonNode = ignoringMapper.readTree(martReport.getCustomFields());
      final JsonNode securityMarkingProperty = jsonNode.get(SECURITY_MARKING_JSON_PROPERTY);
      if (securityMarkingProperty == null) {
        errors.add("Security marking is missing");
      } else {
        final String martReportClassification = securityMarkingProperty.asText();
        if (ResourceUtils.getAllowedClassifications().contains(martReportClassification)) {
          return martReportClassification;
        } else {
          errors.add(String.format("Can not find report security marking: '%s'",
              martReportClassification));
        }
      }
    } catch (JsonProcessingException e) {
      errors.add(String.format("Could not extract security marking from MART report: '%s'",
          e.getMessage()));
      logger.error("Could not extract security marking from MART report", e);
    }

    return null;
  }

  private List<ReportPerson> handleReportPeople(ReportDto martReport, Organization organization,
      List<String> errors) {
    // Try to find the person/s with the email
    final List<Person> matchingPersons = personDao.findByEmailAddress(martReport.getEmail());
    final List<ReportPerson> reportPeople = new ArrayList<>();

    if (!matchingPersons.isEmpty()) {
      // Put everybody with this email as report attendee
      matchingPersons.forEach(person -> reportPeople.add(createReportPerson(person)));
    } else {
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
    }
    return reportPeople;
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
