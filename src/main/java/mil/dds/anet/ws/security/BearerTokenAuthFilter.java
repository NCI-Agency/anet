package mil.dds.anet.ws.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import mil.dds.anet.database.AccessTokenActivityDao;
import mil.dds.anet.utils.ResponseUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * A filter that performs Bearer token authentication in the Security filter chain.
 */
public class BearerTokenAuthFilter extends OncePerRequestFilter {

  private final BearerTokenService bearerTokenService;
  private final AccessTokenActivityDao accessTokenActivityDao;

  public BearerTokenAuthFilter(BearerTokenService bearerTokenService,
      AccessTokenActivityDao accessTokenActivityDao) {
    this.bearerTokenService = bearerTokenService;
    this.accessTokenActivityDao = accessTokenActivityDao;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    final String authHeader = request.getHeader("Authorization");

    final var tokenOpt = bearerTokenService.getAccessPrincipalFromAuthHeader(authHeader);
    if (tokenOpt.isPresent()) {
      ResponseUtils.logAccessTokenActivity(accessTokenActivityDao, tokenOpt, request);
      filterChain.doFilter(request, response);
      return;
    }

    response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
        "Unauthorized: Invalid or missing token");
  }
}
