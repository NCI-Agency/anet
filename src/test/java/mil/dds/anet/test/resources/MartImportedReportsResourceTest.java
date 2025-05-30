package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import mil.dds.anet.test.client.MartImportedReportSearchQueryInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PositionType;
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

  @Test
  void getMartImportedReportUniqueAuthors() {
    testMartImportedReportUniqueAuthors(admin);
    testMartImportedReportUniqueAuthors(getSuperuser());
    testMartImportedReportUniqueAuthors(getRegularUser());
  }

  @Test
  void getMartImportedReportUniqueReports() {
    testMartImportedReportUniqueReports(admin);
    testMartImportedReportUniqueReports(getSuperuser());
    testMartImportedReportUniqueReports(getRegularUser());
  }

  private void testMartImportedReportsList(Person user) {
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final MartImportedReportSearchQueryInput query = MartImportedReportSearchQueryInput.builder()
          .withPageNum(0).withPageSize(0).withSortBy("receivedAt").withSortOrder("DESC").build();
      final var martImportedReports = withCredentials(user.getDomainUsername(),
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
              .withPageSize(0).withSortBy("receivedAt").withSortOrder("DESC").build();
      final var martImportedReports = withCredentials(user.getDomainUsername(),
          t -> queryExecutor.martImportedReportHistory(getListFields(
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

  private void testMartImportedReportUniqueAuthors(Person user) {
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final var martImportedReports = withCredentials(user.getDomainUsername(),
          t -> queryExecutor.uniqueMartReportAuthors(getListFields("{ uuid name }")));
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

  private void testMartImportedReportUniqueReports(Person user) {
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final var martImportedReports = withCredentials(user.getDomainUsername(),
          t -> queryExecutor.uniqueMartReportReports(getListFields("{ uuid intent }")));
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
