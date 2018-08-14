package mil.dds.anet.database;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.DaoUtils.DbType;

public abstract class AnetBaseDao<T> implements IAnetDao<T> {

	protected Handle dbHandle;
	protected String getAllSql;
	protected String countAllSql;

	public AnetBaseDao(Handle dbHandle, String entityTag, String tableName, String fieldList, String orderBy) {
		this.dbHandle = dbHandle;
		this.getAllSql = DaoUtils.buildPagedGetAllSql(getDbType(), entityTag, tableName, fieldList, orderBy);
		this.countAllSql = DaoUtils.buildCountAllSql(entityTag, tableName);
	}

	protected DbType getDbType() {
		return DaoUtils.getDbType(dbHandle);
	}

	protected Query<T> getPagedQuery(int pageNum, int pageSize, ResultSetMapper<T> mapper) {
		return dbHandle.createQuery(this.getAllSql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum)
				.map(mapper);
	}

	protected Long getSqliteRowCount() {
		if (getDbType() == DbType.SQLITE) {
			return dbHandle.createQuery(this.countAllSql).mapTo(Long.class).first();
		}
		return null;
	}
}
