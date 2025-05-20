package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.beans.MergedEntity;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.mappers.PersonPositionHistoryMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.search.pg.PostgresqlPositionSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.SqDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import mil.dds.anet.views.SearchQueryFetcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PositionDao extends AnetSubscribableObjectDao<Position, PositionSearchQuery> {

  public static final String[] fields =
      {"uuid", "name", "code", "createdAt", "updatedAt", "organizationUuid", "currentPersonUuid",
          "type", "superuserType", "status", "locationUuid", "customFields", "role", "description"};
  public static final String TABLE_NAME = "positions";
  public static final String POSITION_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);
  public static final String DUPLICATE_POSITION_CODE =
      "Another position is already using this code and each position must have its own code. "
          + "Please double check that you entered the right code.";

  public PositionDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public Position insertInternal(Position p) {
    final Handle handle = getDbHandle();
    try {
      // prevent code conflicts
      if (p.getCode() != null && p.getCode().trim().isEmpty()) {
        p.setCode(null);
      }

      try {
        handle.createUpdate("/* positionInsert */ INSERT INTO positions (uuid, name, code, type, "
            + "\"superuserType\", status, \"organizationUuid\", \"locationUuid\", \"createdAt\", \"updatedAt\", "
            + "\"customFields\", role, description) VALUES (:uuid, :name, :code, :type, :superuserType, :status, "
            + ":organizationUuid, :locationUuid, :createdAt, :updatedAt, :customFields, :role, "
            + ":description)").bindBean(p)
            .bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
            .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
            .bind("type", DaoUtils.getEnumId(p.getType()))
            .bind("superuserType", DaoUtils.getEnumId(p.getSuperuserType()))
            .bind("status", DaoUtils.getEnumId(p.getStatus()))
            .bind("role", DaoUtils.getEnumId(p.getRole())).execute();
        // Specifically don't set currentPersonUuid here because we'll handle that later in
        // setPersonInPosition();
      } catch (UnableToExecuteStatementException e) {
        throw ResponseUtils.handleSqlException(e, DUPLICATE_POSITION_CODE);
      }
      return p;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public Position getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<Position> {
    private static final String SQL = "/* batch.getPositionsByUuids */ SELECT " + POSITION_FIELDS
        + "FROM positions WHERE positions.uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(PositionDao.this.databaseHandler, SQL, "uuids", new PositionMapper());
    }
  }

  @Override
  public List<Position> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  class PersonPositionHistoryBatcher extends ForeignKeyBatcher<PersonPositionHistory> {
    private static final String SQL =
        "/* batch.getPositionHistory */ SELECT * FROM \"peoplePositions\" "
            + "WHERE \"positionUuid\" IN ( <foreignKeys> ) ORDER BY \"createdAt\" ASC";

    public PersonPositionHistoryBatcher() {
      super(PositionDao.this.databaseHandler, SQL, "foreignKeys", new PersonPositionHistoryMapper(),
          "positionUuid");
    }
  }

  public List<List<PersonPositionHistory>> getPersonPositionHistory(List<String> foreignKeys) {
    return new PersonPositionHistoryBatcher().getByForeignKeys(foreignKeys);
  }

  class PositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String SQL =
        "/* batch.getCurrentPositionForPerson */ SELECT " + POSITION_FIELDS + " FROM positions "
            + "WHERE positions.\"currentPersonUuid\" IN ( <foreignKeys> )";

    public PositionsBatcher() {
      super(PositionDao.this.databaseHandler, SQL, "foreignKeys", new PositionMapper(),
          "positions_currentPersonUuid");
    }
  }

  public List<List<Position>> getCurrentPersonForPosition(List<String> foreignKeys) {
    return new PositionsBatcher().getByForeignKeys(foreignKeys);
  }

  static class PositionSearchBatcher extends SearchQueryBatcher<Position, PositionSearchQuery> {
    public PositionSearchBatcher() {
      super(ApplicationContextProvider.getEngine().getPositionDao());
    }
  }

  public List<List<Position>> getPositionsBySearch(
      List<ImmutablePair<String, PositionSearchQuery>> foreignKeys) {
    return new PositionSearchBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Position>> getPositionsBySearch(GraphQLContext context, String uuid,
      PositionSearchQuery query) {
    return new SearchQueryFetcher<Position, PositionSearchQuery>().load(context,
        SqDataLoaderKey.POSITIONS_SEARCH, new ImmutablePair<>(uuid, query));
  }

  /*
   * @return: number of rows updated.
   */
  @Override
  public int updateInternal(Position p) {
    final Handle handle = getDbHandle();
    try {
      // prevent code conflicts
      if (p.getCode() != null && p.getCode().trim().isEmpty()) {
        p.setCode(null);
      }

      try {
        final int nr = handle
            .createUpdate("/* positionUpdate */ UPDATE positions SET name = :name, code = :code, "
                + "\"organizationUuid\" = :organizationUuid, type = :type, \"superuserType\" = :superuserType, status = :status, "
                + "\"locationUuid\" = :locationUuid, \"updatedAt\" = :updatedAt, "
                + "\"customFields\" = :customFields, role = :role, description = :description "
                + "WHERE uuid = :uuid")
            .bindBean(p).bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
            .bind("type", DaoUtils.getEnumId(p.getType()))
            .bind("superuserType", DaoUtils.getEnumId(p.getSuperuserType()))
            .bind("status", DaoUtils.getEnumId(p.getStatus()))
            .bind("role", DaoUtils.getEnumId(p.getRole())).execute();
        // Evict the person holding this position from the domain users cache, as their position has
        // changed
        engine().getPersonDao().evictFromCacheByPositionUuid(DaoUtils.getUuid(p));
        return nr;
      } catch (UnableToExecuteStatementException e) {
        throw ResponseUtils.handleSqlException(e, DUPLICATE_POSITION_CODE);
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int setPersonInPosition(String personUuid, String positionUuid) {
    final Handle handle = getDbHandle();
    try {
      // Get new position data from database (we need its type)
      final Position newPos = getByUuid(positionUuid);
      if (newPos == null) {
        return 0;
      }
      // Find out if person already holds a position (we also need its type later on)
      final Position currPos = handle
          .createQuery("/* positionSetPerson.find */ SELECT " + POSITION_FIELDS
              + " FROM positions WHERE \"currentPersonUuid\" = :personUuid")
          .bind("personUuid", personUuid).map(new PositionMapper()).findFirst().orElse(null);
      if (currPos != null && currPos.getUuid().equals(positionUuid)) {
        // Attempt to put person in same position they already hold
        return 0;
      }

      // If the position is already assigned to another person, remove the person from the position
      removePersonFromPosition(positionUuid);

      // Get timestamp *after* remove to preserve correct order
      final Instant now = Instant.now();
      if (currPos != null) {
        // If this person is in a position already, we need to remove them.
        final String sql =
            "/* positionSetPerson.end */ UPDATE \"peoplePositions\" SET \"endedAt\" = :endedAt FROM "
                + "(SELECT * FROM \"peoplePositions\""
                + " WHERE \"personUuid\" = :personUuid AND \"positionUuid\" = :positionUuid AND \"endedAt\" IS NULL"
                + " ORDER BY \"createdAt\" DESC LIMIT 1) AS t "
                + "WHERE t.\"personUuid\" = \"peoplePositions\".\"personUuid\" AND"
                + "      t.\"positionUuid\" = \"peoplePositions\".\"positionUuid\" AND"
                + "      t.\"createdAt\" = \"peoplePositions\".\"createdAt\" AND"
                + "      \"peoplePositions\".\"endedAt\" IS NULL";
        handle.createUpdate(sql).bind("personUuid", personUuid)
            .bind("positionUuid", currPos.getUuid()).bind("endedAt", DaoUtils.asLocalDateTime(now))
            .execute();

        handle
            .createUpdate("/* positionSetPerson.remove1 */ UPDATE positions "
                + "SET \"currentPersonUuid\" = NULL, type = :type, \"updatedAt\" = :updatedAt "
                + "WHERE \"currentPersonUuid\" = :personUuid")
            .bind("type", DaoUtils.getEnumId(revokePrivilege(currPos)))
            .bind("updatedAt", DaoUtils.asLocalDateTime(now)).bind("personUuid", personUuid)
            .execute();
      }

      // Now put the person in their new position
      handle
          .createUpdate("/* positionSetPerson.set1 */ UPDATE positions "
              + "SET \"currentPersonUuid\" = :personUuid, type = :type, \"updatedAt\" = :updatedAt "
              + "WHERE uuid = :positionUuid")
          .bind("personUuid", personUuid)
          .bind("type", DaoUtils.getEnumId(keepPrivilege(newPos, currPos)))
          .bind("updatedAt", DaoUtils.asLocalDateTime(now)).bind("positionUuid", positionUuid)
          .execute();
      // And update the history
      final int nr = handle
          .createUpdate("/* positionSetPerson.set2 */ INSERT INTO \"peoplePositions\" "
              + "(\"positionUuid\", \"personUuid\", \"createdAt\") "
              + "VALUES (:positionUuid, :personUuid, :createdAt)")
          .bind("positionUuid", positionUuid).bind("personUuid", personUuid)
          // Need to ensure this timestamp is greater than previous INSERT.
          .bind("createdAt", DaoUtils.asLocalDateTime(now.plusMillis(1))).execute();
      // Evict this person from the domain users cache, as their position has changed
      engine().getPersonDao().evictFromCacheByPersonUuid(personUuid);

      // GraphQL mutations *have* to return something, so we return the number of inserted rows
      return nr;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int addOrganizationToPosition(Position p, Organization o) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* addOrganizationToPosition */ INSERT INTO \"organizationAdministrativePositions\" (\"organizationUuid\", \"positionUuid\") "
              + "VALUES (:organizationUuid, :positionUuid)")
          .bind("organizationUuid", o.getUuid()).bind("positionUuid", p.getUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int removeOrganizationFromPosition(String orgUuid, Position p) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* removeOrganizationToPosition*/ DELETE FROM \"organizationAdministrativePositions\" "
              + "WHERE \"organizationUuid\" = :organizationUuid AND \"positionUuid\" = :positionUuid")
          .bind("organizationUuid", orgUuid).bind("positionUuid", p.getUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int removePersonFromPosition(String positionUuid) {
    final Handle handle = getDbHandle();
    try {
      // Get original position data from database (we need its type)
      final Position position = getByUuid(positionUuid);
      if (position == null) {
        return 0;
      }
      final Instant now = Instant.now();
      final int nr = handle
          .createUpdate("/* positionRemovePerson.update */ UPDATE positions "
              + "SET \"currentPersonUuid\" = NULL, type = :type, \"updatedAt\" = :updatedAt "
              + "WHERE uuid = :positionUuid")
          .bind("type", DaoUtils.getEnumId(revokePrivilege(position)))
          .bind("updatedAt", DaoUtils.asLocalDateTime(now)).bind("positionUuid", positionUuid)
          .execute();

      // Note: also doing an implicit join on personUuid so as to only update 'real' history rows
      // (i.e. with both a position and a person).
      final String updateSql =
          "/* positionRemovePerson.end */ UPDATE \"peoplePositions\" SET \"endedAt\" = :endedAt FROM "
              + "(SELECT * FROM \"peoplePositions\""
              + " WHERE \"positionUuid\" = :positionUuid AND \"endedAt\" IS NULL"
              + " ORDER BY \"createdAt\" DESC LIMIT 1) AS t "
              + "WHERE t.\"personUuid\" = \"peoplePositions\".\"personUuid\" AND"
              + "      t.\"positionUuid\" = \"peoplePositions\".\"positionUuid\" AND"
              + "      t.\"createdAt\" = \"peoplePositions\".\"createdAt\" AND"
              + "      \"peoplePositions\".\"endedAt\" IS NULL";
      handle.createUpdate(updateSql).bind("positionUuid", positionUuid)
          .bind("endedAt", DaoUtils.asLocalDateTime(now)).execute();

      // Evict the person (previously) holding this position from the domain users cache
      engine().getPersonDao().evictFromCacheByPositionUuid(positionUuid);
      return nr;
    } finally {
      closeDbHandle(handle);
    }
  }

  private PositionType keepPrivilege(final Position newPosition, final Position oldPosition) {
    // Keep type from previous position if it exists
    return oldPosition != null ? oldPosition.getType() : newPosition.getType();
  }

  private PositionType revokePrivilege(final Position position) {
    // Revoke privilege from old position;
    // if this was a SUPERUSER or ADMINISTRATOR, change to REGULAR
    return (position.getType() == PositionType.SUPERUSER
        || position.getType() == PositionType.ADMINISTRATOR) ? PositionType.REGULAR
            : position.getType();
  }

  public CompletableFuture<List<Position>> getAssociatedPositions(GraphQLContext context,
      String positionUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.POSITION_ASSOCIATED_POSITIONS, positionUuid);
  }

  class AssociatedPositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String SQL = "/* batch.getAssociatedPositionsForPosition */ SELECT "
        + POSITION_FIELDS
        + ", CASE WHEN positions.uuid = \"positionRelationships\".\"positionUuid_a\""
        + " THEN \"positionRelationships\".\"positionUuid_b\""
        + " ELSE \"positionRelationships\".\"positionUuid_a\" END AS \"associatedPositionUuid\" "
        + "FROM positions, \"positionRelationships\" "
        + "WHERE \"positionRelationships\".deleted = :deleted AND (("
        + "  positions.uuid = \"positionRelationships\".\"positionUuid_a\""
        + "  AND \"positionRelationships\".\"positionUuid_b\" IN ( <foreignKeys> ) ) OR ("
        + "  positions.uuid = \"positionRelationships\".\"positionUuid_b\""
        + "  AND \"positionRelationships\".\"positionUuid_a\" IN ( <foreignKeys> ) ))";
    private static final Map<String, Object> additionalParams = new HashMap<>();

    static {
      additionalParams.put("deleted", false);
    }

    public AssociatedPositionsBatcher() {
      super(PositionDao.this.databaseHandler, SQL, "foreignKeys", new PositionMapper(),
          "associatedPositionUuid", additionalParams);
    }
  }

  public List<List<Position>> getAssociatedPositionsForPosition(List<String> foreignKeys) {
    return new AssociatedPositionsBatcher().getByForeignKeys(foreignKeys);
  }

  @Transactional
  public int associatePosition(String positionUuidA, String positionUuidB) {
    final Handle handle = getDbHandle();
    try {
      Instant now = Instant.now();
      final List<String> uuids = Arrays.asList(positionUuidA, positionUuidB);
      Collections.sort(uuids);
      return handle
          .createUpdate("/* associatePosition */ INSERT INTO \"positionRelationships\" "
              + "(\"positionUuid_a\", \"positionUuid_b\", \"createdAt\", \"updatedAt\", deleted) "
              + "VALUES (:positionUuid_a, :positionUuid_b, :createdAt, :updatedAt, :deleted)")
          .bind("positionUuid_a", uuids.get(0)).bind("positionUuid_b", uuids.get(1))
          .bind("createdAt", DaoUtils.asLocalDateTime(now))
          .bind("updatedAt", DaoUtils.asLocalDateTime(now)).bind("deleted", false).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int deletePositionAssociation(String positionUuidA, String positionUuidB) {
    final Handle handle = getDbHandle();
    try {
      final List<String> uuids = Arrays.asList(positionUuidA, positionUuidB);
      Collections.sort(uuids);
      return handle
          .createUpdate("/* deletePositionAssociation */ UPDATE \"positionRelationships\" "
              + "SET deleted = :deleted, \"updatedAt\" = :updatedAt WHERE ("
              + "  (\"positionUuid_a\" = :positionUuid_a AND \"positionUuid_b\" = :positionUuid_b)"
              + "OR "
              + "  (\"positionUuid_a\" = :positionUuid_b AND \"positionUuid_b\" = :positionUuid_a)"
              + ")")
          .bind("deleted", true).bind("positionUuid_a", uuids.get(0))
          .bind("positionUuid_b", uuids.get(1))
          .bind("updatedAt", DaoUtils.asLocalDateTime(Instant.now())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public List<Position> getEmptyPositions(PositionType type) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createQuery("SELECT " + POSITION_FIELDS + " FROM positions "
              + "WHERE \"currentPersonUuid\" IS NULL AND positions.type = :type")
          .bind("type", DaoUtils.getEnumId(type)).map(new PositionMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public AnetBeanList<Position> search(PositionSearchQuery query) {
    return new PostgresqlPositionSearcher(databaseHandler).runSearch(query);
  }

  public CompletableFuture<AnetBeanList<Position>> search(GraphQLContext context,
      PositionSearchQuery query) {
    return new PostgresqlPositionSearcher(databaseHandler).runSearch(context, query);
  }

  public CompletableFuture<List<PersonPositionHistory>> getPositionHistory(GraphQLContext context,
      String positionUuid) {
    return new ForeignKeyFetcher<PersonPositionHistory>().load(context,
        FkDataLoaderKey.POSITION_PERSON_POSITION_HISTORY, positionUuid);
  }

  public CompletableFuture<Position> getCurrentPositionForPerson(GraphQLContext context,
      String personUuid) {
    return new ForeignKeyFetcher<Position>()
        .load(context, FkDataLoaderKey.POSITION_CURRENT_POSITION_FOR_PERSON, personUuid)
        .thenApply(l -> l.isEmpty() ? null : l.get(0));
  }

  @Transactional
  public Position getCurrentPositionForPerson(String personUuid) {
    final Handle handle = getDbHandle();
    try {
      List<Position> positions = handle
          .createQuery("/* getCurrentPositionForPerson */ SELECT " + POSITION_FIELDS
              + " FROM positions WHERE \"currentPersonUuid\" = :personUuid")
          .bind("personUuid", personUuid).map(new PositionMapper()).list();
      if (positions.isEmpty()) {
        return null;
      }
      return positions.get(0);
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public Boolean getIsApprover(String positionUuid) {
    final Handle handle = getDbHandle();
    try {
      Number count = (Number) handle.createQuery(
          "/* getIsApprover */ SELECT count(*) as ct from approvers where \"positionUuid\" = :positionUuid")
          .bind("positionUuid", positionUuid).map(new MapMapper()).one().get("ct");

      return count.longValue() > 0;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected Position getObjectForSubscriptionDelete(String uuid) {
    return new Position();
  }

  @Override
  public int deleteInternal(String positionUuid) {
    final Handle handle = getDbHandle();
    try {
      // if this position has any history, we'll just delete it
      handle.execute("DELETE FROM \"peoplePositions\" WHERE \"positionUuid\" = ?", positionUuid);

      // if this position is in an approval chain, we just delete it
      handle.execute("DELETE FROM approvers WHERE \"positionUuid\" = ?", positionUuid);

      // if this position is in an organization, it'll be automatically removed.

      // if this position has any associated positions, just remove them.
      handle.execute(
          "DELETE FROM \"positionRelationships\" WHERE \"positionUuid_a\" = ? OR \"positionUuid_b\"= ?",
          positionUuid, positionUuid);

      final AnetObjectEngine instance = engine();
      // Delete customSensitiveInformation
      instance.getCustomSensitiveInformationDao().deleteFor(positionUuid);

      final NoteDao noteDao = instance.getNoteDao();
      // Delete noteRelatedObjects
      noteDao.deleteNoteRelatedObjects(TABLE_NAME, positionUuid);
      // Delete orphan notes
      noteDao.deleteOrphanNotes();

      // Delete position
      final int nr = handle.createUpdate("DELETE FROM positions WHERE uuid = :positionUuid")
          .bind("positionUuid", positionUuid).execute();
      // Evict the person (previously) holding this position from the domain users cache
      instance.getPersonDao().evictFromCacheByPositionUuid(positionUuid);
      return nr;
    } finally {
      closeDbHandle(handle);
    }
  }

  public static String generatePositionFilterAtDate(String personJoinColumn,
      String dateFilterColumn, String placeholderName) {
    return String.format(
        "JOIN \"peoplePositions\" pp ON pp.\"personUuid\" = %1$s"
            + " WHERE pp.\"createdAt\" <= %2$s"
            + " AND (pp.\"endedAt\" IS NULL OR pp.\"endedAt\" > %2$s)"
            + " AND pp.\"positionUuid\" = :%3$s",
        personJoinColumn, dateFilterColumn, placeholderName);
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Position obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "positions.uuid");
  }

  @Transactional
  public int mergePositions(Position winner, Position loser) {
    final Handle handle = getDbHandle();
    try {
      final String winnerUuid = winner.getUuid();
      final String loserUuid = loser.getUuid();
      final AnetObjectEngine engine = engine();
      final GraphQLContext context = engine.getContext();
      // Get some data related to the existing position in the database
      final Position existingPos = getByUuid(winnerUuid);
      final List<Position> existingAssociatedPositions =
          existingPos.loadAssociatedPositions(context).join();

      // Clear loser's code to prevent update conflicts (code must be unique)
      handle
          .createUpdate("/* clearPositionCode */ UPDATE \"positions\""
              + " SET \"code\" = NULL WHERE \"uuid\" = :loserUuid")
          .bind("loserUuid", loserUuid).execute();

      // Update the winner's fields
      update(winner);

      // Remove loser from position history
      deleteForMerge("peoplePositions", "positionUuid", loserUuid);
      // Update position history with given input on winner
      updatePositionHistory(winner);

      // Update positionRelationships with given input on winner
      final Set<String> existingApUuids =
          existingAssociatedPositions.stream().map(ap -> ap.getUuid()).collect(Collectors.toSet());
      // delete common relations of merging positions
      if (!existingApUuids.isEmpty()) {
        handle
            .createUpdate("UPDATE \"positionRelationships\" SET deleted = :deleted"
                + " WHERE (\"positionUuid_a\" IN (<winnerExApUuids>)"
                + " OR \"positionUuid_b\" IN (<winnerExApUuids>))"
                + " AND (\"positionUuid_a\" = :loserUuid OR \"positionUuid_b\" = :loserUuid)")
            .bind("deleted", true).bindList(NULL_KEYWORD, "winnerExApUuids", existingApUuids)
            .bind("loserUuid", loserUuid).execute();
      }
      // transfer loser's relations to winners
      handle
          .createUpdate("UPDATE \"positionRelationships\""
              + " SET \"positionUuid_a\" = :winnerUuid, \"updatedAt\" = :updatedAt"
              + " WHERE \"positionUuid_a\" = :loserUuid")
          .bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid)
          .bind("updatedAt", DaoUtils.asLocalDateTime(Instant.now())).execute();
      handle
          .createUpdate("UPDATE \"positionRelationships\""
              + " SET \"positionUuid_b\" = :winnerUuid, \"updatedAt\" = :updatedAt"
              + " WHERE \"positionUuid_b\" = :loserUuid")
          .bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid)
          .bind("updatedAt", DaoUtils.asLocalDateTime(Instant.now())).execute();
      // delete unused relations
      final Set<String> winnerApUuids =
          winner.getAssociatedPositions() == null ? Collections.emptySet()
              : winner.getAssociatedPositions().stream().map(ap -> ap.getUuid())
                  .collect(Collectors.toSet());
      if (winnerApUuids.isEmpty()) {
        handle
            .createUpdate("UPDATE \"positionRelationships\""
                + " SET deleted = :deleted, \"updatedAt\" = :updatedAt"
                + " WHERE \"positionUuid_a\" = :winnerUuid OR \"positionUuid_b\" = :winnerUuid")
            .bind("deleted", true).bind("winnerUuid", winnerUuid)
            .bind("updatedAt", DaoUtils.asLocalDateTime(Instant.now())).execute();
      } else {
        handle
            .createUpdate("UPDATE \"positionRelationships\""
                + " SET deleted = :deleted, \"updatedAt\" = :updatedAt"
                + " WHERE (\"positionUuid_a\" = :winnerUuid OR \"positionUuid_b\" = :winnerUuid)"
                + " AND \"positionUuid_a\" NOT IN (<winnerList>)"
                + " AND \"positionUuid_b\" NOT IN (<winnerList>)")
            .bind("deleted", true).bind("winnerUuid", winnerUuid)
            .bindList(NULL_KEYWORD, "winnerList", winnerApUuids)
            .bind("updatedAt", DaoUtils.asLocalDateTime(Instant.now())).execute();
      }

      // Update notes
      updateM2mForMerge("noteRelatedObjects", "noteUuid", "relatedObjectUuid", winnerUuid,
          loserUuid);

      // Update attachments
      updateM2mForMerge("attachmentRelatedObjects", "attachmentUuid", "relatedObjectUuid",
          winnerUuid, loserUuid);

      // Update the avatar
      final EntityAvatarDao entityAvatarDao = engine().getEntityAvatarDao();
      entityAvatarDao.delete(PositionDao.TABLE_NAME, winnerUuid);
      entityAvatarDao.delete(PositionDao.TABLE_NAME, loserUuid);
      final EntityAvatar winnerEntityAvatar = winner.getEntityAvatar();
      if (winnerEntityAvatar != null) {
        winnerEntityAvatar.setRelatedObjectType(PositionDao.TABLE_NAME);
        winnerEntityAvatar.setRelatedObjectUuid(winnerUuid);
        entityAvatarDao.upsert(winnerEntityAvatar);
      }

      // Update approvers
      updateM2mForMerge("approvers", "approvalStepUuid", "positionUuid", winnerUuid, loserUuid);

      // Update taskResponsiblePositions
      updateM2mForMerge("taskResponsiblePositions", "taskUuid", "positionUuid", winnerUuid,
          loserUuid);

      // Update authorizationGroupRelatedObjects
      updateM2mForMerge("authorizationGroupRelatedObjects", "authorizationGroupUuid",
          "relatedObjectUuid", winnerUuid, loserUuid);

      // Update organizationAdministrativePositions
      deleteForMerge("organizationAdministrativePositions", "positionUuid", loserUuid);

      Utils.addRemoveElementsByUuid(existingPos.loadOrganizationsAdministrated(context).join(),
          Utils.orIfNull(winner.getOrganizationsAdministrated(), new ArrayList<>()),
          newOrg -> addOrganizationToPosition(winner, newOrg),
          oldOrg -> removeOrganizationFromPosition(DaoUtils.getUuid(oldOrg), winner));

      // Update emailAddresses
      final EmailAddressDao emailAddressDao = engine().getEmailAddressDao();
      emailAddressDao.updateEmailAddresses(PositionDao.TABLE_NAME, loserUuid, null);
      emailAddressDao.updateEmailAddresses(PositionDao.TABLE_NAME, winnerUuid,
          winner.getEmailAddresses());

      // Update customSensitiveInformation for winner
      DaoUtils.saveCustomSensitiveInformation(null, PositionDao.TABLE_NAME, winnerUuid,
          winner.getCustomSensitiveInformation());
      // Delete customSensitiveInformation for loser
      deleteForMerge("customSensitiveInformation", "relatedObjectUuid", loserUuid);

      // Finally, delete loser
      final int nrDeleted = deleteForMerge(PositionDao.TABLE_NAME, "uuid", loserUuid);
      if (nrDeleted > 0) {
        ApplicationContextProvider.getBean(AdminDao.class)
            .insertMergedEntity(new MergedEntity(loserUuid, winnerUuid, Instant.now()));
      }

      // Evict the persons (previously) holding these positions from the domain users cache
      final PersonDao personDao = engine.getPersonDao();
      personDao.evictFromCacheByPositionUuid(loserUuid);
      personDao.evictFromCacheByPositionUuid(winnerUuid);
      return nrDeleted;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int updatePositionHistory(Position pos) {
    final Handle handle = getDbHandle();
    try {
      final PersonDao personDao = engine().getPersonDao();
      final String posUuid = pos.getUuid();
      // Delete old history
      final int numRows =
          handle.execute("DELETE FROM \"peoplePositions\"  WHERE \"positionUuid\" = ?", posUuid);
      if (Utils.isEmptyOrNull(pos.getPreviousPeople())) {
        personDao.updatePeoplePositions(posUuid, pos.getPersonUuid(), Instant.now(), null);
      } else {
        // Add new history
        for (final PersonPositionHistory history : pos.getPreviousPeople()) {
          personDao.updatePeoplePositions(posUuid, history.getPersonUuid(), history.getStartTime(),
              history.getEndTime());
        }
      }
      return numRows;
    } finally {
      closeDbHandle(handle);
    }
  }
}
