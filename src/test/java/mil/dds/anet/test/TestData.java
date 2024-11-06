package mil.dds.anet.test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.mart.ReportDto;
import mil.dds.anet.test.client.*;

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

  public static ReportDto createGoodMartReport() {
    ReportDto reportDto = new ReportDto();
    // User Info
    reportDto.setUuid(UUID.randomUUID().toString());
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
    reportDto.setCountry("British");
    reportDto.setPositionName("MART Team Member");
    reportDto.setSubmittedAt(Instant.now());

    // Custom fields
    reportDto.setCustomFields(
        "{\"attitude\":\"Positive\", \"contacts\":\"Contacts\", \"remarks\":\"Remarks\", \"rcAssessment\":\"rcAssessment\"}");

    // Tasks
    Map<String, String> tasks = new HashMap<>();
    tasks.put("19364d81-3203-483d-a6bf-461d58888c76", "Intelligence");
    tasks.put("does not exist", "does not exist");
    reportDto.setTasks(tasks);

    return reportDto;
  }

  public static ReportDto createMartReportWrongOrganization() {
    ReportDto reportDto = new ReportDto();
    reportDto.setOrganizationUuid("does not exist");
    reportDto.setOrganizationName("does not exist");
    return reportDto;
  }

  public static ReportDto createMartReportWrongLocation() {
    ReportDto reportDto = new ReportDto();
    reportDto.setOrganizationUuid("9a35caa7-a095-4963-ac7b-b784fde4d583");
    reportDto.setLocationUuid("does not exist");
    return reportDto;
  }
}
