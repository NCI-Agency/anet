package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import io.dropwizard.testing.junit5.DropwizardAppExtension;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.emails.ReportEmail;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Report;
import mil.dds.anet.test.client.ReportSearchQueryInput;
import mil.dds.anet.threads.AnetEmailWorker;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AnetEmailResourceTest extends AbstractResourceTest {
  @Autowired
  protected DropwizardAppExtension<AnetConfiguration> dropwizardApp;
  private AnetEmailWorker emailWorker;

  @BeforeAll
  void setUpClass() {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    emailWorker = new AnetEmailWorker(dropwizardApp.getConfiguration(), engine.getEmailDao());
    emailWorker.run();
  }

  @AfterAll
  void tearDownClass() {
    emailWorker.run();
    emailWorker = null;
    AnetEmailWorker.setInstance(null);
  }

  @Test
  void shouldReturnEmailData() {
    final var reportQuery = ReportSearchQueryInput.builder()
        .withAuthorPositionUuid(admin.getPosition().getUuid()).build();

    // Search by author position
    final AnetBeanList_Report results = withCredentials(adminUser,
        t -> queryExecutor.reportList(getListFields("{ uuid }"), reportQuery));
    final var reportUuid = results.getList().iterator().next().getUuid();
    final var input = TestData.createAnetEmailInput();
    final var mutationResult =
        withCredentials(adminUser, t -> mutationExecutor.emailReport("", input, reportUuid));
    assertThat(mutationResult).isEqualTo(1);

    final var pendingEmails = withCredentials(adminUser, t -> queryExecutor.pendingEmails(
        getListFields("{ id toAddresses createdAt comment errorMessage type }"), 0, 0));
    assertThat(pendingEmails.getTotalCount()).isOne();
    assertThat(pendingEmails.getList()).hasSize(1)
        .allSatisfy(pendingEmail -> assertThat(pendingEmail).usingRecursiveComparison()
            .comparingOnlyFields("toAddresses", "comment").isEqualTo(input))
        .allSatisfy(pendingEmail -> assertThat(pendingEmail.getErrorMessage()).isNullOrEmpty())
        .allSatisfy(pendingEmail -> assertThat(pendingEmail.getType())
            .isEqualTo(ReportEmail.class.getSimpleName()));
  }
}