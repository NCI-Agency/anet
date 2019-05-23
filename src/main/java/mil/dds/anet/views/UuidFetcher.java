package mil.dds.anet.views;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import org.dataloader.DataLoader;
import org.dataloader.DataLoaderRegistry;

public class UuidFetcher<T extends AbstractAnetBean> {
  public CompletableFuture<T> load(Map<String, Object> context, IdDataLoaderKey dataLoaderKey,
      String uuid) {
    final DataLoaderRegistry dlr = (DataLoaderRegistry) context.get("dataLoaderRegistry");
    final DataLoader<String, T> dl = dlr.getDataLoader(dataLoaderKey.toString());
    return (uuid == null) ? CompletableFuture.completedFuture(null) : dl.load(uuid);
  }
}
