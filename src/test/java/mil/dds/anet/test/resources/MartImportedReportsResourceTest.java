package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import mil.dds.anet.test.client.MartImportedReportSearchQueryInput;
import mil.dds.anet.test.client.MartImportedReportSearchSortBy;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.SortOrder;
import org.junit.jupiter.api.Test;

class MartImportedReportsResourceTest extends AbstractResourceTest {

  private static final String REPORT_UUID = "59be259b-30b9-4d04-9e21-e8ceb58cbe9c";

  @Test
  void getMartImportedReports() {
    testMartImportedReportsList(admin);
    testMartImportedReportsList(getSuperuser());
    testMartImportedReportsList(getRegularUser());
  }

  @Test
  void getMartImportedReportHistory() {
    testMartImportedReportsHistory(admin);
    testMartImportedReportsHistory(getSuperuser());
    testMartImportedReportsHistory(getRegularUser());
  }

  private void testMartImportedReportsList(Person user) {
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final MartImportedReportSearchQueryInput query = MartImportedReportSearchQueryInput.builder()
          .withPageNum(0).withPageSize(0).withSortBy(MartImportedReportSearchSortBy.RECEIVED_AT)
          .withSortOrder(SortOrder.DESC).build();
      final var martImportedReports = withCredentials(getDomainUsername(user),
          t -> queryExecutor.martImportedReportList(getListFields(
              "{ sequence person { uuid } report { uuid } receivedAt submittedAt state errors }"),
              query));
      if (!isAdmin) {
        fail("Expected an Exception");
      }
      assertThat(martImportedReports.getTotalCount()).isOne();
      assertThat(martImportedReports.getList()).hasSize(1);
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }

  private void testMartImportedReportsHistory(Person user) {
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final MartImportedReportSearchQueryInput query =
          MartImportedReportSearchQueryInput.builder().withReportUuid(REPORT_UUID).withPageNum(0)
              .withPageSize(0).withSortBy(MartImportedReportSearchSortBy.RECEIVED_AT)
              .withSortOrder(SortOrder.DESC).build();
      final var martImportedReports = withCredentials(getDomainUsername(user),
          t -> queryExecutor.martImportedReportList(getListFields(
              "{ sequence person { uuid } report { uuid } receivedAt submittedAt state errors }"),
              query));
      if (!isAdmin) {
        fail("Expected an Exception");
      }
      assertThat(martImportedReports.getTotalCount()).isOne();
      assertThat(martImportedReports.getList()).hasSize(1);
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }

}
