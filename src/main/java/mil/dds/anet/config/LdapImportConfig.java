package mil.dds.anet.config;

import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_COUNTRY;
import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_EMAIL_ADDRESSES;
import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_EMAIL_NETWORK;
import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_GENDER;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.ldap.LdapPersonRecord;
import mil.dds.anet.utils.Utils;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.ldap.core.ContextMapper;
import org.springframework.ldap.core.DirContextAdapter;
import org.springframework.stereotype.Component;

@Component
public class LdapImportConfig {

  private static final org.slf4j.Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String PERSON_LDAP_IMPORT_SETTINGS_KEY = "fields.person.ldapImport";
  private static final String ENABLED_KEY = "enabled";
  private static final String SEARCH_BASE_KEY = "searchBase";
  private static final String ATTRIBUTE_MAPPINGS_KEY = "attributeMappings";

  // Formatter covering LDAP GeneralizedTime variations (e.g., 20260811164400Z, 20260811164400.123Z)
  private static final DateTimeFormatter LDAP_DATE_FORMATTER = new DateTimeFormatterBuilder()
      .appendPattern("yyyyMMddHHmmss").optionalStart()
      .appendFraction(java.time.temporal.ChronoField.MILLI_OF_SECOND, 1, 3, true).optionalEnd()
      .appendLiteral('Z').toFormatter(java.util.Locale.ENGLISH).withZone(java.time.ZoneOffset.UTC);

  private final AnetDictionary dict;

  @FunctionalInterface
  public interface Function3Arity<A, B, C, R> {
    R apply(A a, B b, C c);
  }

  private final Map<String, Function3Arity<Person, String, Map<String, Location>, Void>> attributeSetters =
      Map.of( // -
          LDAP_EMAIL_ADDRESSES, this::setEmailAddresses, // -
          LDAP_COUNTRY, this::setCountry, // -
          LDAP_GENDER, this::setGender // -
      );

  public LdapImportConfig(AnetDictionary dict) {
    this.dict = dict;
  }

  public boolean isLdapImportEnabled() {
    return Boolean.TRUE.equals(dict.getDictionaryEntry("enableLdapImport"));
  }

  public boolean isLdapImportPeopleEnabled() {
    return isLdapImportEnabled() && Boolean.TRUE.equals(dict
        .getDictionaryEntry(String.format("%s.%s", PERSON_LDAP_IMPORT_SETTINGS_KEY, ENABLED_KEY)));
  }

  public String getPersonSearchBase() {
    return (String) dict.getDictionaryEntry(
        String.format("%s.%s", PERSON_LDAP_IMPORT_SETTINGS_KEY, SEARCH_BASE_KEY));
  }

  public Map<String, String> getPersonAttributeMappings() {
    @SuppressWarnings("unchecked")
    final Map<String, String> attributeMappings = (Map<String, String>) dict.getDictionaryEntry(
        String.format("%s.%s", PERSON_LDAP_IMPORT_SETTINGS_KEY, ATTRIBUTE_MAPPINGS_KEY));
    return attributeMappings;
  }

  public ContextMapper<LdapPersonRecord> getLdapPersonRecordMapper() {
    final Map<String, String> attributeMappings = getPersonAttributeMappings();
    return ctx -> {
      final DirContextAdapter adapter = (DirContextAdapter) ctx;
      final LdapPersonRecord person = new LdapPersonRecord();
      attributeMappings.forEach((internalField, ldapAttribute) -> {
        final String rawValue = adapter.getStringAttribute(ldapAttribute);
        if (!Utils.isEmptyOrNull(Utils.trimStringReturnNull(rawValue))) {
          person.set(internalField, rawValue);
        }
      });
      return person;
    };
  }

  public void mapInto(LdapPersonRecord ldapPersonRecord, Person person,
      Map<String, Location> countries) {
    final Map<String, String> attributeMappings = getPersonAttributeMappings();
    final BeanWrapper beanWrapper = new BeanWrapperImpl(person);

    attributeMappings.forEach((internalField, ldapAttribute) -> {
      final String rawValue = ldapPersonRecord.get(internalField);

      if (!Utils.isEmptyOrNull(Utils.trimStringReturnNull(rawValue))) {
        if (attributeSetters.containsKey(internalField)) {
          final Function3Arity<Person, String, Map<String, Location>, Void> attributeSetter =
              attributeSetters.get(internalField);
          attributeSetter.apply(person, rawValue, countries);
        } else if (beanWrapper.isWritableProperty(internalField)) {
          final Class<?> propertyType = beanWrapper.getPropertyType(internalField);

          try {
            if (Instant.class.isAssignableFrom(propertyType)) {
              // Parse LDAP generalized text format to Instant
              final Instant instantValue = Instant.from(LDAP_DATE_FORMATTER.parse(rawValue));
              beanWrapper.setPropertyValue(internalField, instantValue);
            } else {
              // Fallback to default raw String mapping
              beanWrapper.setPropertyValue(internalField, rawValue);
            }
          } catch (Exception e) {
            logger.warn("Failed to map field {} with raw value: {}", internalField, rawValue, e);
          }
        }
      }
    });
  }

  private Void setEmailAddresses(Person person, String value, Map<String, Location> countries) {
    person.setEmailAddresses(List.of(new EmailAddress(LDAP_EMAIL_NETWORK, value)));
    return null;
  }

  private Void setCountry(Person person, String value, Map<String, Location> countries) {
    person.setCountry(countries.get(value));
    return null;
  }

  private Void setGender(Person person, String value, Map<String, Location> countries) {
    person.setGender(switch (value.substring(0, 1).toUpperCase()) {
      case "M" -> "MALE";
      case "F", "W" -> "FEMALE";
      default -> "NOT SPECIFIED";
    });
    return null;
  }
}
