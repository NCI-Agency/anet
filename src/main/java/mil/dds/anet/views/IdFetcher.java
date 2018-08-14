package mil.dds.anet.views;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;

import org.dataloader.DataLoader;
import org.dataloader.DataLoaderRegistry;

import mil.dds.anet.utils.DaoUtils;

public class IdFetcher<T extends AbstractAnetBean> {
	public CompletableFuture<T> load(Map<String, Object> context, String dataLoader, T bean) {
		final DataLoaderRegistry dlr = (DataLoaderRegistry) context.get("dataLoaderRegistry");
		final DataLoader<Integer, T> dl = dlr.getDataLoader(dataLoader);
		return (DaoUtils.getId(bean) == null)
				? CompletableFuture.supplyAsync(new Supplier<T>() {
					@Override
					public T get() {
						return null;
					}})
				: dl.load(bean.getId());
	}
}
