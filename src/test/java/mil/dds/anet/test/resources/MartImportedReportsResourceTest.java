package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PositionType;
import org.junit.jupiter.api.Test;

class MartImportedReportsResourceTest extends AbstractResourceTest {

  @Test
  void getMartImportedReports() {
    testMartImportedReports(getSuperuser());
    testMartImportedReports(getRegularUser());
  }

  private void testMartImportedReports(Person user) {
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final var martImportedReports =
          withCredentials(adminUser, t -> queryExecutor.martImportedReports(
              getListFields("{ personUuid reportUuid createdAt success errors }"), 0, 0));

      assertThat(martImportedReports.getTotalCount()).isOne();
      assertThat(martImportedReports.getList()).hasSize(1);
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }
}
