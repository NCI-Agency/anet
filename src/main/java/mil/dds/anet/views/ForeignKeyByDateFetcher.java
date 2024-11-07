package mil.dds.anet.views;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.FkDataLoaderKey;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.dataloader.DataLoader;
import org.dataloader.DataLoaderRegistry;

public class ForeignKeyByDateFetcher<T extends AbstractAnetBean> {
  public CompletableFuture<List<T>> load(GraphQLContext context, FkDataLoaderKey dataLoaderKey,
      ImmutablePair<String, Instant> foreignKey) {
    final DataLoaderRegistry dlr = context.get("dataLoaderRegistry");
    final DataLoader<ImmutablePair<String, Instant>, List<T>> dl =
        dlr.getDataLoader(dataLoaderKey.toString());
    return (foreignKey == null) ? CompletableFuture.completedFuture(new ArrayList<T>())
        : dl.load(foreignKey);
  }
}
