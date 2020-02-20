package mil.dds.anet.test.beans;

import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;
import org.junit.jupiter.api.Test;

public class PositionTest extends BeanTester<Position> {

  public static Position getTestPosition() {
    Position b = new Position();
    b.setName("Head of donut operations");
    b.setCode("DNT-001");
    b.setType(PositionType.PRINCIPAL);
    b.setStatus(PositionStatus.ACTIVE);
    return b;
  }

  public static Position getTestAdvisor() {
    Position b = new Position();
    b.setName("Test Advisor Position");
    b.setCode("TST-0101");
    b.setType(PositionType.ADVISOR);
    b.setStatus(PositionStatus.ACTIVE);
    return b;
  }

  @Test
  public void serializesToJson() throws Exception {
    serializesToJson(getTestPosition(), "testJson/positions/testPosition.json");
  }

  @Test
  public void deserializesFromJson() throws Exception {
    deserializesFromJson(getTestPosition(), "testJson/positions/testPosition.json");
  }

}
