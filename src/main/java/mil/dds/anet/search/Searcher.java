package mil.dds.anet.search;

import com.google.common.base.Joiner;
import java.util.ArrayList;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.database.SubscriptionUpdateGroup;
import mil.dds.anet.database.SubscriptionUpdateStatement;
import mil.dds.anet.utils.DaoUtils;

public abstract class Searcher {

  public static String getSubscriptionReferences(Person user, Map<String, Object> args,
      SubscriptionUpdateGroup subscriptionUpdate) {
    final String paramObjectTypeTpl = "objectType%1$d";
    final String stmtTpl =
        "( \"subscribedObjectType\" = :%1$s AND \"subscribedObjectUuid\" IN ( %2$s ) )";
    final List<String> stmts = new ArrayList<>();
    final ListIterator<SubscriptionUpdateStatement> iter = subscriptionUpdate.stmts.listIterator();
    while (iter.hasNext()) {
      final String objectTypeParam = String.format(paramObjectTypeTpl, iter.nextIndex());
      final SubscriptionUpdateStatement stmt = iter.next();
      if (stmt != null && stmt.sql != null && stmt.objectType != null) {
        stmts.add(String.format(stmtTpl, objectTypeParam, stmt.sql));
        args.put(objectTypeParam, stmt.objectType);
      }
    }
    final String sql =
        "EXISTS ( SELECT uuid FROM subscriptions WHERE \"subscriberUuid\" = :subscriberUuid "
            + "AND ( " + Joiner.on(" OR ").join(stmts) + " ) )";
    final Position position = DaoUtils.getPosition(user);
    args.put("subscriberUuid", DaoUtils.getUuid(position));
    return sql;
  }
}
