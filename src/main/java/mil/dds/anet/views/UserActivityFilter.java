package mil.dds.anet.views;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.UserActivity;
import mil.dds.anet.beans.recentActivity.Activity;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.SecurityUtils;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class UserActivityFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    // Record activity only if the user is fully authenticated
    if (request.getUserPrincipal() != null) {
      final Person person = SecurityUtils.getPersonFromPrincipal(request.getUserPrincipal());
      // Store recent user activities in Person bean
      final Activity activity = new Activity(ResponseUtils.getRemoteAddr(request),
          ResponseUtils.getReferer(request), DaoUtils.getCurrentMinute());
      ApplicationContextProvider.getEngine().getPersonDao()
          .logActivitiesByDomainUsername(person.getDomainUsername(), activity);
      // Store this request in the database (only once per minute)
      final Position position = person.getPosition();
      final UserActivity userActivity = new UserActivity(person.getUuid(),
          position == null ? null : position.getOrganizationUuid(), DaoUtils.getCurrentMinute());
      ApplicationContextProvider.getEngine().getUserActivityDao().insert(userActivity);
    }
    filterChain.doFilter(request, response);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    // Log only requests other than GET and the activity should not be ignored
    return HttpMethod.GET.matches(request.getMethod()) || ResponseUtils.ignoreActivity(request);
  }
}
