package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

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
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.mappers.PersonPositionHistoryMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.SqDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import mil.dds.anet.views.SearchQueryFetcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class PositionDao extends AnetSubscribableObjectDao<Position, PositionSearchQuery> {

  public static final String[] fields =
      {"uuid", "name", "code", "createdAt", "updatedAt", "organizationUuid", "currentPersonUuid",
          "type", "status", "locationUuid", "customFields", "role"};
  public static final String TABLE_NAME = "positions";
  public static final String POSITION_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);
  public static final String DUPLICATE_POSITION_CODE =
      "Another position is already using this code and each position must have its own code. "
          + "Please double check that you entered the right code.";

  @Override
  public Position insertInternal(Position p) {
    // prevent code conflicts
    if (p.getCode() != null && p.getCode().trim().length() == 0) {
      p.setCode(null);
    }

    try {
      getDbHandle()
          .createUpdate("/* positionInsert */ INSERT INTO positions (uuid, name, code, type, "
              + "status, \"organizationUuid\", \"locationUuid\", \"createdAt\", \"updatedAt\", "
              + "\"customFields\", \"role\") VALUES (:uuid, :name, :code, :type, :status, :organizationUuid, "
              + ":locationUuid, :createdAt, :updatedAt, :customFields, :role)")
          .bindBean(p).bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("type", DaoUtils.getEnumId(p.getType()))
          .bind("status", DaoUtils.getEnumId(p.getStatus()))
          .bind("role", DaoUtils.getEnumId(p.getRole())).execute();
      // Specifically don't set currentPersonUuid here because we'll handle that later in
      // setPersonInPosition();
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, DUPLICATE_POSITION_CODE);
    }
    return p;
  }

  @Override
  public Position getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Position> {
    private static final String sql = "/* batch.getPositionsByUuids */ SELECT " + POSITION_FIELDS
        + "FROM positions WHERE positions.uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new PositionMapper());
    }
  }

  @Override
  public List<Position> getByIds(List<String> uuids) {
    final IdBatcher<Position> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  static class PersonPositionHistoryBatcher extends ForeignKeyBatcher<PersonPositionHistory> {
    private static final String sql =
        "/* batch.getPositionHistory */ SELECT * FROM \"peoplePositions\" "
            + "WHERE \"positionUuid\" IN ( <foreignKeys> ) ORDER BY \"createdAt\" ASC";

    public PersonPositionHistoryBatcher() {
      super(sql, "foreignKeys", new PersonPositionHistoryMapper(), "positionUuid");
    }
  }

  public List<List<PersonPositionHistory>> getPersonPositionHistory(List<String> foreignKeys) {
    final ForeignKeyBatcher<PersonPositionHistory> personPositionHistoryBatcher = AnetObjectEngine
        .getInstance().getInjector().getInstance(PersonPositionHistoryBatcher.class);
    return personPositionHistoryBatcher.getByForeignKeys(foreignKeys);
  }

  static class PositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String sql =
        "/* batch.getCurrentPositionForPerson */ SELECT " + POSITION_FIELDS + " FROM positions "
            + "WHERE positions.\"currentPersonUuid\" IN ( <foreignKeys> )";

    public PositionsBatcher() {
      super(sql, "foreignKeys", new PositionMapper(), "positions_currentPersonUuid");
    }
  }

  public List<List<Position>> getCurrentPersonForPosition(List<String> foreignKeys) {
    final ForeignKeyBatcher<Position> currentPositionForPersonBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(PositionsBatcher.class);
    return currentPositionForPersonBatcher.getByForeignKeys(foreignKeys);
  }

  static class PositionSearchBatcher extends SearchQueryBatcher<Position, PositionSearchQuery> {
    public PositionSearchBatcher() {
      super(AnetObjectEngine.getInstance().getPositionDao());
    }
  }

  public List<List<Position>> getPositionsBySearch(
      List<ImmutablePair<String, PositionSearchQuery>> foreignKeys) {
    final PositionSearchBatcher instance =
        AnetObjectEngine.getInstance().getInjector().getInstance(PositionSearchBatcher.class);
    return instance.getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Position>> getPositionsBySearch(Map<String, Object> context,
      String uuid, PositionSearchQuery query) {
    return new SearchQueryFetcher<Position, PositionSearchQuery>().load(context,
        SqDataLoaderKey.POSITIONS_SEARCH, new ImmutablePair<>(uuid, query));
  }

  /*
   * @return: number of rows updated.
   */
  @Override
  public int updateInternal(Position p) {
    // prevent code conflicts
    if (p.getCode() != null && p.getCode().trim().length() == 0) {
      p.setCode(null);
    }

    try {
      final int nr = getDbHandle()
          .createUpdate("/* positionUpdate */ UPDATE positions SET name = :name, code = :code, "
              + "\"organizationUuid\" = :organizationUuid, type = :type, status = :status, "
              + "\"locationUuid\" = :locationUuid, \"updatedAt\" = :updatedAt, "
              + "\"customFields\" = :customFields, \"role\" = :role WHERE uuid = :uuid")
          .bindBean(p).bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("type", DaoUtils.getEnumId(p.getType()))
          .bind("status", DaoUtils.getEnumId(p.getStatus()))
          .bind("role", DaoUtils.getEnumId(p.getRole())).execute();
      // Evict the person holding this position from the domain users cache, as their position has
      // changed
      AnetObjectEngine.getInstance().getPersonDao()
          .evictFromCacheByPositionUuid(DaoUtils.getUuid(p));
      return nr;
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, DUPLICATE_POSITION_CODE);
    }
  }

  @InTransaction
  public int setPersonInPosition(String personUuid, String positionUuid) {
    // Get new position data from database (we need its type)
    final Position newPos = getByUuid(positionUuid);
    if (newPos == null) {
      return 0;
    }
    // Find out if person already holds a position (we also need its type later on)
    final Position currPos = getDbHandle()
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
      getDbHandle().createUpdate(sql).bind("personUuid", personUuid)
          .bind("positionUuid", currPos.getUuid()).bind("endedAt", DaoUtils.asLocalDateTime(now))
          .execute();

      getDbHandle()
          .createUpdate("/* positionSetPerson.remove1 */ UPDATE positions "
              + "SET \"currentPersonUuid\" = NULL, type = :type, \"updatedAt\" = :updatedAt "
              + "WHERE \"currentPersonUuid\" = :personUuid")
          .bind("type", DaoUtils.getEnumId(revokePrivilege(currPos)))
          .bind("updatedAt", DaoUtils.asLocalDateTime(now)).bind("personUuid", personUuid)
          .execute();
    }

    // Now put the person in their new position
    getDbHandle()
        .createUpdate("/* positionSetPerson.set1 */ UPDATE positions "
            + "SET \"currentPersonUuid\" = :personUuid, type = :type, \"updatedAt\" = :updatedAt "
            + "WHERE uuid = :positionUuid")
        .bind("personUuid", personUuid)
        .bind("type", DaoUtils.getEnumId(keepPrivilege(newPos, currPos)))
        .bind("updatedAt", DaoUtils.asLocalDateTime(now)).bind("positionUuid", positionUuid)
        .execute();
    // And update the history
    final int nr = getDbHandle()
        .createUpdate("/* positionSetPerson.set2 */ INSERT INTO \"peoplePositions\" "
            + "(\"positionUuid\", \"personUuid\", \"createdAt\") "
            + "VALUES (:positionUuid, :personUuid, :createdAt)")
        .bind("positionUuid", positionUuid).bind("personUuid", personUuid)
        // Need to ensure this timestamp is greater than previous INSERT.
        .bind("createdAt", DaoUtils.asLocalDateTime(now.plusMillis(1))).execute();
    // Evict this person from the domain users cache, as their position has changed
    AnetObjectEngine.getInstance().getPersonDao().evictFromCacheByPersonUuid(personUuid);

    // GraphQL mutations *have* to return something, so we return the number of inserted rows
    return nr;
  }

  @InTransaction
  public int addOrganizationToPosition(Position p, Organization o) {
    return getDbHandle().createUpdate(
        "/* addOrganizationToPosition */ INSERT INTO \"organizationAdministrativePositions\" (\"organizationUuid\", \"positionUuid\") "
            + "VALUES (:organizationUuid, :positionUuid)")
        .bind("organizationUuid", o.getUuid()).bind("positionUuid", p.getUuid()).execute();
  }

  @InTransaction
  public int removeOrganizationFromPosition(String orgUuid, Position p) {
    return getDbHandle().createUpdate(
        "/* removeOrganizationToPosition*/ DELETE FROM \"organizationAdministrativePositions\" "
            + "WHERE \"organizationUuid\" = :organizationUuid AND \"positionUuid\" = :positionUuid")
        .bind("organizationUuid", orgUuid).bind("positionUuid", p.getUuid()).execute();
  }

  @InTransaction
  public int removePersonFromPosition(String positionUuid) {
    // Get original position data from database (we need its type)
    final Position position = getByUuid(positionUuid);
    if (position == null) {
      return 0;
    }
    final Instant now = Instant.now();
    final int nr = getDbHandle()
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
    getDbHandle().createUpdate(updateSql).bind("positionUuid", positionUuid)
        .bind("endedAt", DaoUtils.asLocalDateTime(now)).execute();

    // Evict the person (previously) holding this position from the domain users cache
    AnetObjectEngine.getInstance().getPersonDao().evictFromCacheByPositionUuid(positionUuid);
    return nr;
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

  public CompletableFuture<List<Position>> getAssociatedPositions(Map<String, Object> context,
      String positionUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.POSITION_ASSOCIATED_POSITIONS, positionUuid);
  }

  static class AssociatedPositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String sql = "/* batch.getAssociatedPositionsForPosition */ SELECT "
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
      super(sql, "foreignKeys", new PositionMapper(), "associatedPositionUuid", additionalParams);
    }
  }

  public List<List<Position>> getAssociatedPositionsForPosition(List<String> foreignKeys) {
    final ForeignKeyBatcher<Position> associatedPositionsBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(AssociatedPositionsBatcher.class);
    return associatedPositionsBatcher.getByForeignKeys(foreignKeys);
  }

  @InTransaction
  public int associatePosition(String positionUuidA, String positionUuidB) {
    Instant now = Instant.now();
    final List<String> uuids = Arrays.asList(positionUuidA, positionUuidB);
    Collections.sort(uuids);
    return getDbHandle()
        .createUpdate("/* associatePosition */ INSERT INTO \"positionRelationships\" "
            + "(\"positionUuid_a\", \"positionUuid_b\", \"createdAt\", \"updatedAt\", deleted) "
            + "VALUES (:positionUuid_a, :positionUuid_b, :createdAt, :updatedAt, :deleted)")
        .bind("positionUuid_a", uuids.get(0)).bind("positionUuid_b", uuids.get(1))
        .bind("createdAt", DaoUtils.asLocalDateTime(now))
        .bind("updatedAt", DaoUtils.asLocalDateTime(now)).bind("deleted", false).execute();
  }

  @InTransaction
  public int deletePositionAssociation(String positionUuidA, String positionUuidB) {
    final List<String> uuids = Arrays.asList(positionUuidA, positionUuidB);
    Collections.sort(uuids);
    return getDbHandle()
        .createUpdate("/* deletePositionAssociation */ UPDATE \"positionRelationships\" "
            + "SET deleted = :deleted, \"updatedAt\" = :updatedAt WHERE ("
            + "  (\"positionUuid_a\" = :positionUuid_a AND \"positionUuid_b\" = :positionUuid_b)"
            + "OR "
            + "  (\"positionUuid_a\" = :positionUuid_b AND \"positionUuid_b\" = :positionUuid_a)"
            + ")")
        .bind("deleted", true).bind("positionUuid_a", uuids.get(0))
        .bind("positionUuid_b", uuids.get(1))
        .bind("updatedAt", DaoUtils.asLocalDateTime(Instant.now())).execute();
  }

  @InTransaction
  public List<Position> getEmptyPositions(PositionType type) {
    return getDbHandle()
        .createQuery("SELECT " + POSITION_FIELDS + " FROM positions "
            + "WHERE \"currentPersonUuid\" IS NULL AND positions.type = :type")
        .bind("type", DaoUtils.getEnumId(type)).map(new PositionMapper()).list();
  }

  @Override
  public AnetBeanList<Position> search(PositionSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getPositionSearcher().runSearch(query);
  }

  public CompletableFuture<AnetBeanList<Position>> search(Map<String, Object> context,
      PositionSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getPositionSearcher().runSearch(context,
        query);
  }

  public CompletableFuture<List<PersonPositionHistory>> getPositionHistory(
      Map<String, Object> context, String positionUuid) {
    return new ForeignKeyFetcher<PersonPositionHistory>().load(context,
        FkDataLoaderKey.POSITION_PERSON_POSITION_HISTORY, positionUuid);
  }

  public CompletableFuture<Position> getCurrentPositionForPerson(Map<String, Object> context,
      String personUuid) {
    return new ForeignKeyFetcher<Position>()
        .load(context, FkDataLoaderKey.POSITION_CURRENT_POSITION_FOR_PERSON, personUuid)
        .thenApply(l -> l.isEmpty() ? null : l.get(0));
  }

  @InTransaction
  public Position getCurrentPositionForPerson(String personUuid) {
    List<Position> positions = getDbHandle()
        .createQuery("/* getCurrentPositionForPerson */ SELECT " + POSITION_FIELDS
            + " FROM positions WHERE \"currentPersonUuid\" = :personUuid")
        .bind("personUuid", personUuid).map(new PositionMapper()).list();
    if (positions.size() == 0) {
      return null;
    }
    return positions.get(0);
  }

  @InTransaction
  public Boolean getIsApprover(String positionUuid) {
    Number count = (Number) getDbHandle().createQuery(
        "/* getIsApprover */ SELECT count(*) as ct from approvers where \"positionUuid\" = :positionUuid")
        .bind("positionUuid", positionUuid).map(new MapMapper(false)).one().get("ct");

    return count.longValue() > 0;
  }

  @Override
  protected Position getObjectForSubscriptionDelete(String uuid) {
    return new Position();
  }

  @Override
  public int deleteInternal(String positionUuid) {
    // if this position has any history, we'll just delete it
    getDbHandle().execute("DELETE FROM \"peoplePositions\" WHERE \"positionUuid\" = ?",
        positionUuid);

    // if this position is in an approval chain, we just delete it
    getDbHandle().execute("DELETE FROM approvers WHERE \"positionUuid\" = ?", positionUuid);

    // if this position is in an organization, it'll be automatically removed.

    // if this position has any associated positions, just remove them.
    getDbHandle().execute(
        "DELETE FROM \"positionRelationships\" WHERE \"positionUuid_a\" = ? OR \"positionUuid_b\"= ?",
        positionUuid, positionUuid);

    final AnetObjectEngine instance = AnetObjectEngine.getInstance();
    // Delete customSensitiveInformation
    instance.getCustomSensitiveInformationDao().deleteFor(positionUuid);

    final NoteDao noteDao = instance.getNoteDao();
    // Delete noteRelatedObjects
    noteDao.deleteNoteRelatedObjects(TABLE_NAME, positionUuid);
    // Delete orphan notes
    noteDao.deleteOrphanNotes();

    // Delete position
    final int nr = getDbHandle().createUpdate("DELETE FROM positions WHERE uuid = :positionUuid")
        .bind("positionUuid", positionUuid).execute();
    // Evict the person (previously) holding this position from the domain users cache
    instance.getPersonDao().evictFromCacheByPositionUuid(positionUuid);
    return nr;
  }

  public static String generateCurrentPositionFilter(String personJoinColumn,
      String dateFilterColumn, String placeholderName) {
    // it is possible this would be better implemented using WHERE NOT EXISTS instead of the left
    // join
    return String.format(
        "JOIN \"peoplePositions\" pp ON pp.\"personUuid\" = %1$s  AND pp.\"createdAt\" <= %2$s "
            + " LEFT JOIN \"peoplePositions\" maxPp ON"
            + "   maxPp.\"positionUuid\" = pp.\"positionUuid\" AND maxPp.\"createdAt\" > pp.\"createdAt\" AND maxPp.\"createdAt\" <= %2$s "
            + " WHERE pp.\"positionUuid\" = :%3$s AND maxPp.\"createdAt\" IS NULL ",
        personJoinColumn, dateFilterColumn, placeholderName);
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Position obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "positions.uuid");
  }

  @InTransaction
  public int mergePositions(Position winner, Position loser) {
    final String winnerUuid = winner.getUuid();
    final String loserUuid = loser.getUuid();
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Map<String, Object> context = engine.getContext();
    // Get some data related to the existing position in the database
    final Position existingPos = getByUuid(winnerUuid);
    final List<Position> existingAssociatedPositions =
        existingPos.loadAssociatedPositions(context).join();

    // Clear loser's code to prevent update conflicts (code must be unique)
    getDbHandle()
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
      getDbHandle()
          .createUpdate("UPDATE \"positionRelationships\" SET deleted = :deleted"
              + " WHERE (\"positionUuid_a\" IN (<winnerExApUuids>)"
              + " OR \"positionUuid_b\" IN (<winnerExApUuids>))"
              + " AND (\"positionUuid_a\" = :loserUuid OR \"positionUuid_b\" = :loserUuid)")
          .bind("deleted", true).bindList(NULL_KEYWORD, "winnerExApUuids", existingApUuids)
          .bind("loserUuid", loserUuid).execute();
    }
    // transfer loser's relations to winners
    getDbHandle()
        .createUpdate("UPDATE \"positionRelationships\""
            + " SET \"positionUuid_a\" = :winnerUuid, \"updatedAt\" = :updatedAt"
            + " WHERE \"positionUuid_a\" = :loserUuid")
        .bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid)
        .bind("updatedAt", DaoUtils.asLocalDateTime(Instant.now())).execute();
    getDbHandle()
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
      getDbHandle()
          .createUpdate("UPDATE \"positionRelationships\""
              + " SET deleted = :deleted, \"updatedAt\" = :updatedAt"
              + " WHERE \"positionUuid_a\" = :winnerUuid OR \"positionUuid_b\" = :winnerUuid")
          .bind("deleted", true).bind("winnerUuid", winnerUuid)
          .bind("updatedAt", DaoUtils.asLocalDateTime(Instant.now())).execute();
    } else {
      getDbHandle()
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
    updateM2mForMerge("noteRelatedObjects", "noteUuid", "relatedObjectUuid", winnerUuid, loserUuid);

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
        oldOrgUuid -> removeOrganizationFromPosition(oldOrgUuid, winner));

    // Update customSensitiveInformation for winner
    DaoUtils.saveCustomSensitiveInformation(null, PositionDao.TABLE_NAME, winnerUuid,
        winner.getCustomSensitiveInformation());
    // Delete customSensitiveInformation for loser
    deleteForMerge("customSensitiveInformation", "relatedObjectUuid", loserUuid);

    // Finally, delete loser
    final int nr = deleteForMerge("positions", "uuid", loserUuid);

    // Evict the persons (previously) holding these positions from the domain users cache
    final PersonDao personDao = engine.getPersonDao();
    personDao.evictFromCacheByPositionUuid(loserUuid);
    personDao.evictFromCacheByPositionUuid(winnerUuid);
    return nr;
  }

  @InTransaction
  public int updatePositionHistory(Position pos) {
    final PersonDao personDao = AnetObjectEngine.getInstance().getPersonDao();
    final String posUuid = pos.getUuid();
    // Delete old history
    final int numRows = getDbHandle()
        .execute("DELETE FROM \"peoplePositions\"  WHERE \"positionUuid\" = ?", posUuid);
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
  }
}
