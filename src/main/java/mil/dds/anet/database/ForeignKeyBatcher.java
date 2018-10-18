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

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.tweak.ResultSetMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Joiner;

public class ForeignKeyBatcher<T extends AbstractAnetBean> {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	private final Handle dbHandle;
	private final String sql;
	private final ForeignKeyMapper<T> mapper;
	private final String foreignKeyName;

	public ForeignKeyBatcher(Handle dbHandle, String sql, ResultSetMapper<T> objectMapper, String foreignKeyName) {
		this.dbHandle = dbHandle;
		this.sql = sql;
		this.mapper = new ForeignKeyMapper<>(foreignKeyName, objectMapper);
		this.foreignKeyName = foreignKeyName;
	}

	public List<List<T>> getByForeignKeys(List<Integer> foreignKeys) {
		final Map<String, Object> args = new HashMap<String, Object>();
		final List<String> argNames = new LinkedList<String>();
		for (int i = 0; i < foreignKeys.size(); i++) {
			final String arg = "id" + i;
			argNames.add(":" + arg);
			args.put(arg, foreignKeys.get(i));
		}
		final String queryKeys = foreignKeys.isEmpty() ? "-1" : Joiner.on(", ").join(argNames);
		final Query<ForeignKeyTuple<T>> query = dbHandle.createQuery(String.format(sql, queryKeys))
				.bindFromMap(args)
				.map(mapper);
		final Map<Integer, List<T>> map = new HashMap<>();
		for (final ForeignKeyTuple<T> obj : query.list()) {
			try {
				final Integer foreignKey = obj.getForeignKey();
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
		for (final int foreignKey : foreignKeys) {
			final List<T> l = map.get(foreignKey);
			result.add((l == null) ? new ArrayList<T>() : l);
		}
		return result;
	}
}
