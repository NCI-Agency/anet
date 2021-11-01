package mil.dds.anet.auth;

import com.codahale.metrics.MetricRegistry;
import com.codahale.metrics.Timer;
import io.dropwizard.auth.AuthenticationException;
import io.dropwizard.auth.Authenticator;
import io.dropwizard.auth.basic.BasicCredentials;
import java.util.List;
import java.util.Optional;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.database.PersonDao;

public class AnetDevAuthenticator implements Authenticator<BasicCredentials, Person> {

  private final PersonDao dao;
  private final Timer timerAuthenticate;

  public AnetDevAuthenticator(AnetObjectEngine engine, MetricRegistry metricRegistry) {
    this.dao = engine.getPersonDao();
    this.timerAuthenticate =
        metricRegistry.timer(MetricRegistry.name(this.getClass(), "authenticate"));
  }

  @Override
  public Optional<Person> authenticate(BasicCredentials credentials)
      throws AuthenticationException {
    final Timer.Context context = timerAuthenticate.time();
    try {
      // Call non-synchronized method first
      final String domainUsername = credentials.getUsername();
      Person person = findUser(domainUsername);
      if (person == null && domainUsername.equals(credentials.getPassword())) {
        // Special development mechanism to perform a 'first login'.
        // Call synchronized method
        person = findOrCreateUser(domainUsername);
      }
      return person == null ? Optional.empty() : Optional.of(person);
    } finally {
      context.stop();
    }
  }

  // Non-synchronized method, safe to run multiple times in parallel
  private Person findUser(String domainUsername) {
    final List<Person> matches = dao.findByDomainUsername(domainUsername);
    return (matches.size() == 0) ? null : matches.get(0);
  }

  // Synchronized method, so we create at most one user in the face of multiple simultaneous
  // authentication requests
  private synchronized Person findOrCreateUser(String domainUsername) {
    final Person person = findUser(domainUsername);
    if (person != null) {
      return person;
    }
    // First time this user has ever logged in.
    final Person newPerson = new Person();
    newPerson.setDomainUsername(domainUsername);
    newPerson.setName("");
    newPerson.setRole(Role.ADVISOR);
    newPerson.setPendingVerification(true);
    return dao.insert(newPerson);
  }

}
