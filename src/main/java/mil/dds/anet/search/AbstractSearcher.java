package mil.dds.anet.search;

import java.util.ArrayList;
import java.util.List;
import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
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

  protected List<String> getOrderBy(SortOrder sortOrder, String table, String... columns) {
    final List<String> clauses = new ArrayList<>();
    for (final String column : columns) {
      if (table == null) {
        clauses.add(String.format("%1$s %2$s", column, sortOrder));
      } else {
        clauses.add(String.format("%1$s.%2$s %3$s", table, column, sortOrder));
      }
    }
    return clauses;
  }

}
