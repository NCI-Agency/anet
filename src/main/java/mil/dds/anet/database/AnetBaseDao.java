package mil.dds.anet.database;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.DaoUtils.DbType;
import mil.dds.anet.views.AbstractAnetBean;

public abstract class AnetBaseDao<T extends AbstractAnetBean> implements IAnetDao<T> {

	protected Handle dbHandle;
	protected String getAllSql;
	protected String countAllSql;

	public AnetBaseDao(Handle dbHandle, String entityTag, String tableName, String fieldList, String orderBy) {
		this.dbHandle = dbHandle;
		this.getAllSql = DaoUtils.buildPagedGetAllSql(getDbType(), entityTag, tableName, fieldList, orderBy);
		this.countAllSql = DaoUtils.buildCountAllSql(entityTag, tableName);
	}

	public T insert(T obj) {
		DaoUtils.setInsertFields(obj);
		return AnetObjectEngine.getInstance().executeInTransaction(this::insertInternal, obj);
	}

	public int update(T obj) {
		DaoUtils.setUpdateFields(obj);
		return AnetObjectEngine.getInstance().executeInTransaction(this::updateInternal, obj);
	}

	public int delete(String uuid) {
		return AnetObjectEngine.getInstance().executeInTransaction(this::deleteInternal, uuid);
	}

	protected DbType getDbType() {
		return DaoUtils.getDbType(dbHandle);
	}

	protected Query getPagedQuery(int pageNum, int pageSize) {
		return dbHandle.createQuery(this.getAllSql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum);
	}

	protected Long getSqliteRowCount() {
		if (getDbType() == DbType.SQLITE) {
			return dbHandle.createQuery(this.countAllSql).mapTo(Long.class).findFirst().orElse(null);
		}
		return null;
	}
}
