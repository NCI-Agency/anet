package mil.dds.anet.beans.search;

import java.util.Objects;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.views.AbstractAnetBean;

public class RecursiveFkBatchParams<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>>
    extends FkBatchParams<B, T> {
  private String recursiveTableName;
  private String recursiveForeignKey;

  public RecursiveFkBatchParams(String tableName, String foreignKey, String recursiveTableName,
      String recursiveForeignKey) {
    super(tableName, foreignKey);
    this.recursiveTableName = recursiveTableName;
    this.recursiveForeignKey = recursiveForeignKey;
  }

  @Override
  public void addQuery(AbstractSearchQueryBuilder<B, T> outerQb,
      AbstractSearchQueryBuilder<B, T> qb) {
    qb.addRecursiveBatchClause(outerQb, getTableName(), new String[] {getForeignKey()},
        "batch_parents", recursiveTableName, recursiveForeignKey, "batchUuids", getBatchUuids());
  }

  public String getRecursiveTableName() {
    return recursiveTableName;
  }

  public void setRecursiveTableName(String recursiveTableName) {
    this.recursiveTableName = recursiveTableName;
  }

  public String getRecursiveForeignKey() {
    return recursiveForeignKey;
  }

  public void setRecursiveForeignKey(String recursiveForeignKey) {
    this.recursiveForeignKey = recursiveForeignKey;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), getRecursiveTableName(), getRecursiveForeignKey());
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof RecursiveFkBatchParams)) {
      return false;
    }
    final RecursiveFkBatchParams<?, ?> other = (RecursiveFkBatchParams<?, ?>) obj;
    return super.equals(obj)
        && Objects.equals(getRecursiveTableName(), other.getRecursiveTableName())
        && Objects.equals(getRecursiveForeignKey(), other.getRecursiveForeignKey());
  }
}
