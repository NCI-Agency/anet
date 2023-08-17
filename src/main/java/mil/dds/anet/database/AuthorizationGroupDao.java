package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Position;
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

    @SqlUpdate("DELETE FROM \"authorizationGroupRelatedObjects\" WHERE \"authorizationGroupUuid\" = :authorizationGroupUuid")
    void deleteAuthorizationGroupRelatedObjects(
        @Bind("authorizationGroupUuid") String authorizationGroupUuid);
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
  public int addPositionToAuthorizationGroup(Position p, AuthorizationGroup a) {
    return getDbHandle().createUpdate(
        "/* addPositionToAuthorizationGroup */ INSERT INTO \"authorizationGroupRelatedObjects\""
            + " (\"authorizationGroupUuid\", \"relatedObjectType\", \"relatedObjectUuid\") "
            + "VALUES (:authorizationGroupUuid, :relatedObjectTypePosition, :relatedObjectUuid)")
        .bind("authorizationGroupUuid", a.getUuid())
        .bind("relatedObjectTypePosition", PositionDao.TABLE_NAME)
        .bind("relatedObjectUuid", p.getUuid()).execute();
  }

  @InTransaction
  public int removePositionFromAuthorizationGroup(String positionUuid, AuthorizationGroup a) {
    return getDbHandle().createUpdate(
        "/* removePositionFromAuthorizationGroup*/ DELETE FROM \"authorizationGroupRelatedObjects\""
            + " WHERE \"authorizationGroupUuid\" = :authorizationGroupUuid"
            + " AND \"relatedObjectType\" = :relatedObjectTypePosition"
            + " AND \"relatedObjectUuid\" = :relatedObjectUuid")
        .bind("authorizationGroupUuid", a.getUuid())
        .bind("relatedObjectTypePosition", PositionDao.TABLE_NAME)
        .bind("relatedObjectUuid", positionUuid).execute();
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
    final ForeignKeyBatcher<GenericRelatedObject> attachmentRelatedObjectsBatcher = AnetObjectEngine
        .getInstance().getInjector().getInstance(AuthorizationGroupRelatedObjectsBatcher.class);
    return attachmentRelatedObjectsBatcher.getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<GenericRelatedObject>> getRelatedObjects(
      Map<String, Object> context, AuthorizationGroup authorizationGroup) {
    return new ForeignKeyFetcher<GenericRelatedObject>().load(context,
        FkDataLoaderKey.AUTHORIZATION_GROUP_AUTHORIZATION_GROUP_RELATED_OBJECTS,
        authorizationGroup.getUuid());
  }

  @Override
  public AnetBeanList<AuthorizationGroup> search(AuthorizationGroupSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getAuthorizationGroupSearcher()
        .runSearch(query);
  }

  static class AuthorizationGroupsBatcher extends ForeignKeyBatcher<AuthorizationGroup> {
    private static final String sql = "/* batch.getAuthorizationGroupsByPosition */ SELECT "
        + AUTHORIZATION_GROUP_FIELDS
        + ", \"authorizationGroupRelatedObjects\".\"relatedObjectUuid\" FROM \"authorizationGroupRelatedObjects\""
        + " INNER JOIN \"authorizationGroups\" ON \"authorizationGroups\".uuid"
        + " = \"authorizationGroupRelatedObjects\".\"authorizationGroupUuid\""
        + " WHERE \"authorizationGroupRelatedObjects\".\"relatedObjectType\" = '"
        + PositionDao.TABLE_NAME + "'"
        + " AND \"authorizationGroupRelatedObjects\".\"relatedObjectUuid\" IN ( <foreignKeys> )"
        + " ORDER BY \"authorizationGroupRelatedObjects\".\"relatedObjectUuid\","
        + " \"authorizationGroups\".name, \"authorizationGroups\".uuid";

    public AuthorizationGroupsBatcher() {
      super(sql, "foreignKeys", new AuthorizationGroupMapper(), "relatedObjectUuid");
    }
  }

  public List<List<AuthorizationGroup>> getAuthorizationGroups(List<String> foreignKeys) {
    final ForeignKeyBatcher<AuthorizationGroup> authorizationGroupsBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(AuthorizationGroupsBatcher.class);
    return authorizationGroupsBatcher.getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<AuthorizationGroup>> getAuthorizationGroupsForPosition(
      Map<String, Object> context, String positionUuid) {
    return new ForeignKeyFetcher<AuthorizationGroup>().load(context,
        FkDataLoaderKey.POSITION_AUTHORIZATION_GROUPS, positionUuid);
  }

}
