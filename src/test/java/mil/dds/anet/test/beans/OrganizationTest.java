package mil.dds.anet.test.beans;

import java.util.UUID;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationStatus;
import mil.dds.anet.beans.Organization.OrganizationType;
import org.junit.jupiter.api.Test;

public class OrganizationTest extends BeanTester<Organization> {

  public static Organization getTestAO(boolean generateIdentificationCode) {
    Organization ao = new Organization();
    ao.setShortName("TBAE");
    ao.setLongName("The Best Advisors Ever");
    ao.setStatus(OrganizationStatus.ACTIVE);
    if (generateIdentificationCode) {
      ao.setIdentificationCode(UUID.randomUUID().toString());
    }
    ao.setType(OrganizationType.ADVISOR_ORG);
    return ao;
  }

  @Test
  public void serializesToJson() throws Exception {
    serializesToJson(getTestAO(false), "testJson/organizations/test.json");
  }

  @Test
  public void deserializesFromJson() throws Exception {
    deserializesFromJson(getTestAO(false), "testJson/organizations/test.json");
  }

}
