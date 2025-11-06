package mil.dds.anet.test.ws.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;
import mil.dds.anet.test.SpringTestConfig;
import mil.dds.anet.ws.AccessTokenPrincipal;
import mil.dds.anet.ws.security.BearerTokenService;
import mil.dds.anet.ws.security.WebServiceGrantedAuthority;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.GrantedAuthority;

@SpringBootTest(classes = SpringTestConfig.class)
class BearerTokenServiceTest {

  @Autowired
  private BearerTokenService service;


  @Test
  @DisplayName("Returns empty when header is null")
  void nullHeader_returnsEmpty() {
    Optional<AccessTokenPrincipal> result = service.getAccessPrincipalFromAuthHeader(null);
    assertThat(result).isEmpty();
  }

  @Test
  @DisplayName("Returns empty when header does not start with Bearer prefix")
  void headerWithoutPrefix_returnsEmpty() {
    Optional<AccessTokenPrincipal> result =
        service.getAccessPrincipalFromAuthHeader(BearerToken.CORRUPT_TOKEN2);
    assertThat(result).isEmpty();
  }

  @Test
  @DisplayName("Returns empty when Bearer prefix is present but token length is invalid")
  void prefixButInvalidLength_returnsEmpty() {
    Optional<AccessTokenPrincipal> result =
        service.getAccessPrincipalFromAuthHeader(BearerToken.CORRUPT_TOKEN1);
    assertThat(result).isEmpty();
  }

  @Test
  @DisplayName("Returns empty when Bearer token has wrong length")
  void shortToken_returnsEmpty() {
    String shortTokenHeader = "Bearer short";
    Optional<AccessTokenPrincipal> result =
        service.getAccessPrincipalFromAuthHeader(shortTokenHeader);
    assertThat(result).isEmpty();
  }

  @Test
  @DisplayName("Returns empty for an unknown Bearer token")
  void unknownToken_returnsEmpty() {
    Optional<AccessTokenPrincipal> result =
        service.getAccessPrincipalFromAuthHeader(BearerToken.UNKNOWN_TOKEN);
    assertThat(result).isEmpty();
  }

  @Test
  @DisplayName("Returns empty for an expired Bearer token")
  void expiredToken_returnsEmpty() {
    Optional<AccessTokenPrincipal> result =
        service.getAccessPrincipalFromAuthHeader(BearerToken.EXPIRED_TOKEN);
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
