package mil.dds.anet.database;

import java.util.HashMap;
import java.util.Map;

import org.jdbi.v3.core.Handle;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.SubscribableObject;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.AbstractAnetBean;

public abstract class AnetSubscribableObjectDao<T extends AbstractAnetBean & SubscribableObject> extends AnetBaseDao<T> {

	public AnetSubscribableObjectDao(Handle dbHandle, String entityTag, String tableName, String fieldList, String orderBy) {
		super(dbHandle, entityTag, tableName, fieldList, orderBy);
	}

	public abstract SubscriptionUpdate getSubscriptionUpdate(T obj);

	@Override
	public int update(T obj) {
		DaoUtils.setUpdateFields(obj);
		return AnetObjectEngine.getInstance().executeInTransaction(this::updateWithSubscriptions, obj);
	}

	private int updateWithSubscriptions(T obj) {
		final int numRows = updateInternal(obj);
		if (numRows > 0) {
			final SubscriptionUpdate subscriptionUpdate = getSubscriptionUpdate(obj);
			final SubscriptionDao subscriptionDao = AnetObjectEngine.getInstance().getSubscriptionDao();
			subscriptionDao.updateSubscriptions(subscriptionUpdate);
		}
		return numRows;
	}

	@Override
	public int delete(String uuid) {
		return AnetObjectEngine.getInstance().executeInTransaction(this::deleteWithSubscriptions, uuid);
	}

	/* override this method if you want to update subscriptions on delete */
	protected T getObjectForSubscriptionDelete(String uuid) {
		return null;
	}

	private int deleteWithSubscriptions(String uuid) {
		final T obj = getObjectForSubscriptionDelete(uuid);
		final int numRows = deleteInternal(uuid);
		if (numRows > 0 && obj != null) {
			obj.setUuid(uuid);
			DaoUtils.setUpdateFields(obj);
			final SubscriptionUpdate subscriptionUpdate = getSubscriptionUpdate(obj);
			final SubscriptionDao subscriptionDao = AnetObjectEngine.getInstance().getSubscriptionDao();
			subscriptionDao.updateSubscriptions(subscriptionUpdate);
		}
		return numRows;
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

	protected static SubscriptionUpdateStatement getCommonSubscriptionUpdateStatement(String uuid, String tableName, String paramName) {
		if (uuid == null || tableName == null || paramName == null) {
			return null;
		}
		final Map<String, Object> params = new HashMap<>();
		params.put(paramName, uuid);
		return new SubscriptionUpdateStatement(tableName, ":" + paramName, params);
	}

}
