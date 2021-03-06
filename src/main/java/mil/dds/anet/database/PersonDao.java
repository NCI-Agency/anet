package mil.dds.anet.database;

import com.codahale.metrics.MetricRegistry;
import com.google.common.collect.ObjectArrays;
import java.lang.invoke.MethodHandles;
import java.lang.reflect.InvocationTargetException;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Deque;
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
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.beans.userActivity.Activity;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.PersonPositionHistoryMapper;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AnetConstants;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.apache.commons.beanutils.PropertyUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class PersonDao extends AnetBaseDao<Person, PersonSearchQuery> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // Must always retrieve these e.g. for ORDER BY
  public static final String[] minimalFields = {"uuid", "name", "rank", "createdAt"};
  public static final String[] additionalFields = {"status", "role", "emailAddress", "phoneNumber",
      "biography", "country", "gender", "endOfTourDate", "domainUsername", "pendingVerification",
      "code", "updatedAt", "customFields"};
  // "avatar" has its own batcher
  public static final String[] avatarFields = {"uuid", "avatar"};
  public static final String[] allFields =
      ObjectArrays.concat(minimalFields, additionalFields, String.class);
  public static final String TABLE_NAME = "people";
  public static final String PERSON_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, allFields, true);
  public static final String PERSON_AVATAR_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, avatarFields, true);
  public static final String PERSON_FIELDS_NOAS =
      DaoUtils.buildFieldAliases(TABLE_NAME, allFields, false);

  private static final String EHCACHE_CONFIG = "/ehcache-config.xml";
  private static final String DOMAIN_USERS_CACHE = "domainUsersCache";
  private static final int ACTIVITY_LOG_LIMIT = 10;

  private Cache<String, Person> domainUsersCache;

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
    } catch (URISyntaxException | NullPointerException e) {
      logger.warn("Caching config {} not found, proceeding without caching", EHCACHE_CONFIG);
    }
  }

  public Cache<String, Person> getDomainUsersCache() {
    return domainUsersCache;
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
        + "(uuid, name, status, role, \"emailAddress\", \"phoneNumber\", rank, "
        + "\"pendingVerification\", gender, country, avatar, code, \"endOfTourDate\", biography, "
        + "\"domainUsername\", \"createdAt\", \"updatedAt\", \"customFields\") "
        + "VALUES (:uuid, :name, :status, :role, :emailAddress, :phoneNumber, :rank, "
        + ":pendingVerification, :gender, :country, :avatar, :code, ");
    if (DaoUtils.isMsSql()) {
      // MsSql requires an explicit CAST when datetime2 might be NULL.
      sql.append("CAST(:endOfTourDate AS datetime2), ");
    } else {
      sql.append(":endOfTourDate, ");
    }
    sql.append(":biography, :domainUsername, :createdAt, :updatedAt, :customFields);");
    getDbHandle().createUpdate(sql.toString()).bindBean(p)
        .bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
        .bind("endOfTourDate", DaoUtils.asLocalDateTime(p.getEndOfTourDate()))
        .bind("status", DaoUtils.getEnumId(p.getStatus()))
        .bind("role", DaoUtils.getEnumId(p.getRole())).execute();
    evictFromCache(p);
    return p;
  }

  @Override
  public int updateInternal(Person p) {
    StringBuilder sql = new StringBuilder("/* personUpdate */ UPDATE people "
        + "SET name = :name, status = :status, role = :role, gender = :gender, country = :country, "
        + "\"emailAddress\" = :emailAddress, \"avatar\" = :avatar, code = :code, "
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
    evictFromCache(p);
    // The domainUsername may have changed, evict original person as well
    evictFromCache(findInCache(p));
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
        .bind("inactiveStatus", DaoUtils.getEnumId(Person.Status.INACTIVE)).map(new PersonMapper())
        .list();
    // There should at most one match
    people.stream().forEach(p -> putInCache(p));
    return people;
  }

  public void logActivitiesByDomainUsername(String domainUsername, Activity activity) {
    final Person person = domainUsersCache.get(domainUsername);
    if (person != null) {
      final Deque<Activity> activities = person.getUserActivities();
      activities.addFirst(activity);
      while (activities.size() > ACTIVITY_LOG_LIMIT) {
        activities.removeLast();
      }
      person.setUserActivities(activities);
      domainUsersCache.replace(domainUsername, person);
    }
  }

  /**
   * Evict the person from the cache.
   *
   * @param personUuid the uuid of the person to be evicted from the cache
   */
  public void evictFromCacheByPersonUuid(String personUuid) {
    evictFromCache(findInCacheByPersonUuid(personUuid));
  }

  /**
   * Evict the person holding the position from the cache.
   *
   * @param positionUuid the uuid of the position for the person to be evicted from the cache
   */
  public void evictFromCacheByPositionUuid(String positionUuid) {
    evictFromCache(findInCacheByPositionUuid(positionUuid));
  }

  private Person getFromCache(String domainUsername) {
    if (domainUsersCache == null || domainUsername == null) {
      return null;
    }
    final Person person = domainUsersCache.get(domainUsername);
    final MetricRegistry metricRegistry = AnetObjectEngine.getInstance().getMetricRegistry();
    if (metricRegistry != null) {
      metricRegistry.counter(MetricRegistry.name(DOMAIN_USERS_CACHE, "LoadCount")).inc();
      if (person == null) {
        metricRegistry.counter(MetricRegistry.name(DOMAIN_USERS_CACHE, "CacheMissCount")).inc();
      } else {
        metricRegistry.counter(MetricRegistry.name(DOMAIN_USERS_CACHE, "CacheHitCount")).inc();
      }
    }
    // defensively copy the person we return from the cache
    return copyPerson(person);
  }

  private void putInCache(Person person) {
    if (domainUsersCache != null && person != null && person.getUuid() != null
        && person.getDomainUsername() != null) {
      // defensively copy the person we will be caching
      final Person copy = copyPerson(person);
      if (copy != null) {
        domainUsersCache.put(person.getDomainUsername(), copy);
      }
    }
  }

  /**
   * Just to be on the safe side, we only cache objects retrieved inside
   * {@link #findByDomainUsername(String)}.
   *
   * @param person the person to be evicted from the domain users cache
   */
  private void evictFromCache(Person person) {
    if (domainUsersCache != null && person != null && person.getDomainUsername() != null) {
      domainUsersCache.remove(person.getDomainUsername());
    }
  }

  private Person findInCache(Person person) {
    return findInCacheByPersonUuid(DaoUtils.getUuid(person));
  }

  private Person findInCacheByPersonUuid(String personUuid) {
    if (domainUsersCache != null && personUuid != null) {
      for (final Entry<String, Person> entry : domainUsersCache) {
        if (entry != null && Objects.equals(DaoUtils.getUuid(entry.getValue()), personUuid)) {
          return entry.getValue();
        }
      }
    }
    return null;
  }

  private Person findInCacheByPositionUuid(String positionUuid) {
    if (domainUsersCache != null && positionUuid != null) {
      for (final Entry<String, Person> entry : domainUsersCache) {
        if (entry != null
            && Objects.equals(DaoUtils.getUuid(entry.getValue().getPosition()), positionUuid)) {
          return entry.getValue();
        }
      }
    }
    return null;
  }

  // Make a defensive copy of a person and their position
  private Person copyPerson(Person person) {
    if (person != null) {
      try {
        final Person personCopy = new Person();
        for (final String prop : allFields) {
          PropertyUtils.setSimpleProperty(personCopy, prop,
              PropertyUtils.getSimpleProperty(person, prop));
        }
        final Position position = person.getPosition();
        if (position != null) {
          final Position positionCopy = new Position();
          for (final String prop : PositionDao.fields) {
            PropertyUtils.setSimpleProperty(positionCopy, prop,
                PropertyUtils.getSimpleProperty(position, prop));
          }
          personCopy.setPosition(positionCopy);
        }
        return personCopy;
      } catch (IllegalAccessException | InvocationTargetException | NoSuchMethodException e) {
        logger.warn("Could not copy person", e);
      }
    }
    return null;
  }

  @InTransaction
  public int mergePeople(Person winner, Person loser) {
    // For reports where both winner and loser are in the reportPeople:
    // 1. set winner's isPrimary, isAttendee and is isAuthor flags to the logical OR of both
    final String sqlUpd = "WITH dups AS ( SELECT"
        + "  rpw.\"reportUuid\" AS wreportuuid, rpw.\"personUuid\" AS wpersonuuid,"
        + "  rpw.\"isPrimary\" AS wprimary, rpl.\"isPrimary\" AS lprimary,"
        + "  rpw.\"isAttendee\" AS wattendee, rpl.\"isAttendee\" AS lattendee,"
        + "  rpw.\"isAuthor\" AS wauthor, rpl.\"isAuthor\" AS lauthor"
        + "  FROM \"reportPeople\" rpw"
        + "  JOIN \"reportPeople\" rpl ON rpl.\"reportUuid\" = rpw.\"reportUuid\""
        + "  WHERE rpw.\"personUuid\" = :winnerUuid AND rpl.\"personUuid\" = :loserUuid )"
        + " UPDATE \"reportPeople\" SET \"isPrimary\" = (dups.wprimary %1$s dups.lprimary),"
        + " \"isAttendee\" = (dups.wattendee %1$s dups.lattendee),"
        + " \"isAuthor\" = (dups.wauthor %1$s dups.lauthor) FROM dups"
        + " WHERE \"reportPeople\".\"reportUuid\" = dups.wreportuuid"
        + " AND \"reportPeople\".\"personUuid\" = dups.wpersonuuid";
    // MS SQL has no real booleans, so bitwise-or the 0/1 values in that case
    final String winnerUuid = winner.getUuid();
    final String loserUuid = loser.getUuid();
    getDbHandle().createUpdate(String.format(sqlUpd, DaoUtils.isMsSql() ? "|" : "OR"))
        .bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid).execute();
    // 2. delete the loser so we don't have duplicates
    final String sqlDel = "WITH dups AS ( SELECT"
        + "  rpl.\"reportUuid\" AS lreportuuid, rpl.\"personUuid\" AS lpersonuuid"
        + "  FROM \"reportPeople\" rpw"
        + "  JOIN \"reportPeople\" rpl ON rpl.\"reportUuid\" = rpw.\"reportUuid\""
        + "  WHERE rpw.\"personUuid\" = :winnerUuid AND rpl.\"personUuid\" = :loserUuid )"
        + " DELETE FROM \"reportPeople\" %1$s dups"
        + " WHERE \"reportPeople\".\"reportUuid\" = dups.lreportuuid"
        + " AND \"reportPeople\".\"personUuid\" = dups.lpersonuuid";
    // MS SQL and PostgreSQL have slightly different DELETE syntax
    getDbHandle().createUpdate(String.format(sqlDel, DaoUtils.isMsSql() ? "FROM" : "USING"))
        .bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid).execute();

    // update report people, should now be unique
    updateForMerge("reportPeople", "personUuid", winnerUuid, loserUuid);

    // update approvals this person might have done
    updateForMerge("reportActions", "personUuid", winnerUuid, loserUuid);

    // update comment authors
    updateForMerge("comments", "authorUuid", winnerUuid, loserUuid);

    // update position history
    updateForMerge("peoplePositions", "personUuid", winnerUuid, loserUuid);

    // update note authors
    updateForMerge("notes", "authorUuid", winnerUuid, loserUuid);

    // update notes
    updateM2mForMerge("noteRelatedObjects", "noteUuid", "relatedObjectUuid", winnerUuid, loserUuid);

    // Update customSensitiveInformation for winner
    DaoUtils.saveCustomSensitiveInformation(null, PersonDao.TABLE_NAME, winnerUuid,
        winner.getCustomSensitiveInformation());
    // Delete customSensitiveInformation for loser
    deleteForMerge("customSensitiveInformation", "relatedObjectUuid", loserUuid);

    // finally, delete the person!
    final int nr = deleteForMerge("people", "uuid", loserUuid);
    // E.g. positions may have been updated, so evict from the cache
    evictFromCache(winner);
    evictFromCache(loser);
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

  public String clearCache() {
    if (domainUsersCache != null) {
      domainUsersCache.removeAll();
      if (!domainUsersCache.iterator().hasNext()) {
        logger.info(AnetConstants.USERCACHE_MESSAGE);
        return AnetConstants.USERCACHE_MESSAGE;
      }
    }
    logger.warn(AnetConstants.USERCACHE_EMPTY_MESSAGE);
    return AnetConstants.USERCACHE_EMPTY_MESSAGE;
  }

}
