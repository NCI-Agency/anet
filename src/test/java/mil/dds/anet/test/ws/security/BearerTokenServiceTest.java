package mil.dds.anet.test.ws.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;
import mil.dds.anet.test.SpringTestConfig;
import mil.dds.anet.ws.security.AccessTokenPrincipal;
import mil.dds.anet.ws.security.BearerTokenService;
import mil.dds.anet.ws.security.WebServiceGrantedAuthority;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.GrantedAuthority;

@SpringBootTest(classes = SpringTestConfig.class)
class BearerTokenServiceTest {

  @Autowired
  private BearerTokenService service;

  @ParameterizedTest
  @DisplayName("Returns empty for invalid, malformed, unknown, or expired Bearer tokens")
  @NullSource
  @ValueSource(strings = {BearerToken.CORRUPT_TOKEN1, BearerToken.CORRUPT_TOKEN2, "Bearer short",
      BearerToken.UNKNOWN_TOKEN, BearerToken.EXPIRED_TOKEN})
  void invalidHeaders_returnEmpty(String header) {
    Optional<AccessTokenPrincipal> result = service.getAccessPrincipalFromAuthHeader(header);
    assertThat(result).isEmpty();
  }

  @Test
  @DisplayName("Returns a Principal for the valid Bearer token with SCOPE_GRAPHQL authority")
  void validToken_returnsPrincipalWithScopeNvg() {
    Optional<AccessTokenPrincipal> result =
        service.getAccessPrincipalFromAuthHeader(BearerToken.VALID_GRAPHQL_TOKEN);

    assertThat(result).as("Valid token should return a principal").isPresent();

    var principal = result.get();

    assertThat(principal.authorities()).as("Principal should contain SCOPE_GRAPHQL authority")
        .extracting(GrantedAuthority::getAuthority)
        .contains(WebServiceGrantedAuthority.SCOPE_GRAPHQL);
  }
}
