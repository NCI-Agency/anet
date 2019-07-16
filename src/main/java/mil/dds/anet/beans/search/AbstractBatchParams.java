package mil.dds.anet.beans.search;

import java.util.List;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.views.AbstractAnetBean;

public abstract class AbstractBatchParams<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>>
    implements Cloneable {
  private List<String> batchUuids;

  public List<String> getBatchUuids() {
    return batchUuids;
  }

  public void setBatchUuids(List<String> batchUuids) {
    this.batchUuids = batchUuids;
  }

  public abstract void addQuery(AbstractSearchQueryBuilder<B, T> outerQb,
      AbstractSearchQueryBuilder<B, T> qb);

  @Override
  // Note: batchUuids should *not* be part of the hashCode!
  public abstract int hashCode();

  @Override
  // Note: batchUuids should *not* be part of the equals!
  public abstract boolean equals(Object obj);

  @Override
  public Object clone() throws CloneNotSupportedException {
    final AbstractBatchParams<?, ?> clone = (AbstractBatchParams<?, ?>) super.clone();
    clone.setBatchUuids(null);
    return clone;
  }
}
