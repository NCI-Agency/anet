package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;

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
import mil.dds.anet.views.ForeignKeyFetcher;

@RegisterRowMapper(AuthorizationGroupMapper.class)
public class AuthorizationGroupDao implements IAnetDao<AuthorizationGroup> {

	private final Handle dbHandle;
	private final IdBatcher<AuthorizationGroup> idBatcher;
	private final ForeignKeyBatcher<Position> positionsBatcher;

	public AuthorizationGroupDao(Handle h) {
		this.dbHandle = h;
		final String idBatcherSql = "/* batch.getAuthorizationGroupsByUuids */ SELECT * from \"authorizationGroups\" where uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<AuthorizationGroup>(h, idBatcherSql, "uuids", new AuthorizationGroupMapper());

		final String positionsBatcherSql = "/* batch.getPositionsForAuthorizationGroup */ SELECT \"authorizationGroupUuid\", " + PositionDao.POSITIONS_FIELDS
				+ " FROM positions, \"authorizationGroupPositions\" "
				+ "WHERE \"authorizationGroupPositions\".\"authorizationGroupUuid\" IN ( <foreignKeys> ) "
				+ "AND \"authorizationGroupPositions\".\"positionUuid\" = positions.uuid";
		this.positionsBatcher = new ForeignKeyBatcher<Position>(h, positionsBatcherSql, "foreignKeys", new PositionMapper(), "authorizationGroupUuid");
	}

	public AnetBeanList<AuthorizationGroup> getAll(int pageNum, int pageSize) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* getAllAuthorizationGroups */ SELECT \"authorizationGroups\".*, COUNT(*) OVER() AS totalCount "
					+ "FROM \"authorizationGroups\" ORDER BY name ASC "
					+ "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else {
			sql = "/* getAllAuthorizationGroups */ SELECT * from \"authorizationGroups\" "
					+ "ORDER BY name ASC LIMIT :limit OFFSET :offset";
		}

		final Query sqlQuery = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum);
		return new AnetBeanList<AuthorizationGroup>(sqlQuery, pageNum, pageSize, new AuthorizationGroupMapper(), null);
	}

	public AuthorizationGroup getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	@Override
	public List<AuthorizationGroup> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	public List<List<Position>> getPositions(List<String> foreignKeys) {
		return positionsBatcher.getByForeignKeys(foreignKeys);
	}

	@Override
	public AuthorizationGroup insert(AuthorizationGroup a) {
		return dbHandle.inTransaction(h -> {
				DaoUtils.setInsertFields(a);
				dbHandle.createUpdate(
						"/* authorizationGroupInsert */ INSERT INTO \"authorizationGroups\" (uuid, name, description, \"createdAt\", \"updatedAt\", status) "
							+ "VALUES (:uuid, :name, :description, :createdAt, :updatedAt, :status)")
					.bindBean(a)
					.bind("status", DaoUtils.getEnumId(a.getStatus()))
					.execute();
		
				final AuthorizationGroupBatch ab = dbHandle.attach(AuthorizationGroupBatch.class);
				if (a.getPositions() != null) {
					ab.insertAuthorizationGroupPositions(a.getUuid(), a.getPositions());
				}
				return a;
		});
	}

	public interface AuthorizationGroupBatch {
		@SqlBatch("INSERT INTO \"authorizationGroupPositions\" (\"authorizationGroupUuid\", \"positionUuid\") VALUES (:authorizationGroupUuid, :uuid)")
		void insertAuthorizationGroupPositions(@Bind("authorizationGroupUuid") String authorizationGroupUuid,
				@BindBean List<Position> positions);
	}

	public int update(AuthorizationGroup a) {
		return dbHandle.inTransaction(h -> {
				DaoUtils.setUpdateFields(a);
				return dbHandle.createUpdate("/* updateAuthorizationGroup */ UPDATE \"authorizationGroups\" "
							+ "SET name = :name, description = :description, \"updatedAt\" = :updatedAt, status = :status  WHERE uuid = :uuid")
						.bindBean(a)
						.bind("status", DaoUtils.getEnumId(a.getStatus()))
						.execute();
		});
	}

	public int addPositionToAuthorizationGroup(Position p, AuthorizationGroup a) {
		return dbHandle.createUpdate("/* addPositionToAuthorizationGroup */ INSERT INTO \"authorizationGroupPositions\" (\"authorizationGroupUuid\", \"positionUuid\") "
				+ "VALUES (:authorizationGroupUuid, :positionUuid)")
			.bind("authorizationGroupUuid", a.getUuid())
			.bind("positionUuid", p.getUuid())
			.execute();
	}

	public int removePositionFromAuthorizationGroup(Position p, AuthorizationGroup a) {
		return dbHandle.createUpdate("/* removePositionFromAuthorizationGroup*/ DELETE FROM \"authorizationGroupPositions\" "
				+ "WHERE \"authorizationGroupUuid\" = :authorizationGroupUuid AND \"positionUuid\" = :positionUuid")
				.bind("authorizationGroupUuid", a.getUuid())
				.bind("positionUuid", p.getUuid())
				.execute();
	}

	public CompletableFuture<List<Position>> getPositionsForAuthorizationGroup(Map<String, Object> context, String authorizationGroupUuid) {
		return new ForeignKeyFetcher<Position>()
				.load(context, "authorizationGroup.positions", authorizationGroupUuid);
	}

	public AnetBeanList<AuthorizationGroup> search(AuthorizationGroupSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getAuthorizationGroupSearcher().runSearch(query, dbHandle);
	}

	public List<AuthorizationGroup> getRecentAuthorizationGroups(Person author, int maxResults) {
		final String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* getRecentAuthorizationGroups */ SELECT \"authorizationGroups\".* FROM \"authorizationGroups\" WHERE \"authorizationGroups\".uuid IN ("
					+ "SELECT TOP(:maxResults) \"reportAuthorizationGroups\".\"authorizationGroupUuid\" "
					+ "FROM reports "
					+ "JOIN \"reportAuthorizationGroups\" ON reports.uuid = \"reportAuthorizationGroups\".\"reportUuid\" "
					+ "JOIN \"authorizationGroups\" ON \"authorizationGroups\".uuid = \"reportAuthorizationGroups\".\"authorizationGroupUuid\" "
					+ "WHERE reports.\"authorUuid\" = :authorUuid "
					+ "AND \"authorizationGroups\".status = :activeStatus "
					+ "GROUP BY \"reportAuthorizationGroups\".\"authorizationGroupUuid\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC"
				+ ")";
		} else {
			sql =  "/* getRecentAuthorizationGroups */ SELECT \"authorizationGroups\".* FROM \"authorizationGroups\" WHERE \"authorizationGroups\".uuid IN ("
					+ "SELECT \"reportAuthorizationGroups\".\"authorizationGroupUuid\" "
					+ "FROM reports "
					+ "JOIN \"reportAuthorizationGroups\" ON reports.uuid = \"reportAuthorizationGroups\".\"reportUuid\" "
					+ "JOIN \"authorizationGroups\" ON \"authorizationGroups\".uuid = \"reportAuthorizationGroups\".\"authorizationGroupUuid\" "
					+ "WHERE reports.\"authorUuid\" = :authorUuid "
					+ "AND \"authorizationGroups\".status = :activeStatus "
					+ "GROUP BY \"reportAuthorizationGroups\".\"authorizationGroupUuid\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC "
					+ "LIMIT :maxResults"
				+ ")";
		}
		return dbHandle.createQuery(sql)
				.bind("authorUuid", author.getUuid())
				.bind("maxResults", maxResults)
				.bind("activeStatus", DaoUtils.getEnumId(AuthorizationGroupStatus.ACTIVE))
				.map(new AuthorizationGroupMapper())
				.list();
	}

	public List<Report> getReportsForAuthorizationGroup(AuthorizationGroup a) {
		return dbHandle.createQuery("/* getReportsForAuthorizationGroup */ SELECT " + ReportDao.REPORT_FIELDS
				+ "FROM reports, \"reportAuthorizationGroups\" "
				+ "WHERE \"reportAuthorizationGroups\".\"authorizationGroupUuid\" = :authorizationGroupUuid "
				+ "AND \"reportAuthorizationGroups\".\"reportUuid\" = reports.uuid")
				.bind("authorizationGroupUuid", a.getUuid())
				.map(new ReportMapper())
				.list();
	}

}
