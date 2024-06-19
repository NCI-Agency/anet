package mil.dds.anet.database;

import jakarta.inject.Inject;
import jakarta.inject.Provider;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.utils.DaoUtils;
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

  public AnetBeanList<T> search(S query) {
    throw new UnsupportedOperationException();
  }

  // Some convenience functions for merging objects

  protected void updateForMerge(String tableName, String fieldName, String winnerUuid,
      String loserUuid) {
    final String sqlUpdateFormat =
        "UPDATE \"%1$s\" SET \"%2$s\" = :winnerUuid WHERE \"%2$s\" = :loserUuid";
    getDbHandle().createUpdate(String.format(sqlUpdateFormat, tableName, fieldName))
        .bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid).execute();
  }

  protected void updateM2mForMerge(String tableName, String mainObjectFieldName,
      String relatedObjectFieldName, String winnerUuid, String loserUuid) {
    // update m2m objects where we don't already have the same object for the winnerUuid
    final String sqlUpdateFormat = "UPDATE \"%1$s\" SET \"%3$s\" = :winnerUuid"
        + " WHERE \"%3$s\" = :loserUuid AND \"%2$s\" NOT IN ("
        + "SELECT \"%2$s\" FROM \"%1$s\" WHERE \"%3$s\" = :winnerUuid)";
    getDbHandle()
        .createUpdate(
            String.format(sqlUpdateFormat, tableName, mainObjectFieldName, relatedObjectFieldName))
        .bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid).execute();

    // now delete obsolete m2m objects for the loserUuid
    deleteForMerge(tableName, relatedObjectFieldName, loserUuid);
  }

  protected int deleteForMerge(String tableName, String fieldName, String loserUuid) {
    final String sqlDeleteFormat = "DELETE FROM \"%1$s\" WHERE \"%2$s\" = :loserUuid";
    return getDbHandle().createUpdate(String.format(sqlDeleteFormat, tableName, fieldName))
        .bind("loserUuid", loserUuid).execute();
  }

  // For testing purposes only!
  @InTransaction
  public int _deleteByUuid(String tableName, String fieldName, String uuid) {
    return deleteForMerge(tableName, fieldName, uuid);
  }
}
