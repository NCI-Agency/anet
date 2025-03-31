package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AccessToken;
import mil.dds.anet.test.client.AccessTokenInput;
import mil.dds.anet.test.client.TokenScope;
import org.junit.jupiter.api.Test;

public class AccessTokenResourceTest extends AbstractResourceTest {

  public static final String _TOKEN_FIELDS = "{uuid name description scope expiresAt}";

  @Test
  void locationTestGraphQL() {
    // Initially two tokens
    List<mil.dds.anet.test.client.AccessToken> accessTokens =
        withCredentials(adminUser, t -> queryExecutor.accessTokenList(_TOKEN_FIELDS));
    assertThat(accessTokens).isNotNull();
    assertThat(accessTokens.stream().anyMatch(token -> token.getScope().equals(TokenScope.GRAPHQL)))
        .isTrue();
    assertThat(accessTokens.stream().anyMatch(token -> token.getScope().equals(TokenScope.NVG)))
        .isTrue();
    // Create new access token
    final AccessTokenInput input = TestData.createAccessTokenInput("New GRAPHQL Token",
        TokenScope.GRAPHQL, "6m8dyZqNPRoYTjRzV8ppb0WSKS/ER9pVHFh5fsiv53Y=");
    final Integer created =
        withCredentials(adminUser, t -> mutationExecutor.createAccessToken("", input));
    assertThat(created).isNotNull();
    assertThat(created).isEqualTo(1);
    accessTokens = withCredentials(adminUser, t -> queryExecutor.accessTokenList(_TOKEN_FIELDS));
    final Optional<AccessToken> accessTokenOptional = accessTokens.stream()
        .filter(token -> token.getName().equals("New GRAPHQL Token")).findFirst();
    assertThat(accessTokenOptional.isPresent()).isTrue();
    // Update
    input.setUuid(accessTokenOptional.get().getUuid());
    input.setName("New GRAPHQL Token v2");
    final Integer updated =
        withCredentials(adminUser, t -> mutationExecutor.updateAccessToken("", input));
    assertThat(updated).isNotNull();
    assertThat(updated).isEqualTo(1);
    accessTokens = withCredentials(adminUser, t -> queryExecutor.accessTokenList(_TOKEN_FIELDS));
    assertThat(
        accessTokens.stream().anyMatch(token -> token.getName().equals("New GRAPHQL Token v2")))
        .isTrue();
    // Delete
    final Integer deleted =
        withCredentials(adminUser, t -> mutationExecutor.deleteAccessToken("", input));
    assertThat(deleted).isNotNull();
    assertThat(deleted).isEqualTo(1);
    accessTokens = withCredentials(adminUser, t -> queryExecutor.accessTokenList(_TOKEN_FIELDS));
    assertThat(accessTokens.stream().filter(token -> token.getScope().equals(TokenScope.GRAPHQL))
        .toList().size()).isEqualTo(1);
  }
}
