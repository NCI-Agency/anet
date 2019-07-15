package mil.dds.anet.beans.search;

import java.util.Objects;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.views.AbstractAnetBean;

public class M2mBatchParams extends AbstractBatchParams {
  private String tableName;
  private String m2mTableName;
  private String m2mLeftKey;
  private String m2mRightKey;

  public M2mBatchParams(String tableName, String m2mTableName, String m2mLeftKey,
      String m2mRightKey) {
    super();
    this.tableName = tableName;
    this.m2mTableName = m2mTableName;
    this.m2mLeftKey = m2mLeftKey;
    this.m2mRightKey = m2mRightKey;
  }

  @Override
  public void addQuery(
      AbstractSearchQueryBuilder<? extends AbstractAnetBean, ? extends AbstractSearchQuery<?>> qb) {
    qb.addFromClause(String.format("LEFT JOIN %1$s ON %1$s.%2$s = %3$s.uuid", getM2mTableName(),
        getM2mLeftKey(), getTableName()));
    qb.addSelectClause(
        String.format("%1$s.%2$s AS \"batchUuid\"", getM2mTableName(), getM2mRightKey()));
    qb.addWhereClause(
        String.format("%1$s.%2$s IN ( <batchUuids> )", getM2mTableName(), getM2mRightKey()));
    qb.addListArg("batchUuids", getBatchUuids());
  }

  public String getTableName() {
    return tableName;
  }

  public void setTableName(String tableName) {
    this.tableName = tableName;
  }

  public String getM2mTableName() {
    return m2mTableName;
  }

  public void setM2mTableName(String m2mTableName) {
    this.m2mTableName = m2mTableName;
  }

  public String getM2mLeftKey() {
    return m2mLeftKey;
  }

  public void setM2mLeftKey(String m2mLeftKey) {
    this.m2mLeftKey = m2mLeftKey;
  }

  public String getM2mRightKey() {
    return m2mRightKey;
  }

  public void setM2mRightKey(String m2mRightKey) {
    this.m2mRightKey = m2mRightKey;
  }

  @Override
  public int hashCode() {
    return Objects.hash(tableName, m2mTableName, m2mLeftKey, m2mRightKey);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof M2mBatchParams)) {
      return false;
    }
    final M2mBatchParams other = (M2mBatchParams) obj;
    return Objects.equals(tableName, other.getTableName())
        && Objects.equals(m2mTableName, other.getM2mTableName())
        && Objects.equals(m2mLeftKey, other.getM2mLeftKey())
        && Objects.equals(m2mRightKey, other.getM2mRightKey());
  }
}
