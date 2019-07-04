package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.AuthorizationGroup.AuthorizationGroupStatus;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
public class AuthorizationGroupDao
    extends AnetBaseDao<AuthorizationGroup, AuthorizationGroupSearchQuery> {

  public static final String TABLE_NAME = "authorizationGroups";

  public AuthorizationGroup getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<AuthorizationGroup> {
    private static final String sql =
        "/* batch.getAuthorizationGroupsByUuids */ SELECT * from \"authorizationGroups\" where uuid IN ( <uuids> )";

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
            + PositionDao.POSITIONS_FIELDS + " FROM positions, \"authorizationGroupPositions\" "
            + "WHERE \"authorizationGroupPositions\".\"authorizationGroupUuid\" IN ( <foreignKeys> ) "
            + "AND \"authorizationGroupPositions\".\"positionUuid\" = positions.uuid";

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

    final AuthorizationGroupBatch ab = getDbHandle().attach(AuthorizationGroupBatch.class);
    if (a.getPositions() != null) {
      ab.insertAuthorizationGroupPositions(a.getUuid(), a.getPositions());
    }
    return a;
  }

  public interface AuthorizationGroupBatch {
    @SqlBatch("INSERT INTO \"authorizationGroupPositions\" (\"authorizationGroupUuid\", \"positionUuid\") VALUES (:authorizationGroupUuid, :uuid)")
    void insertAuthorizationGroupPositions(
        @Bind("authorizationGroupUuid") String authorizationGroupUuid,
        @BindBean List<Position> positions);
  }

  @Override
  public int updateInternal(AuthorizationGroup a) {
    return getDbHandle()
        .createUpdate("/* updateAuthorizationGroup */ UPDATE \"authorizationGroups\" "
            + "SET name = :name, description = :description, \"updatedAt\" = :updatedAt, status = :status  WHERE uuid = :uuid")
        .bindBean(a).bind("updatedAt", DaoUtils.asLocalDateTime(a.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(a.getStatus())).execute();
  }

  @Override
  public int deleteInternal(String uuid) {
    throw new UnsupportedOperationException();
  }

  public int addPositionToAuthorizationGroup(Position p, AuthorizationGroup a) {
    return getDbHandle().createUpdate(
        "/* addPositionToAuthorizationGroup */ INSERT INTO \"authorizationGroupPositions\" (\"authorizationGroupUuid\", \"positionUuid\") "
            + "VALUES (:authorizationGroupUuid, :positionUuid)")
        .bind("authorizationGroupUuid", a.getUuid()).bind("positionUuid", p.getUuid()).execute();
  }

  public int removePositionFromAuthorizationGroup(Position p, AuthorizationGroup a) {
    return getDbHandle().createUpdate(
        "/* removePositionFromAuthorizationGroup*/ DELETE FROM \"authorizationGroupPositions\" "
            + "WHERE \"authorizationGroupUuid\" = :authorizationGroupUuid AND \"positionUuid\" = :positionUuid")
        .bind("authorizationGroupUuid", a.getUuid()).bind("positionUuid", p.getUuid()).execute();
  }

  public CompletableFuture<List<Position>> getPositionsForAuthorizationGroup(
      Map<String, Object> context, String authorizationGroupUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.AUTHORIZATION_GROUP_POSITIONS, authorizationGroupUuid);
  }

  @Override
  public AnetBeanList<AuthorizationGroup> search(AuthorizationGroupSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getAuthorizationGroupSearcher()
        .runSearch(query);
  }

  public List<AuthorizationGroup> getRecentAuthorizationGroups(Person author, int maxResults) {
    final String sql;
    if (DaoUtils.isMsSql()) {
      sql =
          "/* getRecentAuthorizationGroups */ SELECT \"authorizationGroups\".* FROM \"authorizationGroups\" WHERE \"authorizationGroups\".uuid IN ("
              + "SELECT TOP(:maxResults) \"reportAuthorizationGroups\".\"authorizationGroupUuid\" "
              + "FROM reports "
              + "JOIN \"reportAuthorizationGroups\" ON reports.uuid = \"reportAuthorizationGroups\".\"reportUuid\" "
              + "JOIN \"authorizationGroups\" ON \"authorizationGroups\".uuid = \"reportAuthorizationGroups\".\"authorizationGroupUuid\" "
              + "WHERE reports.\"authorUuid\" = :authorUuid "
              + "AND \"authorizationGroups\".status = :activeStatus "
              + "GROUP BY \"reportAuthorizationGroups\".\"authorizationGroupUuid\" "
              + "ORDER BY MAX(reports.\"createdAt\") DESC" + ")";
    } else {
      sql =
          "/* getRecentAuthorizationGroups */ SELECT \"authorizationGroups\".* FROM \"authorizationGroups\" WHERE \"authorizationGroups\".uuid IN ("
              + "SELECT \"reportAuthorizationGroups\".\"authorizationGroupUuid\" " + "FROM reports "
              + "JOIN \"reportAuthorizationGroups\" ON reports.uuid = \"reportAuthorizationGroups\".\"reportUuid\" "
              + "JOIN \"authorizationGroups\" ON \"authorizationGroups\".uuid = \"reportAuthorizationGroups\".\"authorizationGroupUuid\" "
              + "WHERE reports.\"authorUuid\" = :authorUuid "
              + "AND \"authorizationGroups\".status = :activeStatus "
              + "GROUP BY \"reportAuthorizationGroups\".\"authorizationGroupUuid\" "
              + "ORDER BY MAX(reports.\"createdAt\") DESC " + "LIMIT :maxResults" + ")";
    }
    return getDbHandle().createQuery(sql).bind("authorUuid", author.getUuid())
        .bind("maxResults", maxResults)
        .bind("activeStatus", DaoUtils.getEnumId(AuthorizationGroupStatus.ACTIVE))
        .map(new AuthorizationGroupMapper()).list();
  }

  public List<Report> getReportsForAuthorizationGroup(AuthorizationGroup a) {
    return getDbHandle().createQuery("/* getReportsForAuthorizationGroup */ SELECT "
        + ReportDao.REPORT_FIELDS + "FROM reports, \"reportAuthorizationGroups\" "
        + "WHERE \"reportAuthorizationGroups\".\"authorizationGroupUuid\" = :authorizationGroupUuid "
        + "AND \"reportAuthorizationGroups\".\"reportUuid\" = reports.uuid")
        .bind("authorizationGroupUuid", a.getUuid()).map(new ReportMapper()).list();
  }

}
