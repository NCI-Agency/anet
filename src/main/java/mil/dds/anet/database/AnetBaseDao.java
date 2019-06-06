package mil.dds.anet.database;

import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.DaoUtils.DbType;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
public abstract class AnetBaseDao<T extends AbstractAnetBean> implements IAnetDao<T> {

  @Inject
  private Provider<Handle> handle;

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

}
