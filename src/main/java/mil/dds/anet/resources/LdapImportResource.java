package mil.dds.anet.resources;

import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_EMAIL_NETWORK;
import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_UUID;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.beans.ldap.LdapPersonRecord;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.config.LdapImportConfig;
import mil.dds.anet.database.EmailAddressDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.repositories.LdapPersonRepository;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class LdapImportResource {

  private final LdapPersonRepository ldapUserRepository;
  private final LdapImportConfig ldapImportConfig;
  private final EmailAddressDao emailAddressDao;
  private final LocationDao locationDao;
  private final PersonDao personDao;

  public LdapImportResource(LdapPersonRepository ldapUserRepository,
      LdapImportConfig ldapImportConfig, EmailAddressDao emailAddressDao, LocationDao locationDao,
      PersonDao personDao) {
    this.ldapUserRepository = ldapUserRepository;
    this.ldapImportConfig = ldapImportConfig;
    this.emailAddressDao = emailAddressDao;
    this.locationDao = locationDao;
    this.personDao = personDao;
  }

  @GraphQLQuery(name = "getLdapPeople")
  public List<LdapPersonRecord> getLdapPeople(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "name") String name) {
    assertPermissions(DaoUtils.getUserFromContext(context));

    final List<LdapPersonRecord> ldapPeople =
        Utils.isEmptyOrNull(Utils.trimStringReturnNull(name)) ? ldapUserRepository.findAll()
            : ldapUserRepository.findByFullNameContains(name);
    final Map<String, Person> peopleByLdapUuidMap = getPeopleByLdapUuidMap();
    ldapPeople.forEach(p -> p.setPerson(getExistingPerson(peopleByLdapUuidMap, getLdapUuid(p))));
    return ldapPeople;
  }

  @GraphQLMutation(name = "importLdapPeople")
  public List<LdapPersonRecord> importLdapPeople(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "ldapUuids") List<String> ldapUuids) {
    assertPermissions(DaoUtils.getUserFromContext(context));

    final Map<String, Location> countries = getCountries();
    final List<LdapPersonRecord> peopleToImport = getPeopleToImport(ldapUuids);
    final Map<String, Person> peopleByLdapUuidMap = getPeopleByLdapUuidMap();

    final List<LdapPersonRecord> importedPeople = new ArrayList<>();
    peopleToImport.forEach(p -> {
      final Person existingPerson = getExistingPerson(peopleByLdapUuidMap, getLdapUuid(p));
      if (existingPerson == null) {
        // New person
        final Person newPerson = new Person();
        ldapImportConfig.mapInto(p, newPerson, countries);
        personDao.insert(newPerson);
        doCommonUpdates(newPerson, p, importedPeople);
      } else {
        final Instant lastModified = existingPerson.getLdapUpdatedAt();
        ldapImportConfig.mapInto(p, existingPerson, countries);
        // Person was imported before, check modification
        if (existingPerson.getLdapUpdatedAt() == null
            || existingPerson.getLdapUpdatedAt().isAfter(lastModified)) {
          personDao.update(existingPerson);
          doCommonUpdates(existingPerson, p, importedPeople);
        }
      }
    });
    doEmailAddressUpdates(importedPeople);
    return importedPeople;
  }

  private void assertPermissions(Person user) {
    if (!ldapImportConfig.isLdapImportPeopleEnabled()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "LDAP import is disabled");
    }
    AuthUtils.assertAdministrator(user);
  }

  private static String getLdapUuid(LdapPersonRecord lp) {
    return lp.get(LDAP_UUID);
  }

  private Person getExistingPerson(Map<String, Person> peopleByLdapUuidMap, String ldapUuid) {
    return peopleByLdapUuidMap.getOrDefault(ldapUuid, null);
  }

  private void doCommonUpdates(Person person, LdapPersonRecord lp,
      List<LdapPersonRecord> importedPeople) {
    personDao.updateLdapFields(person, getLdapUuid(lp));
    lp.setPerson(person);
    importedPeople.add(lp);
  }

  private void doEmailAddressUpdates(List<LdapPersonRecord> importedPeople) {
    final List<EmailAddress> emailAddresses =
        importedPeople.stream().map(LdapPersonRecord::getPerson).map(this::getEmailAddress)
            .filter(Objects::nonNull).toList();
    emailAddressDao.upsertEmailAddresses(emailAddresses);
  }

  private EmailAddress getEmailAddress(Person person) {
    if (Utils.isEmptyOrNull(person.getEmailAddresses())) {
      return null;
    }
    final EmailAddress emailAddress =
        person.getEmailAddresses().stream().filter(this::isLdapEmailNetwork).findAny().orElse(null);
    if (emailAddress != null) {
      emailAddress.setRelatedObjectType(PersonDao.TABLE_NAME);
      emailAddress.setRelatedObjectUuid(person.getUuid());
    }
    return emailAddress;
  }

  private boolean isLdapEmailNetwork(EmailAddress emailAddress) {
    return LDAP_EMAIL_NETWORK.equals(emailAddress.getNetwork());
  }

  private @NonNull Map<String, Location> getCountries() {
    final LocationSearchQuery q = new LocationSearchQuery();
    q.setType(Location.LocationType.COUNTRY);
    q.setStatus(WithStatus.Status.ACTIVE);
    q.setPageSize(0);
    return locationDao.search(q).getList().stream()
        .filter(l -> !Utils.isEmptyOrNull(l.getTrigram()))
        .collect(Collectors.toMap(Location::getTrigram, Function.identity()));
  }

  private @NonNull List<LdapPersonRecord> getPeopleToImport(@NonNull List<String> ldapUuids) {
    final List<LdapPersonRecord> allPeople = ldapUserRepository.findAll();
    return allPeople.stream().filter(p -> ldapUuids.contains(getLdapUuid(p))).toList();
  }

  private @NonNull List<Person> getAllPeople() {
    final PersonSearchQuery query = new PersonSearchQuery();
    query.setPageSize(0);
    final AnetBeanList<Person> results = personDao.search(query);
    return results.getList();
  }

  private @NonNull Map<String, Person> getPeopleMap(@NonNull List<Person> people,
      @NonNull Function<Person, String> keyMapper) {
    return people.stream().collect(Collectors.toMap(keyMapper, Function.identity()));
  }

  private @NonNull Map<String, Person> getPeopleByLdapUuidMap() {
    final List<Person> allPeople = getAllPeople();
    final List<Person> peopleWithLdapUuid =
        allPeople.stream().filter(p -> !Utils.isEmptyOrNull(p.getLdapUuid())).toList();
    return getPeopleMap(peopleWithLdapUuid, Person::getLdapUuid);
  }
}
