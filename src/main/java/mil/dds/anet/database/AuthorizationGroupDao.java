package mil.dds.anet.database;

import java.util.List;
import java.util.Map;

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
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.AuthorizationGroupList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.database.mappers.PositionMapper;
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
			sql = "/* getAllAuthorizationGroups */ SELECT authorizationGroups.*, COUNT(*) OVER() AS totalCount "
					+ "FROM authorizationGroups ORDER BY name ASC "
					+ "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else {
			sql = "/* getAllAuthorizationGroups */ SELECT * from authorizationGroups "
					+ "ORDER BY name ASC LIMIT :limit OFFSET :offset";
		}

		final Query<AuthorizationGroup> query = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum)
				.map(new AuthorizationGroupMapper());
		return AuthorizationGroupList.fromQuery(query, pageNum, pageSize);
	}

	@Override
	public AuthorizationGroup getById(@Bind("id") int id) {
		final Query<AuthorizationGroup> query = dbHandle.createQuery("/* getAuthorizationGroupById */ SELECT * from authorizationGroups where id = :id")
			.bind("id", id)
			.map(new AuthorizationGroupMapper());
		final List<AuthorizationGroup> results = query.list();
		if (results.size() == 0) { return null; }
		return results.get(0);
	}

	@Override
	public AuthorizationGroup insert(AuthorizationGroup a) {
		return dbHandle.inTransaction(new TransactionCallback<AuthorizationGroup>() {
			@Override
			public AuthorizationGroup inTransaction(Handle conn, TransactionStatus status) throws Exception {
				a.setCreatedAt(DateTime.now());
				a.setUpdatedAt(DateTime.now());
				final GeneratedKeys<Map<String,Object>> keys = dbHandle.createStatement(
						"/* authorizationGroupInsert */ INSERT INTO authorizationGroups (name, description, createdAt, updatedAt) "
							+ "VALUES (:name, :description, :createdAt, :updatedAt)")
					.bind("name", a.getName())
					.bind("description", a.getDescription())
					.bind("createdAt", a.getCreatedAt())
					.bind("updatedAt", a.getUpdatedAt())
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
		@SqlBatch("INSERT INTO authorizationGroupPositions (authorizationGroupId, positionId) VALUES (:authorizationGroupId, :id)")
		void insertAuthorizationGroupPositions(@Bind("authorizationGroupId") Integer authorizationGroupId,
				@BindBean List<Position> positions);
	}

	@Override
	public int update(AuthorizationGroup a) {
		return dbHandle.inTransaction(new TransactionCallback<Integer>() {
			@Override
			public Integer inTransaction(Handle conn, TransactionStatus status) throws Exception {
				return dbHandle.createStatement("/* updateAuthorizationGroup */ UPDATE authorizationGroups "
							+ "SET name = :name, description = :description, updatedAt = :updatedAt WHERE id = :id")
						.bind("id", a.getId())
						.bind("name", a.getName())
						.bind("description", a.getDescription())
						.bind("updatedAt", DateTime.now())
						.execute();
			}
		});
	}

	public int addPositionToAuthorizationGroup(Position p, AuthorizationGroup a) {
		return dbHandle.createStatement("/* addPositionToAuthorizationGroup */ INSERT INTO authorizationGroupPositions (authorizationGroupId, positionId) "
				+ "VALUES (:authorizationGroupId, :positionId)")
			.bind("authorizationGroupId", a.getId())
			.bind("positionId", p.getId())
			.execute();
	}

	public int removePositionFromAuthorizationGroup(Position p, AuthorizationGroup a) {
		return dbHandle.createStatement("/* removePositionFromAuthorizationGroup*/ DELETE FROM authorizationGroupPositions "
				+ "WHERE authorizationGroupId = :authorizationGroupId AND positionId = :positionId")
				.bind("authorizationGroupId", a.getId())
				.bind("positionId", p.getId())
				.execute();
	}

	public List<Position> getPositionsForAuthorizationGroup(AuthorizationGroup a) {
		return dbHandle.createQuery("/* getPositionsForAuthorizationGroup */ SELECT " + PositionDao.POSITIONS_FIELDS + " FROM positions, authorizationGroupPositions "
				+ "WHERE authorizationGroupPositions.authorizationGroupId = :authorizationGroupId "
				+ "AND authorizationGroupPositions.positionId = positions.id")
				.bind("authorizationGroupId", a.getId())
				.map(new PositionMapper())
				.list();
	}

	public AuthorizationGroupList search(AuthorizationGroupSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getAuthorizationGroupSearcher().runSearch(query, dbHandle);
	}

}
