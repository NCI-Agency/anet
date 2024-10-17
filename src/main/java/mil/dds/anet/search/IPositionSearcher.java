package mil.dds.anet.search;

import graphql.GraphQLContext;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;

public interface IPositionSearcher {

  public AnetBeanList<Position> runSearch(PositionSearchQuery query);

  public CompletableFuture<AnetBeanList<Position>> runSearch(GraphQLContext context,
      PositionSearchQuery query);

}
