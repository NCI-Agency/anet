package mil.dds.anet.test.beans;

import static org.junit.jupiter.api.Assertions.assertTrue;

import mil.dds.anet.beans.Person;
import org.junit.jupiter.api.Test;

class PersonTest {
  @Test
  void systemUserHasNoPersistedAuthorizationGroups() {
    // No application context or DAO is needed for the non-persisted worker principal.
    assertTrue(Person.SYSTEM_USER.getAuthorizationGroupUuids().isEmpty());
    assertTrue(Person.SYSTEM_USER.loadAuthorizationGroups().isEmpty());
  }
}
