package mil.dds.anet.database;

import com.codahale.metrics.MetricRegistry;
import com.google.common.collect.ObjectArrays;
import java.lang.invoke.MethodHandles;
import java.lang.reflect.InvocationTargetException;
import java.net.URISyntaxException;
import java.time.Instant;
import java.time.LocalDateTime;
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
import mil.dds.anet.beans.recentActivity.Activity;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.PersonPositionHistoryMapper;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AnetConstants;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.apache.commons.beanutils.PropertyUtils;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class PersonDao extends AnetSubscribableObjectDao<Person, PersonSearchQuery> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // Must always retrieve these e.g. for ORDER BY
  public static final String[] minimalFields = {"uuid", "name", "rank", "createdAt"};
  public static final String[] additionalFields = {"status", "role", "emailAddress", "phoneNumber",
      "biography", "country", "gender", "endOfTourDate", "domainUsername", "openIdSubject",
      "pendingVerification", "code", "updatedAt", "customFields"};
  // "avatar" has its own batcher
  public static final String[] avatarFields = {"uuid", "avatarUuid"};
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
    final String sql = "/* personInsert */ INSERT INTO people "
        + "(uuid, name, status, role, \"emailAddress\", \"phoneNumber\", rank, "
        + "\"pendingVerification\", gender, country, \"avatarUuid\", code, \"endOfTourDate\", biography, "
        + "\"domainUsername\", \"openIdSubject\", \"createdAt\", \"updatedAt\", \"customFields\") "
        + "VALUES (:uuid, :name, :status, :role, :emailAddress, :phoneNumber, :rank, "
        + ":pendingVerification, :gender, :country, :avatar, :code, :endOfTourDate, :biography, "
        + ":domainUsername, :openIdSubject, :createdAt, :updatedAt, :customFields)";
    getDbHandle().createUpdate(sql).bindBean(p)
        .bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
        .bind("avatarUuid", p.getAvatarUuid())
        .bind("endOfTourDate", DaoUtils.asLocalDateTime(p.getEndOfTourDate()))
        .bind("status", DaoUtils.getEnumId(p.getStatus()))
        .bind("role", DaoUtils.getEnumId(p.getRole())).execute();
    evictFromCache(p);
    return p;
  }

  @InTransaction
  public int updateAuthenticationDetails(Person p) {
    DaoUtils.setUpdateFields(p);
    final String sql = "/* personUpdateAuthenticationDetails */ UPDATE people "
        + "SET \"openIdSubject\" = :openIdSubject , \"updatedAt\" = :updatedAt "
        + "WHERE uuid = :uuid";
    final int nr = getDbHandle().createUpdate(sql).bind("openIdSubject", p.getOpenIdSubject())
        .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt())).bind("uuid", p.getUuid())
        .execute();
    evictFromCache(p);
    // The openIdSubject has changed, evict original person as well
    evictFromCache(findInCache(p));
    // No need to update subscriptions, this is an internal change
    return nr;
  }

  @Override
  public int updateInternal(Person p) {
    final String sql = "/* personUpdate */ UPDATE people "
        + "SET name = :name, status = :status, role = :role, gender = :gender, country = :country, "
        + "\"emailAddress\" = :emailAddress, \"avatarUuid\" = :avatarUuid, code = :code, "
        + "\"phoneNumber\" = :phoneNumber, rank = :rank, biography = :biography, "
        + "\"pendingVerification\" = :pendingVerification, \"domainUsername\" = :domainUsername, "
        + "\"updatedAt\" = :updatedAt, \"customFields\" = :customFields, \"endOfTourDate\" = :endOfTourDate "
        + "WHERE uuid = :uuid";

    final int nr = getDbHandle().createUpdate(sql).bindBean(p)
        .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
        .bind("avatarUuid", p.getAvatarUuid())
        .bind("endOfTourDate", DaoUtils.asLocalDateTime(p.getEndOfTourDate()))
        .bind("status", DaoUtils.getEnumId(p.getStatus()))
        .bind("role", DaoUtils.getEnumId(p.getRole())).execute();
    evictFromCache(p);
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
  // Should only be used during authentication
  public List<Person> findByDomainUsername(String domainUsername) {
    if (Utils.isEmptyOrNull(domainUsername)) {
      return Collections.emptyList();
    }
    return getDbHandle()
        .createQuery("/* findByDomainUsername */ SELECT " + PERSON_FIELDS + ","
            + PositionDao.POSITION_FIELDS
            + "FROM people LEFT JOIN positions ON people.uuid = positions.\"currentPersonUuid\" "
            + "WHERE people.\"domainUsername\" = :domainUsername "
            + "AND people.status != :inactiveStatus")
        .bind("domainUsername", domainUsername)
        .bind("inactiveStatus", DaoUtils.getEnumId(Person.Status.INACTIVE)).map(new PersonMapper())
        .list();
  }

  @InTransaction
  // Should only be used during authentication
  public List<Person> findByEmailAddress(String emailAddress) {
    if (Utils.isEmptyOrNull(emailAddress)) {
      return Collections.emptyList();
    }
    return getDbHandle()
        .createQuery("/* findByEmailAddress */ SELECT " + PERSON_FIELDS + ","
            + PositionDao.POSITION_FIELDS
            + "FROM people LEFT JOIN positions ON people.uuid = positions.\"currentPersonUuid\" "
            + "WHERE people.\"emailAddress\" = :emailAddress "
            + "AND people.status != :inactiveStatus")
        .bind("emailAddress", emailAddress)
        .bind("inactiveStatus", DaoUtils.getEnumId(Person.Status.INACTIVE)).map(new PersonMapper())
        .list();
  }

  @InTransaction
  public List<Person> findByOpenIdSubject(String openIdSubject) {
    if (Utils.isEmptyOrNull(openIdSubject)) {
      return Collections.emptyList();
    }
    final Person person = getFromCache(openIdSubject);
    if (person != null) {
      return Collections.singletonList(person);
    }
    final List<Person> people = getDbHandle()
        .createQuery("/* findByOpenIdSubject */ SELECT " + PERSON_FIELDS + ","
            + PositionDao.POSITION_FIELDS
            + "FROM people LEFT JOIN positions ON people.uuid = positions.\"currentPersonUuid\" "
            + "WHERE people.\"openIdSubject\" = :openIdSubject "
            + "AND people.status != :inactiveStatus")
        .bind("openIdSubject", openIdSubject)
        .bind("inactiveStatus", DaoUtils.getEnumId(Person.Status.INACTIVE)).map(new PersonMapper())
        .list();
    // There should at most one match
    people.stream().forEach(p -> putInCache(p));
    return people;
  }

  public void logActivitiesByOpenIdSubject(String openIdSubject, Activity activity) {
    final Person person = domainUsersCache.get(openIdSubject);
    if (person != null) {
      final Deque<Activity> activities = person.getRecentActivities();
      activities.addFirst(activity);
      while (activities.size() > ACTIVITY_LOG_LIMIT) {
        activities.removeLast();
      }
      person.setRecentActivities(activities);
      domainUsersCache.replace(openIdSubject, person);
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

  private Person getFromCache(String openIdSubject) {
    if (domainUsersCache == null || openIdSubject == null) {
      return null;
    }
    final Person person = domainUsersCache.get(openIdSubject);
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
        && person.getOpenIdSubject() != null) {
      // defensively copy the person we will be caching
      final Person copy = copyPerson(person);
      if (copy != null) {
        domainUsersCache.put(person.getOpenIdSubject(), copy);
      }
    }
  }

  /**
   * Just to be on the safe side, we only cache objects retrieved inside
   * {@link #findByOpenIdSubject(String)}.
   *
   * @param person the person to be evicted from the domain users cache
   */
  private void evictFromCache(Person person) {
    if (domainUsersCache != null && person != null && person.getOpenIdSubject() != null) {
      domainUsersCache.remove(person.getOpenIdSubject());
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
    final String winnerUuid = winner.getUuid();
    final String loserUuid = loser.getUuid();

    // Update the winner's fields
    update(winner);

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
        + " UPDATE \"reportPeople\" SET \"isPrimary\" = (dups.wprimary OR dups.lprimary),"
        + " \"isAttendee\" = (dups.wattendee OR dups.lattendee),"
        + " \"isAuthor\" = (dups.wauthor OR dups.lauthor) FROM dups"
        + " WHERE \"reportPeople\".\"reportUuid\" = dups.wreportuuid"
        + " AND \"reportPeople\".\"personUuid\" = dups.wpersonuuid";
    // MS SQL has no real booleans, so bitwise-or the 0/1 values in that case
    getDbHandle().createUpdate(sqlUpd).bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid)
        .execute();
    // 2. delete the loser so we don't have duplicates
    final String sqlDel = "WITH dups AS ( SELECT"
        + "  rpl.\"reportUuid\" AS lreportuuid, rpl.\"personUuid\" AS lpersonuuid"
        + "  FROM \"reportPeople\" rpw"
        + "  JOIN \"reportPeople\" rpl ON rpl.\"reportUuid\" = rpw.\"reportUuid\""
        + "  WHERE rpw.\"personUuid\" = :winnerUuid AND rpl.\"personUuid\" = :loserUuid )"
        + " DELETE FROM \"reportPeople\" USING dups"
        + " WHERE \"reportPeople\".\"reportUuid\" = dups.lreportuuid"
        + " AND \"reportPeople\".\"personUuid\" = dups.lpersonuuid";
    // MS SQL and PostgreSQL have slightly different DELETE syntax
    getDbHandle().createUpdate(sqlDel).bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid)
        .execute();

    // Update report people, should now be unique
    updateForMerge("reportPeople", "personUuid", winnerUuid, loserUuid);

    // Update approvals this person might have done
    updateForMerge("reportActions", "personUuid", winnerUuid, loserUuid);

    // Update comment authors
    updateForMerge("comments", "authorUuid", winnerUuid, loserUuid);

    // Remove winner and loser from (old) position
    final LocalDateTime now = DaoUtils.asLocalDateTime(Instant.now());
    getDbHandle()
        .createUpdate("/* personMergePositionRemovePerson.update */ UPDATE positions "
            + "SET \"currentPersonUuid\" = NULL, \"updatedAt\" = :updatedAt "
            + "WHERE \"currentPersonUuid\" IN ( :winnerUuid, :loserUuid )")
        .bind("updatedAt", now).bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid)
        .execute();
    // Set winner in (new) position
    getDbHandle()
        .createUpdate("/* personMergePositionAddPerson.update */ UPDATE positions "
            + "SET \"currentPersonUuid\" = :personUuid, \"updatedAt\" = :updatedAt "
            + "WHERE uuid = :positionUuid")
        .bind("personUuid", winnerUuid).bind("updatedAt", now)
        .bind("positionUuid", DaoUtils.getUuid(winner.getPosition())).execute();
    // Remove loser from position history
    deleteForMerge("peoplePositions", "personUuid", loserUuid);
    // Update position history with given input on winner
    updatePersonHistory(winner);

    // Update note authors
    updateForMerge("notes", "authorUuid", winnerUuid, loserUuid);

    // Update notes
    updateM2mForMerge("noteRelatedObjects", "noteUuid", "relatedObjectUuid", winnerUuid, loserUuid);

    // Update customSensitiveInformation for winner
    DaoUtils.saveCustomSensitiveInformation(null, PersonDao.TABLE_NAME, winnerUuid,
        winner.getCustomSensitiveInformation());
    // Delete customSensitiveInformation for loser
    deleteForMerge("customSensitiveInformation", "relatedObjectUuid", loserUuid);

    // Finally, delete loser
    final int nr = deleteForMerge("people", "uuid", loserUuid);

    // E.g. positions may have been updated, so evict from the cache
    evictFromCache(winner);
    evictFromCache(loser);
    return nr;
  }

  public CompletableFuture<List<PersonPositionHistory>> getPositionHistory(
      Map<String, Object> context, String personUuid) {
    return new ForeignKeyFetcher<PersonPositionHistory>().load(context,
        FkDataLoaderKey.PERSON_PERSON_POSITION_HISTORY, personUuid);
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
        evictFromCache(p);
      }
    }
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Person obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "people.uuid");
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

  @InTransaction
  public int updatePersonHistory(Person p) {
    final String personUuid = p.getUuid();
    // Delete old history
    final int numRows = getDbHandle()
        .execute("DELETE FROM \"peoplePositions\"  WHERE \"personUuid\" = ?", personUuid);
    if (Utils.isEmptyOrNull(p.getPreviousPositions())) {
      updatePeoplePositions(DaoUtils.getUuid(p.getPosition()), personUuid, Instant.now(), null);
    } else {
      // Store the history as given
      for (final PersonPositionHistory history : p.getPreviousPositions()) {
        updatePeoplePositions(history.getPositionUuid(), personUuid, history.getStartTime(),
            history.getEndTime());
      }
    }
    return numRows;
  }

  @InTransaction
  public boolean hasHistoryConflict(final String uuid, final String loserUuid,
      final List<PersonPositionHistory> history, final boolean checkPerson) {
    if (!Utils.isEmptyOrNull(history)) {
      final String personPositionClause = checkPerson
          ? "\"personUuid\" NOT IN ( :personUuid, :loserUuid ) AND \"positionUuid\" = :positionUuid"
          : "\"personUuid\" = :personUuid AND \"positionUuid\" NOT IN ( :positionUuid, :loserUuid )";
      for (final PersonPositionHistory pph : history) {
        final Query q;
        final Instant endTime = pph.getEndTime();
        if (endTime == null) {
          q = getDbHandle().createQuery("SELECT COUNT(*) AS count FROM \"peoplePositions\"  WHERE ("
              + " \"endedAt\" IS NULL OR (\"endedAt\" IS NOT NULL AND \"endedAt\" >= :startTime)"
              + ") AND " + personPositionClause);
        } else {
          q = getDbHandle().createQuery("SELECT COUNT(*) AS count FROM \"peoplePositions\" WHERE ("
              + "(\"endedAt\" IS NULL AND \"createdAt\" <= :endTime)"
              + " OR (\"endedAt\" IS NOT NULL AND"
              + " \"createdAt\" <= :endTime AND \"endedAt\" >= :startTime)) AND "
              + personPositionClause).bind("endTime", DaoUtils.asLocalDateTime(endTime));
        }
        final String histUuid = checkPerson ? pph.getPositionUuid() : pph.getPersonUuid();
        final Number count =
            (Number) q.bind("startTime", DaoUtils.asLocalDateTime(pph.getStartTime()))
                .bind("personUuid", checkPerson ? uuid : histUuid)
                .bind("positionUuid", checkPerson ? histUuid : uuid)
                .bind("loserUuid", Utils.orIfNull(loserUuid, "")).map(new MapMapper(false)).one()
                .get("count");

        if (count.longValue() > 0) {
          return true;
        }
      }
    }
    return false;
  }

  @InTransaction
  protected void updatePeoplePositions(final String positionUuid, final String personUuid,
      final Instant startTime, final Instant endTime) {
    if (positionUuid != null && personUuid != null) {
      getDbHandle()
          .createUpdate("INSERT INTO \"peoplePositions\" "
              + "(\"positionUuid\", \"personUuid\", \"createdAt\", \"endedAt\") "
              + "VALUES (:positionUuid, :personUuid, :createdAt, :endedAt)")
          .bind("positionUuid", positionUuid).bind("personUuid", personUuid)
          .bind("createdAt", DaoUtils.asLocalDateTime(startTime))
          .bind("endedAt", DaoUtils.asLocalDateTime(endTime)).execute();
    }
  }
}
