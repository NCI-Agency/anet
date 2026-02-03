package mil.dds.anet.database;

import java.util.List;
import mil.dds.anet.beans.EventType;
import mil.dds.anet.database.mappers.EventTypeMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class EventTypeDao extends AbstractDao {

  private static final String[] fields = {"uuid", "status", "name", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "eventTypes";
  public static final String EVENT_TYPE_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public EventTypeDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  class SelfIdBatcher extends IdBatcher<EventType> {
    private static final String SQL = "/* batch.getEventTypesByUuids */ SELECT " + EVENT_TYPE_FIELDS
        + " FROM \"" + TABLE_NAME + "\" WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(EventTypeDao.this.databaseHandler, SQL, "uuids", new EventTypeMapper());
    }
  }

  @Transactional
  public List<EventType> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Transactional
  public List<EventType> getAll() {
    final Handle handle = getDbHandle();
    try {
      return handle.createQuery("/* getAllEventTypes */ SELECT " + EVENT_TYPE_FIELDS + " FROM \""
          + TABLE_NAME + "\" ORDER BY name").map(new EventTypeMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int insert(EventType eventType) {
    DaoUtils.setInsertFields(eventType);
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* insertEventType */ INSERT INTO \"" + TABLE_NAME + "\" "
              + "(uuid, status, name, \"createdAt\", \"updatedAt\") "
              + "VALUES (:uuid, :status, :name, :createdAt, :updatedAt)")
          .bindBean(eventType).bind("status", DaoUtils.getEnumId(eventType.getStatus()))
          .bind("createdAt", DaoUtils.asLocalDateTime(eventType.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(eventType.getUpdatedAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int update(EventType eventType) {
    DaoUtils.setUpdateFields(eventType);
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* updateEventType */ UPDATE \"" + TABLE_NAME + "\" "
              + "SET status = :status, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(eventType).bind("status", DaoUtils.getEnumId(eventType.getStatus()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(eventType.getUpdatedAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int delete(String uuid) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate(
              "/* deleteEventType */ DELETE FROM \"" + TABLE_NAME + "\" WHERE uuid = :uuid")
          .bind("uuid", uuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }
}
