package mil.dds.anet.database;

import com.google.common.base.Joiner;
import graphql.GraphQLContext;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import mil.dds.anet.database.mappers.SubscriptionUpdateMapper;
import mil.dds.anet.emails.SubscriptionUpdateEmail;
import mil.dds.anet.search.pg.PostgresqlSubscriptionUpdateSearcher;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SubscriptionUpdateDao
    extends AnetBaseDao<SubscriptionUpdate, SubscriptionUpdateSearchQuery> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String[] fields = {"subscriptionUuid", "updatedObjectType",
      "updatedObjectUuid", "isNote", "createdAt", "auditTrailUuid"};
  public static final String TABLE_NAME = "subscriptionUpdates";
  public static final String SUBSCRIPTION_UPDATE_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public SubscriptionUpdateDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public SubscriptionUpdate getByUuid(String uuid) {
    throw new UnsupportedOperationException();
  }

  @Override
  public List<SubscriptionUpdate> getByIds(List<String> uuids) {
    throw new UnsupportedOperationException();
  }

  @Override
  public SubscriptionUpdate insertInternal(SubscriptionUpdate su) {
    throw new UnsupportedOperationException();
  }

  @Override
  public int updateInternal(SubscriptionUpdate su) {
    throw new UnsupportedOperationException();
  }

  @Override
  public AnetBeanList<SubscriptionUpdate> search(SubscriptionUpdateSearchQuery query) {
    return new PostgresqlSubscriptionUpdateSearcher(databaseHandler).runSearch(query);
  }

  @Transactional
  public int insert(SubscriptionUpdateGroup subscriptionUpdate, String auditTrailUuid) {
    final Handle handle = getDbHandle();
    try {
      final StringBuilder sqlPre =
          new StringBuilder("/* insertSubscriptionUpdates */ INSERT INTO \"subscriptionUpdates\""
              + " (\"subscriptionUuid\", \"updatedObjectType\", \"updatedObjectUuid\", \"isNote\","
              + " \"auditTrailUuid\", \"createdAt\")"
              + " SELECT s.uuid, :updatedObjectType, :updatedObjectUuid, :isNote,"
              + " :auditTrailUuid, :createdAt FROM subscriptions s WHERE ");
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
      final String sqlSuf =
          "( " + Joiner.on(" OR ").join(stmts) + " ) RETURNING" + SUBSCRIPTION_UPDATE_FIELDS;
      logger.info(
          "Inserting subscription updates: sql={}, createdAt={}, updatedObjectType={}, "
              + "updatedObjectUuid={}, isNote={}, auditTrailUuid={}, params={}",
          sqlSuf, subscriptionUpdate.getUpdatedAt(), subscriptionUpdate.getObjectType(),
          subscriptionUpdate.getObjectUuid(), subscriptionUpdate.isNote(), auditTrailUuid, params);

      final List<SubscriptionUpdate> subscriptionUpdates = handle.createQuery(sqlPre + sqlSuf)
          .bind("createdAt", DaoUtils.asLocalDateTime(subscriptionUpdate.getUpdatedAt()))
          .bind("updatedObjectType", subscriptionUpdate.getObjectType())
          .bind("updatedObjectUuid", subscriptionUpdate.getObjectUuid())
          .bind("isNote", subscriptionUpdate.isNote()).bind("auditTrailUuid", auditTrailUuid)
          .bindMap(params).map(new SubscriptionUpdateMapper()).list();
      sendEmailToSubscribers(subscriptionUpdates);
      return subscriptionUpdates.size();
    } finally {
      closeDbHandle(handle);
    }
  }

  private void sendEmailToSubscribers(List<SubscriptionUpdate> subscriptionUpdates) {
    final GraphQLContext context = engine().getContext();
    for (final SubscriptionUpdate subscriptionUpdate : subscriptionUpdates) {
      final Subscription subscription = subscriptionUpdate.loadSubscription(context).join();
      final Position subscribedPosition = subscription.loadSubscriber(context).join();
      final List<String> addresses =
          getEmailAddressesBasedOnPreference(List.of(subscribedPosition.getPersonUuid()),
              PreferenceDao.PREFERENCE_SUBSCRIPTIONS, PreferenceDao.CATEGORY_EMAILING);
      if (!addresses.isEmpty()) {
        final SubscriptionUpdateEmail action = new SubscriptionUpdateEmail();
        action.setSubscriptionUuid(subscriptionUpdate.getSubscriptionUuid());
        action.setUpdatedObjectType(subscriptionUpdate.getUpdatedObjectType());
        action.setUpdatedObjectUuid(subscriptionUpdate.getUpdatedObjectUuid());
        action.setAuditTrailUuid(subscriptionUpdate.getAuditTrailUuid());
        action.setIsNote(subscriptionUpdate.getIsNote());
        action.setCreatedAt(subscriptionUpdate.getCreatedAt());
        final AnetEmail email = new AnetEmail();
        email.setAction(action);
        email.setToAddresses(addresses);
        AnetEmailWorker.sendEmailAsync(email);
      }
    }
  }

}
