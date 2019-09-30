package mil.dds.anet.database;

import java.sql.SQLException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.mappers.PersonPositionHistoryMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.SqDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import mil.dds.anet.views.SearchQueryFetcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
public class PositionDao extends AnetBaseDao<Position, PositionSearchQuery> {

  private static String[] fields = {"uuid", "name", "code", "createdAt", "updatedAt",
      "organizationUuid", "currentPersonUuid", "type", "status", "locationUuid"};
  public static String TABLE_NAME = "positions";
  public static String POSITIONS_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  @Override
  public Position insertInternal(Position p) {
    // prevent code conflicts
    if (p.getCode() != null && p.getCode().trim().length() == 0) {
      p.setCode(null);
    }

    try {
      getDbHandle()
          .createUpdate("/* positionInsert */ INSERT INTO positions (uuid, name, code, type, "
              + "status, \"organizationUuid\", \"locationUuid\", \"createdAt\", \"updatedAt\") "
              + "VALUES (:uuid, :name, :code, :type, :status, :organizationUuid, :locationUuid, :createdAt, :updatedAt)")
          .bindBean(p).bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("type", DaoUtils.getEnumId(p.getType()))
          .bind("status", DaoUtils.getEnumId(p.getStatus())).execute();
      // Specifically don't set currentPersonUuid here because we'll handle that later in
      // setPersonInPosition();
    } catch (UnableToExecuteStatementException e) {
      checkForUniqueCodeViolation(e);
      throw e;
    }
    return p;
  }

  public void checkForUniqueCodeViolation(UnableToExecuteStatementException e) {
    if (e.getCause() != null && e.getCause() instanceof SQLException) {
      SQLException cause = (SQLException) e.getCause();
      if (cause.getErrorCode() == 2601) { // Unique Key Violation constant for SQL Server
        if (cause.getMessage().contains("UQ_PositionCodes")) {
          throw new WebApplicationException("Another position is already using this "
              + "code and each position must have its own code. "
              + "Please double check that you entered the right code. ", Status.CONFLICT);
        }
      }
    }
  }

  public Position getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Position> {
    private static final String sql = "/* batch.getPositionsByUuids */ SELECT " + POSITIONS_FIELDS
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
        "/* batch.getCurrentPositionForPerson */ SELECT " + POSITIONS_FIELDS + " FROM positions "
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
      return getDbHandle().createUpdate("/* positionUpdate */ UPDATE positions SET name = :name, "
          + "code = :code, \"organizationUuid\" = :organizationUuid, type = :type, status = :status, "
          + "\"locationUuid\" = :locationUuid, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(p).bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("type", DaoUtils.getEnumId(p.getType()))
          .bind("status", DaoUtils.getEnumId(p.getStatus())).execute();
    } catch (UnableToExecuteStatementException e) {
      checkForUniqueCodeViolation(e);
      throw e;
    }
  }

  public int setPersonInPosition(String personUuid, String positionUuid) {
    // If the position is already assigned to another person, remove the person from the position
    AnetObjectEngine.getInstance().getPositionDao().removePersonFromPosition(positionUuid);

    // If this person is in a position already, we need to remove them.
    Position currPos = getDbHandle()
        .createQuery("/* positionSetPerson.find */ SELECT " + POSITIONS_FIELDS
            + " FROM positions WHERE \"currentPersonUuid\" = :personUuid")
        .bind("personUuid", personUuid).map(new PositionMapper()).findFirst().orElse(null);
    // Get timestamp *after* remove to preserve correct order
    final Instant now = Instant.now();
    if (currPos != null) {
      final String sql;
      if (DaoUtils.isMsSql()) {
        sql =
            "/* positionSetPerson.end */ UPDATE \"peoplePositions\" SET \"endedAt\" = :endedAt FROM "
                + "(SELECT TOP(1) * FROM \"peoplePositions\""
                + " WHERE \"personUuid\" = :personUuid AND \"positionUuid\" = :positionUuid AND \"endedAt\" IS NULL"
                + " ORDER BY \"createdAt\" DESC) AS t "
                + "WHERE t.\"personUuid\" = \"peoplePositions\".\"personUuid\" AND"
                + "      t.\"positionUuid\" = \"peoplePositions\".\"positionUuid\" AND"
                + "      t.\"createdAt\" = \"peoplePositions\".\"createdAt\" AND"
                + "      \"peoplePositions\".\"endedAt\" IS NULL";
      } else {
        sql =
            "/* positionSetPerson.end */ UPDATE \"peoplePositions\" SET \"endedAt\" = :endedAt FROM "
                + "(SELECT * FROM \"peoplePositions\""
                + " WHERE \"personUuid\" = :personUuid AND \"positionUuid\" = :positionUuid AND \"endedAt\" IS NULL"
                + " ORDER BY \"createdAt\" DESC LIMIT 1) AS t "
                + "WHERE t.\"personUuid\" = \"peoplePositions\".\"personUuid\" AND"
                + "      t.\"positionUuid\" = \"peoplePositions\".\"positionUuid\" AND"
                + "      t.\"createdAt\" = \"peoplePositions\".\"createdAt\" AND"
                + "      \"peoplePositions\".\"endedAt\" IS NULL";
      }
      getDbHandle().createUpdate(sql).bind("personUuid", personUuid)
          .bind("positionUuid", currPos.getUuid()).bind("endedAt", DaoUtils.asLocalDateTime(now))
          .execute();

      getDbHandle()
          .createUpdate(
              "/* positionSetPerson.remove1 */ UPDATE positions set \"currentPersonUuid\" = NULL "
                  + "WHERE \"currentPersonUuid\" = :personUuid")
          .bind("personUuid", personUuid).execute();

      getDbHandle()
          .createUpdate("/* positionSetPerson.remove2 */ INSERT INTO \"peoplePositions\" "
              + "(\"positionUuid\", \"personUuid\", \"createdAt\") "
              + "VALUES (:positionUuid, NULL, :createdAt)")
          .bind("positionUuid", currPos.getUuid()).bind("createdAt", DaoUtils.asLocalDateTime(now))
          .execute();
    }

    getDbHandle()
        .createUpdate("/* positionSetPerson.set1 */ UPDATE positions "
            + "SET \"currentPersonUuid\" = :personUuid WHERE uuid = :positionUuid")
        .bind("personUuid", personUuid).bind("positionUuid", positionUuid).execute();
    // GraphQL mutations *have* to return something, so we return the number of inserted rows
    return getDbHandle()
        .createUpdate("/* positionSetPerson.set2 */ INSERT INTO \"peoplePositions\" "
            + "(\"positionUuid\", \"personUuid\", \"createdAt\") "
            + "VALUES (:positionUuid, :personUuid, :createdAt)")
        .bind("positionUuid", positionUuid).bind("personUuid", personUuid)
        // Need to ensure this timestamp is greater than previous INSERT.
        .bind("createdAt", DaoUtils.asLocalDateTime(now.plusMillis(1))).execute();
  }

  public int removePersonFromPosition(String positionUuid) {
    Instant now = Instant.now();
    getDbHandle()
        .createUpdate("/* positionRemovePerson.update */ UPDATE positions "
            + "SET \"currentPersonUuid\" = :personUuid, \"updatedAt\" = :updatedAt "
            + "WHERE uuid = :positionUuid")
        .bind("personUuid", (Integer) null).bind("updatedAt", DaoUtils.asLocalDateTime(now))
        .bind("positionUuid", positionUuid).execute();

    final String updateSql;
    // Note: also doing an implicit join on personUuid so as to only update 'real' history rows
    // (i.e. with both a position and a person).
    if (DaoUtils.isMsSql()) {
      updateSql =
          "/* positionRemovePerson.end */ UPDATE \"peoplePositions\" SET \"endedAt\" = :endedAt FROM "
              + "(SELECT TOP(1) * FROM \"peoplePositions\""
              + " WHERE \"positionUuid\" = :positionUuid AND \"endedAt\" IS NULL"
              + " ORDER BY \"createdAt\" DESC) AS t "
              + "WHERE t.\"personUuid\" = \"peoplePositions\".\"personUuid\" AND"
              + "      t.\"positionUuid\" = \"peoplePositions\".\"positionUuid\" AND"
              + "      t.\"createdAt\" = \"peoplePositions\".\"createdAt\" AND"
              + "      \"peoplePositions\".\"endedAt\" IS NULL";
    } else {
      updateSql =
          "/* positionRemovePerson.end */ UPDATE \"peoplePositions\" SET \"endedAt\" = :endedAt FROM "
              + "(SELECT * FROM \"peoplePositions\""
              + " WHERE \"positionUuid\" = :positionUuid AND \"endedAt\" IS NULL"
              + " ORDER BY \"createdAt\" DESC LIMIT 1) AS t "
              + "WHERE t.\"personUuid\" = \"peoplePositions\".\"personUuid\" AND"
              + "      t.\"positionUuid\" = \"peoplePositions\".\"positionUuid\" AND"
              + "      t.\"createdAt\" = \"peoplePositions\".\"createdAt\" AND"
              + "      \"peoplePositions\".\"endedAt\" IS NULL";
    }
    getDbHandle().createUpdate(updateSql).bind("positionUuid", positionUuid)
        .bind("endedAt", DaoUtils.asLocalDateTime(now)).execute();

    String insertSql;
    if (DaoUtils.isMsSql()) {
      insertSql = "/* positionRemovePerson.insert1 */ INSERT INTO \"peoplePositions\" "
          + "(\"positionUuid\", \"personUuid\", \"createdAt\") VALUES(NULL, "
          + "(SELECT TOP(1) \"personUuid\" FROM \"peoplePositions\""
          + " WHERE \"positionUuid\" = :positionUuid ORDER BY \"createdAt\" DESC),"
          + " :createdAt)";
    } else {
      insertSql = "/* positionRemovePerson.insert1 */ INSERT INTO \"peoplePositions\" "
          + "(\"positionUuid\", \"personUuid\", \"createdAt\") VALUES(NULL, "
          + "(SELECT \"personUuid\" FROM \"peoplePositions\""
          + " WHERE \"positionUuid\" = :positionUuid ORDER BY \"createdAt\" DESC LIMIT 1),"
          + " :createdAt)";
    }
    getDbHandle().createUpdate(insertSql).bind("positionUuid", positionUuid)
        .bind("createdAt", DaoUtils.asLocalDateTime(now)).execute();

    return getDbHandle()
        .createUpdate("/* positionRemovePerson.insert2 */ INSERT INTO \"peoplePositions\" "
            + "(\"positionUuid\", \"personUuid\", \"createdAt\") "
            + "VALUES (:positionUuid, NULL, :createdAt)")
        .bind("positionUuid", positionUuid)
        // Need to ensure this timestamp is greater than previous INSERT.
        .bind("createdAt", DaoUtils.asLocalDateTime(now.plusMillis(1))).execute();
  }

  public CompletableFuture<List<Position>> getAssociatedPositions(Map<String, Object> context,
      String positionUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.POSITION_ASSOCIATED_POSITIONS, positionUuid);
  }

  static class AssociatedPositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String sql = "/* batch.getAssociatedPositionsForPosition */ SELECT "
        + POSITIONS_FIELDS
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

  public List<Position> getEmptyPositions(PositionType type) {
    return getDbHandle()
        .createQuery("SELECT " + POSITIONS_FIELDS + " FROM positions "
            + "WHERE \"currentPersonUuid\" IS NULL AND positions.type = :type")
        .bind("type", DaoUtils.getEnumId(type)).map(new PositionMapper()).list();
  }

  @Override
  public AnetBeanList<Position> search(PositionSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getPositionSearcher().runSearch(query);
  }

  public CompletableFuture<List<PersonPositionHistory>> getPositionHistory(
      Map<String, Object> context, String positionUuid) {
    return new ForeignKeyFetcher<PersonPositionHistory>()
        .load(context, FkDataLoaderKey.POSITION_PERSON_POSITION_HISTORY, positionUuid)
        .thenApply(l -> PersonPositionHistory.getDerivedHistory(l));
  }

  public CompletableFuture<Position> getCurrentPositionForPerson(Map<String, Object> context,
      String personUuid) {
    return new ForeignKeyFetcher<Position>()
        .load(context, FkDataLoaderKey.POSITION_CURRENT_POSITION_FOR_PERSON, personUuid)
        .thenApply(l -> l.isEmpty() ? null : l.get(0));
  }

  public Position getCurrentPositionForPerson(String personUuid) {
    List<Position> positions = getDbHandle()
        .createQuery("/* getCurrentPositionForPerson */ SELECT " + POSITIONS_FIELDS
            + " FROM positions WHERE \"currentPersonUuid\" = :personUuid")
        .bind("personUuid", personUuid).map(new PositionMapper()).list();
    if (positions.size() == 0) {
      return null;
    }
    return positions.get(0);
  }

  public Boolean getIsApprover(String positionUuid) {
    Number count = (Number) getDbHandle().createQuery(
        "/* getIsApprover */ SELECT count(*) as ct from approvers where \"positionUuid\" = :positionUuid")
        .bind("positionUuid", positionUuid).map(new MapMapper(false)).findOnly().get("ct");

    return count.longValue() > 0;
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

    return getDbHandle().createUpdate("DELETE FROM positions WHERE uuid = :positionUuid")
        .bind("positionUuid", positionUuid).execute();
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
}
