package mil.dds.anet.views;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.dataloader.DataLoader;
import org.dataloader.DataLoaderRegistry;

import mil.dds.anet.utils.DaoUtils;

public class IdFetcher<T extends AbstractAnetBean> {
	public CompletableFuture<T> load(Map<String, Object> context, String dataLoader, T bean) {
		final DataLoaderRegistry dlr = (DataLoaderRegistry) context.get("dataLoaderRegistry");
		final DataLoader<String, T> dl = dlr.getDataLoader(dataLoader);
		return (DaoUtils.getUuid(bean) == null)
				? CompletableFuture.supplyAsync(() -> null)
				: dl.load(bean.getUuid());
	}
}
