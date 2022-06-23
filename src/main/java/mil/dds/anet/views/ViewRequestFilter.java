package mil.dds.anet.views;

import java.security.Principal;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.HttpMethod;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.core.Context;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.userActivity.Activity;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;

public class ViewRequestFilter implements ContainerRequestFilter {
  @Context
  HttpServletRequest request;

  @Override
  public void filter(ContainerRequestContext requestContext) {
    // Log only requests other than GET and if userPrincipal is a Person,
    // and the activity should not be ignored
    final boolean isGet = HttpMethod.GET.equals(requestContext.getMethod());
    final Principal userPrincipal = requestContext.getSecurityContext().getUserPrincipal();
    if (!isGet && userPrincipal instanceof Person
        && !ResponseUtils.ignoreActivity(requestContext)) {
      final Person person = (Person) userPrincipal;
      final Activity activity = new Activity(ResponseUtils.getRemoteAddr(request),
          ResponseUtils.getReferer(requestContext), DaoUtils.getCurrentMinute());
      // Store user activities in Person bean
      AnetObjectEngine.getInstance().getPersonDao()
          .logActivitiesByOpenIdSubject(person.getOpenIdSubject(), activity);
    }
  }
}
