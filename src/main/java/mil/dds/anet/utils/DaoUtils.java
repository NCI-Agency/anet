package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.joda.time.DateTime;
import org.jdbi.v3.core.Handle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Joiner;

import mil.dds.anet.beans.Person;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.views.AbstractAnetBean;

public class DaoUtils {

	public enum DbType {
		MSSQL("sqlserver"), SQLITE("sqlite"), POSTGRESQL("postgresql");

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

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	public static String getUuid(AbstractAnetBean obj) {
		if (obj == null) { return null; }
		return obj.getUuid();
	}
	
	public static Integer getEnumId(Enum<?> o) { 
		if (o == null) { return null; } 
		return o.ordinal();
	}

	/*This never changes during execution, so statically cache it. */
	private static DbType DB_TYPE = null;

	public static DbType getDbType(Handle dbHandle) {
		// No locking because this operation is idempotent and safe
		if (DB_TYPE == null) {
			try { 
				String databaseUrl = dbHandle.getConnection().getMetaData().getURL();
				String driverType = databaseUrl.split(":", 3)[1].toLowerCase();
				DB_TYPE = DbType.fromTag(driverType);
				logger.info("Detected and cached database type as {}", DB_TYPE);
			} catch (SQLException e) { 
				throw new RuntimeException("Error determining database type", e);
			}
		}
		return DB_TYPE;
	}

	public static boolean isMsSql(Handle dbHandle) {
		return getDbType(dbHandle) == DbType.MSSQL;
	}

	public static String getNewUuid() {
		return UUID.randomUUID().toString();
	}

	public static void setInsertFields(AbstractAnetBean bean) {
		bean.setUuid(getNewUuid());
		final DateTime now = DateTime.now();
		bean.setCreatedAt(now);
		bean.setUpdatedAt(now);
	}

	public static void setUpdateFields(AbstractAnetBean bean) {
		final DateTime now = DateTime.now();
		bean.setUpdatedAt(now);
	}

	public static void setCommonBeanFields(AbstractAnetBean bean, ResultSet rs, String tableName)
			throws SQLException {
		// Should always be there
		bean.setUuid(rs.getString(getQualifiedFieldName(tableName, "uuid")));

		// Not all beans have createdAt and/or updatedAt
		final String createdAtCol = getQualifiedFieldName(tableName, "createdAt");
		if (MapperUtils.containsColumnNamed(rs, createdAtCol)) {
			bean.setCreatedAt(new DateTime(rs.getTimestamp(createdAtCol)));
		}
		final String updatedAtCol = getQualifiedFieldName(tableName, "updatedAt");
		if (MapperUtils.containsColumnNamed(rs, updatedAtCol)) {
			bean.setUpdatedAt(new DateTime(rs.getTimestamp(updatedAtCol)));
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
				sb.append(String.format(" AS %s_%s", tableName, field));
			}
			fieldAliases.add(sb.toString());
		}
		return " " + Joiner.on(", ").join(fieldAliases) + " ";
	}

	public static String buildPagedGetAllSql(DbType databaseType, String entityTag, String tableName, String fieldList) {
		return buildPagedGetAllSql(databaseType, entityTag, tableName, fieldList, null);
	}

	public static String buildPagedGetAllSql(DbType databaseType, String entityTag,
			String tableName, String fieldList, String orderBy) {
		if (orderBy == null) {
			orderBy = "\"createdAt\"";
		}
		StringBuilder sb = new StringBuilder("/* getAll%s */ SELECT %s ");
		switch (databaseType) {
			case MSSQL:
				sb.append(", count(*) over() AS \"totalCount\" FROM %s ")
				  .append("ORDER BY %s ASC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY");
				break;
			case SQLITE:
				sb.append("FROM %s ORDER BY %s ASC LIMIT :limit OFFSET :offset");
				break;
			case POSTGRESQL:
				sb.append(", count(*) over() AS \"totalCount\" ")
				  .append("FROM %s ORDER BY %s ASC LIMIT :limit OFFSET :offset");
				break;
			default:
				throw new RuntimeException();
		}

		return String.format(sb.toString(), entityTag, fieldList, tableName, orderBy);
	}

	public static String buildCountAllSql(String entityTag, String tableName) {
		return String.format("/* countAll%s */ SELECT COUNT(1) from \"%s\"", entityTag, tableName);
	}

	public static Double getOptionalDouble(final ResultSet rs, final String columnName) throws SQLException {
	    final Double value = rs.getDouble(columnName);
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
}
