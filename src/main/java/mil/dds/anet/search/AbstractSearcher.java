package mil.dds.anet.search;

import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;

public abstract class AbstractSearcher<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>> {

  @Inject
  private Provider<Handle> handle;

  protected final AbstractSearchQueryBuilder<B, T> qb;

  public AbstractSearcher(AbstractSearchQueryBuilder<B, T> qb) {
    this.qb = qb;
  }

  protected Handle getDbHandle() {
    return handle.get();
  }

  protected abstract void buildQuery(T query);

}
