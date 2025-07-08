package mil.dds.anet.beans.search;

import java.util.Objects;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.views.AbstractAnetBean;

public class FkBatchParams<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>>
    extends AbstractBatchParams<B, T> {

  private final String tableName;
  private final String foreignKey;

  public FkBatchParams(String tableName, String foreignKey) {
    super();
    this.tableName = tableName;
    this.foreignKey = foreignKey;
  }

  @Override
  public void addQuery(AbstractSearchQueryBuilder<B, T> outerQb,
      AbstractSearchQueryBuilder<B, T> qb) {
    qb.addSelectClause(
        String.format("%1$s.%2$s AS \"batchUuid\"", getTableName(), getForeignKey()));
    qb.addWhereClause(
        String.format("%1$s.%2$s IN ( <batchUuids> )", getTableName(), getForeignKey()));
    qb.addListArg("batchUuids", getBatchUuids());
  }

  public String getTableName() {
    return tableName;
  }

  public String getForeignKey() {
    return foreignKey;
  }

  @Override
  public int hashCode() {
    return Objects.hash(tableName, foreignKey);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof FkBatchParams)) {
      return false;
    }
    final FkBatchParams<?, ?> other = (FkBatchParams<?, ?>) obj;
    return Objects.equals(tableName, other.getTableName())
        && Objects.equals(foreignKey, other.getForeignKey());
  }

  @Override
  public FkBatchParams<B, T> clone() throws CloneNotSupportedException {
    return (FkBatchParams<B, T>) super.clone();
  }

}
