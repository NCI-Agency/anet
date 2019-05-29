package mil.dds.anet.search;

import javax.inject.Inject;
import javax.inject.Provider;
import org.jdbi.v3.core.Handle;

public abstract class AbstractSearcher {

  @Inject
  private Provider<Handle> handle;

  public AbstractSearcher() {}

  protected Handle getDbHandle() {
    return handle.get();
  }

}
