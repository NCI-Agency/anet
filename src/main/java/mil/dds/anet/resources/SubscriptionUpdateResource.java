package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import mil.dds.anet.database.SubscriptionUpdateDao;
import mil.dds.anet.utils.DaoUtils;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionUpdateResource {

  private final SubscriptionUpdateDao dao;

  public SubscriptionUpdateResource(SubscriptionUpdateDao dao) {
    this.dao = dao;
  }

  @GraphQLQuery(name = "mySubscriptionUpdates")
  public AnetBeanList<SubscriptionUpdate> getMySubscriptionUpdates(
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") SubscriptionUpdateSearchQuery query) {
    return dao.search(DaoUtils.getUserFromContext(context), query);
  }

}
