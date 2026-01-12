package mil.dds.anet.database;

import java.time.Instant;
import java.util.List;
import mil.dds.anet.beans.EventType;
import mil.dds.anet.beans.WithStatus.Status;
import mil.dds.anet.database.mappers.EventTypeMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;

@Component
public class EventTypeDao {

  public static final String TABLE_NAME = "eventTypes";

  private static final String EVENT_TYPE_FIELDS =
      "\"uuid\", \"code\", \"status\", \"createdAt\", \"updatedAt\"";

  private final DatabaseHandler databaseHandler;

  public EventTypeDao(DatabaseHandler databaseHandler) {
    this.databaseHandler = databaseHandler;
  }

  public EventType getByCode(String code) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createQuery("/* getEventTypeByCode */ SELECT " + EVENT_TYPE_FIELDS + " FROM \""
              + TABLE_NAME + "\" WHERE \"code\" = :code")
          .bind("code", code).map(new EventTypeMapper()).findOne().orElse(null);
    } finally {
      closeDbHandle(handle);
    }
  }

  public List<EventType> getAll() {
    final Handle handle = getDbHandle();
    try {
      return handle.createQuery("/* getAllEventTypes */ SELECT " + EVENT_TYPE_FIELDS + " FROM \""
          + TABLE_NAME + "\" ORDER BY \"code\"").map(new EventTypeMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  public int insert(EventType type) {
    final Instant now = Instant.now();

    if (type.getUuid() == null) {
      type.setUuid(DaoUtils.getNewUuid());
    }
    if (type.getStatus() == null) {
      type.setStatus(Status.ACTIVE);
    }
    type.setCreatedAt(now);
    type.setUpdatedAt(now);

    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* insertEventType */ INSERT INTO \"" + TABLE_NAME + "\" "
              + "(\"uuid\", \"code\", \"status\", \"createdAt\", \"updatedAt\") "
              + "VALUES (:uuid, :code, :status, :createdAt, :updatedAt)")
          .bind("uuid", type.getUuid()).bind("code", type.getCode())
          .bind("status", type.getStatus().ordinal())
          .bind("createdAt", DaoUtils.asLocalDateTime(type.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(type.getUpdatedAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }


  public int updateStatus(String code, Status status) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* updateEventTypeStatus */ UPDATE \"" + TABLE_NAME + "\" "
              + "SET \"status\" = :status, \"updatedAt\" = :updatedAt " + "WHERE \"code\" = :code")
          .bind("code", code).bind("status", status.ordinal())
          .bind("updatedAt", DaoUtils.asLocalDateTime(Instant.now())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public boolean isInUse(String code) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createQuery("/* eventTypeInUse */ SELECT 1 FROM events WHERE type = :code LIMIT 1")
          .bind("code", code).mapTo(Integer.class).findOne().isPresent();
    } finally {
      closeDbHandle(handle);
    }
  }

  public int delete(String code) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate(
              "/* deleteEventType */ DELETE FROM \"" + TABLE_NAME + "\" WHERE \"code\" = :code")
          .bind("code", code).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  private Handle getDbHandle() {
    return databaseHandler.getHandle();
  }

  private void closeDbHandle(Handle handle) {
    databaseHandler.closeHandle(handle);
  }
}
