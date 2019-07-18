package mil.dds.anet.views;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.utils.SqDataLoaderKey;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.dataloader.DataLoader;
import org.dataloader.DataLoaderRegistry;

public class SearchQueryFetcher<T extends AbstractAnetBean> {
  public CompletableFuture<List<T>> load(Map<String, Object> context, SqDataLoaderKey dataLoaderKey,
      ImmutablePair<String, ReportSearchQuery> foreignKey) {
    final DataLoaderRegistry dlr = (DataLoaderRegistry) context.get("dataLoaderRegistry");
    final DataLoader<ImmutablePair<String, ReportSearchQuery>, List<T>> dl =
        dlr.getDataLoader(dataLoaderKey.toString());
    return (foreignKey == null) ? CompletableFuture.completedFuture(new ArrayList<T>())
        : dl.load(foreignKey);
  }
}
