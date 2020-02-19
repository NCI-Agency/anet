package mil.dds.anet.database;

import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.DaoUtils.DbType;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AnetBaseDao<T extends AbstractAnetBean, S extends AbstractSearchQuery<?>>
    implements IAnetDao<T> {

  @Inject
  private Provider<Handle> handle;

  @InTransaction
  @Override
  public T insert(T obj) {
    DaoUtils.setInsertFields(obj);
    return insertInternal(obj);
  }

  @InTransaction
  @Override
  public int update(T obj) {
    DaoUtils.setUpdateFields(obj);
    return updateInternal(obj);
  }

  @InTransaction
  @Override
  public int delete(String uuid) {
    return deleteInternal(uuid);
  }

  @Override
  public int deleteInternal(String uuid) {
    throw new UnsupportedOperationException();
  }

  protected Handle getDbHandle() {
    return handle.get();
  }

  protected DbType getDbType() {
    return DaoUtils.getDbType(AnetObjectEngine.getInstance().getDbUrl());
  }

  public AnetBeanList<T> search(S query) {
    throw new UnsupportedOperationException();
  }

}
