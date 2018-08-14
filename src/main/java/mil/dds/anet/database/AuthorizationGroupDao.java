package mil.dds.anet.database;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.TransactionCallback;
import org.skife.jdbi.v2.TransactionStatus;
import org.skife.jdbi.v2.sqlobject.Bind;
import org.skife.jdbi.v2.sqlobject.BindBean;
import org.skife.jdbi.v2.sqlobject.SqlBatch;
import org.skife.jdbi.v2.sqlobject.customizers.RegisterMapper;

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

@RegisterMapper(AuthorizationGroupMapper.class)
public class AuthorizationGroupDao implements IAnetDao<AuthorizationGroup> {

	private final Handle dbHandle;
	private final IdBatcher<AuthorizationGroup> idBatcher;
	private final ForeignKeyBatcher<Position> positionsBatcher;

	public AuthorizationGroupDao(Handle h) {
		this.dbHandle = h;
		final String idBatcherSql = "/* batch.getAuthorizationGroupsByIds */ SELECT * from \"authorizationGroups\" where id IN ( %1$s )";
		this.idBatcher = new IdBatcher<AuthorizationGroup>(h, idBatcherSql, new AuthorizationGroupMapper());

		final String positionsBatcherSql = "/* batch.getPositionsForAuthorizationGroup */ SELECT \"authorizationGroupId\", " + PositionDao.POSITIONS_FIELDS
				+ " FROM positions, \"authorizationGroupPositions\" "
				+ "WHERE \"authorizationGroupPositions\".\"authorizationGroupId\" IN ( %1$s ) "
				+ "AND \"authorizationGroupPositions\".\"positionId\" = positions.id";
		this.positionsBatcher = new ForeignKeyBatcher<Position>(h, positionsBatcherSql, new PositionMapper(), "authorizationGroupId");
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

		final Query<AuthorizationGroup> query = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum)
				.map(new AuthorizationGroupMapper());
		return new AnetBeanList<AuthorizationGroup>(query, pageNum, pageSize, null);
	}

	@Override
	public AuthorizationGroup getById(int id) {
		final Query<AuthorizationGroup> query = dbHandle.createQuery("/* getAuthorizationGroupById */ SELECT * from \"authorizationGroups\" where id = :id")
			.bind("id", id)
			.map(new AuthorizationGroupMapper());
		final List<AuthorizationGroup> results = query.list();
		if (results.size() == 0) { return null; }
		return results.get(0);
	}

	@Override
	public List<AuthorizationGroup> getByIds(List<Integer> ids) {
		return idBatcher.getByIds(ids);
	}

	public List<List<Position>> getPositions(List<Integer> foreignKeys) {
		return positionsBatcher.getByForeignKeys(foreignKeys);
	}

	@Override
	public AuthorizationGroup insert(AuthorizationGroup a) {
		return dbHandle.inTransaction(new TransactionCallback<AuthorizationGroup>() {
			@Override
			public AuthorizationGroup inTransaction(Handle conn, TransactionStatus status) throws Exception {
				a.setCreatedAt(DateTime.now());
				a.setUpdatedAt(DateTime.now());
				final GeneratedKeys<Map<String,Object>> keys = dbHandle.createStatement(
						"/* authorizationGroupInsert */ INSERT INTO \"authorizationGroups\" (name, description, \"createdAt\", \"updatedAt\", status) "
							+ "VALUES (:name, :description, :createdAt, :updatedAt, :status)")
					.bind("name", a.getName())
					.bind("description", a.getDescription())
					.bind("createdAt", a.getCreatedAt())
					.bind("updatedAt", a.getUpdatedAt())
					.bind("status", DaoUtils.getEnumId(a.getStatus()))
					.executeAndReturnGeneratedKeys();
				a.setId(DaoUtils.getGeneratedId(keys));
		
				final AuthorizationGroupBatch ab = dbHandle.attach(AuthorizationGroupBatch.class);
				if (a.getPositions() != null) {
					ab.insertAuthorizationGroupPositions(a.getId(), a.getPositions());
				}
				return a;
			}
		});
	}

	public interface AuthorizationGroupBatch {
		@SqlBatch("INSERT INTO \"authorizationGroupPositions\" (\"authorizationGroupId\", \"positionId\") VALUES (:authorizationGroupId, :id)")
		void insertAuthorizationGroupPositions(@Bind("authorizationGroupId") Integer authorizationGroupId,
				@BindBean List<Position> positions);
	}

	@Override
	public int update(AuthorizationGroup a) {
		return dbHandle.inTransaction(new TransactionCallback<Integer>() {
			@Override
			public Integer inTransaction(Handle conn, TransactionStatus status) throws Exception {
				return dbHandle.createStatement("/* updateAuthorizationGroup */ UPDATE \"authorizationGroups\" "
							+ "SET name = :name, description = :description, \"updatedAt\" = :updatedAt, status = :status  WHERE id = :id")
						.bind("id", a.getId())
						.bind("name", a.getName())
						.bind("description", a.getDescription())
						.bind("updatedAt", DateTime.now())
						.bind("status", DaoUtils.getEnumId(a.getStatus()))
						.execute();
			}
		});
	}

	public int addPositionToAuthorizationGroup(Position p, AuthorizationGroup a) {
		return dbHandle.createStatement("/* addPositionToAuthorizationGroup */ INSERT INTO \"authorizationGroupPositions\" (\"authorizationGroupId\", \"positionId\") "
				+ "VALUES (:authorizationGroupId, :positionId)")
			.bind("authorizationGroupId", a.getId())
			.bind("positionId", p.getId())
			.execute();
	}

	public int removePositionFromAuthorizationGroup(Position p, AuthorizationGroup a) {
		return dbHandle.createStatement("/* removePositionFromAuthorizationGroup*/ DELETE FROM \"authorizationGroupPositions\" "
				+ "WHERE \"authorizationGroupId\" = :authorizationGroupId AND \"positionId\" = :positionId")
				.bind("authorizationGroupId", a.getId())
				.bind("positionId", p.getId())
				.execute();
	}

	public CompletableFuture<List<Position>> getPositionsForAuthorizationGroup(Map<String, Object> context, Integer authorizationGroupId) {
		return new ForeignKeyFetcher<Position>()
				.load(context, "authorizationGroup.positions", authorizationGroupId);
	}

	public AnetBeanList<AuthorizationGroup> search(AuthorizationGroupSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getAuthorizationGroupSearcher().runSearch(query, dbHandle);
	}

	public List<AuthorizationGroup> getRecentAuthorizationGroups(Person author, int maxResults) {
		final String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* getRecentAuthorizationGroups */ SELECT \"authorizationGroups\".* FROM \"authorizationGroups\" WHERE \"authorizationGroups\".id IN ("
					+ "SELECT TOP(:maxResults) \"reportAuthorizationGroups\".\"authorizationGroupId\" "
					+ "FROM reports "
					+ "JOIN \"reportAuthorizationGroups\" ON reports.id = \"reportAuthorizationGroups\".\"reportId\" "
					+ "JOIN \"authorizationGroups\" ON \"authorizationGroups\".id = \"reportAuthorizationGroups\".\"authorizationGroupId\" "
					+ "WHERE reports.\"authorId\" = :authorId "
					+ "AND \"authorizationGroups\".status = :activeStatus "
					+ "GROUP BY \"reportAuthorizationGroups\".\"authorizationGroupId\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC"
				+ ")";
		} else {
			sql =  "/* getRecentAuthorizationGroups */ SELECT \"authorizationGroups\".* FROM \"authorizationGroups\" WHERE \"authorizationGroups\".id IN ("
					+ "SELECT \"reportAuthorizationGroups\".\"authorizationGroupId\" "
					+ "FROM reports "
					+ "JOIN \"reportAuthorizationGroups\" ON reports.id = \"reportAuthorizationGroups\".\"reportId\" "
					+ "JOIN \"authorizationGroups\" ON \"authorizationGroups\".id = \"reportAuthorizationGroups\".\"authorizationGroupId\" "
					+ "WHERE reports.\"authorId\" = :authorId "
					+ "AND \"authorizationGroups\".status = :activeStatus "
					+ "GROUP BY \"reportAuthorizationGroups\".\"authorizationGroupId\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC "
					+ "LIMIT :maxResults"
				+ ")";
		}
		return dbHandle.createQuery(sql)
				.bind("authorId", author.getId())
				.bind("maxResults", maxResults)
				.bind("activeStatus", DaoUtils.getEnumId(AuthorizationGroupStatus.ACTIVE))
				.map(new AuthorizationGroupMapper())
				.list();
	}

	public List<Report> getReportsForAuthorizationGroup(AuthorizationGroup a) {
		return dbHandle.createQuery("/* getReportsForAuthorizationGroup */ SELECT " + ReportDao.REPORT_FIELDS  + ", " + PersonDao.PERSON_FIELDS
				+ " FROM reports, people, \"reportAuthorizationGroups\" "
				+ "WHERE reports.\"authorId\" = people.id "
				+ "AND \"reportAuthorizationGroups\".\"authorizationGroupId\" = :authorizationGroupId "
				+ "AND \"reportAuthorizationGroups\".\"reportId\" = reports.id")
				.bind("authorizationGroupId", a.getId())
				.map(new ReportMapper())
				.list();
	}

}
