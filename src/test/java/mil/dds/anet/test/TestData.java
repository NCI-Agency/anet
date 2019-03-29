package mil.dds.anet.test;

import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Location.LocationStatus;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.Task;

public class TestData {

  public static RollupGraph createRollupGraph() {

    RollupGraph rollupGraph = new RollupGraph();
    rollupGraph.setCancelled(0);
    rollupGraph.setOrg(createOrganization());
    rollupGraph.setPublished(1);

    return rollupGraph;
  }

  public static Organization createOrganization() {
    Organization org = new Organization();

    org.setLongName("longName");

    return org;
  }

  public static Task createTask(String shortName, String longName, String category) {
    return TestData.createTask(shortName, longName, category, null, null, Task.TaskStatus.ACTIVE);
  }

  public static Task createTask(String shortName, String longName, String category,
      Task customFieldRef1, Organization responsibleOrg, Task.TaskStatus status) {
    Task p = new Task();
    p.setShortName(shortName);
    p.setLongName(longName);
    p.setCategory(category);
    p.setCustomFieldRef1(customFieldRef1);
    p.setResponsibleOrg(responsibleOrg);
    p.setStatus(status);
    return p;
  }

  public static Comment createComment(String text) {
    Comment c = new Comment();
    c.setText(text);
    return c;
  }

  public static Organization createOrganization(String shortName,
      Organization.OrganizationType type) {
    Organization org = new Organization();
    org.setShortName(shortName);
    org.setType(type);
    return org;
  }

  public static Location createLocation(String name, Double lat, Double lng) {
    Location l = new Location();
    l.setName(name);
    l.setStatus(LocationStatus.ACTIVE);
    l.setLat(lat);
    l.setLng(lng);
    return l;
  }

}
