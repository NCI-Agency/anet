package mil.dds.anet.database;

import com.google.common.base.Joiner;
import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionSearchQuery;
import mil.dds.anet.database.mappers.SubscriptionMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
public class SubscriptionDao extends AnetBaseDao<Subscription> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public SubscriptionDao() {
    super("Subscriptions", "subscriptions", "*", null);
  }

  public AnetBeanList<Subscription> getAll(int pageNum, int pageSize) {
    final String sql;
    if (DaoUtils.isMsSql()) {
      sql = "/* getAllSubscriptions */ SELECT subscriptions.*, COUNT(*) OVER() AS totalCount "
          + "FROM subscriptions ORDER BY \"updatedAt\" DESC "
          + "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
    } else {
      sql = "/* getAllSubscriptions */ SELECT * from subscriptions "
          + "ORDER BY \"updatedAt\" DESC LIMIT :limit OFFSET :offset";
    }

    final Query query =
        getDbHandle().createQuery(sql).bind("limit", pageSize).bind("offset", pageSize * pageNum);
    return new AnetBeanList<Subscription>(query, pageNum, pageSize, new SubscriptionMapper(), null);
  }

  public Subscription getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  @Override
  public Subscription insert(Subscription obj) {
    final Instant updatedAt = obj.getUpdatedAt();
    DaoUtils.setInsertFields(obj);
    if (updatedAt != null) {
      obj.setUpdatedAt(updatedAt); // keep supplied value
    }
    return insertInternal(obj);
  }

  static class SelfIdBatcher extends IdBatcher<Subscription> {
    private static final String sql =
        "/* batch.getSubscriptionsByUuids */ SELECT * FROM subscriptions WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new SubscriptionMapper());
    }
  }

  @Override
  public List<Subscription> getByIds(List<String> uuids) {
    final IdBatcher<Subscription> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public Subscription insertInternal(Subscription s) {
    getDbHandle().createUpdate(
        "/* insertSubscription */ INSERT INTO subscriptions (uuid, \"subscriberUuid\", \"subscribedObjectType\", \"subscribedObjectUuid\", \"createdAt\", \"updatedAt\") "
            + "VALUES (:uuid, :subscriberUuid, :subscribedObjectType, :subscribedObjectUuid, :createdAt, :updatedAt)")
        .bindBean(s).bind("createdAt", DaoUtils.asLocalDateTime(s.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(s.getUpdatedAt())).execute();
    return s;
  }

  @Override
  public int updateInternal(Subscription s) {
    throw new UnsupportedOperationException();
  }

  @Override
  public int deleteInternal(String uuid) {
    return getDbHandle()
        .createUpdate("/* deleteSubscription */ DELETE FROM subscriptions WHERE uuid = :uuid")
        .bind("uuid", uuid).execute();
  }

  public int deleteObjectSubscription(Person user, String uuid) {
    final Position position = user.loadPosition();
    return getDbHandle()
        .createUpdate("/* deleteObjectSubscription */ DELETE FROM subscriptions"
            + " WHERE \"subscriberUuid\" = :subscriberUuid"
            + " AND \"subscribedObjectUuid\" = :subscribedObjectUuid")
        .bind("subscriberUuid", DaoUtils.getUuid(position)).bind("subscribedObjectUuid", uuid)
        .execute();
  }

  public int updateSubscriptions(SubscriptionUpdateGroup subscriptionUpdate) {
    if (subscriptionUpdate == null || !subscriptionUpdate.isValid()) {
      return 0;
    }
    final StringBuilder sqlPre = new StringBuilder("/* updateSubscriptions */ UPDATE subscriptions"
        + " SET \"updatedAt\" = :updatedAt WHERE ");
    final String paramObjectTypeTpl = "objectType%1$d";
    final String stmtTpl =
        "( \"subscribedObjectType\" = :%1$s" + " AND \"subscribedObjectUuid\" IN ( %2$s ) )";
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
    logger.info("Updating subscriptions: sql={}, updatedAt={}, params={}", sqlSuf,
        subscriptionUpdate.updatedAt, params);
    final int nRows = getDbHandle().createUpdate(sqlPre + sqlSuf)
        .bind("updatedAt", DaoUtils.asLocalDateTime(subscriptionUpdate.updatedAt)).bindMap(params)
        .execute();
    insertSubscriptionUpdates(subscriptionUpdate);
    return nRows;
  }

  private int insertSubscriptionUpdates(SubscriptionUpdateGroup subscriptionUpdate) {
    final StringBuilder sqlPre =
        new StringBuilder("/* insertSubscriptionUpdates */ INSERT INTO \"subscriptionUpdates\""
            + " (\"subscriptionUuid\", \"updatedObjectType\", \"updatedObjectUuid\", \"isNote\", \"createdAt\")"
            + " SELECT s.uuid, :updatedObjectType, :updatedObjectUuid, :isNote, :createdAt"
            + " FROM subscriptions s WHERE ");
    final String paramObjectTypeTpl = "objectType%1$d";
    final String stmtTpl =
        "( \"subscribedObjectType\" = :%1$s" + " AND \"subscribedObjectUuid\" IN ( %2$s ) )";
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
    logger.info(
        "Inserting subscription updates: sql={}, createdAt={}, updatedObjectType={}, updatedObjectUuid={}, isNote={}, params={}",
        sqlSuf, subscriptionUpdate.updatedAt, subscriptionUpdate.objectType,
        subscriptionUpdate.objectUuid, subscriptionUpdate.isNote, params);
    return getDbHandle().createUpdate(sqlPre + sqlSuf)
        .bind("createdAt", DaoUtils.asLocalDateTime(subscriptionUpdate.updatedAt))
        .bind("updatedObjectType", subscriptionUpdate.objectType)
        .bind("updatedObjectUuid", subscriptionUpdate.objectUuid)
        .bind("isNote", subscriptionUpdate.isNote).bindMap(params).execute();
  }

  public boolean isSubscribedObject(Map<String, Object> context, String subscribedObjectUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position position = user.loadPosition();
    final String sql = "/* isSubscribedObject */ SELECT COUNT(*) AS count" + " FROM subscriptions"
        + " WHERE \"subscriberUuid\" = :subscriberUuid"
        + " AND \"subscribedObjectUuid\" = :subscribedObjectUuid";
    final List<Map<String, Object>> rs =
        getDbHandle().createQuery(sql).bind("subscriberUuid", DaoUtils.getUuid(position))
            .bind("subscribedObjectUuid", subscribedObjectUuid).map(new MapMapper(false)).list();
    final Map<String, Object> result = rs.get(0);
    final int count = ((Number) result.get("count")).intValue();
    return (count > 0);
  }

  public AnetBeanList<Subscription> search(Person user, SubscriptionSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getSubscriptionSearcher().runSearch(query,
        user);
  }

}
