package mil.dds.anet.database;

import com.google.common.base.Joiner;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.SubscribableObject;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.views.AbstractSubscribableAnetBean;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public abstract class AnetSubscribableObjectDao<T extends AbstractSubscribableAnetBean & SubscribableObject, S extends AbstractSearchQuery<?>>
    extends AnetBaseDao<T, S> {

  protected AnetSubscribableObjectDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  public abstract SubscriptionUpdateGroup getSubscriptionUpdate(T obj, String auditTrailUuid,
      boolean isDelete);

  public SubscriptionUpdateGroup getSubscriptionUpdate(T obj, boolean isDelete) {
    return getSubscriptionUpdate(obj, null, isDelete);
  }

  @Transactional
  public void updateSubscriptions(T obj, String auditTrailUuid, boolean isDelete) {
    final SubscriptionUpdateGroup subscriptionUpdate =
        getSubscriptionUpdate(obj, auditTrailUuid, isDelete);
    final SubscriptionDao subscriptionDao = engine().getSubscriptionDao();
    subscriptionDao.updateSubscriptions(subscriptionUpdate, auditTrailUuid);
  }

  protected SubscriptionUpdateGroup getCommonSubscriptionUpdate(AbstractSubscribableAnetBean obj,
      String tableName, String auditTrailUuid, String paramName, boolean isDelete) {
    final boolean isParam = (obj != null);
    final String uuid = isParam ? obj.getUuid() : null;
    final SubscriptionUpdateStatement update =
        getCommonSubscriptionUpdateStatement(isParam, uuid, tableName, paramName);
    if (update == null) {
      return null;
    }
    final Instant updatedAt;
    if (!isParam) {
      updatedAt = null;
    } else if (isDelete) {
      updatedAt = Instant.now();
    } else {
      updatedAt = obj.getUpdatedAt();
    }
    return new SubscriptionUpdateGroup(tableName, uuid, auditTrailUuid, updatedAt, update);
  }

  public static SubscriptionUpdateStatement getCommonSubscriptionUpdateStatement(boolean isParam,
      String uuid, String tableName, String paramName) {
    if ((isParam && uuid == null) || tableName == null || paramName == null) {
      return null;
    }
    final Map<String, Object> params = new HashMap<>();
    if (isParam) {
      params.put(paramName, uuid);
    }
    return new SubscriptionUpdateStatement(tableName, paramOrJoin(paramName, isParam), params);
  }

  protected static String paramOrJoin(String field, boolean isParam) {
    return isParam ? (":" + field) : escapeSqlField(field);
  }

  private static String escapeSqlField(String field) {
    final List<String> parts = new ArrayList<>();
    for (final String part : field.split("\\.")) {
      parts.add("\"" + part + "\"");
    }
    return Joiner.on(".").join(parts);
  }

}
