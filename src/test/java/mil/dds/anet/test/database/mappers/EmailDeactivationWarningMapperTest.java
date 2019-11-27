package mil.dds.anet.test.database.mappers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.sql.ResultSet;
import java.time.Instant;
import mil.dds.anet.beans.EmailDeactivationWarning;
import mil.dds.anet.database.mappers.EmailDeactivationWarningMapper;
import mil.dds.anet.utils.DaoUtils;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

@RunWith(PowerMockRunner.class)
@PrepareForTest({ResultSet.class, DaoUtils.class})
public class EmailDeactivationWarningMapperTest {

  @Test
  public void test() throws Exception {
    // Setup
    final Instant sentAt = Instant.now();
    final ResultSet rs = PowerMockito.mock(ResultSet.class, Mockito.RETURNS_MOCKS);
    when(rs.getString("personUuid")).thenReturn("test_uuid");
    PowerMockito.mockStatic(DaoUtils.class);
    PowerMockito.doReturn(sentAt).when(DaoUtils.class, "getInstantAsLocalDateTime", rs, "sentAt");

    final EmailDeactivationWarning edw = new EmailDeactivationWarningMapper().map(rs, null);

    // Verify
    assertThat(edw.getPersonUuid()).isEqualTo("test_uuid");
    assertThat(edw.getSentAt()).isEqualTo(sentAt);
  }
}
