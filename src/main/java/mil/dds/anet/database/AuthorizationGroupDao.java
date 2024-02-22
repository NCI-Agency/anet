package mil.dds.anet.database;

import static org.jdbi.v3.sqlobject.customizer.BindList.EmptyHandling.NULL_STRING;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.WithStatus.Status;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.database.mappers.GenericRelatedObjectMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.customizer.BindList;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class AuthorizationGroupDao
    extends AnetBaseDao<AuthorizationGroup, AuthorizationGroupSearchQuery> {

  private static final String[] fields =
      {"uuid", "name", "description", "status", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "authorizationGroups";
  public static final String AUTHORIZATION_GROUP_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  @Override
  public AuthorizationGroup getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<AuthorizationGroup> {
    private static final String sql = "/* batch.getAuthorizationGroupsByUuids */ SELECT "
        + AUTHORIZATION_GROUP_FIELDS + " FROM \"authorizationGroups\" WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new AuthorizationGroupMapper());
    }
  }

  @Override
  public List<AuthorizationGroup> getByIds(List<String> uuids) {
    final IdBatcher<AuthorizationGroup> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  static class PositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String sql =
        "/* batch.getPositionsForAuthorizationGroup */ SELECT \"authorizationGroupUuid\", "
            + PositionDao.POSITION_FIELDS + " FROM positions, \"authorizationGroupRelatedObjects\" "
            + "WHERE \"authorizationGroupRelatedObjects\".\"authorizationGroupUuid\" IN ( <foreignKeys> ) "
            + "AND \"authorizationGroupRelatedObjects\".\"relatedObjectType\" = '"
            + PositionDao.TABLE_NAME + "'"
            + "AND \"authorizationGroupRelatedObjects\".\"relatedObjectUuid\" = positions.uuid";

    public PositionsBatcher() {
      super(sql, "foreignKeys", new PositionMapper(), "authorizationGroupUuid");
    }
  }

  public List<List<Position>> getPositions(List<String> foreignKeys) {
    final ForeignKeyBatcher<Position> positionsBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(PositionsBatcher.class);
    return positionsBatcher.getByForeignKeys(foreignKeys);
  }

  @Override
  public AuthorizationGroup insertInternal(AuthorizationGroup a) {
    getDbHandle().createUpdate(
        "/* authorizationGroupInsert */ INSERT INTO \"authorizationGroups\" (uuid, name, description, \"createdAt\", \"updatedAt\", status) "
            + "VALUES (:uuid, :name, :description, :createdAt, :updatedAt, :status)")
        .bindBean(a).bind("createdAt", DaoUtils.asLocalDateTime(a.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(a.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(a.getStatus())).execute();

    if (a.getAuthorizationGroupRelatedObjects() != null) {
      final AuthorizationGroupBatch ab = getDbHandle().attach(AuthorizationGroupBatch.class);
      ab.insertAuthorizationGroupRelatedObjects(a.getUuid(),
          a.getAuthorizationGroupRelatedObjects());
    }
    return a;
  }

  public interface AuthorizationGroupBatch {
    @SqlBatch("INSERT INTO \"authorizationGroupRelatedObjects\""
        + " (\"authorizationGroupUuid\", \"relatedObjectType\", \"relatedObjectUuid\")"
        + " VALUES (:authorizationGroupUuid, :relatedObjectType, :relatedObjectUuid)")
    void insertAuthorizationGroupRelatedObjects(
        @Bind("authorizationGroupUuid") String authorizationGroupUuid,
        @BindBean List<GenericRelatedObject> authorizationGroupRelatedObjects);

    @SqlUpdate("DELETE FROM \"authorizationGroupRelatedObjects\""
        + " WHERE \"authorizationGroupUuid\" = :authorizationGroupUuid")
    void deleteAuthorizationGroupRelatedObjects(
        @Bind("authorizationGroupUuid") String authorizationGroupUuid);

    @SqlBatch("INSERT INTO \"authorizationGroupAdministrativePositions\""
        + " (\"authorizationGroupUuid\", \"positionUuid\")"
        + " VALUES (:authorizationGroupUuid, :uuid)")
    void insertAdministrativePositions(
        @Bind("authorizationGroupUuid") String authorizationGroupUuid,
        @BindBean List<Position> positions);

    @SqlUpdate("DELETE FROM \"authorizationGroupAdministrativePositions\""
        + " WHERE \"authorizationGroupUuid\" = :authorizationGroupUuid"
        + " AND \"positionUuid\" IN ( <positionUuids> )")
    void deleteAdministrativePositions(
        @Bind("authorizationGroupUuid") String authorizationGroupUuid,
        @BindList(value = "positionUuids", onEmpty = NULL_STRING) List<String> positionUuids);
  }

  @Override
  public int updateInternal(AuthorizationGroup a) {
    final AuthorizationGroupBatch ab = getDbHandle().attach(AuthorizationGroupBatch.class);
    ab.deleteAuthorizationGroupRelatedObjects(DaoUtils.getUuid(a)); // seems the easiest thing to do
    if (a.getAuthorizationGroupRelatedObjects() != null) {
      ab.insertAuthorizationGroupRelatedObjects(DaoUtils.getUuid(a),
          a.getAuthorizationGroupRelatedObjects());
    }
    return getDbHandle()
        .createUpdate("/* updateAuthorizationGroup */ UPDATE \"authorizationGroups\" "
            + "SET name = :name, description = :description, \"updatedAt\" = :updatedAt, status = :status  WHERE uuid = :uuid")
        .bindBean(a).bind("updatedAt", DaoUtils.asLocalDateTime(a.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(a.getStatus())).execute();
  }

  @InTransaction
  public void addAdministrativePositions(String authorizationGroupUuid, List<Position> positions) {
    final AuthorizationGroupBatch ab = getDbHandle().attach(AuthorizationGroupBatch.class);
    if (positions != null) {
      ab.insertAdministrativePositions(authorizationGroupUuid, positions);
    }
  }

  @InTransaction
  public void removeAdministrativePositions(String authorizationGroupUuid,
      List<String> positionUuids) {
    final AuthorizationGroupBatch ab = getDbHandle().attach(AuthorizationGroupBatch.class);
    if (positionUuids != null) {
      ab.deleteAdministrativePositions(authorizationGroupUuid, positionUuids);
    }
  }

  static class AuthorizationGroupRelatedObjectsBatcher
      extends ForeignKeyBatcher<GenericRelatedObject> {
    private static final String SQL =
        "/* batch.getAuthorizationGroupRelatedObjects */ SELECT * FROM \"authorizationGroupRelatedObjects\" "
            + "WHERE \"authorizationGroupUuid\" IN ( <foreignKeys> ) ORDER BY \"relatedObjectType\", \"relatedObjectUuid\" ASC";

    public AuthorizationGroupRelatedObjectsBatcher() {
      super(SQL, "foreignKeys", new GenericRelatedObjectMapper("authorizationGroupUuid"),
          "authorizationGroupUuid");
    }
  }

  public List<List<GenericRelatedObject>> getAuthorizationGroupRelatedObjects(
      List<String> foreignKeys) {
    final ForeignKeyBatcher<GenericRelatedObject> authorizationGroupRelatedObjectsBatcher =
        AnetObjectEngine.getInstance().getInjector()
            .getInstance(AuthorizationGroupRelatedObjectsBatcher.class);
    return authorizationGroupRelatedObjectsBatcher.getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<GenericRelatedObject>> getRelatedObjects(
      Map<String, Object> context, AuthorizationGroup authorizationGroup) {
    return new ForeignKeyFetcher<GenericRelatedObject>().load(context,
        FkDataLoaderKey.AUTHORIZATION_GROUP_AUTHORIZATION_GROUP_RELATED_OBJECTS,
        authorizationGroup.getUuid());
  }

  static class AuthorizationGroupAdministrativePositionsBatcher
      extends ForeignKeyBatcher<Position> {
    private static final String SQL = "/* batch.getAuthorizationGroupAdministrativePositions */"
        + " SELECT \"authorizationGroupAdministrativePositions\".\"authorizationGroupUuid\","
        + PositionDao.POSITION_FIELDS + " FROM \"authorizationGroupAdministrativePositions\""
        + " INNER JOIN positions on positions.uuid = \"authorizationGroupAdministrativePositions\".\"positionUuid\""
        + " WHERE \"authorizationGroupAdministrativePositions\".\"authorizationGroupUuid\" IN ( <foreignKeys> )";

    public AuthorizationGroupAdministrativePositionsBatcher() {
      super(SQL, "foreignKeys", new PositionMapper(), "authorizationGroupUuid");
    }
  }

  public List<List<Position>> getAdministrativePositions(List<String> foreignKeys) {
    final ForeignKeyBatcher<Position> authorizationGroupAdministrativePositionsBatcher =
        AnetObjectEngine.getInstance().getInjector()
            .getInstance(AuthorizationGroupAdministrativePositionsBatcher.class);
    return authorizationGroupAdministrativePositionsBatcher.getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Position>> getAdministrativePositionsForAuthorizationGroup(
      Map<String, Object> context, String authorizationGroupUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.AUTHORIZATION_GROUP_ADMINISTRATIVE_POSITIONS, authorizationGroupUuid);
  }

  @Override
  public AnetBeanList<AuthorizationGroup> search(AuthorizationGroupSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getAuthorizationGroupSearcher()
        .runSearch(query);
  }

  @InTransaction
  public Set<String> getAuthorizationGroupUuidsForPerson(String personUuid) {
    final String mainSelectClause = "SELECT ag.uuid FROM \"authorizationGroups\" ag"
        + " INNER JOIN \"authorizationGroupRelatedObjects\" agro"
        + " ON ag.uuid = agro.\"authorizationGroupUuid\"";
    final String mainWhereClause = " WHERE ag.status = :status"; // only active groups
    final String positionClause = " AND positions.\"currentPersonUuid\" = :personUuid";

    // Now build the query using UNION ALL, so it can be optimized
    final StringBuilder sql = new StringBuilder("/* batch.getAuthorizationGroupsByPerson */");
    sql.append(" WITH RECURSIVE parent_orgs(uuid, parent_uuid) AS"
        + " (SELECT uuid, uuid as parent_uuid FROM organizations"
        + " UNION ALL SELECT pt.uuid, bt.\"parentOrgUuid\" FROM organizations bt"
        + " INNER JOIN parent_orgs pt ON bt.uuid = pt.parent_uuid) ");

    // Check for person
    sql.append(mainSelectClause);
    sql.append(mainWhereClause + " AND \"relatedObjectType\" = '" + PersonDao.TABLE_NAME
        + "' AND \"relatedObjectUuid\" = :personUuid");

    // Check for position
    sql.append(" UNION ALL ");
    sql.append(mainSelectClause + ", positions");
    sql.append(mainWhereClause + positionClause + " AND agro.\"relatedObjectType\" = '"
        + PositionDao.TABLE_NAME + "' AND agro.\"relatedObjectUuid\" = positions.uuid");

    // Recursively check for user's organization (and transitive parents thereof)
    sql.append(" UNION ALL ");
    sql.append(mainSelectClause + ", positions, parent_orgs");
    sql.append(mainWhereClause + positionClause + " AND agro.\"relatedObjectType\" = '"
        + OrganizationDao.TABLE_NAME + "' AND agro.\"relatedObjectUuid\" = parent_orgs.parent_uuid"
        + " AND positions.\"organizationUuid\" = parent_orgs.uuid");

    return getDbHandle().createQuery(sql).bind("status", DaoUtils.getEnumId(Status.ACTIVE))
        .bind("personUuid", personUuid).mapTo(String.class).set();
  }

  @InTransaction
  public List<AuthorizationGroup> getAuthorizationGroupsAdministratedByPosition(
      String positionUuid) {
    final String sql = "/* getAuthorizationGroupsAdministratedByPosition */ SELECT "
        + AUTHORIZATION_GROUP_FIELDS + " FROM \"authorizationGroups\""
        + " JOIN \"authorizationGroupAdministrativePositions\" agap"
        + " ON agap.\"authorizationGroupUuid\" = \"authorizationGroups\".uuid"
        + " WHERE agap.\"positionUuid\" = :positionUuid";
    return getDbHandle().createQuery(sql).bind("positionUuid", positionUuid)
        .map(new AuthorizationGroupMapper()).list();
  }

}
