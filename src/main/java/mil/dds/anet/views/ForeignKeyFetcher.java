package mil.dds.anet.views;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.FkDataLoaderKey;
import org.dataloader.DataLoader;
import org.dataloader.DataLoaderRegistry;

public class ForeignKeyFetcher<T extends AbstractAnetBean> {
  public CompletableFuture<List<T>> load(Map<String, Object> context, FkDataLoaderKey dataLoaderKey,
      String foreignKey) {
    final DataLoaderRegistry dlr = (DataLoaderRegistry) context.get("dataLoaderRegistry");
    final DataLoader<String, List<T>> dl = dlr.getDataLoader(dataLoaderKey.toString());
    return (foreignKey == null) ? CompletableFuture.completedFuture(new ArrayList<T>())
        : dl.load(foreignKey);
  }
}
