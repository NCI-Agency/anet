package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import mil.dds.anet.test.client.AnetBeanList_AuditTrail;
import mil.dds.anet.test.client.AuditTrailSearchQueryInput;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class AuditTrailResourceTest extends AbstractResourceTest {

  @Test
  void testAuditTrailAsUserWithNullRelatedObjectUuid() {
    final AuditTrailSearchQueryInput query =
        AuditTrailSearchQueryInput.builder().withRelatedObjectUuid(null).build();
    assertThatThrownBy(() -> withCredentials(jackUser,
        t -> queryExecutor.auditTrailList(getListFields("{ uuid }"), query)))
        .isInstanceOf(Exception.class);
  }

  @ParameterizedTest
  @ValueSource(strings = {"", " "})
  void testAuditTrailAsUserWithEmptyRelatedObjectUuid(String relatedObjectUuid) {
    final AuditTrailSearchQueryInput query =
        AuditTrailSearchQueryInput.builder().withRelatedObjectUuid(relatedObjectUuid).build();
    assertThatThrownBy(() -> withCredentials(jackUser,
        t -> queryExecutor.auditTrailList(getListFields("{ uuid }"), query)))
        .isInstanceOf(Exception.class);
  }

  @Test
  void testAuditTrailAsAdminWithNullRelatedObjectUuid() {
    final AuditTrailSearchQueryInput query =
        AuditTrailSearchQueryInput.builder().withRelatedObjectUuid(null).build();
    final AnetBeanList_AuditTrail result = withCredentials(adminUser,
        t -> queryExecutor.auditTrailList(getListFields("{ uuid }"), query));
    assertThat(result).isNotNull();
    assertThat(result.getTotalCount()).isGreaterThan(0);
  }

  @ParameterizedTest
  @ValueSource(strings = {"", " "})
  void testAuditTrailAsAdminWithEmptyRelatedObjectUuid(String relatedObjectUuid) {
    final AuditTrailSearchQueryInput query =
        AuditTrailSearchQueryInput.builder().withRelatedObjectUuid(relatedObjectUuid).build();
    final AnetBeanList_AuditTrail result = withCredentials(adminUser,
        t -> queryExecutor.auditTrailList(getListFields("{ uuid }"), query));
    assertThat(result).isNotNull();
    assertThat(result.getTotalCount()).isGreaterThan(0);
  }

}
