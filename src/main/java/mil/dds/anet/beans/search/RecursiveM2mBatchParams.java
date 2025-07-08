package mil.dds.anet.beans.search;

import java.util.Objects;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.views.AbstractAnetBean;

public class RecursiveM2mBatchParams<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>>
    extends M2mBatchParams<B, T> {

  private String recursiveTableName;
  private String recursiveForeignKey;
  private ISearchQuery.RecurseStrategy recurseStrategy;

  public RecursiveM2mBatchParams(String tableName, String foreignKey, String m2mTableName,
      String m2mLeftKey, String m2mRightKey, String recursiveTableName, String recursiveForeignKey,
      ISearchQuery.RecurseStrategy recurseStrategy) {
    super(tableName, foreignKey, m2mTableName, m2mLeftKey, m2mRightKey);
    this.recursiveTableName = recursiveTableName;
    this.recursiveForeignKey = recursiveForeignKey;
    this.recurseStrategy = recurseStrategy;
  }

  @Override
  public void addQuery(AbstractSearchQueryBuilder<B, T> outerQb,
      AbstractSearchQueryBuilder<B, T> qb) {
    qb.addRecursiveBatchClause(outerQb, getTableName(), new String[] {getForeignKey()},
        "batch_parents", recursiveTableName, getM2mLeftKey(), recursiveForeignKey, "batchUuids",
        getBatchUuids(), recurseStrategy);
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

  public ISearchQuery.RecurseStrategy getRecurseStrategy() {
    return recurseStrategy;
  }

  public void setRecurseStrategy(ISearchQuery.RecurseStrategy recurseStrategy) {
    this.recurseStrategy = recurseStrategy;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), getRecursiveTableName(), getRecursiveForeignKey(),
        getRecurseStrategy());
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof RecursiveM2mBatchParams<?, ?> other)) {
      return false;
    }
    return super.equals(obj)
        && Objects.equals(getRecursiveTableName(), other.getRecursiveTableName())
        && Objects.equals(getRecursiveForeignKey(), other.getRecursiveForeignKey())
        && Objects.equals(getRecurseStrategy(), other.getRecurseStrategy());
  }

  @Override
  public RecursiveM2mBatchParams<B, T> clone() throws CloneNotSupportedException {
    return (RecursiveM2mBatchParams<B, T>) super.clone();
  }

}
