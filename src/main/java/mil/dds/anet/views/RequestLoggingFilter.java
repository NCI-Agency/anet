package mil.dds.anet.views;


import jakarta.ws.rs.HttpMethod;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import java.io.IOException;
import java.security.Principal;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.UserActivity;
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
      final Person person = (Person) userPrincipal;
      final Position position = person.getPosition();
      dao.insert(new UserActivity(person.getUuid(),
          position == null ? null : position.getOrganizationUuid(), DaoUtils.getCurrentMinute()));
    }
  }
}
