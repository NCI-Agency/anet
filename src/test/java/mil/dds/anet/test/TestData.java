package mil.dds.anet.test;

import java.util.List;
import java.util.UUID;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.test.client.CommentInput;
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

}
