package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import javax.ws.rs.WebApplicationException;

import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Joiner;

import mil.dds.anet.beans.Person;
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
	
	public static Integer getId(AbstractAnetBean obj) { 
		if (obj == null) { return null; }
		return obj.getId();
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
	
	public static Integer getGeneratedId(GeneratedKeys<Map<String,Object>> keys) { 
		Map<String,Object> r = keys.first();
		if (r == null) {
			return null;
		}
		Object id = null;
		// NOTE: this could probably be a switch on DB_TYPE instead, with modest care
		if (r.containsKey("last_insert_rowid()")) { 
			id = r.get("last_insert_rowid()");
		} else if (r.containsKey("generated_keys")) { 
			id = r.get("generated_keys");
		} else if (r.containsKey("id")) {
			id = r.get("id");
		}
		if (id == null) { return null; } 
		if (id instanceof Integer) { 
			return (Integer) id;
		} else if (id instanceof Number) {
			return ((Number) id).intValue();
		} else {
			logger.error("Database returned an ID of type {} (not a Number or Integer)", id.getClass());
			throw new WebApplicationException("Unexpected id type returned from database");
		}
	}
	
	public static String buildFieldAliases(String tableName, String[] fields) { 
		List<String> fieldAliases = new LinkedList<String>();
		for (String field : fields) { 
			fieldAliases.add(String.format("\"%s\".\"%s\" AS %s_%s", tableName, field, tableName, field));
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
