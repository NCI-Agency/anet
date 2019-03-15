package mil.dds.anet.database;

import org.jdbi.v3.core.statement.Query;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.DaoUtils.DbType;
import mil.dds.anet.views.AbstractAnetBean;

public abstract class AnetBaseDao<T extends AbstractAnetBean> implements IAnetDao<T> {

	protected AnetObjectEngine engine;
	protected String getAllSql;
	protected String countAllSql;

	public AnetBaseDao(AnetObjectEngine engine, String entityTag, String tableName, String fieldList, String orderBy) {
		this.engine = engine;
		this.getAllSql = DaoUtils.buildPagedGetAllSql(getDbType(), entityTag, tableName, fieldList, orderBy);
		this.countAllSql = DaoUtils.buildCountAllSql(entityTag, tableName);
	}

	public T insert(T obj) {
		DaoUtils.setInsertFields(obj);
		return engine.executeInTransaction(this::insertInternal, obj);
	}

	public int update(T obj) {
		DaoUtils.setUpdateFields(obj);
		return engine.executeInTransaction(this::updateInternal, obj);
	}

	public int delete(String uuid) {
		return engine.executeInTransaction(this::deleteInternal, uuid);
	}

	protected DbType getDbType() {
		return DaoUtils.getDbType(engine.getDbUrl());
	}

	protected Query getPagedQuery(int pageNum, int pageSize) {
		return engine.getDbHandle().createQuery(this.getAllSql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum);
	}

	protected Long getSqliteRowCount() {
		if (getDbType() == DbType.SQLITE) {
			return engine.getDbHandle().createQuery(this.countAllSql).mapTo(Long.class).findFirst().orElse(null);
		}
		return null;
	}
}
