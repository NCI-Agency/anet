package mil.dds.anet.views;

import graphql.GraphQLContext;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.FkDataLoaderKey;
import org.dataloader.DataLoader;
import org.dataloader.DataLoaderRegistry;

public class ForeignKeyFetcher<T extends AbstractAnetBean> {
  public CompletableFuture<List<T>> load(GraphQLContext context, FkDataLoaderKey dataLoaderKey,
      String foreignKey) {
    final DataLoaderRegistry dlr = context.get("dataLoaderRegistry");
    final DataLoader<String, List<T>> dl = dlr.getDataLoader(dataLoaderKey.toString());
    return (foreignKey == null) ? CompletableFuture.completedFuture(new ArrayList<>())
        : dl.load(foreignKey);
  }
}
