package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import javax.annotation.security.PermitAll;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import mil.dds.anet.database.SubscriptionUpdateDao;
import mil.dds.anet.utils.DaoUtils;

@PermitAll
public class SubscriptionUpdateResource {

  private SubscriptionUpdateDao dao;

  public SubscriptionUpdateResource(AnetObjectEngine engine) {
    this.dao = engine.getSubscriptionUpdateDao();
  }

  @GraphQLQuery(name = "mySubscriptionUpdates")
  public AnetBeanList<SubscriptionUpdate> getMySubscriptionUpdates(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") SubscriptionUpdateSearchQuery query) {
    return dao.search(DaoUtils.getUserFromContext(context), query);
  }

}
