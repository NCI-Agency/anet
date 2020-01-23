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
import mil.dds.anet.views.AbstractCustomizableAnetBean;
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

  public static boolean isPostgresql() {
    return getDbType(AnetObjectEngine.getInstance().getDbUrl()) == DbType.POSTGRESQL;
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

  public static void setCustomizableBeanFields(AbstractCustomizableAnetBean bean, ResultSet rs,
      String tableName) throws SQLException {
    MapperUtils.setCommonBeanFields(bean, rs, tableName);

    final String customFieldsCol = getQualifiedFieldName(tableName, "customFields");
    if (MapperUtils.containsColumnNamed(rs, customFieldsCol)) {
      bean.setCustomFields(rs.getString(customFieldsCol));
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
   * milliseconds less than one year. Since it doesn't make sense to look for any date before 1971.
   */
  private static final long MILLIS_IN_YEAR = 1000L * 60L * 60L * 24L * 365L;

  public static boolean isRelativeDate(Instant input) {
    if (input == null) {
      return false;
    }
    final long millis = input.toEpochMilli();
    return millis < MILLIS_IN_YEAR;
  }

  private static Instant handleRelativeDate(Instant input) {
    if (isRelativeDate(input)) {
      final long now = Instant.now().toEpochMilli();
      return Instant.ofEpochMilli(now + input.toEpochMilli());
    }
    return input;
  }
}
