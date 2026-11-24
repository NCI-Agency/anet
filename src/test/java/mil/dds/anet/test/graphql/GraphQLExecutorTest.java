package mil.dds.anet.test.graphql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import mil.dds.anet.test.AnetApplicationTest;
import mil.dds.anet.test.client.Location;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.web.reactive.function.client.WebClientResponseException;

class GraphQLExecutorTest extends AnetApplicationTest {

  private static final String LOCATION_UUID = "283797ec-7077-49b2-87b8-9afd5499b6f3";

  @ParameterizedTest
  @ValueSource(strings = {"", "555", "-1", "not-a-uuid", "1-1-1-1-1",
      " 00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000001 "})
  void invalidUuidFromBatchLoaderReturnsBadRequest(String uuid) {
    assertBadRequest(
        () -> withCredentials(adminUser, t -> queryExecutor.location("{ uuid }", uuid)));
    assertBadRequest(() -> withCredentials(adminUser,
        t -> queryExecutor.locations("{ uuid }", List.of(LOCATION_UUID, uuid))));
  }

  @Test
  void batchLookupPreservesOrderNullsDuplicatesAndCanonicalUuids() {
    final List<Location> locations = withCredentials(adminUser,
        t -> queryExecutor.locations("{ uuid }",
            Arrays.asList(LOCATION_UUID.toUpperCase(Locale.ROOT), UUID.randomUUID().toString(),
                null, LOCATION_UUID)));

    assertThat(locations).hasSize(4);
    assertThat(locations.get(0).getUuid()).isEqualTo(LOCATION_UUID);
    assertThat(locations.get(1)).isNull();
    assertThat(locations.get(2)).isNull();
    assertThat(locations.get(3).getUuid()).isEqualTo(LOCATION_UUID);
  }

  @Test
  void optionalNullAndEmptyBatchesUseRealEndpoint() {
    final List<Location> nullLocations = withCredentials(adminUser,
        t -> queryExecutor.locations("{ uuid }", Arrays.asList(null, null)));
    assertThat(nullLocations).containsExactly(null, null);

    final List<Location> emptyLocations =
        withCredentials(adminUser, t -> queryExecutor.locations("{ uuid }", List.of()));
    assertThat(emptyLocations).isEmpty();
  }

  private void assertBadRequest(Runnable request) {
    final RuntimeException exception = assertThrows(RuntimeException.class, request::run);
    assertThat(ExceptionUtils.getRootCause(exception)).isInstanceOfSatisfying(
        WebClientResponseException.BadRequest.class,
        error -> assertThat(error.getResponseBodyAsString()).contains("Invalid UUID"));
  }
}
