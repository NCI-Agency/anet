package mil.dds.anet.search;

import javax.inject.Inject;
import javax.inject.Provider;

import org.jdbi.v3.core.Handle;

public class AbstractSearcherBase {

	@Inject
	private Provider<Handle> handle;

	protected Handle getDbHandle() {
		return handle.get();
	}

}
