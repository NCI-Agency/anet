package mil.dds.anet.database;

import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.DaoUtils.DbType;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
public abstract class AnetBaseDao<T extends AbstractAnetBean> implements IAnetDao<T> {

  @Inject
  private Provider<Handle> handle;
  private final String entityTag;
  private String tableName;
  private String fieldList;
  private String orderBy;

  private String getAllSql;
  private String countAllSql;

  public AnetBaseDao(String entityTag, String tableName, String fieldList, String orderBy) {
    this.entityTag = entityTag;
    this.tableName = tableName;
    this.fieldList = fieldList;
    this.orderBy = orderBy;
  }

  public T insert(T obj) {
    DaoUtils.setInsertFields(obj);
    return insertInternal(obj);
  }

  public int update(T obj) {
    DaoUtils.setUpdateFields(obj);
    return updateInternal(obj);
  }

  public int delete(String uuid) {
    return deleteInternal(uuid);
  }

  protected Handle getDbHandle() {
    return handle.get();
  }

  protected DbType getDbType() {
    return DaoUtils.getDbType(AnetObjectEngine.getInstance().getDbUrl());
  }

  protected Query getPagedQuery(int pageNum, int pageSize) {
    return getDbHandle().createQuery(getGetAllSql()).bind("limit", pageSize).bind("offset",
        pageSize * pageNum);
  }

  protected Long getSqliteRowCount() {
    if (getDbType() == DbType.SQLITE) {
      return getDbHandle().createQuery(getCountAllSql()).mapTo(Long.class).findFirst().orElse(null);
    }
    return null;
  }

  public String getGetAllSql() {
    if (getAllSql == null) {
      getAllSql =
          DaoUtils.buildPagedGetAllSql(getDbType(), entityTag, tableName, fieldList, orderBy);
    }
    return getAllSql;
  }

  public String getCountAllSql() {
    if (countAllSql == null) {
      countAllSql = DaoUtils.buildCountAllSql(entityTag, tableName);
    }
    return countAllSql;
  }
}
