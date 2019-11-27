package mil.dds.anet.test.database;

import java.util.ArrayList;
import mil.dds.anet.database.EmailDeactivationWarningDao;
import org.junit.Test;

public class EmailDeactivationWarningDaoTest {
  @Test(expected = UnsupportedOperationException.class)
  public void testGetByIds() {
    new EmailDeactivationWarningDao().getByIds(new ArrayList<String>());
  }

  @Test(expected = UnsupportedOperationException.class)
  public void testGetByUuid() {
    new EmailDeactivationWarningDao().getByUuid("");
  }
}
