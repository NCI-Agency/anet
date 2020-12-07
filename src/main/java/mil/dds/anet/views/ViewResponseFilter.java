package mil.dds.anet.views;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import com.google.common.net.HttpHeaders;
import java.security.Principal;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.HttpMethod;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.SecurityContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.utils.DaoUtils;
import org.eclipse.jetty.security.DefaultUserIdentity;
import org.eclipse.jetty.security.UserAuthentication;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.UserIdentity;

public class ViewResponseFilter implements ContainerResponseFilter {

  @Context
  HttpServletRequest request;

  AnetConfiguration config;
  private static final Set<MediaType> uncachedMediaTypes =
      ImmutableSet.of(MediaType.APPLICATION_JSON_TYPE, MediaType.TEXT_HTML_TYPE);

  public ViewResponseFilter(AnetConfiguration config) {
    this.config = config;
  }

  @Override
  public void filter(ContainerRequestContext requestContext,
      ContainerResponseContext responseContext) {
    // Don't cache requests other than GET, and don't cache selected media types
    final MediaType mediaType = responseContext.getMediaType();
    if (!HttpMethod.GET.equals(requestContext.getMethod()) || mediaType == null
        || uncachedMediaTypes.stream().anyMatch(mt -> mt.equals(mediaType))) {
      responseContext.getHeaders().put(HttpHeaders.CACHE_CONTROL,
          ImmutableList.of("no-store, no-cache, must-revalidate, post-check=0, pre-check=0"));
      responseContext.getHeaders().put(HttpHeaders.PRAGMA, ImmutableList.of("no-cache"));
      // Log only requests other than GET and if userPrincipal exists
      if (!HttpMethod.GET.equals(requestContext.getMethod())
          && requestContext.getSecurityContext().getUserPrincipal() != null) {
        // This code snippet resolves the situation that caused empty user information to be
        // written to the access.log file
        // Start
        Principal userPrincipal = new Principal() {
          @Override
          public String getName() {
            final SecurityContext secContext = requestContext.getSecurityContext();
            Principal p = secContext.getUserPrincipal();
            return p.getName();
          }
        };
        UserIdentity userId = new DefaultUserIdentity(null, userPrincipal, null);
        Request baseRequest = Request.getBaseRequest(request);
        baseRequest.setAuthentication(new UserAuthentication(null, userId));
        // End

        // Store user activities in Person bean
        if (requestContext.getSecurityContext().getUserPrincipal() instanceof Person) {
          final Person person = (Person) requestContext.getSecurityContext().getUserPrincipal();
          @SuppressWarnings("serial")
          final HashMap<String, Object> activity = new HashMap<String, Object>() {
            {
              put("ip", request.getRemoteAddr() == null ? "-" : request.getRemoteAddr());
              put("user", copyMinimalPerson(person));
              put("request",
                  requestContext.getHeaderString("referer") != null
                      ? requestContext.getHeaderString("referer")
                      : "-");
              put("time", getCurrentMinute()); // log only one request per minute
              put("activity", "activity");
            }
          };
          AnetObjectEngine.getInstance().getPersonDao()
              .logActivitiesByOpenIdSubject(person.getOpenIdSubject(), activity);
        }
      }
    } else {
      responseContext.getHeaders().put(HttpHeaders.CACHE_CONTROL,
          ImmutableList.of("max-age=259200, public"));
    }
  }

  // Copy a minimal number of fields from a Person, enough for a LinkTo
  private Map<String, String> copyMinimalPerson(Person person) {
    final Map<String, String> result = new HashMap<>();
    result.put("uuid", person.getUuid());
    result.put("rank", person.getRank());
    result.put("name", person.getName());
    result.put("domainUsername", person.getDomainUsername());
    return result;
  }

  private Long getCurrentMinute() {
    final ZonedDateTime now = Instant.now().atZone(DaoUtils.getServerNativeZoneId());
    final ZonedDateTime bom = now.truncatedTo(ChronoUnit.MINUTES);
    return bom.toInstant().toEpochMilli();
  }
}
