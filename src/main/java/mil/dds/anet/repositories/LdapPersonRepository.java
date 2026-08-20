package mil.dds.anet.repositories;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.ldap.LdapPersonRecord;
import mil.dds.anet.config.LdapImportConfig;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.query.LdapQueryBuilder;
import org.springframework.stereotype.Repository;

@Repository
public class LdapPersonRepository {

  private final LdapTemplate ldapTemplate;
  private final LdapImportConfig ldapImportConfig;

  public LdapPersonRepository(LdapTemplate ldapTemplate, LdapImportConfig ldapImportConfig) {
    this.ldapTemplate = ldapTemplate;
    this.ldapImportConfig = ldapImportConfig;
  }

  public List<LdapPersonRecord> findAll() {
    var query = getCommonQuery();
    return executeQuery(query);
  }

  public List<LdapPersonRecord> findByFullNameContains(String name) {
    var query =
        LdapQueryBuilder.fromQuery(getCommonQuery().where("cn").whitespaceWildcardsLike(name));
    return executeQuery(query);
  }

  private LdapQueryBuilder getCommonQuery() {
    final Map<String, String> attributeMappings = ldapImportConfig.getPersonAttributeMappings();
    final String[] attributesToReturn = attributeMappings.values().toArray(new String[0]);
    return LdapQueryBuilder
        .fromQuery(LdapQueryBuilder.query().base(ldapImportConfig.getPersonSearchBase())
            .attributes(attributesToReturn).where("objectClass").is("person"));
  }

  private List<LdapPersonRecord> executeQuery(LdapQueryBuilder query) {
    final List<LdapPersonRecord> results =
        ldapTemplate.search(query, ldapImportConfig.getLdapPersonRecordMapper());
    Collections.sort(results);
    return results;
  }

}
