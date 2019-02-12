package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;

import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.SubscriptionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.ForeignKeyFetcher;

@RegisterRowMapper(SubscriptionMapper.class)
public class SubscriptionDao implements IAnetDao<Subscription> {

	private final Handle dbHandle;
	private final IdBatcher<Subscription> idBatcher;
	private final ForeignKeyBatcher<Subscription> positionSubscriptionsBatcher;
	private final ForeignKeyBatcher<Subscription> subscribedObjectSubscriptionsBatcher;

	public SubscriptionDao(Handle h) {
		this.dbHandle = h;
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
	public Subscription insert(Subscription s) {
		return dbHandle.inTransaction(h -> {
			DaoUtils.setInsertFields(s);
			h.createUpdate(
					"/* insertSubscription */ INSERT INTO subscriptions (uuid, \"subscriberUuid\", \"subscribedObjectType\", \"subscribedObjectUuid\", \"createdAt\", \"updatedAt\") "
						+ "VALUES (:uuid, :subscriberUuid, :subscribedObjectType, :subscribedObjectUuid, :createdAt, :updatedAt)")
				.bindBean(s)
				.bind("createdAt", DaoUtils.asLocalDateTime(s.getCreatedAt()))
				.bind("updatedAt", DaoUtils.asLocalDateTime(s.getUpdatedAt()))
				.execute();
			return s;
		});
	}

	public int update(Subscription s) {
		return dbHandle.inTransaction(h -> {
			DaoUtils.setUpdateFields(s);
			return h.createUpdate("/* updateSubscription */ UPDATE subscriptions "
						+ "SET \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
					.bindBean(s)
					.bind("updatedAt", DaoUtils.asLocalDateTime(s.getUpdatedAt()))
					.execute();
		});
	}

	public int delete(String uuid) {
		return dbHandle.inTransaction(h -> {
			return h.createUpdate("/* deleteSubscription */ DELETE FROM subscriptions where uuid = :uuid")
				.bind("uuid", uuid)
				.execute();
		});
	}

	public int updateSubscriptions(String subscribedObjectType, String subscribedObjectUuid) {
		return dbHandle.inTransaction(h -> {
			final Instant now = Instant.now();
			return h.createUpdate("/* updateSubscriptions */ UPDATE subscriptions "
						+ "SET \"updatedAt\" = :updatedAt"
						+ " WHERE \"subscribedObjectType\" = :subscribedObjectType"
						+ " AND \"subscribedObjectUuid\" = :subscribedObjectUuid")
					.bind("updatedAt", DaoUtils.asLocalDateTime(now))
					.bind("subscribedObjectType", subscribedObjectType)
					.bind("subscribedObjectUuid", subscribedObjectUuid)
					.execute();
		});
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
