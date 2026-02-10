package mil.dds.anet.database;

import com.google.common.base.Joiner;
import graphql.GraphQLContext;
import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionSearchQuery;
import mil.dds.anet.database.mappers.SubscriptionMapper;
import mil.dds.anet.search.pg.PostgresqlSubscriptionSearcher;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.MapMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SubscriptionDao extends AnetBaseDao<Subscription, SubscriptionSearchQuery> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String[] fields = {"uuid", "subscriberUuid", "subscribedObjectType",
      "subscribedObjectUuid", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "subscriptions";
  public static final String SUBSCRIPTION_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  private final SubscriptionUpdateDao subscriptionUpdateDao;

  public SubscriptionDao(DatabaseHandler databaseHandler,
      SubscriptionUpdateDao subscriptionUpdateDao) {
    super(databaseHandler);
    this.subscriptionUpdateDao = subscriptionUpdateDao;
  }

  @Override
  public Subscription getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  @Transactional
  public Subscription getBySubscribedObject(Person user, String subscribedObjectUuid) {
    final Handle handle = getDbHandle();
    try {
      final Position position = DaoUtils.getPosition(user);
      return handle
          .createQuery("/* getBySubscribedObject */ SELECT " + SUBSCRIPTION_FIELDS
              + " FROM subscriptions WHERE \"subscriberUuid\" = :subscriberUuid"
              + " AND \"subscribedObjectUuid\" = :subscribedObjectUuid")
          .bind("subscriberUuid", DaoUtils.getUuid(position))
          .bind("subscribedObjectUuid", subscribedObjectUuid).map(new SubscriptionMapper()).first();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  @Override
  public Subscription insert(Subscription obj) {
    final Instant updatedAt = obj.getUpdatedAt();
    DaoUtils.setInsertFields(obj);
    if (updatedAt != null) {
      obj.setUpdatedAt(updatedAt); // keep supplied value
    }
    return insertInternal(obj);
  }

  class SelfIdBatcher extends IdBatcher<Subscription> {
    private static final String SQL = "/* batch.getSubscriptionsByUuids */ SELECT "
        + SUBSCRIPTION_FIELDS + " FROM subscriptions WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(SubscriptionDao.this.databaseHandler, SQL, "uuids", new SubscriptionMapper());
    }
  }

  @Override
  public List<Subscription> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Override
  public Subscription insertInternal(Subscription s) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate(
          "/* insertSubscription */ INSERT INTO subscriptions (uuid, \"subscriberUuid\", "
              + "\"subscribedObjectType\", \"subscribedObjectUuid\", \"createdAt\", \"updatedAt\") "
              + "VALUES (:uuid, :subscriberUuid, :subscribedObjectType, :subscribedObjectUuid, "
              + ":createdAt, :updatedAt)")
          .bindBean(s).bind("createdAt", DaoUtils.asLocalDateTime(s.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(s.getUpdatedAt())).execute();
      return s;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int updateInternal(Subscription s) {
    throw new UnsupportedOperationException();
  }

  @Override
  public int deleteInternal(String uuid) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* deleteSubscription */ DELETE FROM subscriptions WHERE uuid = :uuid")
          .bind("uuid", uuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int updateSubscriptions(SubscriptionUpdateGroup subscriptionUpdate,
      String auditTrailUuid) {
    final Handle handle = getDbHandle();
    try {
      if (subscriptionUpdate == null || !subscriptionUpdate.isValid()) {
        return 0;
      }
      final StringBuilder sqlPre =
          new StringBuilder("/* updateSubscriptions */ UPDATE subscriptions"
              + " SET \"updatedAt\" = :updatedAt WHERE ");
      final String paramObjectTypeTpl = "objectType%1$d";
      final String stmtTpl =
          "( \"subscribedObjectType\" = :%1$s AND \"subscribedObjectUuid\" IN ( %2$s ) )";
      final List<String> stmts = new ArrayList<>();
      final Map<String, Object> params = new HashMap<>();
      final ListIterator<SubscriptionUpdateStatement> iter =
          subscriptionUpdate.getStmts().listIterator();
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
      logger.info("Updating subscriptions: sql={}, updatedAt={}, params={}", sqlSuf,
          subscriptionUpdate.getUpdatedAt(), params);
      final int nRows = handle.createUpdate(sqlPre + sqlSuf)
          .bind("updatedAt", DaoUtils.asLocalDateTime(subscriptionUpdate.getUpdatedAt()))
          .bindMap(params).execute();
      subscriptionUpdateDao.insert(subscriptionUpdate, auditTrailUuid);
      return nRows;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public boolean isSubscribedObject(GraphQLContext context, String subscribedObjectUuid) {
    final Handle handle = getDbHandle();
    try {
      final Person user = DaoUtils.getUserFromContext(context);
      final Position position = DaoUtils.getPosition(user);
      final String sql = "/* isSubscribedObject */ SELECT COUNT(*) AS count FROM subscriptions"
          + " WHERE \"subscriberUuid\" = :subscriberUuid"
          + " AND \"subscribedObjectUuid\" = :subscribedObjectUuid";
      final List<Map<String, Object>> rs =
          handle.createQuery(sql).bind("subscriberUuid", DaoUtils.getUuid(position))
              .bind("subscribedObjectUuid", subscribedObjectUuid).map(new MapMapper()).list();
      final Map<String, Object> result = rs.get(0);
      final int count = ((Number) result.get("count")).intValue();
      return (count > 0);
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public AnetBeanList<Subscription> search(SubscriptionSearchQuery query) {
    return new PostgresqlSubscriptionSearcher(databaseHandler).runSearch(query);
  }

}
