package mil.dds.anet.database;

import static org.jdbi.v3.sqlobject.customizer.BindList.EmptyHandling.NULL_STRING;

import graphql.GraphQLContext;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.WithStatus.Status;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.database.mappers.GenericRelatedObjectMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.search.pg.PostgresqlAuthorizationGroupSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.customizer.BindList;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AuthorizationGroupDao
    extends AnetSubscribableObjectDao<AuthorizationGroup, AuthorizationGroupSearchQuery> {

  private static final String[] fields = {"uuid", "name", "description", "status",
      "distributionList", "forSensitiveInformation", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "authorizationGroups";
  public static final String AUTHORIZATION_GROUP_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public AuthorizationGroupDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public AuthorizationGroup getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<AuthorizationGroup> {
    private static final String SQL = "/* batch.getAuthorizationGroupsByUuids */ SELECT "
        + AUTHORIZATION_GROUP_FIELDS + " FROM \"authorizationGroups\" WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(AuthorizationGroupDao.this.databaseHandler, SQL, "uuids",
          new AuthorizationGroupMapper());
    }
  }

  @Override
  public List<AuthorizationGroup> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  class PositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String SQL =
        "/* batch.getPositionsForAuthorizationGroup */ SELECT \"authorizationGroupUuid\", "
            + PositionDao.POSITION_FIELDS + " FROM positions, \"authorizationGroupRelatedObjects\" "
            + "WHERE \"authorizationGroupRelatedObjects\".\"authorizationGroupUuid\" IN ( <foreignKeys> ) "
            + "AND \"authorizationGroupRelatedObjects\".\"relatedObjectType\" = '"
            + PositionDao.TABLE_NAME + "'"
            + "AND \"authorizationGroupRelatedObjects\".\"relatedObjectUuid\" = positions.uuid";

    public PositionsBatcher() {
      super(AuthorizationGroupDao.this.databaseHandler, SQL, "foreignKeys", new PositionMapper(),
          "authorizationGroupUuid");
    }
  }

  public List<List<Position>> getPositions(List<String> foreignKeys) {
    return new PositionsBatcher().getByForeignKeys(foreignKeys);
  }

  @Override
  public AuthorizationGroup insertInternal(AuthorizationGroup a) {
    final Handle handle = getDbHandle();
    try {
      handle
          .createUpdate("/* authorizationGroupInsert */ INSERT INTO \"authorizationGroups\" "
              + "(uuid, name, description, \"createdAt\", \"updatedAt\", status, "
              + "\"distributionList\", \"forSensitiveInformation\") "
              + "VALUES (:uuid, :name, :description, :createdAt, :updatedAt, :status, "
              + ":distributionList, :forSensitiveInformation)")
          .bindBean(a).bind("createdAt", DaoUtils.asLocalDateTime(a.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(a.getUpdatedAt()))
          .bind("status", DaoUtils.getEnumId(a.getStatus())).execute();

      if (a.getAuthorizationGroupRelatedObjects() != null) {
        final AuthorizationGroupBatch ab = handle.attach(AuthorizationGroupBatch.class);
        ab.insertAuthorizationGroupRelatedObjects(a.getUuid(),
            a.getAuthorizationGroupRelatedObjects());
      }
      return a;
    } finally {
      closeDbHandle(handle);
    }
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
    final Handle handle = getDbHandle();
    try {
      final AuthorizationGroupBatch ab = handle.attach(AuthorizationGroupBatch.class);
      ab.deleteAuthorizationGroupRelatedObjects(DaoUtils.getUuid(a)); // seems the easiest thing to
                                                                      // do
      if (a.getAuthorizationGroupRelatedObjects() != null) {
        ab.insertAuthorizationGroupRelatedObjects(DaoUtils.getUuid(a),
            a.getAuthorizationGroupRelatedObjects());
      }
      return handle.createUpdate("/* updateAuthorizationGroup */ UPDATE \"authorizationGroups\" "
          + "SET name = :name, description = :description, \"updatedAt\" = :updatedAt, status = :status, "
          + "\"distributionList\" = :distributionList, \"forSensitiveInformation\" = :forSensitiveInformation "
          + "WHERE uuid = :uuid").bindBean(a)
          .bind("updatedAt", DaoUtils.asLocalDateTime(a.getUpdatedAt()))
          .bind("status", DaoUtils.getEnumId(a.getStatus())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void addAdministrativePositions(String authorizationGroupUuid, List<Position> positions) {
    final Handle handle = getDbHandle();
    try {
      final AuthorizationGroupBatch ab = handle.attach(AuthorizationGroupBatch.class);
      if (positions != null) {
        ab.insertAdministrativePositions(authorizationGroupUuid, positions);
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void removeAdministrativePositions(String authorizationGroupUuid,
      List<String> positionUuids) {
    final Handle handle = getDbHandle();
    try {
      final AuthorizationGroupBatch ab = handle.attach(AuthorizationGroupBatch.class);
      if (positionUuids != null) {
        ab.deleteAdministrativePositions(authorizationGroupUuid, positionUuids);
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  class AuthorizationGroupRelatedObjectsBatcher extends ForeignKeyBatcher<GenericRelatedObject> {
    private static final String SQL =
        "/* batch.getAuthorizationGroupRelatedObjects */ SELECT * FROM \"authorizationGroupRelatedObjects\" "
            + "WHERE \"authorizationGroupUuid\" IN ( <foreignKeys> ) ORDER BY \"relatedObjectType\", \"relatedObjectUuid\" ASC";

    public AuthorizationGroupRelatedObjectsBatcher() {
      super(AuthorizationGroupDao.this.databaseHandler, SQL, "foreignKeys",
          new GenericRelatedObjectMapper("authorizationGroupUuid"), "authorizationGroupUuid");
    }
  }

  public List<List<GenericRelatedObject>> getAuthorizationGroupRelatedObjects(
      List<String> foreignKeys) {
    return new AuthorizationGroupRelatedObjectsBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<GenericRelatedObject>> getRelatedObjects(GraphQLContext context,
      AuthorizationGroup authorizationGroup) {
    return new ForeignKeyFetcher<GenericRelatedObject>().load(context,
        FkDataLoaderKey.AUTHORIZATION_GROUP_AUTHORIZATION_GROUP_RELATED_OBJECTS,
        authorizationGroup.getUuid());
  }

  class AuthorizationGroupAdministrativePositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String SQL = "/* batch.getAuthorizationGroupAdministrativePositions */"
        + " SELECT \"authorizationGroupAdministrativePositions\".\"authorizationGroupUuid\","
        + PositionDao.POSITION_FIELDS + " FROM \"authorizationGroupAdministrativePositions\""
        + " INNER JOIN positions on positions.uuid = \"authorizationGroupAdministrativePositions\".\"positionUuid\""
        + " WHERE \"authorizationGroupAdministrativePositions\".\"authorizationGroupUuid\" IN ( <foreignKeys> )";

    public AuthorizationGroupAdministrativePositionsBatcher() {
      super(AuthorizationGroupDao.this.databaseHandler, SQL, "foreignKeys", new PositionMapper(),
          "authorizationGroupUuid");
    }
  }

  public List<List<Position>> getAdministrativePositions(List<String> foreignKeys) {
    return new AuthorizationGroupAdministrativePositionsBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Position>> getAdministrativePositionsForAuthorizationGroup(
      GraphQLContext context, String authorizationGroupUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.AUTHORIZATION_GROUP_ADMINISTRATIVE_POSITIONS, authorizationGroupUuid);
  }

  @Override
  public AnetBeanList<AuthorizationGroup> search(AuthorizationGroupSearchQuery query) {
    return new PostgresqlAuthorizationGroupSearcher(databaseHandler).runSearch(query);
  }

  @Transactional
  public Set<String> getAuthorizationGroupUuidsForRelatedObject(String relatedObjectType,
      String relatedObjectUuid) {
    final Handle handle = getDbHandle();
    try {
      final String relatedTableAlias = "agro";
      final String mainSelectClause = "SELECT ag.uuid FROM \"authorizationGroups\" ag"
          + " INNER JOIN \"authorizationGroupRelatedObjects\" " + relatedTableAlias
          + " ON ag.uuid = " + relatedTableAlias + ".\"authorizationGroupUuid\"";
      final String statusParam = "status";
      final String mainWhereClause = " WHERE ag.status = :" + statusParam; // only active groups
      final String relatedObjectParam = "relatedObjectUuid";
      final String sql = DaoUtils.getAuthorizationGroupUuidsForRelatedObject(
          "/* getAuthorizationGroupUuidsForRelatedObject */", relatedObjectParam, relatedObjectType,
          relatedTableAlias, mainSelectClause, mainWhereClause);

      return handle.createQuery(sql).bind(statusParam, DaoUtils.getEnumId(Status.ACTIVE))
          .bind(relatedObjectParam, relatedObjectUuid).mapTo(String.class).set();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public List<AuthorizationGroup> getAuthorizationGroupsAdministratedByPosition(
      String positionUuid) {
    final Handle handle = getDbHandle();
    try {
      final String sql = "/* getAuthorizationGroupsAdministratedByPosition */ SELECT "
          + AUTHORIZATION_GROUP_FIELDS + " FROM \"authorizationGroups\""
          + " JOIN \"authorizationGroupAdministrativePositions\" agap"
          + " ON agap.\"authorizationGroupUuid\" = \"authorizationGroups\".uuid"
          + " WHERE agap.\"positionUuid\" = :positionUuid";
      return handle.createQuery(sql).bind("positionUuid", positionUuid)
          .map(new AuthorizationGroupMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(AuthorizationGroup obj, boolean isDelete) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "authorizationGroups.uuid", isDelete);
  }

}
