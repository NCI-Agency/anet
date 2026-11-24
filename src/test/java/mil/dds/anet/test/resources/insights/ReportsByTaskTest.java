package mil.dds.anet.test.resources.insights;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import mil.dds.anet.test.AnetApplicationTest;
import mil.dds.anet.test.client.AnetBeanList_Report;
import mil.dds.anet.test.client.ReportSearchQueryInput;
import mil.dds.anet.test.client.ReportState;
import mil.dds.anet.test.resources.ReportResourceTest;
import org.junit.jupiter.api.Test;

public class ReportsByTaskTest extends AnetApplicationTest {

  @Test
  void testWithDummyTask() {
    final ReportSearchQueryInput query =
        ReportSearchQueryInput.builder().withState(List.of(ReportState.DRAFT))
            .withTaskUuid(List.of(mil.dds.anet.beans.Task.DUMMY_TASK_UUID)).build();
    final AnetBeanList_Report result = withCredentials(adminUser,
        t -> queryExecutor.reportList(getListFields(ReportResourceTest.FIELDS), query));
    assertThat(result).isNotNull();
    // There should be Draft reports without any tasks
    assertThat(result.getList()).hasSizeGreaterThan(0);
  }
}
