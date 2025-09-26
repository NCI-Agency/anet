package mil.dds.anet.beans.search;

import java.util.Objects;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.views.AbstractAnetBean;

public class RecursiveFkBatchParams<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>>
    extends FkBatchParams<B, T> {

  private final String recursiveTableName;
  private final String recursiveForeignKey;
  private final RecurseStrategy recurseStrategy;

  public RecursiveFkBatchParams(String tableName, String foreignKey, String recursiveTableName,
      String recursiveForeignKey, RecurseStrategy recurseStrategy) {
    super(tableName, foreignKey);
    this.recursiveTableName = recursiveTableName;
    this.recursiveForeignKey = recursiveForeignKey;
    this.recurseStrategy = recurseStrategy;
  }

  @Override
  public void addQuery(AbstractSearchQueryBuilder<B, T> outerQb,
      AbstractSearchQueryBuilder<B, T> qb) {
    qb.addRecursiveBatchClause(outerQb, getTableName(), new String[] {getForeignKey()},
        "batch_parents", recursiveTableName, "uuid", recursiveForeignKey, "batchUuids",
        getBatchUuids(), recurseStrategy, null);
  }

  public String getRecursiveTableName() {
    return recursiveTableName;
  }

  public String getRecursiveForeignKey() {
    return recursiveForeignKey;
  }

  public RecurseStrategy getRecurseStrategy() {
    return recurseStrategy;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), getRecursiveTableName(), getRecursiveForeignKey(),
        getRecurseStrategy());
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof RecursiveFkBatchParams)) {
      return false;
    }
    final RecursiveFkBatchParams<?, ?> other = (RecursiveFkBatchParams<?, ?>) obj;
    return super.equals(obj)
        && Objects.equals(getRecursiveTableName(), other.getRecursiveTableName())
        && Objects.equals(getRecursiveForeignKey(), other.getRecursiveForeignKey())
        && Objects.equals(getRecurseStrategy(), other.getRecurseStrategy());
  }

  @Override
  public RecursiveFkBatchParams<B, T> clone() throws CloneNotSupportedException {
    return (RecursiveFkBatchParams<B, T>) super.clone();
  }

}
