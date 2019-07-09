package mil.dds.anet.beans.search;

import java.util.List;
import java.util.Objects;

public class BatchParams implements Cloneable {
  private String tableName;
  private String m2mTableName;
  private String m2mLeftKey;
  private String m2mRightKey;
  private List<String> batchUuids;

  public BatchParams(String tableName, String m2mTableName, String m2mLeftKey, String m2mRightKey) {
    this.tableName = tableName;
    this.m2mTableName = m2mTableName;
    this.m2mLeftKey = m2mLeftKey;
    this.m2mRightKey = m2mRightKey;
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

  public List<String> getBatchUuids() {
    return batchUuids;
  }

  public void setBatchUuids(List<String> batchUuids) {
    this.batchUuids = batchUuids;
  }

  @Override
  public int hashCode() {
    // Note: batchUuids should *not* be part of the hashCode!
    return Objects.hash(tableName, m2mTableName, m2mLeftKey, m2mRightKey);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof BatchParams)) {
      return false;
    }
    final BatchParams other = (BatchParams) obj;
    // Note: batchUuids should *not* be part of the equals!
    return Objects.equals(tableName, other.getTableName())
        && Objects.equals(m2mTableName, other.getM2mTableName())
        && Objects.equals(m2mLeftKey, other.getM2mLeftKey())
        && Objects.equals(m2mRightKey, other.getM2mRightKey());
  }

  @Override
  public Object clone() throws CloneNotSupportedException {
    final BatchParams clone = (BatchParams) super.clone();
    clone.setBatchUuids(null);
    return clone;
  }
}
