package mil.dds.anet.utils;

import com.google.common.base.Joiner;
import java.lang.invoke.MethodHandles;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.views.AbstractAnetBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DaoUtils {

  public enum DbType {
    MSSQL("sqlserver"), POSTGRESQL("postgresql");

    private String jdbcTag;

    private DbType(String tag) {
      jdbcTag = tag;
    }

    public static DbType fromTag(String tag) {
      for (DbType t : DbType.values()) {
        if (t.jdbcTag.equalsIgnoreCase(tag)) {
          return t;
        }
      }
      throw new IllegalArgumentException("No database type found for JDBC tag " + tag);
    }
  }

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public static String getUuid(AbstractAnetBean obj) {
    if (obj == null) {
      return null;
    }
    return obj.getUuid();
  }

  public static Integer getEnumId(Enum<?> o) {
    if (o == null) {
      return null;
    }
    return o.ordinal();
  }

  /* This never changes during execution, so statically cache it. */
  private static DbType DB_TYPE = null;

  public static DbType getDbType(String dbUrl) {
    // No locking because this operation is idempotent and safe
    if (DB_TYPE == null) {
      final String driverType = dbUrl.split(":", 3)[1].toLowerCase();
      DB_TYPE = DbType.fromTag(driverType);
      logger.info("Detected and cached database type as {}", DB_TYPE);
    }
    return DB_TYPE;
  }

  public static boolean isMsSql() {
    return getDbType(AnetObjectEngine.getInstance().getDbUrl()) == DbType.MSSQL;
  }

  public static String getNewUuid() {
    return UUID.randomUUID().toString();
  }

  public static void setInsertFields(AbstractAnetBean bean) {
    bean.setUuid(getNewUuid());
    final Instant now = Instant.now();
    bean.setCreatedAt(now);
    bean.setUpdatedAt(now);
  }

  public static void setUpdateFields(AbstractAnetBean bean) {
    final Instant now = Instant.now();
    bean.setUpdatedAt(now);
  }

  public static void setCommonBeanFields(AbstractAnetBean bean, ResultSet rs, String tableName)
      throws SQLException {
    // Should always be there
    bean.setUuid(rs.getString(getQualifiedFieldName(tableName, "uuid")));

    // Not all beans have createdAt and/or updatedAt
    final String createdAtCol = getQualifiedFieldName(tableName, "createdAt");
    if (MapperUtils.containsColumnNamed(rs, createdAtCol)) {
      bean.setCreatedAt(getInstantAsLocalDateTime(rs, createdAtCol));
    }
    final String updatedAtCol = getQualifiedFieldName(tableName, "updatedAt");
    if (MapperUtils.containsColumnNamed(rs, updatedAtCol)) {
      bean.setUpdatedAt(getInstantAsLocalDateTime(rs, updatedAtCol));
    }
  }

  private static String getQualifiedFieldName(String tableName, String fieldName) {
    final StringBuilder result = new StringBuilder();
    if (!Utils.isEmptyOrNull(tableName)) {
      result.append(tableName);
      result.append("_");
    }
    result.append(fieldName);
    return result.toString();
  }

  public static String buildFieldAliases(String tableName, String[] fields, boolean addAs) {
    final List<String> fieldAliases = new LinkedList<String>();
    for (String field : fields) {
      final StringBuilder sb = new StringBuilder(String.format("\"%s\".\"%s\"", tableName, field));
      if (addAs) {
        sb.append(String.format(" AS \"%s_%s\"", tableName, field));
      }
      fieldAliases.add(sb.toString());
    }
    return " " + Joiner.on(", ").join(fieldAliases) + " ";
  }

  public static Double getOptionalDouble(final ResultSet rs, final String columnName)
      throws SQLException {
    final Double value = rs.getDouble(columnName);
    return rs.wasNull() ? null : value;
  }

  public static Integer getOptionalInt(final ResultSet rs, final String columnName)
      throws SQLException {
    final Integer value = rs.getInt(columnName);
    return rs.wasNull() ? null : value;
  }

  public static Person getUser(Map<String, Object> context, Person user) {
    if (context != null && context.containsKey("user")) {
      user = getUserFromContext(context);
    }
    return user;
  }

  public static Person getUserFromContext(Map<String, Object> context) {
    return (Person) context.get("user");
  }

  public static ZoneId getDefaultZoneId() {
    return ZoneId.of("UTC");
  }

  public static ZoneOffset getDefaultZoneOffset() {
    return ZoneOffset.UTC;
  }

  public static Instant getInstantAsLocalDateTime(ResultSet rs, String field) throws SQLException {
    // We would like to do <code>rs.getObject(field, java.time.Instant.class)</code>
    // but the MSSQL JDBC driver does not support that (yet).
    // However, as of the 7.1.0 preview, at least java.time.LocalDateTime *is* supported.
    final LocalDateTime result = rs.getObject(field, LocalDateTime.class);
    if (result != null) {
      return result.toInstant(getDefaultZoneOffset());
    }
    return null;
  }

  public static void addInstantAsLocalDateTime(Map<String, Object> args, String parameterName,
      Instant parameterValue) {
    // Likewise, the conversion by the MSSQL JDBC driver from java.time.Instant to a query parameter
    // uses the local time zone, so use java.time.LocalDateTime with an explicit time zone.
    final LocalDateTime localValue;
    if (parameterValue == null) {
      localValue = null;
    } else {
      // Convert relative time if needed
      final Instant convertedParameterValue = handleRelativeDate(parameterValue);
      localValue = asLocalDateTime(convertedParameterValue);
    }
    args.put(parameterName, localValue);
  }

  public static LocalDateTime asLocalDateTime(final Instant instant) {
    return instant == null ? null : LocalDateTime.ofInstant(instant, getDefaultZoneId());
  }

  /*
   * For all search interfaces we accept either specific dates as number of milliseconds since the
   * Unix Epoch, OR a number of milliseconds relative to today's date. Relative times should be
   * milliseconds less than one year. Since it doesn't make sense to look for any data between 1968
   * and 1971.
   */
  private static final long MILLIS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;

  private static Instant handleRelativeDate(Instant input) {
    final Long millis = input.toEpochMilli();
    if (millis < MILLIS_IN_YEAR) {
      long now = Instant.now().toEpochMilli();
      return Instant.ofEpochMilli(now + millis);
    }
    return input;
  }
}
