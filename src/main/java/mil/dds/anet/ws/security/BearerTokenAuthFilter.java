package mil.dds.anet.ws.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * A filter that performs Bearer token authentication in the Security filter chain.
 */
public class BearerTokenAuthFilter extends OncePerRequestFilter {

  private final BearerTokenService bearerTokenService;

  public BearerTokenAuthFilter(BearerTokenService bearerTokenService) {
    this.bearerTokenService = bearerTokenService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    final String authHeader = request.getHeader("Authorization");

    final var tokenOpt = bearerTokenService.getAccessPrincipalFromAuthHeader(authHeader);
    if (tokenOpt.isPresent()) {
      var token = tokenOpt.get();

      // You can use info from token.getUser(), token.getScope(), etc.
      Authentication authentication = new AccessTokenAuthentication(token);

      SecurityContextHolder.getContext().setAuthentication(authentication);
      filterChain.doFilter(request, response);
      return;
    }

    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.getWriter().write("Unauthorized: Invalid or missing token");
    response.flushBuffer();
  }
}
