package mil.dds.anet.database;

import java.util.HashMap;
import java.util.Map;

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
		return AnetObjectEngine.getInstance().executeInTransaction(this::updateWithSubscriptions, obj);
	}

	private int updateWithSubscriptions(T obj) {
		final int n = updateInternal(obj);
		if (n > 0) {
			final SubscriptionUpdate subscriptionUpdate = getSubscriptionUpdate(obj);
			final SubscriptionDao subscriptionDao = AnetObjectEngine.getInstance().getSubscriptionDao();
			subscriptionDao.updateSubscriptions(subscriptionUpdate);
		}
		return n;
	}

	@Override
	public SubscriptionUpdate getSubscriptionUpdate(T obj) {
		return null;
	}

	protected SubscriptionUpdate getCommonSubscriptionUpdate(AbstractAnetBean obj, String tableName, String paramName) {
		if (obj == null) {
			return null;
		}
		final SubscriptionUpdateStatement update = getCommonSubscriptionUpdateStatement(obj.getUuid(), tableName, paramName);
		if (update == null) {
			return null;
		}
		return new SubscriptionUpdate(obj.getUpdatedAt(), update);
	}

	protected SubscriptionUpdateStatement getCommonSubscriptionUpdateStatement(String uuid, String tableName, String paramName) {
		if (uuid == null || tableName == null || paramName == null) {
			return null;
		}
		final Map<String, Object> params = new HashMap<>();
		params.put(paramName, uuid);
		return new SubscriptionUpdateStatement(tableName, ":" + paramName, params);
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
