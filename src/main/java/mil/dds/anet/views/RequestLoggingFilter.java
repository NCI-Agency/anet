package mil.dds.anet.views;

import java.io.IOException;
import java.security.Principal;
import javax.ws.rs.HttpMethod;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.UserActivityDao;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;

public class RequestLoggingFilter implements ContainerRequestFilter {
  private final UserActivityDao dao;

  public RequestLoggingFilter(final AnetObjectEngine engine) {
    this.dao = engine.getUserActivityDao();
  }

  @Override
  public void filter(ContainerRequestContext requestContext) throws IOException {
    // Log only requests other than GET and if userPrincipal is a Person,
    // and the activity should not be ignored
    final boolean isGet = HttpMethod.GET.equals(requestContext.getMethod());
    final Principal userPrincipal = requestContext.getSecurityContext().getUserPrincipal();
    if (!isGet && userPrincipal instanceof Person
        && !ResponseUtils.ignoreActivity(requestContext)) {
      // Store this request in the database (only once per minute)
      dao.insert(((Person) userPrincipal).getUuid(), DaoUtils.getCurrentMinute());
    }
  }
}
