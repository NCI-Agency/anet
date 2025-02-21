package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PositionType;
import org.junit.jupiter.api.Test;

class MartImportedReportsResourceTest extends AbstractResourceTest {

  @Test
  void getMartImportedReports() {
    testMartImportedReports(admin);
    testMartImportedReports(getSuperuser());
    testMartImportedReports(getRegularUser());
  }

  private void testMartImportedReports(Person user) {
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final var martImportedReports = withCredentials(user.getDomainUsername(),
          t -> queryExecutor.martImportedReports(getListFields(
              "{ sequence person { uuid } report { uuid } receivedAt submittedAt success errors }"),
              0, 0));
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
