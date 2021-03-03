package mil.dds.anet.search;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;

public interface IPositionSearcher {

  public AnetBeanList<Position> runSearch(PositionSearchQuery query);

  public CompletableFuture<AnetBeanList<Position>> runSearch(Map<String, Object> context,
      PositionSearchQuery query);

}
