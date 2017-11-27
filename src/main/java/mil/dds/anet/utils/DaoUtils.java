package mil.dds.anet.utils;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import javax.ws.rs.WebApplicationException;

import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;

import com.google.common.base.Joiner;

import mil.dds.anet.views.AbstractAnetBean;

public class DaoUtils {

	public static String MSSQL_SERVER_NAME = "Microsoft SQL Server";
	
	public static Integer getId(AbstractAnetBean obj) { 
		if (obj == null) { return null; }
		return obj.getId();
	}
	
	public static Integer getEnumId(Enum<?> o) { 
		if (o == null) { return null; } 
		return o.ordinal();
	}

	
	/*This never changes during execution, so statically cache it. */
	public static Boolean isMsSql = null;
	
	public static boolean isMsSql(Handle dbHandle) {
		if (isMsSql == null) { 
			try { 
				isMsSql =  dbHandle.getConnection().getMetaData().getDatabaseProductName().equals(DaoUtils.MSSQL_SERVER_NAME);
			} catch (SQLException e) { 
				throw new RuntimeException("Error fetching Database Product Name", e);
			}
		}
		return isMsSql;
	}
	
	public static Integer getGeneratedId(GeneratedKeys<Map<String,Object>> keys) { 
		Map<String,Object> r = keys.first();
		if (r == null) {
			return null;
		}
		Object id = null;
		if (r.containsKey("last_insert_rowid()")) { 
			id = r.get("last_insert_rowid()");
		} else if (r.containsKey("generated_keys")) { 
			id = r.get("generated_keys");
		}
		if (id == null) { return null; } 
		if (id instanceof Integer) { 
			return (Integer) id;
		} else if (id instanceof BigDecimal) { 
			return ((BigDecimal) id).intValue();
		} else { 
			throw new WebApplicationException("Unexpected id type returned from database");
		}
	}
	
	public static String buildFieldAliases(String tableName, String[] fields) { 
		List<String> fieldAliases = new LinkedList<String>();
		for (String field : fields) { 
			fieldAliases.add(String.format("%s.%s AS %s_%s", tableName, field, tableName, field));
		}
		return " " + Joiner.on(", ").join(fieldAliases) + " ";
	}
	
}
