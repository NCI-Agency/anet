package mil.dds.anet.auth;

import com.codahale.metrics.MetricRegistry;
import com.codahale.metrics.Timer;
import io.dropwizard.auth.Authorizer;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.security.Principal;
import java.util.List;
import javax.annotation.Priority;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.core.SecurityContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Priority(1500) // Run After Authentication, but before Authorization
public class AnetAuthenticationFilter implements ContainerRequestFilter, Authorizer<Person> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final AnetObjectEngine engine;
  private final Timer timerFilter;
  private final Timer timerAuthorize;

  public AnetAuthenticationFilter(AnetObjectEngine engine, MetricRegistry metricRegistry) {
    this.engine = engine;
    this.timerFilter = metricRegistry.timer(MetricRegistry.name(this.getClass(), "filter"));
    this.timerAuthorize = metricRegistry.timer(MetricRegistry.name(this.getClass(), "authorize"));
  }

  @Override
  public void filter(ContainerRequestContext ctx) throws IOException {
    final Timer.Context context = timerFilter.time();
    try {
      final SecurityContext secContext = ctx.getSecurityContext();
      Principal p = secContext.getUserPrincipal();
      if (p != null) {
        String domainUsername = p.getName();
        List<Person> matches = engine.getPersonDao().findByDomainUsername(domainUsername);
        Person person;
        if (matches.size() == 0) {
          // First time this user has ever logged in.
          person = new Person();
          person.setDomainUsername(domainUsername);
          person.setName("");
          person.setRole(Role.ADVISOR);
          person.setStatus(PersonStatus.NEW_USER);
          person = engine.getPersonDao().insert(person);
        } else {
          person = matches.get(0);
        }

        final Person user = person;
        ctx.setSecurityContext(new SecurityContext() {
          @Override
          public Principal getUserPrincipal() {
            return user;
          }

          @Override
          public boolean isUserInRole(String role) {
            return authorize(user, role);
          }

          @Override
          public boolean isSecure() {
            return secContext.isSecure();
          }

          @Override
          public String getAuthenticationScheme() {
            return secContext.getAuthenticationScheme();
          }
        });
      } else {
        throw new WebApplicationException("Unauthorized", Status.UNAUTHORIZED);
      }
    } finally {
      context.stop();
    }
  }

  @Override
  public boolean authorize(Person principal, String role) {
    final Timer.Context context = timerAuthorize.time();
    try {
      return checkAuthorization(principal, role);
    } finally {
      context.stop();
    }
  }

  /**
   * Determines if a given person has a particular role. For SUPER_USER Privileges, this does not
   * validate that the user has those privileges for a particular organization. That needs to be
   * done later.
   */
  public static boolean checkAuthorization(Person principal, String role) {
    Position position = principal.loadPosition();
    if (position == null) {
      logger.debug("Authorizing {} for role {} FAILED due to null position",
          principal.getDomainUsername(), role);
      return false;
    }

    // Administrators can do anything
    if (position.getType() == PositionType.ADMINISTRATOR) {
      logger.debug("Authorizing {} for role {} SUCCESS", principal.getDomainUsername(), role);
      return true;
    }

    // Verify the user is a super user.
    if (PositionType.SUPER_USER.toString().equals(role)) {
      if (position.getType() == PositionType.SUPER_USER) {
        logger.debug("Authorizing {} for role {} SUCCESS", principal.getDomainUsername(), role);
        return true;
      }
    }
    logger.debug("Authorizing {} for role {} FAILED", principal.getDomainUsername(), role);
    return false;
  }

}
