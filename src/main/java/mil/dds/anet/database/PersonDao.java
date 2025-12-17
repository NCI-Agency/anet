package mil.dds.anet.database;

import com.google.common.collect.ObjectArrays;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.lang.invoke.MethodHandles;
import java.lang.reflect.InvocationTargetException;
import java.net.URISyntaxException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import javax.cache.Cache;
import javax.cache.Cache.Entry;
import javax.cache.CacheManager;
import javax.cache.Caching;
import javax.cache.spi.CachingProvider;
import mil.dds.anet.beans.AuditTrail;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.beans.MergedEntity;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.PersonPreference;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.User;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.recentActivity.Activity;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.PersonPositionHistoryMapper;
import mil.dds.anet.database.mappers.PersonPreferenceMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.search.pg.PostgresqlPersonSearcher;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AnetConstants;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.apache.commons.beanutils.PropertyUtils;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PersonDao extends AnetSubscribableObjectDao<Person, PersonSearchQuery> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // Must always retrieve these e.g. for ORDER BY
  public static final String[] minimalFields = {"uuid", "name", "rank", "createdAt"};
  public static final String[] additionalFields =
      {"status", "user", "phoneNumber", "biography", "obsoleteCountry", "countryUuid", "gender",
          "endOfTourDate", "pendingVerification", "code", "updatedAt", "customFields"};
  public static final String[] allFields =
      ObjectArrays.concat(minimalFields, additionalFields, String.class);
  public static final String TABLE_NAME = "people";
  public static final String PERSON_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, allFields, true);

  private static final String EHCACHE_CONFIG = "/ehcache-config.xml";
  private static final String DOMAIN_USERS_CACHE = "domainUsersCache";
  private static final int ACTIVITY_LOG_LIMIT = 10;

  private Cache<String, Person> domainUsersCache;

  public PersonDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
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

  class SelfIdBatcher extends IdBatcher<Person> {
    private static final String SQL = "/* batch.getPeopleByUuids */ SELECT " + PERSON_FIELDS
        + " FROM people WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(PersonDao.this.databaseHandler, SQL, "uuids", new PersonMapper());
    }
  }

  @Override
  public List<Person> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  class PersonPositionHistoryBatcher extends ForeignKeyBatcher<PersonPositionHistory> {
    private static final String SQL =
        "/* batch.getPersonPositionHistory */ SELECT * FROM \"peoplePositions\" "
            + "WHERE \"personUuid\" IN ( <foreignKeys> ) ORDER BY \"createdAt\" ASC";

    public PersonPositionHistoryBatcher() {
      super(PersonDao.this.databaseHandler, SQL, "foreignKeys", new PersonPositionHistoryMapper(),
          "personUuid");
    }
  }

  public List<List<PersonPositionHistory>> getPersonPositionHistory(List<String> foreignKeys) {
    return new PersonPositionHistoryBatcher().getByForeignKeys(foreignKeys);
  }

  class PersonPreferenceBatcher extends ForeignKeyBatcher<PersonPreference> {
    private static final String SQL =
        "/* batch.getPersonPreferences */ SELECT * FROM \"peoplePreferences\" "
            + "WHERE \"personUuid\" IN ( <foreignKeys> )";

    public PersonPreferenceBatcher() {
      super(PersonDao.this.databaseHandler, SQL, "foreignKeys", new PersonPreferenceMapper(),
          "personUuid");
    }
  }

  public List<List<PersonPreference>> getPersonPreferences(List<String> foreignKeys) {
    return new PersonPreferenceBatcher().getByForeignKeys(foreignKeys);
  }

  @Override
  public Person insertInternal(Person p) {
    final Handle handle = getDbHandle();
    try {
      final String sql = "/* personInsert */ INSERT INTO people "
          + "(uuid, name, status, \"user\", \"phoneNumber\", rank, "
          + "\"pendingVerification\", gender, \"countryUuid\", code, \"endOfTourDate\", biography, "
          + "\"createdAt\", \"updatedAt\", \"customFields\") "
          + "VALUES (:uuid, :name, :status, :user, :phoneNumber, :rank, "
          + ":pendingVerification, :gender, :countryUuid, :code, :endOfTourDate, :biography, "
          + ":createdAt, :updatedAt, :customFields)";
      handle.createUpdate(sql).bindBean(p)
          .bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("endOfTourDate", DaoUtils.asLocalDateTime(p.getEndOfTourDate()))
          .bind("status", DaoUtils.getEnumId(p.getStatus())).execute();
      evictFromCache(p);
      return p;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int updateAuthenticationDetails(Person p) {
    final Handle handle = getDbHandle();
    try {
      DaoUtils.setUpdateFields(p);
      final String sql = "/* personUpdateAuthenticationDetails */ UPDATE people "
          + "SET status = :status, \"user\" = :user, \"pendingVerification\" = :pendingVerification, "
          + "\"endOfTourDate\" = :endOfTourDate, \"updatedAt\" = :updatedAt WHERE uuid = :uuid";
      final int nr = handle.createUpdate(sql).bindBean(p)
          .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("endOfTourDate", DaoUtils.asLocalDateTime(p.getEndOfTourDate()))
          .bind("status", DaoUtils.getEnumId(p.getStatus())).execute();
      // Evict original person as well as current person
      evictFromCache(findInCache(p));
      evictFromCache(p);
      // No need to update subscriptions, this is an internal change
      return nr;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int updateInternal(Person p) {
    final Handle handle = getDbHandle();
    try {
      final String sql = "/* personUpdate */ UPDATE people "
          + "SET name = :name, status = :status, \"user\" = :user, gender = :gender, "
          + "\"obsoleteCountry\" = :obsoleteCountry, \"countryUuid\" = :countryUuid, "
          + "code = :code, \"phoneNumber\" = :phoneNumber, rank = :rank, biography = :biography, "
          + "\"pendingVerification\" = :pendingVerification, "
          + "\"updatedAt\" = :updatedAt, \"customFields\" = :customFields, \"endOfTourDate\" = :endOfTourDate "
          + "WHERE uuid = :uuid";

      final int nr = handle.createUpdate(sql).bindBean(p)
          .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("endOfTourDate", DaoUtils.asLocalDateTime(p.getEndOfTourDate()))
          .bind("status", DaoUtils.getEnumId(p.getStatus())).execute();
      // Evict original person as well as current person
      evictFromCache(findInCache(p));
      evictFromCache(p);
      return nr;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public AnetBeanList<Person> search(PersonSearchQuery query) {
    return search(null, query);
  }

  public AnetBeanList<Person> search(Set<String> subFields, PersonSearchQuery query) {
    return new PostgresqlPersonSearcher(databaseHandler).runSearch(subFields, query);
  }

  @Transactional
  // Used by the MART IMPORT
  public List<Person> findByEmailAddress(String emailAddress) {
    final Handle handle = getDbHandle();
    try {
      if (Utils.isEmptyOrNull(emailAddress)) {
        return Collections.emptyList();
      }
      return handle
          .createQuery("/* findByEmailAddress */ SELECT " + PERSON_FIELDS + ","
              + PositionDao.POSITION_FIELDS
              + "FROM people LEFT JOIN positions ON people.uuid = positions.\"currentPersonUuid\" "
              + "LEFT JOIN \"emailAddresses\" ON \"emailAddresses\".\"relatedObjectType\" = '"
              + TABLE_NAME + "' AND people.uuid = \"emailAddresses\".\"relatedObjectUuid\" "
              + "WHERE \"emailAddresses\".address = :emailAddress")
          .bind("emailAddress", emailAddress).map(new PersonMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public List<Person> findByDomainUsername(String domainUsername, boolean activeUser) {
    final Handle handle = getDbHandle();
    try {
      if (Utils.isEmptyOrNull(domainUsername)) {
        return Collections.emptyList();
      }
      final Person person = getFromCache(domainUsername);
      if (person != null) {
        return Collections.singletonList(person);
      }
      final StringBuilder sql = new StringBuilder("/* findByDomainUsername */ SELECT "
          + PERSON_FIELDS + "," + PositionDao.POSITION_FIELDS + "," + UserDao.USER_FIELDS
          + "FROM people JOIN users ON people.uuid = users.\"personUuid\" "
          + "LEFT JOIN \"peoplePositions\" pp ON pp.\"personUuid\" = people.uuid "
          + "AND pp.\"endedAt\" IS NULL AND pp.primary IS TRUE "
          + "LEFT JOIN positions ON positions.uuid = pp.\"positionUuid\" "
          + "WHERE users.\"domainUsername\" = :domainUsername");
      if (activeUser) {
        sql.append(" AND people.user = :user AND people.status != :inactiveStatus");
      }
      final Query query = handle.createQuery(sql.toString()).bind("domainUsername", domainUsername);
      if (activeUser) {
        query.bind("user", true).bind("inactiveStatus",
            DaoUtils.getEnumId(WithStatus.Status.INACTIVE));
      }
      final List<Person> people = query.map(new PersonMapper()).list();
      // There should be at most one match since domainUsername must be unique
      people.forEach(this::putInCache);
      return people;
    } finally {
      closeDbHandle(handle);
    }
  }

  public void logActivitiesByPersonUuid(String personUuid, Activity activity) {
    final Person person = findInCacheByPersonUuid(personUuid);
    if (person != null) {
      final Deque<Activity> activities = person.getRecentActivities();
      activities.addFirst(activity);
      while (activities.size() > ACTIVITY_LOG_LIMIT) {
        activities.removeLast();
      }
      person.setRecentActivities(activities);
      person.getUsers().forEach(u -> domainUsersCache.replace(u.getDomainUsername(), person));
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
    // defensively copy the person we return from the cache
    return copyPerson(person);
  }

  private void putInCache(Person person) {
    if (domainUsersCache != null && person != null && !Utils.isEmptyOrNull(person.getUsers())) {
      // defensively copy the person we will be caching
      final Person copy = copyPerson(person);
      if (copy != null) {
        person.getUsers().forEach(u -> domainUsersCache.put(u.getDomainUsername(), copy));
      }
    }
  }

  /**
   * Just to be on the safe side, we only cache objects retrieved inside
   * {@link #findByDomainUsername(String, boolean)}.
   *
   * @param person the person to be evicted from the domain users cache
   */
  private void evictFromCache(Person person) {
    if (domainUsersCache != null && person != null && !Utils.isEmptyOrNull(person.getUsers())) {
      person.getUsers().forEach(u -> domainUsersCache.remove(u.getDomainUsername()));
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
        // Copy person
        final Person personCopy = new Person();
        for (final String prop : allFields) {
          PropertyUtils.setSimpleProperty(personCopy, prop,
              PropertyUtils.getSimpleProperty(person, prop));
        }
        personCopy.setName(person.getName());
        // Copy users
        if (!Utils.isEmptyOrNull(person.getUsers())) {
          final List<User> usersCopy = new ArrayList<>();
          for (final User user : person.getUsers()) {
            final User userCopy = new User();
            for (final String prop : UserDao.fields) {
              PropertyUtils.setSimpleProperty(userCopy, prop,
                  PropertyUtils.getSimpleProperty(user, prop));
            }
            usersCopy.add(userCopy);
          }
          personCopy.setUsers(usersCopy);
        }
        // Copy position
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

  @Transactional
  public int approve(String personUuid) {
    final Handle handle = getDbHandle();
    try {
      final int nr = handle
          .createUpdate("UPDATE people SET \"pendingVerification\" = :pendingVerification"
              + " WHERE uuid = :personUuid")
          .bind("pendingVerification", false).bind("personUuid", personUuid).execute();
      // Evict the person from the domain users cache
      evictFromCacheByPersonUuid(personUuid);
      return nr;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int deleteInternal(String personUuid) {
    final Handle handle = getDbHandle();
    try {
      // Just delete the person; if it fails, this means it still has relations
      final int nr = handle.createUpdate("DELETE FROM people WHERE uuid = :personUuid")
          .bind("personUuid", personUuid).execute();
      // Evict the person from the domain users cache
      evictFromCacheByPersonUuid(personUuid);
      return nr;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int mergePeople(Person winner, Person loser, boolean useWinnerPositionHistory) {
    final Handle handle = getDbHandle();
    try {
      final String winnerUuid = winner.getUuid();
      final String loserUuid = loser.getUuid();

      // Update the winner's fields
      update(winner);

      // Update user accounts
      updateForMerge("users", "personUuid", winnerUuid, loserUuid);

      // For reports where both winner and loser are in the reportPeople:
      // 1. set winner's isPrimary, isAttendee, isAuthor and isInterlocutor flags to the logical OR
      // of both
      final String sqlUpd = "WITH dups AS ( SELECT"
          + "  rpw.\"reportUuid\" AS wreportuuid, rpw.\"personUuid\" AS wpersonuuid,"
          + "  rpw.\"isPrimary\" AS wprimary, rpl.\"isPrimary\" AS lprimary,"
          + "  rpw.\"isAttendee\" AS wattendee, rpl.\"isAttendee\" AS lattendee,"
          + "  rpw.\"isAuthor\" AS wauthor, rpl.\"isAuthor\" AS lauthor,"
          + "  rpw.\"isInterlocutor\" AS winterlocutor, rpl.\"isInterlocutor\" AS linterlocutor"
          + "  FROM \"reportPeople\" rpw"
          + "  JOIN \"reportPeople\" rpl ON rpl.\"reportUuid\" = rpw.\"reportUuid\""
          + "  WHERE rpw.\"personUuid\" = :winnerUuid AND rpl.\"personUuid\" = :loserUuid )"
          + " UPDATE \"reportPeople\" SET \"isPrimary\" = (dups.wprimary OR dups.lprimary),"
          + " \"isAttendee\" = (dups.wattendee OR dups.lattendee),"
          + " \"isAuthor\" = (dups.wauthor OR dups.lauthor),"
          + " \"isInterlocutor\" = (dups.winterlocutor OR dups.linterlocutor) FROM dups"
          + " WHERE \"reportPeople\".\"reportUuid\" = dups.wreportuuid"
          + " AND \"reportPeople\".\"personUuid\" = dups.wpersonuuid";
      handle.createUpdate(sqlUpd).bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid)
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
      handle.createUpdate(sqlDel).bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid)
          .execute();

      // Update report people, should now be unique
      updateForMerge("reportPeople", "personUuid", winnerUuid, loserUuid);

      // Update approvals this person might have done
      updateForMerge("reportActions", "personUuid", winnerUuid, loserUuid);

      // Update comment authors
      updateForMerge("comments", "authorUuid", winnerUuid, loserUuid);

      // Update attachment authors
      updateForMerge("attachments", "authorUuid", winnerUuid, loserUuid);

      if (useWinnerPositionHistory) {
        updatePosition(handle, null, loserUuid, loserUuid);
      } else {
        updatePosition(handle, winnerUuid, loserUuid, winnerUuid);
        // Move loser's position history to winner
        updateForMerge("peoplePositions", "personUuid", winnerUuid, loserUuid);
      }

      // Update assessment authors
      updateForMerge("assessments", "authorUuid", winnerUuid, loserUuid);

      // Update assessments
      updateM2mForMerge("assessmentRelatedObjects", "assessmentUuid", "relatedObjectUuid",
          winnerUuid, loserUuid);

      // Update note authors
      updateForMerge("notes", "authorUuid", winnerUuid, loserUuid);

      // Update notes
      updateM2mForMerge("noteRelatedObjects", "noteUuid", "relatedObjectUuid", winnerUuid,
          loserUuid);

      // Update authorizationGroupRelatedObjects
      updateM2mForMerge("authorizationGroupRelatedObjects", "authorizationGroupUuid",
          "relatedObjectUuid", winnerUuid, loserUuid);

      // Update event people
      updateM2mForMerge("eventPeople", "eventUuid", "personUuid", winnerUuid, loserUuid);

      // Update imported MART reports
      updateForMerge("martImportedReports", "personUuid", winnerUuid, loserUuid);

      // Update saved searches
      updateForMerge("savedSearches", "ownerUuid", winnerUuid, loserUuid);

      // Update people preferences
      updateM2mForMerge("peoplePreferences", "preferenceUuid", "personUuid", winnerUuid, loserUuid);

      // Update attachments
      updateM2mForMerge("attachmentRelatedObjects", "attachmentUuid", "relatedObjectUuid",
          winnerUuid, loserUuid);
      // And update the avatar
      final EntityAvatarDao entityAvatarDao = engine().getEntityAvatarDao();
      entityAvatarDao.delete(PersonDao.TABLE_NAME, winnerUuid);
      entityAvatarDao.delete(PersonDao.TABLE_NAME, loserUuid);
      final EntityAvatar winnerEntityAvatar = winner.getEntityAvatar();
      if (winnerEntityAvatar != null) {
        winnerEntityAvatar.setRelatedObjectType(PersonDao.TABLE_NAME);
        winnerEntityAvatar.setRelatedObjectUuid(winnerUuid);
        entityAvatarDao.upsert(winnerEntityAvatar);
      }

      // Update authorizationGroupRelatedObjects
      updateM2mForMerge("authorizationGroupRelatedObjects", "authorizationGroupUuid",
          "relatedObjectUuid", winnerUuid, loserUuid);

      // Update reportAuthorizedMembers
      updateM2mForMerge("reportAuthorizedMembers", "reportUuid", "relatedObjectUuid", winnerUuid,
          loserUuid);

      // Update emailAddresses
      final EmailAddressDao emailAddressDao = engine().getEmailAddressDao();
      emailAddressDao.updateEmailAddresses(PersonDao.TABLE_NAME, loserUuid, null);
      emailAddressDao.updateEmailAddresses(PersonDao.TABLE_NAME, winnerUuid,
          winner.getEmailAddresses());

      // Update customSensitiveInformation for winner
      DaoUtils.saveCustomSensitiveInformation(Person.SYSTEM_USER, PersonDao.TABLE_NAME, winnerUuid,
          winner.customSensitiveInformationKey(), winner.getCustomSensitiveInformation());
      // Delete customSensitiveInformation for loser
      deleteForMerge("customSensitiveInformation", "relatedObjectUuid", loserUuid);

      // Update subscriptions
      updateM2mForMerge("subscriptions", "subscriberUuid", "subscribedObjectUuid", winnerUuid,
          loserUuid);
      // Update subscriptionUpdates
      updateForMerge("subscriptionUpdates", "updatedObjectUuid", winnerUuid, loserUuid);

      // Finally, delete loser
      final int nrDeleted = deleteForMerge(PersonDao.TABLE_NAME, "uuid", loserUuid);
      if (nrDeleted > 0) {
        engine().getAdminDao()
            .insertMergedEntity(new MergedEntity(loserUuid, winnerUuid, Instant.now()));
      }

      // E.g. positions may have been updated, so evict from the cache
      evictFromCache(winner);
      evictFromCache(loser);
      return nrDeleted;
    } finally {
      closeDbHandle(handle);
    }
  }

  private void updatePosition(Handle handle, String newPersonUuidForPosition,
      String oldPersonUuidForPosition, String personUuidForHistoryRemoval) {
    // Update position
    final LocalDateTime now = DaoUtils.asLocalDateTime(Instant.now());
    handle
        .createUpdate("/* personMergePositionAddPerson.update */ UPDATE positions "
            + "SET \"currentPersonUuid\" = :newPersonUuid, \"updatedAt\" = :updatedAt "
            + "WHERE \"currentPersonUuid\" = :oldPersonUuid")
        .bind("newPersonUuid", newPersonUuidForPosition)
        .bind("oldPersonUuid", oldPersonUuidForPosition).bind("updatedAt", now).execute();
    // Clear obsolete position history
    deleteForMerge("peoplePositions", "personUuid", personUuidForHistoryRemoval);
  }

  public CompletableFuture<List<Position>> getAdditionalPositionsForPerson(
      @GraphQLRootContext GraphQLContext context, String personUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.PERSON_PERSON_ADDITIONAL_POSITIONS, personUuid);
  }

  class PersonAdditionalPositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String SQL = "/* batch.getAdditionalPositionsForPerson */ SELECT "
        + PositionDao.POSITION_FIELDS
        + ", \"peoplePositions\".\"personUuid\" FROM \"peoplePositions\" "
        + "LEFT JOIN positions ON \"peoplePositions\".\"positionUuid\" = positions.uuid "
        + "WHERE \"peoplePositions\".\"personUuid\" IN ( <foreignKeys> ) "
        + "AND \"peoplePositions\".primary IS NOT TRUE AND \"peoplePositions\".\"endedAt\" IS NULL "
        + "ORDER BY positions.name, positions.uuid";

    public PersonAdditionalPositionsBatcher() {
      super(PersonDao.this.databaseHandler, SQL, "foreignKeys", new PositionMapper(), "personUuid");
    }
  }

  public List<List<Position>> getPersonAdditionalPositions(List<String> foreignKeys) {
    return new PersonDao.PersonAdditionalPositionsBatcher().getByForeignKeys(foreignKeys);
  }


  public CompletableFuture<List<PersonPositionHistory>> getPositionHistory(GraphQLContext context,
      String personUuid) {
    return new ForeignKeyFetcher<PersonPositionHistory>().load(context,
        FkDataLoaderKey.PERSON_PERSON_POSITION_HISTORY, personUuid);
  }

  @Transactional
  public void clearEmptyBiographies() {
    final Handle handle = getDbHandle();
    try {
      // Search all people with a not null biography field
      final PersonSearchQuery query = new PersonSearchQuery();
      query.setPageSize(0);
      query.setHasBiography(true);
      final List<Person> persons = search(query).getList();

      // For each person with an empty html biography, set this one to null
      for (final Person p : persons) {
        if (Utils.isEmptyHtml(p.getBiography())) {
          handle.createUpdate(
              "/* updatePersonBiography */ UPDATE people SET biography = NULL WHERE uuid = :uuid")
              .bind("uuid", p.getUuid()).execute();
          AnetAuditLogger.log(AuditTrail.getUpdateInstance(null, TABLE_NAME, p,
              "has an empty html biography, set to null by the system"));
          evictFromCache(p);
        }
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Person obj, boolean isDelete) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "people.uuid", isDelete);
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

  @Transactional
  public int updatePersonHistory(Person p) {
    final Handle handle = getDbHandle();
    try {
      final String personUuid = p.getUuid();
      // Delete old history
      final int numRows =
          handle.execute("DELETE FROM \"peoplePositions\"  WHERE \"personUuid\" = ?", personUuid);
      if (Utils.isEmptyOrNull(p.getPreviousPositions())) {
        updatePeoplePositions(DaoUtils.getUuid(p.getPosition()), personUuid, Instant.now(), null,
            true);
      } else {
        // Store the history as given
        for (final PersonPositionHistory history : p.getPreviousPositions()) {
          updatePeoplePositions(history.getPositionUuid(), personUuid, history.getStartTime(),
              history.getEndTime(), Boolean.TRUE.equals(history.getPrimary()));
        }
      }
      return numRows;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  protected void updatePeoplePositions(final String positionUuid, final String personUuid,
      final Instant startTime, final Instant endTime, boolean primary) {
    final Handle handle = getDbHandle();
    try {
      if (positionUuid != null && personUuid != null) {
        handle
            .createUpdate("INSERT INTO \"peoplePositions\" "
                + "(\"positionUuid\", \"personUuid\", \"createdAt\", \"endedAt\", \"primary\") "
                + "VALUES (:positionUuid, :personUuid, :createdAt, :endedAt, :primary)")
            .bind("positionUuid", positionUuid).bind("personUuid", personUuid)
            .bind("createdAt", DaoUtils.asLocalDateTime(startTime))
            .bind("endedAt", DaoUtils.asLocalDateTime(endTime)).bind("primary", primary).execute();
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<PersonPreference>> getPreferences(GraphQLContext context,
      String personUuid) {
    return new ForeignKeyFetcher<PersonPreference>().load(context,
        FkDataLoaderKey.PERSON_PERSON_PREFERENCES, personUuid);
  }
}
