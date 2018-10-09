package mil.dds.anet.database.mappers;

import java.lang.invoke.MethodHandles;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MapperUtils {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	/* Utility function to check for NULL values in the column
	 * Because .getInt returns 0 if the column is null.  Boooo 
	 */
	public static Integer getInteger(ResultSet rs, String columnName) throws SQLException {
		Object res = rs.getObject(columnName);
		if (res == null) { 
			return null; 
		} else if (res instanceof Integer) { 
			return (Integer) res;
		} else { 
			return null;
		}
	}
	
	public static <T extends Enum<T>> T getEnumIdx(ResultSet rs, String columnName, Class<T> clazz) throws SQLException {
		Object res = rs.getObject(columnName);
		if (res == null) { return null; } 
		int idx = rs.getInt(columnName);
		
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
	
}
