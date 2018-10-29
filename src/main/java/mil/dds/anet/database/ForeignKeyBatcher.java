package mil.dds.anet.database;

import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import mil.dds.anet.database.mappers.ForeignKeyMapper;
import mil.dds.anet.database.mappers.ForeignKeyTuple;
import mil.dds.anet.views.AbstractAnetBean;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.result.ResultIterable;
import org.jdbi.v3.core.mapper.RowMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ForeignKeyBatcher<T extends AbstractAnetBean> {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
	private static final List<String> defaultIfEmpty = Arrays.asList("-1");

	private final Handle dbHandle;
	private final String sql;
	private final String paramName;
	private final ForeignKeyMapper<T> mapper;
	private final String foreignKeyName;

	public ForeignKeyBatcher(Handle dbHandle, String sql, String paramName, RowMapper<T> objectMapper, String foreignKeyName) {
		this.dbHandle = dbHandle;
		this.sql = sql;
		this.paramName = paramName;
		this.mapper = new ForeignKeyMapper<>(foreignKeyName, objectMapper);
		this.foreignKeyName = foreignKeyName;
	}

	public List<List<T>> getByForeignKeys(List<String> foreignKeys) {
		final List<String> args = foreignKeys.isEmpty() ? defaultIfEmpty : foreignKeys;
		final ResultIterable<ForeignKeyTuple<T>> query = dbHandle.createQuery(sql)
				.bindList(paramName, args)
				.map(mapper);
		final Map<String, List<T>> map = new HashMap<>();
		for (final ForeignKeyTuple<T> obj : query.list()) {
			try {
				final String foreignKey = obj.getForeignKey();
				List<T> list = map.get(foreignKey);
				if (list == null) {
					list = new ArrayList<>(); 
					map.put(foreignKey, list);
				}
				list.add(obj.getObject());
			} catch (Exception e) {
				logger.error("Failed to retrieve property {} of {}: {}", foreignKeyName, obj, e);
			}
		}
		final List<List<T>> result = new ArrayList<>();
		for (final String foreignKey : foreignKeys) {
			final List<T> l = map.get(foreignKey);
			result.add((l == null) ? new ArrayList<T>() : l);
		}
		return result;
	}
}
