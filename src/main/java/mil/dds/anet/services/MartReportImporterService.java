package mil.dds.anet.services;

import static mil.dds.anet.resources.AttachmentResource.IMAGE_SVG_XML;

import io.github.borewit.sanitize.SVGSanitizer;
import java.io.IOException;
import java.io.InputStream;
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
import mil.dds.anet.beans.Comment;
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
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.mart.ReportDto;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.beans.search.MartImportedReportSearchQuery;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.CommentDao;
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
import tools.jackson.core.JacksonException;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.cfg.DateTimeFeature;

@Component
public class MartReportImporterService implements IMartReportImporterService {
  protected final Logger logger = LoggerFactory.getLogger(this.getClass());

  public static final String REPORT_JSON_ATTACHMENT = "mart_report.json";

  private final ObjectMapper ignoringMapper = MapperUtils.getDefaultMapper().rebuild()
      .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
      .disable(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS).build();

  private final OrganizationDao organizationDao;
  private final ReportDao reportDao;
  private final TaskDao taskDao;
  private final PersonDao personDao;
  private final PositionDao positionDao;
  private final LocationDao locationDao;
  private final MartImportedReportDao martImportedReportDao;
  private final AttachmentDao attachmentDao;
  private final EmailAddressDao emailAddressDao;
  private final CommentDao commentDao;

  public MartReportImporterService(ReportDao reportDao, PersonDao personDao,
      PositionDao positionDao, TaskDao taskDao, OrganizationDao organizationDao,
      LocationDao locationDao, MartImportedReportDao martImportedReportDao,
      AttachmentDao attachmentDao, EmailAddressDao emailAddressDao, CommentDao commentDao) {
    this.reportDao = reportDao;
    this.personDao = personDao;
    this.positionDao = positionDao;
    this.taskDao = taskDao;
    this.organizationDao = organizationDao;
    this.locationDao = locationDao;
    this.martImportedReportDao = martImportedReportDao;
    this.attachmentDao = attachmentDao;
    this.emailAddressDao = emailAddressDao;
    this.commentDao = commentDao;
  }

  @Override
  public void processMartReport(List<FileAttachment> attachments) {
    final Optional<FileAttachment> martReportAttachmentOpt = attachments.stream()
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
      MartImportedReportSearchQuery query = new MartImportedReportSearchQuery();
      query.setReportUuid(reportDto.getUuid());
      final AnetBeanList<MartImportedReport> existingMartImportedReportSequences =
          martImportedReportDao.search(query);

      if (existingMartImportedReportSequences.getTotalCount() == 0) {
        // New report, import
        logger.info("Report with UUID={} will be imported", reportDto.getUuid());
        processReportInfo(reportDto, newMartImportedReport, attachments);
        martImportedReportDao.insert(newMartImportedReport);
      } else if (existingMartImportedReportSequences.getList().getFirst()
          .getState() != MartImportedReport.State.SUBMITTED_OK) {
        // This report was last marked as failed or missing earlier, re-import
        logger.info("Report with UUID={} will be imported", reportDto.getUuid());
        processReportInfo(reportDto, newMartImportedReport, attachments);
        if (Objects.equals(existingMartImportedReportSequences.getList().getFirst().getSequence(),
            newMartImportedReport.getSequence())) {
          // Replace existing import record
          martImportedReportDao.delete(existingMartImportedReportSequences.getList().getFirst());
        }
        martImportedReportDao.insert(newMartImportedReport);
      } else {
        // It was successfully imported, so it is a duplicate, do not import again
        logger.info("Report with UUID={} has already been imported", reportDto.getUuid());
      }
    } catch (Exception e) {
      logger.error("Error loading MartImportedReport from {}", REPORT_JSON_ATTACHMENT, e);
    }
  }

  private void processAttachments(List<FileAttachment> attachments, Report anetReport,
      List<String> errors) {
    for (final FileAttachment fileAttachment : attachments) {
      try {
        fileAttachment.load();
        processAttachment(errors, anetReport.getUuid(), anetReport.getReportPeople().getFirst(),
            fileAttachment);
      } catch (Exception e) {
        logger.error("Could not process report attachment from email", e);
        errors.add(
            String.format("Could not process report attachment due to error: %s", e.getMessage()));
      }
    }
  }

  private void processAttachment(List<String> errors, String reportUuid, Person reportAuthor,
      FileAttachment fileAttachment) {
    try (final TikaInputStream tikaInputStream = TikaInputStream.get(fileAttachment.getContent())) {
      final String detectedMimeType = new Tika().detect(tikaInputStream, fileAttachment.getName());

      if (!detectedMimeType.equalsIgnoreCase(fileAttachment.getContentType())) {
        errors.add(String.format(
            "Attachment with name %s found in e-mail has a different mime type: %s than specified: %s",
            fileAttachment.getName(), detectedMimeType, fileAttachment.getContentType()));
      } else if (!assertAllowedMimeType(detectedMimeType)) {
        errors.add(
            String.format("Attachment with name %s found in e-mail is a not allowed mime type: %s",
                fileAttachment.getName(), fileAttachment.getContentType()));
      } else {
        saveAttachment(errors, reportUuid, reportAuthor, fileAttachment, detectedMimeType,
            tikaInputStream);
      }
    } catch (IOException e) {
      logger.error("Saving attachment content failed", e);
      errors.add(String.format("Saving attachment content failed: %s", e.getMessage()));
    }
  }

  private void saveAttachment(List<String> errors, String reportUuid, Person reportAuthor,
      FileAttachment fileAttachment, String detectedMimeType, InputStream inputStream) {
    // Create attachment
    final GenericRelatedObject genericRelatedObject = new GenericRelatedObject();
    genericRelatedObject.setRelatedObjectType(ReportDao.TABLE_NAME);
    genericRelatedObject.setRelatedObjectUuid(reportUuid);
    Attachment anetAttachment = new Attachment();
    anetAttachment.setAttachmentRelatedObjects(List.of(genericRelatedObject));
    anetAttachment.setCaption(fileAttachment.getName());
    anetAttachment.setFileName(fileAttachment.getName());
    anetAttachment.setMimeType(detectedMimeType);
    anetAttachment.setContentLength((long) fileAttachment.getContent().length);
    anetAttachment.setAuthor(reportAuthor);
    anetAttachment = attachmentDao.insert(anetAttachment);

    // Save attachment content
    if (IMAGE_SVG_XML.equals(detectedMimeType)) {
      try {
        logger.debug("Detected SVG attachment, sanitizing!");
        attachmentDao.saveContentBlob(anetAttachment.getUuid(), SVGSanitizer.sanitize(inputStream));
      } catch (Exception e) {
        logger.error("Error while sanitizing SVG", e);
        errors.add(String.format("Error while sanitizing SVG: %s", e.getMessage()));
      }
    } else {
      attachmentDao.saveContentBlob(anetAttachment.getUuid(), inputStream);
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

  private ReportDto getReportInfo(String reportJson) throws JacksonException {
    try {
      final ReportDto report = ignoringMapper.readValue(reportJson, ReportDto.class);
      if (report.getSubmittedAt() == null) {
        logger.warn("Submitted time not provided in report");
      } else {
        final Duration transportDelay = Duration.between(report.getSubmittedAt(), Instant.now());
        logger.info("Time between report send and reception: {} ms", transportDelay.toMillis());
      }
      logger.debug("Found report with UUID={}", report.getUuid());
      return report;
    } catch (JacksonException e) {
      logger.error("Invalid JSON format", e);
      throw e;
    }
  }

  private void processReportInfo(ReportDto martReport, MartImportedReport martImportedReport,
      List<FileAttachment> attachments) {
    final List<String> errors = new ArrayList<>();

    Report anetReport = new Report();

    // Handle report people
    handleReportPeople(anetReport, martReport, errors);

    // Handle report location
    final Location location = locationDao.getByUuid(martReport.getLocationUuid());
    if (location == null) {
      errors.add(String.format("Can not find report location: '%s' with uuid: %s",
          martReport.getLocationName(), martReport.getLocationUuid()));
    }
    anetReport.setLocation(location);

    // Handle report generic details
    anetReport.setUuid(martReport.getUuid());
    anetReport.setCreatedAt(martReport.getCreatedAt());
    anetReport.setIntent(martReport.getIntent());
    if (martReport.getAtmosphere() != null) {
      anetReport.setAtmosphere(Report.Atmosphere.valueOf(martReport.getAtmosphere().toUpperCase()));
    }
    anetReport.setEngagementDate(martReport.getEngagementDate());
    anetReport.setReportText(martReport.getReportText());

    // Get classification from securityMarking property
    anetReport.setClassification(getClassificationFromReport(martReport, errors));

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

    // Complete the MART imported report record
    martImportedReport.setReport(anetReport);
    martImportedReport.setPerson(anetReport.getReportPeople().getFirst());

    // Check errors to determine whether to submit or not and marImportedReport state
    if (errors.isEmpty()) {
      // All good, submit without warnings
      reportDao.submit(anetReport, anetReport.getReportPeople().getFirst());
      martImportedReport.setState(MartImportedReport.State.SUBMITTED_OK);
    } else {
      String errorMsg = String.format("While importing report %s:", martReport.getUuid())
          + String.format("<ul><li>%s</li></ul>", String.join("</li><li>", errors));
      martImportedReport.setErrors(errorMsg);
      // Also add a comment to the report with the errors
      Comment comment = new Comment();
      comment.setText(errorMsg);
      comment.setAuthor(anetReport.getReportPeople().getFirst());
      comment.setReportUuid(anetReport.getUuid());
      commentDao.insert(comment);
      // Submit the report only if the submitter organization is there
      if (anetReport.getAdvisorOrg() != null) {
        reportDao.submit(anetReport, anetReport.getReportPeople().getFirst());
        martImportedReport.setState(MartImportedReport.State.SUBMITTED_WARNINGS);
      } else {
        martImportedReport.setState(MartImportedReport.State.NOT_SUBMITTED);
      }
    }
  }

  private String getClassificationFromReport(ReportDto martReport, List<String> errors) {
    final String martReportClassification = martReport.getSecurityMarking();
    if (martReportClassification == null) {
      errors.add("Security marking is missing");
    } else {
      if (ResourceUtils.getAllowedClassifications().contains(martReportClassification)) {
        return martReportClassification;
      } else {
        errors.add(
            String.format("Can not find report security marking: '%s'", martReportClassification));
      }
    }

    return null;
  }

  private void handleReportPeople(Report anetReport, ReportDto martReport, List<String> errors) {
    // Validate organization coming from MART
    Organization organizationForReport =
        organizationDao.getByUuid(martReport.getOrganizationUuid());
    if (organizationForReport == null) {
      errors.add(
          String.format("Can not find submitter organization coming from MART: '%s' with uuid: %s",
              martReport.getOrganizationName(), martReport.getOrganizationUuid()));
    }
    // Try to find the person/s with the email
    final List<Person> matchingPersons = personDao.findByEmailAddress(martReport.getEmail());
    final List<ReportPerson> reportPeople = new ArrayList<>();
    Person personForReport;

    if (matchingPersons.isEmpty()) {
      // This is a new person -> CREATE from MART report information
      personForReport = createNewPerson(martReport, errors);
      createPositionForPerson(organizationForReport, martReport.getPositionName(), personForReport);
    } else {
      if (matchingPersons.size() > 1) {
        errors.add(String.format("More than one ANET person has this email address: '%s'",
            martReport.getEmail()));
      }
      // Grab the first person
      personForReport = matchingPersons.getFirst();
      if (personForReport.getPosition() != null
          && personForReport.getPosition().getOrganizationUuid() != null) {
        if (organizationForReport == null || !personForReport.getPosition().getOrganizationUuid()
            .equals(organizationForReport.getUuid())) {
          errors.add(
              String.format("Organization for this person in ANET is different than in MART: '%s'",
                  martReport.getEmail()));
        }
        organizationForReport =
            organizationDao.getByUuid(personForReport.getPosition().getOrganizationUuid());
      } else {
        createPositionForPerson(organizationForReport, martReport.getPositionName(),
            personForReport);
        errors.add(String.format("Existing ANET user was assigned to MART position: '%s'",
            martReport.getPositionName()));
      }
    }
    // Add MART person as author
    reportPeople.add(createReportPerson(personForReport));
    // Assign report people
    anetReport.setReportPeople(reportPeople);
    // Set advisor organization
    anetReport.setAdvisorOrg(organizationForReport);
  }

  private Person createNewPerson(ReportDto martReport, List<String> errors) {
    Person person = new Person();
    person.setName(martReport.getLastName().toUpperCase() + ", " + martReport.getFirstName());
    person.setRank(martReport.getRank());
    person.setStatus(WithStatus.Status.ACTIVE);
    getPersonCountry(person, martReport, errors);

    person = personDao.insert(person);
    // Update email address
    final EmailAddress emailAddress = new EmailAddress("Internet", martReport.getEmail());
    emailAddressDao.updateEmailAddresses(PersonDao.TABLE_NAME, person.getUuid(),
        List.of(emailAddress));
    return person;
  }

  private void createPositionForPerson(Organization organization, String positionName,
      Person person) {
    if (organization != null) {
      // Create person position if organization from MART exists
      Position position = new Position();
      position.setName(positionName);
      position.setType(Position.PositionType.REGULAR);
      position.setStatus(WithStatus.Status.ACTIVE);
      position.setRole(Position.PositionRole.MEMBER);
      position.setOrganization(organization);
      position = positionDao.insert(position);
      positionDao.setPersonInPosition(person.getUuid(), position.getUuid());
    }
  }

  private void getPersonCountry(Person person, ReportDto martReport, List<String> errors) {
    final LocationSearchQuery searchQuery = new LocationSearchQuery();
    searchQuery.setType(Location.LocationType.COUNTRY);
    searchQuery.setStatus(WithStatus.Status.ACTIVE);
    if (isValidAlpha3Format(martReport.getCountry())) {
      searchQuery.setTrigram(martReport.getCountry());
    } else {
      searchQuery.setName(martReport.getCountry());
    }
    List<Location> countries = locationDao.search(searchQuery).getList();
    if (countries.isEmpty()) {
      errors.add(String.format("Can not find submitter country: '%s'", martReport.getCountry()));
    } else {
      person.setCountry(countries.getFirst());
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

  private static boolean isValidAlpha3Format(String code) {
    return code != null && code.matches("^[A-Z]{3}$");
  }
}
