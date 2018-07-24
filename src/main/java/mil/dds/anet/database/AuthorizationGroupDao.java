package mil.dds.anet.database;

import java.util.List;

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
import mil.dds.anet.beans.lists.AbstractAnetBeanList.AuthorizationGroupList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.utils.DaoUtils;

@RegisterMapper(AuthorizationGroupMapper.class)
public class AuthorizationGroupDao implements IAnetDao<AuthorizationGroup> {

	private Handle dbHandle;

	public AuthorizationGroupDao(Handle h) {
		this.dbHandle = h;
	}

	public AuthorizationGroupList getAll(int pageNum, int pageSize) {
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
		return AuthorizationGroupList.fromQuery(query, pageNum, pageSize);
	}

	public AuthorizationGroup getByUuid(String uuid) {
		return dbHandle.createQuery("/* getAuthorizationGroupByUuid */ SELECT * from \"authorizationGroups\" where uuid = :uuid")
				.bind("uuid", uuid)
				.map(new AuthorizationGroupMapper())
				.first();
	}

	public AuthorizationGroup insert(AuthorizationGroup a) {
		return dbHandle.inTransaction(new TransactionCallback<AuthorizationGroup>() {
			@Override
			public AuthorizationGroup inTransaction(Handle conn, TransactionStatus status) throws Exception {
				DaoUtils.setInsertFields(a);
				dbHandle.createStatement(
						"/* authorizationGroupInsert */ INSERT INTO \"authorizationGroups\" (uuid, name, description, \"createdAt\", \"updatedAt\", status) "
							+ "VALUES (:uuid, :name, :description, :createdAt, :updatedAt, :status)")
					.bindFromProperties(a)
					.bind("status", DaoUtils.getEnumId(a.getStatus()))
					.execute();
		
				final AuthorizationGroupBatch ab = dbHandle.attach(AuthorizationGroupBatch.class);
				if (a.getPositions() != null) {
					ab.insertAuthorizationGroupPositions(a.getUuid(), a.getPositions());
				}
				return a;
			}
		});
	}

	public interface AuthorizationGroupBatch {
		@SqlBatch("INSERT INTO \"authorizationGroupPositions\" (\"authorizationGroupUuid\", \"positionUuid\") VALUES (:authorizationGroupUuid, :uuid)")
		void insertAuthorizationGroupPositions(@Bind("authorizationGroupUuid") String authorizationGroupUuid,
				@BindBean List<Position> positions);
	}

	public int update(AuthorizationGroup a) {
		return dbHandle.inTransaction(new TransactionCallback<Integer>() {
			@Override
			public Integer inTransaction(Handle conn, TransactionStatus status) throws Exception {
				DaoUtils.setUpdateFields(a);
				return dbHandle.createStatement("/* updateAuthorizationGroup */ UPDATE \"authorizationGroups\" "
							+ "SET name = :name, description = :description, \"updatedAt\" = :updatedAt, status = :status  WHERE uuid = :uuid")
						.bindFromProperties(a)
						.bind("status", DaoUtils.getEnumId(a.getStatus()))
						.execute();
			}
		});
	}

	public int addPositionToAuthorizationGroup(Position p, AuthorizationGroup a) {
		return dbHandle.createStatement("/* addPositionToAuthorizationGroup */ INSERT INTO \"authorizationGroupPositions\" (\"authorizationGroupUuid\", \"positionUuid\") "
				+ "VALUES (:authorizationGroupUuid, :positionUuid)")
			.bind("authorizationGroupUuid", a.getUuid())
			.bind("positionUuid", p.getUuid())
			.execute();
	}

	public int removePositionFromAuthorizationGroup(Position p, AuthorizationGroup a) {
		return dbHandle.createStatement("/* removePositionFromAuthorizationGroup*/ DELETE FROM \"authorizationGroupPositions\" "
				+ "WHERE \"authorizationGroupUuid\" = :authorizationGroupUuid AND \"positionUuid\" = :positionUuid")
				.bind("authorizationGroupUuid", a.getUuid())
				.bind("positionUuid", p.getUuid())
				.execute();
	}

	public List<Position> getPositionsForAuthorizationGroup(AuthorizationGroup a) {
		return dbHandle.createQuery("/* getPositionsForAuthorizationGroup */ SELECT " + PositionDao.POSITIONS_FIELDS + " FROM positions, \"authorizationGroupPositions\" "
				+ "WHERE \"authorizationGroupPositions\".\"authorizationGroupUuid\" = :authorizationGroupUuid "
				+ "AND \"authorizationGroupPositions\".\"positionUuid\" = positions.uuid")
				.bind("authorizationGroupUuid", a.getUuid())
				.map(new PositionMapper())
				.list();
	}

	public AuthorizationGroupList search(AuthorizationGroupSearchQuery query) {
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
		return dbHandle.createQuery("/* getReportsForAuthorizationGroup */ SELECT " + ReportDao.REPORT_FIELDS  + ", " + PersonDao.PERSON_FIELDS
				+ " FROM reports, people, \"reportAuthorizationGroups\" "
				+ "WHERE reports.\"authorUuid\" = people.uuid "
				+ "AND \"reportAuthorizationGroups\".\"authorizationGroupUuid\" = :authorizationGroupUuid "
				+ "AND \"reportAuthorizationGroups\".\"reportUuid\" = reports.uuid")
				.bind("authorizationGroupUuid", a.getUuid())
				.map(new ReportMapper())
				.list();
	}

}
