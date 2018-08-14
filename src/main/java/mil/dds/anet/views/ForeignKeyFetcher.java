package mil.dds.anet.views;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;

import org.dataloader.DataLoader;
import org.dataloader.DataLoaderRegistry;

public class ForeignKeyFetcher<T extends AbstractAnetBean> {
	public CompletableFuture<List<T>> load(Map<String, Object> context, String dataLoader, Integer foreignKey) {
		final DataLoaderRegistry dlr = (DataLoaderRegistry) context.get("dataLoaderRegistry");
		final DataLoader<Integer, List<T>> dl = dlr.getDataLoader(dataLoader);
		return (foreignKey == null)
				? CompletableFuture.supplyAsync(new Supplier<List<T>>() {
					@Override
					public List<T> get() {
						return new ArrayList<T>();
					}})
				: dl.load(foreignKey);
	}
}
