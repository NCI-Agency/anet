package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;

import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Joiner;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.SubscriptionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.ForeignKeyFetcher;

@RegisterRowMapper(SubscriptionMapper.class)
public class SubscriptionDao extends AnetBaseDao<Subscription> {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	private final IdBatcher<Subscription> idBatcher;
	private final ForeignKeyBatcher<Subscription> positionSubscriptionsBatcher;
	private final ForeignKeyBatcher<Subscription> subscribedObjectSubscriptionsBatcher;

	public SubscriptionDao(Handle h) {
		super(h, "Subscriptions", "subscriptions", "*", null);
		final String idBatcherSql = "/* batch.getSubscriptionsByUuids */ SELECT * FROM subscriptions WHERE uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<Subscription>(h, idBatcherSql, "uuids", new SubscriptionMapper());

		final String positionSubscriptionsBatcherSql = "/* batch.getSubscriptionsForPosition */ SELECT * FROM \"subscriptions\" "
				+ "WHERE \"subscriptions\".\"subscriberUuid\" IN ( <foreignKeys> ) "
				+ "ORDER BY subscriptions.\"updatedAt\" DESC";
		this.positionSubscriptionsBatcher = new ForeignKeyBatcher<Subscription>(h, positionSubscriptionsBatcherSql, "foreignKeys", new SubscriptionMapper(), "subscriberUuid");

		final String subscribedObjectSubscriptionsBatcherSql = "/* batch.getSubscriptionsForSubscribedObject */ SELECT * FROM \"subscriptions\" "
				+ "WHERE \"subscriptions\".\"subscribedObjectUuid\" IN ( <foreignKeys> ) "
				+ "ORDER BY subscriptions.\"updatedAt\" DESC";
		this.subscribedObjectSubscriptionsBatcher = new ForeignKeyBatcher<Subscription>(h, subscribedObjectSubscriptionsBatcherSql, "foreignKeys", new SubscriptionMapper(), "subscribedObjectUuid");
	}

	public AnetBeanList<Subscription> getAll(int pageNum, int pageSize) {
		final String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* getAllSubscriptions */ SELECT subscriptions.*, COUNT(*) OVER() AS totalCount "
					+ "FROM subscriptions ORDER BY \"updatedAt\" DESC "
					+ "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else {
			sql = "/* getAllSubscriptions */ SELECT * from subscriptions "
					+ "ORDER BY \"updatedAt\" DESC LIMIT :limit OFFSET :offset";
		}

		final Query query = dbHandle.createQuery(sql)
			.bind("limit", pageSize)
			.bind("offset", pageSize * pageNum);
		return new AnetBeanList<Subscription>(query, pageNum, pageSize, new SubscriptionMapper(), null);
	}

	public Subscription getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	@Override
	public List<Subscription> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	@Override
	public Subscription insertInternal(Subscription s) {
		dbHandle.createUpdate(
				"/* insertSubscription */ INSERT INTO subscriptions (uuid, \"subscriberUuid\", \"subscribedObjectType\", \"subscribedObjectUuid\", \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :subscriberUuid, :subscribedObjectType, :subscribedObjectUuid, :createdAt, :updatedAt)")
			.bindBean(s)
			.bind("createdAt", DaoUtils.asLocalDateTime(s.getCreatedAt()))
			.bind("updatedAt", DaoUtils.asLocalDateTime(s.getUpdatedAt()))
			.execute();
		return s;
	}

	@Override
	public int updateInternal(Subscription s) {
		return dbHandle.createUpdate("/* updateSubscription */ UPDATE subscriptions "
					+ "SET \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindBean(s)
				.bind("updatedAt", DaoUtils.asLocalDateTime(s.getUpdatedAt()))
				.execute();
	}

	@Override
	public int deleteInternal(String uuid) {
		return dbHandle.createUpdate("/* deleteSubscription */ DELETE FROM subscriptions where uuid = :uuid")
			.bind("uuid", uuid)
			.execute();
	}

	public int updateSubscriptions(SubscriptionUpdate subscriptionUpdate) {
		return AnetObjectEngine.getInstance().executeInTransaction(this::updateSubscriptionsTransactional, subscriptionUpdate);
	}

	public int updateSubscriptionsTransactional(SubscriptionUpdate subscriptionUpdate) {
		if (subscriptionUpdate == null || subscriptionUpdate.updatedAt == null || subscriptionUpdate.stmts == null) {
			return 0;
		}
		final StringBuilder sqlPre = new StringBuilder("/* updateSubscriptions */ UPDATE subscriptions"
					+ " SET \"updatedAt\" = :updatedAt WHERE ");
		final String paramObjectTypeTpl = "objectType%1$d";
		final String stmtTpl = "( \"subscribedObjectType\" = :%1$s"
					+ " AND \"subscribedObjectUuid\" IN ( %2$s ) )";
		final List<String> stmts = new ArrayList<>();
		final Map<String, Object> params = new HashMap<>();
		final ListIterator<SubscriptionUpdateStatement> iter = subscriptionUpdate.stmts.listIterator();
		while (iter.hasNext()) {
			final String objectTypeParam = String.format(paramObjectTypeTpl, iter.nextIndex());
			final SubscriptionUpdateStatement stmt = iter.next();
			if (stmt != null && stmt.sql != null && stmt.objectType != null && stmt.params != null) {
				stmts.add(String.format(stmtTpl, objectTypeParam, stmt.sql));
				params.put(objectTypeParam, stmt.objectType);
				params.putAll(stmt.params);
			}
		}
		final String sqlSuf = "( " + Joiner.on(" OR ").join(stmts) + " )";
		logger.info("Updating subscriptions: sql={}, updatedAt={}, params={}", sqlSuf, subscriptionUpdate.updatedAt, params);
		return dbHandle.createUpdate(sqlPre + sqlSuf)
				.bind("updatedAt", DaoUtils.asLocalDateTime(subscriptionUpdate.updatedAt))
				.bindMap(params)
				.execute();
	}

	public CompletableFuture<List<Subscription>> getSubscriptionsForPosition(@GraphQLRootContext Map<String, Object> context, String subscriberUuid) {
		return new ForeignKeyFetcher<Subscription>()
				.load(context, "position.subscriptions", subscriberUuid);
	}

	public List<List<Subscription>> getPositionSubscriptions(List<String> foreignKeys) {
		return positionSubscriptionsBatcher.getByForeignKeys(foreignKeys);
	}

	public CompletableFuture<List<Subscription>> getSubscriptionsForSubscribedObject(@GraphQLRootContext Map<String, Object> context, String subscribedObjectUuid) {
		return new ForeignKeyFetcher<Subscription>()
				.load(context, "subscribedObject.subscriptions", subscribedObjectUuid);
	}

	public List<List<Subscription>> getSubscribedObjectSubscriptions(List<String> foreignKeys) {
		return subscribedObjectSubscriptionsBatcher.getByForeignKeys(foreignKeys);
	}

}
