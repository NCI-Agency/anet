package mil.dds.anet.database;

import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
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

import com.google.common.base.Joiner;

public class ForeignKeyBatcher<T extends AbstractAnetBean> {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	private final Handle dbHandle;
	private final String sql;
	private final ForeignKeyMapper<T> mapper;
	private final String foreignKeyName;

	public ForeignKeyBatcher(Handle dbHandle, String sql, RowMapper<T> objectMapper, String foreignKeyName) {
		this.dbHandle = dbHandle;
		this.sql = sql;
		this.mapper = new ForeignKeyMapper<>(foreignKeyName, objectMapper);
		this.foreignKeyName = foreignKeyName;
	}

	public List<List<T>> getByForeignKeys(List<String> foreignKeys) {
		final Map<String, Object> args = new HashMap<String, Object>();
		final List<String> argNames = new LinkedList<String>();
		for (int i = 0; i < foreignKeys.size(); i++) {
			final String arg = "uuid" + i;
			argNames.add(":" + arg);
			args.put(arg, foreignKeys.get(i));
		}
		final String queryKeys = foreignKeys.isEmpty() ? "-1" : Joiner.on(", ").join(argNames);
		final ResultIterable<ForeignKeyTuple<T>> query = dbHandle.createQuery(String.format(sql, queryKeys))
				.bindMap(args)
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
