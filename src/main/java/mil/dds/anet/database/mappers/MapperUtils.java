package mil.dds.anet.database.mappers;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.lang.invoke.MethodHandles;
import java.sql.Blob;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDateTime;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MapperUtils {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public static ObjectMapper getDefaultMapper() {
    return new ObjectMapper().registerModule(new JavaTimeModule())
        .configure(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS, false)
        .configure(DeserializationFeature.READ_DATE_TIMESTAMPS_AS_NANOSECONDS, false);
  }

  public static void setCommonBeanFields(AbstractAnetBean bean, ResultSet rs, String tableName)
      throws SQLException {
    // Should always be there
    bean.setUuid(rs.getString(getQualifiedFieldName(tableName, "uuid")));

    // Not all beans have createdAt and/or updatedAt
    bean.setCreatedAt(getInstantAsLocalDateTime(rs, getQualifiedFieldName(tableName, "createdAt")));
    bean.setUpdatedAt(getInstantAsLocalDateTime(rs, getQualifiedFieldName(tableName, "updatedAt")));

    // Only present when batch searching
    bean.setBatchUuid(getOptionalString(rs, "batchUuid"));
  }

  public static void setCustomizableBeanFields(AbstractCustomizableAnetBean bean, ResultSet rs,
      String tableName) throws SQLException {
    setCommonBeanFields(bean, rs, tableName);
  
    final String customFieldsCol = getQualifiedFieldName(tableName, "customFields");
    if (containsColumnNamed(rs, customFieldsCol)) {
      bean.setCustomFields(rs.getString(customFieldsCol));
    }
  }

  public static Integer getOptionalInt(final ResultSet rs, final String columnName)
      throws SQLException {
    if (!containsColumnNamed(rs, columnName)) {
      return null;
    }
    final int value = rs.getInt(columnName);
    return rs.wasNull() ? null : value;
  }

  public static Double getOptionalDouble(final ResultSet rs, final String columnName)
      throws SQLException {
    if (!containsColumnNamed(rs, columnName)) {
      return null;
    }
    final double value = rs.getDouble(columnName);
    return rs.wasNull() ? null : value;
  }

  public static String getOptionalString(final ResultSet rs, final String columnName)
      throws SQLException {
    if (!containsColumnNamed(rs, columnName)) {
      return null;
    }
    return rs.getString(columnName);
  }

  public static Boolean getOptionalBoolean(final ResultSet rs, final String columnName)
      throws SQLException {
    if (!containsColumnNamed(rs, columnName)) {
      return null;
    }
    return rs.getBoolean(columnName);
  }

  public static Blob getOptionalBlob(final ResultSet rs, final String columnName)
      throws SQLException {
    if (!containsColumnNamed(rs, columnName)) {
      return null;
    }
    return rs.getBlob(columnName);
  }

  public static <T extends Enum<T>> T getEnumIdx(ResultSet rs, String columnName, Class<T> clazz)
      throws SQLException {
    final Integer idx = getOptionalInt(rs, columnName);
    if (idx == null) {
      return null;
    }

    try {
      @SuppressWarnings("unchecked")
      T[] values = (T[]) clazz.getMethod("values").invoke(null);
      return values[idx];
    } catch (Exception e) {
      logger.error("failed to get/invoke method", e);
      return null;
    }
  }

  public static boolean containsColumnNamed(ResultSet rs, String colName) throws SQLException {
    ResultSetMetaData metaData = rs.getMetaData();
    for (int i = 1; i <= metaData.getColumnCount(); i++) {
      if (colName.equals(metaData.getColumnName(i))) {
        return true;
      }
    }
    return false;
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

  public static Instant getInstantAsLocalDateTime(ResultSet rs, String columnName)
      throws SQLException {
    if (!containsColumnNamed(rs, columnName)) {
      return null;
    }
    // We would like to do <code>rs.getObject(columnName, java.time.Instant.class)</code>
    // but the MSSQL JDBC driver does not support that (yet).
    // However, as of the 7.1.0 preview, at least java.time.LocalDateTime *is* supported.
    final LocalDateTime result = rs.getObject(columnName, LocalDateTime.class);
    if (result != null) {
      return result.toInstant(DaoUtils.getDefaultZoneOffset());
    }
    return null;
  }

}
