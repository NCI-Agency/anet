package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.util.List;
import java.util.Optional;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AccessToken;
import mil.dds.anet.test.client.AccessTokenInput;
import mil.dds.anet.test.client.TokenScope;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClientResponseException;

public class AccessTokenResourceTest extends AbstractResourceTest {

  public static final String FIELDS = "{ uuid name description scope expiresAt updatedAt }";

  @Test
  void accessTokenResourceTest() {
    // Create new access token
    final AccessTokenInput input = TestData.createAccessTokenInput("New GRAPHQL Token",
        TokenScope.GRAPHQL, "6m8dyZqNPRoYTjRzV8ppb0WSKS/ER9pVHFh5fsiv53Y=");
    final AccessToken created =
        withCredentials(adminUser, t -> mutationExecutor.createAccessToken(FIELDS, input));
    assertThat(created).isNotNull();
    List<AccessToken> accessTokens =
        withCredentials(adminUser, t -> queryExecutor.accessTokenList(FIELDS));
    Optional<AccessToken> accessTokenOptional = accessTokens.stream()
        .filter(token -> token.getName().equals("New GRAPHQL Token")).findFirst();
    assertThat(accessTokenOptional).isPresent();
    assertThat(accessTokenOptional.get().getUuid()).isEqualTo(created.getUuid());
    assertThat(accessTokenOptional.get().getName()).isEqualTo(input.getName());

    // Update
    final AccessTokenInput updatedInput = getAccessTokenInput(created);
    input.setName("New GRAPHQL Token v2");
    Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateAccessToken("", updatedInput, false));
    assertThat(nrUpdated).isOne();
    final AccessToken updated =
        withCredentials(adminUser, t -> queryExecutor.accessToken(FIELDS, updatedInput.getUuid()));
    assertThat(updated.getName()).isEqualTo(updatedInput.getName());

    // Update with outdated input
    final AccessTokenInput outdatedInput = getAccessTokenInput(created);
    try {
      withCredentials(adminUser, t -> mutationExecutor.updateAccessToken("", outdatedInput, false));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      final Throwable rootCause = ExceptionUtils.getRootCause(expectedException);
      if (!(rootCause instanceof WebClientResponseException.Conflict)) {
        fail("Expected WebClientResponseException.Conflict");
      }
    }

    // Now do a force-update
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateAccessToken("", outdatedInput, true));
    assertThat(nrUpdated).isOne();
    final AccessToken forceUpdated =
        withCredentials(adminUser, t -> queryExecutor.accessToken(FIELDS, outdatedInput.getUuid()));
    assertThat(forceUpdated.getName()).isEqualTo(outdatedInput.getName());

    // Delete
    final Integer nrDeleted = withCredentials(adminUser,
        t -> mutationExecutor.deleteAccessToken("", outdatedInput.getUuid()));
    assertThat(nrDeleted).isOne();
    accessTokens = withCredentials(adminUser, t -> queryExecutor.accessTokenList(FIELDS));
    assertThat(
        accessTokens.stream().anyMatch(token -> token.getName().equals("New GRAPHQL Token v2")))
        .isFalse();
  }
}
