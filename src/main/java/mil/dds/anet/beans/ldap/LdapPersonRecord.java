package mil.dds.anet.beans.ldap;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.beans.Person;

public class LdapPersonRecord implements Comparable<LdapPersonRecord> {
  // Some standard attribute mappings
  public static final String LDAP_UUID = "ldapUuid";
  public static final String LDAP_UPDATED_AT = "ldapUpdatedAt";
  public static final String LDAP_EMAIL_ADDRESSES = "emailAddresses";
  public static final String LDAP_PHONE_NUMBER = "phoneNumber";
  public static final String LDAP_COUNTRY = "country";
  public static final String LDAP_GENDER = "gender";
  public static final String LDAP_ENTITY_AVATAR = "entityAvatar";
  // The default email network for LDAP email addresses
  public static final String LDAP_EMAIL_NETWORK = "Internet";
  // The default phone type for LDAP telephone numbers
  public static final String LDAP_PHONE_TYPE = "Work";

  public static final Comparator<LdapPersonRecord> COMPARATOR = Comparator
      .comparing((LdapPersonRecord ldapPersonRecord) -> ldapPersonRecord.getAsString("familyName"))
      .thenComparing(ldapPersonRecord -> ldapPersonRecord.getAsString("givenName"))
      .thenComparing(ldapPersonRecord -> ldapPersonRecord.getAsString(LDAP_UUID));

  @GraphQLQuery
  private Map<String, Object> attributes = new HashMap<>();
  @GraphQLQuery
  private Person person;

  public Map<String, Object> getAttributes() {
    return attributes;
  }

  public void setAttributes(Map<String, Object> attributes) {
    this.attributes = attributes;
  }

  public Object get(String key) {
    return this.attributes.get(key);
  }

  public String getAsString(String key) {
    return (String) get(key);
  }

  public void set(String key, Object value) {
    this.attributes.put(key, value);
  }

  public Person getPerson() {
    return person;
  }

  public void setPerson(Person person) {
    this.person = person;
  }

  @Override
  public int compareTo(LdapPersonRecord o) {
    // Used by Collections.sort() in LdapPersonRepository::executeQuery
    return COMPARATOR.compare(this, o);
  }

  @Override
  public boolean equals(Object object) {
    if (!(object instanceof LdapPersonRecord that))
      return false;
    return Objects.equals(attributes, that.attributes);
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(attributes);
  }
}
