package mil.dds.anet.test.ws.security;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.io.UnsupportedEncodingException;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.ws.security.AccessTokenAuthentication;
import mil.dds.anet.ws.security.BearerTokenAuthFilter;
import mil.dds.anet.ws.security.BearerTokenService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
class BearerTokenAuthFilterTest extends AbstractResourceTest {

  private final BearerTokenAuthFilter filter;

  @Autowired
  public BearerTokenAuthFilterTest(BearerTokenService tokenService) {
    this.filter = new BearerTokenAuthFilter(tokenService);
  }

  @AfterEach
  void clearSecurity() {
    SecurityContextHolder.clearContext();
  }

  private MockHttpServletRequest requestWith(String header) {
    var req = new MockHttpServletRequest();
    req.addHeader("Authorization", header);
    return req;
  }

  private static class RecordingChain implements FilterChain {
    boolean invoked = false;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response) {
      invoked = true;
    }
  }

  private void assertUnauthorized(MockHttpServletResponse res, RecordingChain chain)
      throws UnsupportedEncodingException {
    assertThat(res.getStatus()).isEqualTo(MockHttpServletResponse.SC_UNAUTHORIZED);
    assertThat(res.getContentAsString()).contains("Unauthorized");
    assertThat(chain.invoked).isFalse();
    assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
  }

  @Test
  @DisplayName("Reject unknown token")
  void unknownToken_rejected() throws Exception {
    var req = requestWith(BearerToken.UNKNOWN_TOKEN);
    var res = new MockHttpServletResponse();
    var chain = new RecordingChain();

    filter.doFilter(req, res, chain);

    assertUnauthorized(res, chain);
  }

  @Test
  @DisplayName("Reject malformed bearer token with prefix")
  void corrupt1_rejected() throws Exception {
    var req = requestWith(BearerToken.CORRUPT_TOKEN1);
    var res = new MockHttpServletResponse();
    var chain = new RecordingChain();

    filter.doFilter(req, res, chain);

    assertUnauthorized(res, chain);
  }

  @Test
  @DisplayName("Reject malformed token without Bearer prefix")
  void corrupt2_rejected() throws Exception {
    var req = requestWith(BearerToken.CORRUPT_TOKEN2);
    var res = new MockHttpServletResponse();
    var chain = new RecordingChain();

    filter.doFilter(req, res, chain);

    assertUnauthorized(res, chain);
  }

  @Test
  @DisplayName("Reject expired token")
  void expired_rejected() throws Exception {
    var req = requestWith(BearerToken.EXPIRED_TOKEN);
    var res = new MockHttpServletResponse();
    var chain = new RecordingChain();

    filter.doFilter(req, res, chain);

    assertUnauthorized(res, chain);
  }

  @Test
  @DisplayName("Authenticate valid token")
  void validToken_authenticated() throws Exception {
    var req = requestWith(BearerToken.VALID_GRAPHQL_TOKEN);
    var res = new MockHttpServletResponse();
    var chain = new RecordingChain();

    filter.doFilter(req, res, chain);

    assertThat(chain.invoked).isTrue();

    var auth = SecurityContextHolder.getContext().getAuthentication();
    assertThat(auth).isInstanceOf(AccessTokenAuthentication.class);
  }
}
