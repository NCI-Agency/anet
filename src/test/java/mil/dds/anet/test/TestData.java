package mil.dds.anet.test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.mart.LogDto;
import mil.dds.anet.beans.mart.ReportDto;
import mil.dds.anet.test.client.AnetEmailInput;
import mil.dds.anet.test.client.CommentInput;
import mil.dds.anet.test.client.EventInput;
import mil.dds.anet.test.client.EventSeriesInput;
import mil.dds.anet.test.client.EventType;
import mil.dds.anet.test.client.LocationInput;
import mil.dds.anet.test.client.LocationType;
import mil.dds.anet.test.client.OrganizationInput;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.TaskInput;

public class TestData {

  public static RollupGraph createRollupGraph() {
    final RollupGraph rollupGraph = new RollupGraph();
    rollupGraph.setCancelled(0);
    rollupGraph.setOrg(createOrganization());
    rollupGraph.setPublished(1);
    return rollupGraph;
  }

  public static Organization createOrganization() {
    final Organization org = new Organization();
    org.setLongName("longName");
    return org;
  }

  public static Position getTestAdvisor() {
    final Position b = new Position();
    b.setName("Test Advisor Position");
    b.setCode("TST-0101");
    b.setType(PositionType.REGULAR);
    b.setRole(PositionRole.MEMBER);
    b.setStatus(Status.ACTIVE);
    return b;
  }

  public static AnetEmailInput createAnetEmailInput() {
    return AnetEmailInput.builder().withToAddresses(List.of("geronimo@example.com"))
        .withComment("This is just a helpful test comment")
        .withCreatedAt(Instant.now().minus(1, ChronoUnit.DAYS)).build();
  }

  public static OrganizationInput createAdvisorOrganizationInput(
      boolean generateIdentificationCode) {
    return OrganizationInput.builder().withShortName("TBAE").withLongName("The Best Advisors Ever")
        .withStatus(Status.ACTIVE).withProfile("<p>This organization has no profile.</p>")
        .withIdentificationCode(generateIdentificationCode ? UUID.randomUUID().toString() : null)
        .build();
  }

  public static CommentInput createCommentInput(String text) {
    return CommentInput.builder().withText(text).build();
  }

  public static LocationInput createLocationInput(String name, Double lat, Double lng) {
    return LocationInput.builder().withName(name).withStatus(Status.ACTIVE).withLat(lat)
        .withType(LocationType.POINT_LOCATION).withLng(lng).build();
  }

  public static PositionInput createPositionInput() {
    return PositionInput.builder().withName("Head of donut operations").withCode("DNT-001")
        .withType(PositionType.REGULAR).withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE)
        .build();
  }

  public static TaskInput createTaskInput(String shortName, String longName, String category) {
    return TestData.createTaskInput(shortName, longName, category, null, null, Status.ACTIVE);
  }

  public static TaskInput createTaskInput(String shortName, String longName, String category,
      String customFields) {
    final TaskInput p = TestData.createTaskInput(shortName, longName, category);
    p.setCustomFields(customFields);
    return p;
  }

  public static TaskInput createTaskInput(String shortName, String longName, String category,
      TaskInput parentTask, List<OrganizationInput> taskedOrganizations, Status status) {
    return TaskInput.builder().withShortName(shortName).withLongName(longName)
        .withCategory(category).withParentTask(parentTask)
        .withTaskedOrganizations(taskedOrganizations).withStatus(status).build();
  }

  public static EventInput createEventInput(String name, String description,
      OrganizationInput ownerOrg, OrganizationInput hostOrg, OrganizationInput adminOrg) {
    return EventInput.builder().withName(name).withStatus(Status.ACTIVE)
        .withDescription(description).withOwnerOrg(ownerOrg).withHostOrg(hostOrg)
        .withAdminOrg(adminOrg).withStartDate(Instant.now()).withEndDate(Instant.now())
        .withType(EventType.CONFERENCE).build();
  }

  public static EventSeriesInput createEventSeriesInput(String name, String description,
      OrganizationInput ownerOrg, OrganizationInput hostOrg, OrganizationInput adminOrg) {
    return EventSeriesInput.builder().withName(name).withStatus(Status.ACTIVE)
        .withDescription(description).withOwnerOrg(ownerOrg).withHostOrg(hostOrg)
        .withAdminOrg(adminOrg).build();
  }

  public static ReportDto createGoodMartReport(long sequence) {
    final ReportDto reportDto = new ReportDto();
    // User Info
    reportDto.setSequence(sequence);
    reportDto.setUuid("231196f5-3b13-45ea-9d73-524d042b16e7");
    reportDto.setOrganizationUuid("9a35caa7-a095-4963-ac7b-b784fde4d583");
    reportDto.setOrganizationName("Planning Programming, Budgeting and Execution");
    reportDto.setRank("OF-6");
    reportDto.setEmail("mart-user@kfor.nato.int");
    reportDto.setFirstName("MART");
    reportDto.setLastName("User");

    // Report Info
    reportDto.setCreatedAt(Instant.now());
    reportDto.setIntent("Report Intent");
    reportDto.setReportText("Report Text");
    reportDto.setEngagementDate(Instant.now());
    reportDto.setLocationUuid("0855fb0a-995e-4a79-a132-4024ee2983ff");
    reportDto.setLocationName("General Hospital");
    reportDto.setCountry("British");
    reportDto.setPositionName("MART Team Member");
    reportDto.setSubmittedAt(Instant.now());
    reportDto.setAtmosphere("Positive");

    // Custom fields
    reportDto.setCustomFields(
        "{\"attitude\":\"Positive\", \"contacts\":\"Contacts\", \"securityMarking\":\"NU\"}");

    // Tasks
    final Map<String, String> tasks = new HashMap<>();
    tasks.put("19364d81-3203-483d-a6bf-461d58888c76", "Intelligence");
    reportDto.setTasks(tasks);

    return reportDto;
  }

  public static ReportDto createGoodMartReportWithUnknownTaskAndMissingSecurityMarking(
      long sequence) {
    final ReportDto reportDto = createGoodMartReport(sequence);
    reportDto.setUuid("34faac7c-8c85-4dec-8e9f-57d9254b5ae2");
    reportDto.getTasks().put("does not exist", "does not exist");
    reportDto.setCustomFields("{\"attitude\":\"Positive\", \"contacts\":\"Contacts\"}");
    return reportDto;
  }

  public static ReportDto createMartReportWithSecurityMarkingNotInDictionary(long sequence) {
    final ReportDto reportDto = createGoodMartReport(sequence);
    reportDto.setUuid("58e0ff9b-4908-4f2d-8cab-8d64aefff929");
    reportDto.setCustomFields(
        "{\"attitude\":\"Positive\", \"contacts\":\"Contacts\", \"securityMarking\":\"random\"}");
    return reportDto;
  }

  public static ReportDto createMartReportWrongOrganization(long sequence) {
    final ReportDto reportDto = new ReportDto();
    reportDto.setSequence(sequence);
    reportDto.setUuid("fb875171-2501-46c9-9246-60dafabb656d");
    reportDto.setOrganizationUuid("does not exist");
    reportDto.setOrganizationName("does not exist");
    reportDto.setLocationUuid("0855fb0a-995e-4a79-a132-4024ee2983ff");
    reportDto.setLocationName("General Hospital");
    reportDto.setSubmittedAt(Instant.now());
    return reportDto;
  }

  public static ReportDto createMartReportWrongLocation(long sequence) {
    final ReportDto reportDto = new ReportDto();
    reportDto.setSequence(sequence);
    reportDto.setUuid("2d6c7a19-d878-4792-bdaf-7a73dc3bfc83");
    reportDto.setOrganizationUuid("9a35caa7-a095-4963-ac7b-b784fde4d583");
    reportDto.setOrganizationName("Planning Programming, Budgeting and Execution");
    reportDto.setLocationUuid("does not exist");
    reportDto.setLocationName("does not exist");
    reportDto.setSubmittedAt(Instant.now());
    return reportDto;
  }

  public static ReportDto createMartReportCompletelyWrong(long sequence) {
    final ReportDto reportDto = new ReportDto();
    reportDto.setSequence(sequence);
    reportDto.setUuid("68077002-b766-4a79-bcf2-40b7dbffe6e6");
    reportDto.setOrganizationUuid("does not exist");
    reportDto.setOrganizationName("does not exist");
    reportDto.setLocationUuid("does not exist");
    reportDto.setLocationName("does not exist");
    reportDto.setSubmittedAt(Instant.now());
    final Map<String, String> tasks = new HashMap<>();
    tasks.put("19364d81-3203-483d-a6bf-461d58888c76", "Intelligence");
    tasks.put("does not exist", "does not exist");
    reportDto.setTasks(tasks);
    return reportDto;
  }

  public static ReportDto createRetryOfMissingReport(long sequence) {
    final ReportDto reportDto = createGoodMartReport(sequence);
    reportDto.setUuid("missingReportUuid2");
    return reportDto;
  }

  public static List<LogDto> createTransmissionLog() {
    List<LogDto> transmissionLog = new ArrayList<>();

    // Put all properly transmitted ones
    for (long i = 0; i < 8; i++) {
      LogDto logDto = new LogDto();
      logDto.setState(LogDto.LogState.SENT.getCode());
      logDto.setSequence(i);
      transmissionLog.add(logDto);
    }

    // Now Put two missing logs
    LogDto missing1 = new LogDto();
    missing1.setReportUuid("missingReportUuid");
    missing1.setState(LogDto.LogState.FAILED_TO_SEND_EMAIL.getCode());
    missing1.setErrors("SMTP error sending email in MART");
    missing1.setSubmittedAt(Instant.now());
    missing1.setSequence(8L);
    transmissionLog.add(missing1);

    LogDto missing2 = new LogDto();
    missing2.setReportUuid("missingReportUuid2");
    missing2.setState(LogDto.LogState.SENT.getCode());
    missing2.setSubmittedAt(Instant.now());
    missing2.setSequence(9L);
    transmissionLog.add(missing2);

    return transmissionLog;
  }
}
