package mil.dds.anet.test.beans;

import java.util.LinkedList;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Position;
import org.junit.Test;

public class AuthorizationGroupTest extends BeanTester<AuthorizationGroup> {

  public static AuthorizationGroup getTestAuthorizationGroup() {
    final AuthorizationGroup a = new AuthorizationGroup();
    a.setName("sensitive info positions group");
    a.setDescription("desc");
    LinkedList<Position> positions = new LinkedList<Position>();
    positions.add(PositionTest.getTestPosition());
    a.setPositions(positions);
    return a;
  }

  @Test
  public void serializesToJson() throws Exception {
    serializesToJson(getTestAuthorizationGroup(), "testJson/authorizationGroups/test.json");
  }

  @Test
  public void deserializesFromJson() throws Exception {
    deserializesFromJson(getTestAuthorizationGroup(), "testJson/authorizationGroups/test.json");
  }

}
