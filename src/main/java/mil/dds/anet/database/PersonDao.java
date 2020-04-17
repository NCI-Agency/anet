package mil.dds.anet.database;

import com.codahale.metrics.MetricRegistry;
import com.google.common.collect.ObjectArrays;
import java.lang.invoke.MethodHandles;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import javax.cache.Cache;
import javax.cache.Cache.Entry;
import javax.cache.CacheManager;
import javax.cache.Caching;
import javax.cache.spi.CachingProvider;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.PersonPositionHistoryMapper;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class PersonDao extends AnetBaseDao<Person, PersonSearchQuery> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // Must always retrieve these e.g. for ORDER BY
  public static String[] minimalFields = {"uuid", "name", "rank", "createdAt"};
  public static String[] additionalFields = {"status", "role", "emailAddress", "phoneNumber",
      "biography", "country", "gender", "endOfTourDate", "domainUsername", "pendingVerification",
      "code", "updatedAt", "customFields"};
  // "avatar" has its own batcher
  public static String[] avatarFields = {"uuid", "avatar"};
  public static final String[] allFields =
      ObjectArrays.concat(minimalFields, additionalFields, String.class);
  public static String TABLE_NAME = "people";
  public static String PERSON_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, allFields, true);
  public static String PERSON_AVATAR_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, avatarFields, true);
  public static String PERSON_FIELDS_NOAS =
      DaoUtils.buildFieldAliases(TABLE_NAME, allFields, false);

  private static final String EHCACHE_CONFIG = "/ehcache-config.xml";
  private static final String DOMAIN_USERS_CACHE = "domainUsersCache";

  private Cache<String, Person> domainUsersCache;
  private MetricRegistry metricRegistry;

  public PersonDao() {
    try {
      final CachingProvider cachingProvider = Caching.getCachingProvider();
      final CacheManager manager = cachingProvider.getCacheManager(
          PersonDao.class.getResource(EHCACHE_CONFIG).toURI(), PersonDao.class.getClassLoader());
      domainUsersCache = manager.getCache(DOMAIN_USERS_CACHE, String.class, Person.class);
      if (domainUsersCache == null) {
        logger.warn("Caching config for {} not found in {}, proceeding without caching",
            DOMAIN_USERS_CACHE, EHCACHE_CONFIG);
      }
    } catch (URISyntaxException e) {
      logger.warn("Caching config {} not found, proceeding without caching", EHCACHE_CONFIG);
    }
  }

  public MetricRegistry getMetricRegistry() {
    return metricRegistry;
  }

  public void setMetricRegistry(MetricRegistry metricRegistry) {
    this.metricRegistry = metricRegistry;
  }

  @Override
  public Person getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Person> {
    private static final String sql = "/* batch.getPeopleByUuids */ SELECT " + PERSON_FIELDS
        + " FROM people WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new PersonMapper());
    }
  }

  static class AvatarBatcher extends IdBatcher<Person> {
    private static final String sql = "/* batch.getPeopleAvatars */ SELECT " + PERSON_AVATAR_FIELDS
        + " FROM people WHERE uuid IN ( <uuids> )";

    public AvatarBatcher() {
      super(sql, "uuids", new PersonMapper());
    }
  }

  @Override
  public List<Person> getByIds(List<String> uuids) {
    final IdBatcher<Person> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  public Person getAvatar(String uuid) {
    return getAvatars(Arrays.asList(uuid)).get(0);
  }

  public List<Person> getAvatars(List<String> uuids) {
    final IdBatcher<Person> avatarBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(AvatarBatcher.class);
    return avatarBatcher.getByIds(uuids);
  }

  static class PersonPositionHistoryBatcher extends ForeignKeyBatcher<PersonPositionHistory> {
    private static final String sql =
        "/* batch.getPersonPositionHistory */ SELECT * FROM \"peoplePositions\" "
            + "WHERE \"personUuid\" IN ( <foreignKeys> ) ORDER BY \"createdAt\" ASC";

    public PersonPositionHistoryBatcher() {
      super(sql, "foreignKeys", new PersonPositionHistoryMapper(), "personUuid");
    }
  }

  public List<List<PersonPositionHistory>> getPersonPositionHistory(List<String> foreignKeys) {
    final ForeignKeyBatcher<PersonPositionHistory> personPositionHistoryBatcher = AnetObjectEngine
        .getInstance().getInjector().getInstance(PersonPositionHistoryBatcher.class);
    return personPositionHistoryBatcher.getByForeignKeys(foreignKeys);
  }

  @Override
  public Person insertInternal(Person p) {
    StringBuilder sql = new StringBuilder();
    sql.append("/* personInsert */ INSERT INTO people "
        + "(uuid, name, status, role, \"emailAddress\", \"phoneNumber\", rank, \"pendingVerification\", "
        + "gender, country, avatar, code, \"endOfTourDate\", biography, \"domainUsername\", \"createdAt\", \"updatedAt\", \"customFields\") "
        + "VALUES (:uuid, :name, :status, :role, :emailAddress, :phoneNumber, :rank, :pendingVerification, "
        + ":gender, :country, :avatar, :code, ");
    if (DaoUtils.isMsSql()) {
      // MsSql requires an explicit CAST when datetime2 might be NULL.
      sql.append("CAST(:endOfTourDate AS datetime2), ");
    } else {
      sql.append(":endOfTourDate, ");
    }
    sql.append(":biography, :domainUsername, :createdAt, :updatedAt, :customFields);");
    final int nr = getDbHandle().createUpdate(sql.toString()).bindBean(p)
        .bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
        .bind("endOfTourDate", DaoUtils.asLocalDateTime(p.getEndOfTourDate()))
        .bind("status", DaoUtils.getEnumId(p.getStatus()))
        .bind("role", DaoUtils.getEnumId(p.getRole())).execute();
    evictFromCache(p, nr > 0);
    return p;
  }

  @Override
  public int updateInternal(Person p) {
    StringBuilder sql = new StringBuilder("/* personUpdate */ UPDATE people "
        + "SET name = :name, status = :status, role = :role, "
        + "gender = :gender, country = :country,  \"emailAddress\" = :emailAddress, "
        + "\"avatar\" = :avatar, code = :code, "
        + "\"phoneNumber\" = :phoneNumber, rank = :rank, biography = :biography, "
        + "\"pendingVerification\" = :pendingVerification, \"domainUsername\" = :domainUsername, "
        + "\"updatedAt\" = :updatedAt, \"customFields\" = :customFields, ");

    if (DaoUtils.isMsSql()) {
      // MsSql requires an explicit CAST when datetime2 might be NULL.
      sql.append("\"endOfTourDate\" = CAST(:endOfTourDate AS datetime2) ");
    } else {
      sql.append("\"endOfTourDate\" = :endOfTourDate ");
    }
    sql.append("WHERE uuid = :uuid");

    final int nr = getDbHandle().createUpdate(sql.toString()).bindBean(p)
        .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
        .bind("endOfTourDate", DaoUtils.asLocalDateTime(p.getEndOfTourDate()))
        .bind("status", DaoUtils.getEnumId(p.getStatus()))
        .bind("role", DaoUtils.getEnumId(p.getRole())).execute();
    evictFromCache(p, nr > 0);
    // The domainUsername may have changed, evict original person as well
    evictFromCache(findInCache(p), true);
    return nr;
  }

  @Override
  public AnetBeanList<Person> search(PersonSearchQuery query) {
    return search(null, query);
  }

  public AnetBeanList<Person> search(Set<String> subFields, PersonSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getPersonSearcher().runSearch(subFields,
        query);
  }

  @InTransaction
  public List<Person> findByDomainUsername(String domainUsername) {
    final Person person = getFromCache(domainUsername);
    if (person != null) {
      return Collections.singletonList(person);
    }
    final List<Person> people = getDbHandle()
        .createQuery("/* findByDomainUsername */ SELECT " + PERSON_FIELDS + ","
            + PositionDao.POSITIONS_FIELDS
            + "FROM people LEFT JOIN positions ON people.uuid = positions.\"currentPersonUuid\" "
            + "WHERE people.\"domainUsername\" = :domainUsername "
            + "AND people.status != :inactiveStatus")
        .bind("domainUsername", domainUsername)
        .bind("inactiveStatus", DaoUtils.getEnumId(PersonStatus.INACTIVE)).map(new PersonMapper())
        .list();
    // There should at most one match
    people.stream().forEach(p -> putInCache(p));
    return people;
  }

  private Person getFromCache(String domainUsername) {
    if (domainUsersCache == null || domainUsername == null) {
      return null;
    }
    final Person person = domainUsersCache.get(domainUsername);
    if (metricRegistry != null) {
      metricRegistry.counter(MetricRegistry.name(DOMAIN_USERS_CACHE, "LoadCount")).inc();
      if (person == null) {
        metricRegistry.counter(MetricRegistry.name(DOMAIN_USERS_CACHE, "CacheMissCount")).inc();
      } else {
        metricRegistry.counter(MetricRegistry.name(DOMAIN_USERS_CACHE, "CacheHitCount")).inc();
      }
    }
    return person;
  }

  private void putInCache(Person person) {
    if (domainUsersCache != null && person != null && person.getDomainUsername() != null) {
      domainUsersCache.put(person.getDomainUsername(), person);
    }
  }

  /**
   * Just to be on the safe side, we only cache objects retrieved inside
   * {@link #findByDomainUsername(String)}.
   *
   * @param person the person to be evicted from the domain users cache
   * @param evict if the person should be evicted from the cache (because the object has been
   *        updated or deleted)
   */
  private void evictFromCache(Person person, boolean evict) {
    if (domainUsersCache != null && evict && person != null && person.getDomainUsername() != null) {
      domainUsersCache.remove(person.getDomainUsername());
    }
  }

  private Person findInCache(Person person) {
    if (domainUsersCache != null && person != null) {
      for (final Entry<String, Person> entry : domainUsersCache) {
        if (Objects.equals(DaoUtils.getUuid(entry.getValue()), DaoUtils.getUuid(person))) {
          return entry.getValue();
        }
      }
    }
    return null;
  }

  @InTransaction
  public int mergePeople(Person winner, Person loser) {
    // delete duplicates where other is primary, or where neither is primary
    getDbHandle().createUpdate("DELETE FROM \"reportPeople\" WHERE ("
        + "\"personUuid\" = :loserUuid AND \"reportUuid\" IN ("
        + "SELECT \"reportUuid\" FROM \"reportPeople\" WHERE \"personUuid\" = :winnerUuid AND \"isPrimary\" = :isPrimary"
        + ")) OR (\"personUuid\" = :winnerUuid AND \"reportUuid\" IN ("
        + "SELECT \"reportUuid\" FROM \"reportPeople\" WHERE \"personUuid\" = :loserUuid AND \"isPrimary\" = :isPrimary"
        + ")) OR ("
        + "\"personUuid\" = :loserUuid AND \"isPrimary\" != :isPrimary AND \"reportUuid\" IN ("
        + "SELECT \"reportUuid\" FROM \"reportPeople\" WHERE \"personUuid\" = :winnerUuid AND \"isPrimary\" != :isPrimary"
        + "))").bind("winnerUuid", winner.getUuid()).bind("loserUuid", loser.getUuid())
        .bind("isPrimary", true).execute();

    // update report attendance, should now be unique
    getDbHandle().createUpdate(
        "UPDATE \"reportPeople\" SET \"personUuid\" = :winnerUuid WHERE \"personUuid\" = :loserUuid")
        .bind("winnerUuid", winner.getUuid()).bind("loserUuid", loser.getUuid()).execute();

    // update approvals this person might have done
    getDbHandle().createUpdate(
        "UPDATE \"reportActions\" SET \"personUuid\" = :winnerUuid WHERE \"personUuid\" = :loserUuid")
        .bind("winnerUuid", winner.getUuid()).bind("loserUuid", loser.getUuid()).execute();

    // report author update
    getDbHandle()
        .createUpdate(
            "UPDATE reports SET \"authorUuid\" = :winnerUuid WHERE \"authorUuid\" = :loserUuid")
        .bind("winnerUuid", winner.getUuid()).bind("loserUuid", loser.getUuid()).execute();

    // comment author update
    getDbHandle()
        .createUpdate(
            "UPDATE comments SET \"authorUuid\" = :winnerUuid WHERE \"authorUuid\" = :loserUuid")
        .bind("winnerUuid", winner.getUuid()).bind("loserUuid", loser.getUuid()).execute();

    // update position history
    getDbHandle().createUpdate(
        "UPDATE \"peoplePositions\" SET \"personUuid\" = :winnerUuid WHERE \"personUuid\" = :loserUuid")
        .bind("winnerUuid", winner.getUuid()).bind("loserUuid", loser.getUuid()).execute();

    // update note authors
    getDbHandle()
        .createUpdate(
            "UPDATE \"notes\" SET \"authorUuid\" = :winnerUuid WHERE \"authorUuid\" = :loserUuid")
        .bind("winnerUuid", winner.getUuid()).bind("loserUuid", loser.getUuid()).execute();

    // update note related objects where we don't already have the same note for the winnerUuid
    getDbHandle().createUpdate(
        "UPDATE \"noteRelatedObjects\" SET \"relatedObjectUuid\" = :winnerUuid WHERE \"relatedObjectUuid\" = :loserUuid"
            + " AND \"noteUuid\" NOT IN ("
            + "SELECT \"noteUuid\" FROM \"noteRelatedObjects\" WHERE \"relatedObjectUuid\" = :winnerUuid"
            + ")")
        .bind("winnerUuid", winner.getUuid()).bind("loserUuid", loser.getUuid()).execute();

    // now delete obsolete note related objects
    getDbHandle()
        .createUpdate("DELETE FROM \"noteRelatedObjects\" WHERE \"relatedObjectUuid\" = :loserUuid")
        .bind("loserUuid", loser.getUuid()).execute();

    // delete the person!
    final int nr = getDbHandle().createUpdate("DELETE FROM people WHERE uuid = :loserUuid")
        .bind("loserUuid", loser.getUuid()).execute();
    // E.g. positions may have been updated, so always evict
    evictFromCache(winner, true);
    evictFromCache(loser, true);
    return nr;
  }

  public CompletableFuture<List<PersonPositionHistory>> getPositionHistory(
      Map<String, Object> context, String personUuid) {
    return new ForeignKeyFetcher<PersonPositionHistory>()
        .load(context, FkDataLoaderKey.PERSON_PERSON_POSITION_HISTORY, personUuid)
        .thenApply(l -> PersonPositionHistory.getDerivedHistory(l));
  }

  @InTransaction
  public void clearEmptyBiographies() {
    // Search all people with a not null biography field
    final PersonSearchQuery query = new PersonSearchQuery();
    query.setPageSize(0);
    query.setHasBiography(true);
    final List<Person> persons = search(query).getList();

    // For each person with an empty html biography, set this one to null
    for (final Person p : persons) {
      if (Utils.isEmptyHtml(p.getBiography())) {
        getDbHandle()
            .createUpdate(
                "/* updatePersonBiography */ UPDATE people SET biography = NULL WHERE uuid = :uuid")
            .bind("uuid", p.getUuid()).execute();
        AnetAuditLogger.log("Person {} has an empty html biography, set it to null", p);
      }
    }
  }

}
