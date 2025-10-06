package mil.dds.anet.database;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AnetBaseDao<T extends AbstractAnetBean, S extends AbstractSearchQuery<?>>
    extends AbstractDao implements IAnetDao<T> {

  protected AnetBaseDao(final DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Transactional
  @Override
  public T insert(T obj) {
    DaoUtils.setInsertFields(obj);
    return insertInternal(obj);
  }

  @Transactional
  @Override
  public int update(T obj) {
    DaoUtils.setUpdateFields(obj);
    return updateInternal(obj);
  }

  @Transactional
  @Override
  public int delete(String uuid) {
    return deleteInternal(uuid);
  }

  @Override
  public int deleteInternal(String uuid) {
    throw new UnsupportedOperationException();
  }

  public AnetBeanList<T> search(S query) {
    throw new UnsupportedOperationException();
  }

  // Some convenience functions for merging objects

  protected void updateForMerge(String tableName, String fieldName, String winnerUuid,
      String loserUuid) {
    final Handle handle = getDbHandle();
    try {
      final String sqlUpdateFormat =
          "UPDATE \"%1$s\" SET \"%2$s\" = :winnerUuid WHERE \"%2$s\" = :loserUuid";
      handle.createUpdate(String.format(sqlUpdateFormat, tableName, fieldName))
          .bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  protected void updateM2mForMerge(String tableName, String mainObjectFieldName,
      String relatedObjectFieldName, String winnerUuid, String loserUuid) {
    final Handle handle = getDbHandle();
    try {
      // update m2m objects where we don't already have the same object for the winnerUuid
      final String sqlUpdateFormat = "UPDATE \"%1$s\" SET \"%3$s\" = :winnerUuid"
          + " WHERE \"%3$s\" = :loserUuid AND \"%2$s\" NOT IN ("
          + "SELECT \"%2$s\" FROM \"%1$s\" WHERE \"%3$s\" = :winnerUuid)";
      handle
          .createUpdate(String.format(sqlUpdateFormat, tableName, mainObjectFieldName,
              relatedObjectFieldName))
          .bind("winnerUuid", winnerUuid).bind("loserUuid", loserUuid).execute();

      // now delete obsolete m2m objects for the loserUuid
      deleteForMerge(tableName, relatedObjectFieldName, loserUuid);
    } finally {
      closeDbHandle(handle);
    }
  }

  protected int deleteForMerge(String tableName, String fieldName, String loserUuid) {
    final String sqlDeleteFormat = "DELETE FROM \"%1$s\" WHERE \"%2$s\" = :loserUuid";
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(String.format(sqlDeleteFormat, tableName, fieldName))
          .bind("loserUuid", loserUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  // For testing purposes only!
  @Transactional
  public int _deleteByUuid(String tableName, String fieldName, String uuid) {
    return deleteForMerge(tableName, fieldName, uuid);
  }

  protected AnetDictionary dict() {
    return ApplicationContextProvider.getDictionary();
  }

  protected AnetObjectEngine engine() {
    return ApplicationContextProvider.getEngine();
  }
}
