package mil.dds.anet.test.beans;

import static org.assertj.core.api.Assertions.assertThat;

import mil.dds.anet.beans.Report;
import org.junit.jupiter.api.Test;

public class ReportTest {

  @Test
  public void staticCreatorTest() {
    Report r = Report.createWithUuid("4");
    assertThat(r.getUuid()).isEqualTo("4");
    assertThat(r.getReportText()).isNull();
    assertThat(r.getApprovalStep()).isNull();
    assertThat(r.getNextSteps()).isNull();
    assertThat(r.getCreatedAt()).isNull();
  }

}
