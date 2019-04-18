package mil.dds.anet.auth;

import io.dropwizard.auth.AuthFilter;
import io.dropwizard.auth.Authenticator;
import io.dropwizard.auth.basic.BasicCredentials;
import java.io.IOException;
import java.security.Principal;
import java.util.List;
import javax.annotation.Nullable;
import javax.annotation.Priority;
import javax.ws.rs.Priorities;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.SecurityContext;
import org.apache.commons.collections.CollectionUtils;

@Priority(Priorities.AUTHENTICATION)
public class UrlParamsAuthFilter<P extends Principal> extends AuthFilter<BasicCredentials, P> {

  private static final String PARAM_PASSWORD = "pass";
  private static final String PARAM_USERNAME = "user";

  private UrlParamsAuthFilter() {}

  @Override
  public void filter(ContainerRequestContext requestContext) throws IOException {
    final MultivaluedMap<String, String> queryParameters =
        requestContext.getUriInfo().getQueryParameters();
    final BasicCredentials credentials = getCredentials(queryParameters);
    if (!authenticate(requestContext, credentials, SecurityContext.BASIC_AUTH)) {
      throw new WebApplicationException(unauthorizedHandler.buildResponse(prefix, realm));
    }
  }

  @Nullable
  private BasicCredentials getCredentials(MultivaluedMap<String, String> queryParameters) {
    final String username = extractParam(queryParameters, PARAM_USERNAME);
    final String password = extractParam(queryParameters, PARAM_PASSWORD);
    if (username == null || password == null) {
      return null;
    }
    return new BasicCredentials(username, password);
  }

  private String extractParam(MultivaluedMap<String, String> queryParameters, String paramName) {
    final List<String> params = queryParameters.get(paramName);
    return CollectionUtils.isEmpty(params) ? null : params.get(0);
  }

  /**
   * Builder for {@link UrlParamsAuthFilter}.
   * <p>
   * An {@link Authenticator} must be provided during the building process.
   * </p>
   *
   * @param <P> the principal
   */
  public static class Builder<P extends Principal>
      extends AuthFilterBuilder<BasicCredentials, P, UrlParamsAuthFilter<P>> {

    @Override
    protected UrlParamsAuthFilter<P> newInstance() {
      return new UrlParamsAuthFilter<>();
    }
  }
}
