package mil.dds.anet.test.beans;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.ZonedDateTime;
import mil.dds.anet.beans.EmailDeactivationWarning;
import mil.dds.anet.utils.DaoUtils;
import org.junit.Test;

public class EmailDeactivationWarningTest extends BeanTester<EmailDeactivationWarning> {

  public static EmailDeactivationWarning getTestEDW() {
    final EmailDeactivationWarning edw = new EmailDeactivationWarning();
    edw.setPersonUuid("test_uuid");
    edw.setSentAt(
        ZonedDateTime.of(2017, 6, 30, 0, 0, 0, 0, DaoUtils.getDefaultZoneId()).toInstant());
    return edw;
  }

  @Test
  public void testDataObject() {
    final EmailDeactivationWarning edw = getTestEDW();
    assertThat(edw.getPersonUuid()).isEqualTo("test_uuid");
    assertThat(edw.getSentAt().toEpochMilli()).isEqualTo(new Long("1498780800000"));

    assertThat(edw.getUuid()).isNull();
    assertThat(edw.getCreatedAt()).isNull();
    assertThat(edw.getUpdatedAt()).isNull();

    assertThat(edw.hashCode()).isNotNull();
    assertThat(edw).isEqualTo(edw);
    assertThat(edw.toString()).isEqualTo("[PersonUuid:test_uuid;SentAt:2017-06-30T00:00:00Z]");
  }

  @Test
  public void serializesToJson() throws Exception {
    serializesToJson(getTestEDW(), "testJson/emailDeactivationWarning/test.json");
  }

  @Test
  public void deserializesFromJson() throws Exception {
    deserializesFromJson(getTestEDW(), "testJson/emailDeactivationWarning/test.json");
  }

}
