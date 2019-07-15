package mil.dds.anet.beans.search;

import java.util.Objects;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.views.AbstractAnetBean;

public class FkBatchParams extends AbstractBatchParams {
  private String tableName;
  private String foreignKey;

  public FkBatchParams(String tableName, String foreignKey) {
    super();
    this.tableName = tableName;
    this.foreignKey = foreignKey;
  }

  @Override
  public void addQuery(
      AbstractSearchQueryBuilder<? extends AbstractAnetBean, ? extends AbstractSearchQuery<?>> qb) {
    qb.addSelectClause(
        String.format("%1$s.%2$s AS \"batchUuid\"", getTableName(), getForeignKey()));
    qb.addWhereClause(
        String.format("%1$s.%2$s IN ( <batchUuids> )", getTableName(), getForeignKey()));
    qb.addListArg("batchUuids", getBatchUuids());
  }

  public String getTableName() {
    return tableName;
  }

  public void setTableName(String tableName) {
    this.tableName = tableName;
  }

  public String getForeignKey() {
    return foreignKey;
  }

  public void setForeignKey(String foreignKey) {
    this.foreignKey = foreignKey;
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
    final FkBatchParams other = (FkBatchParams) obj;
    return Objects.equals(tableName, other.getTableName())
        && Objects.equals(foreignKey, other.getForeignKey());
  }
}
