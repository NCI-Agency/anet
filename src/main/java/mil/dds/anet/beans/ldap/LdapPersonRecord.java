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
  public static final String LDAP_COUNTRY = "country";
  public static final String LDAP_GENDER = "gender";
  // The default email network for LDAP email addresses
  public static final String LDAP_EMAIL_NETWORK = "Internet";

  public static final Comparator<LdapPersonRecord> COMPARATOR = Comparator
      .comparing((LdapPersonRecord ldapPersonRecord) -> ldapPersonRecord.get("familyName"))
      .thenComparing(ldapPersonRecord -> ldapPersonRecord.get("givenName"))
      .thenComparing(ldapPersonRecord -> ldapPersonRecord.get(LDAP_UUID));

  @GraphQLQuery
  private Map<String, String> attributes = new HashMap<>();
  @GraphQLQuery
  private Person person;

  public Map<String, String> getAttributes() {
    return attributes;
  }

  public void setAttributes(Map<String, String> attributes) {
    this.attributes = attributes;
  }

  public String get(String key) {
    return this.attributes.get(key);
  }

  public void set(String key, String value) {
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
