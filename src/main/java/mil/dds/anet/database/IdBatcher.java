package mil.dds.anet.database;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import mil.dds.anet.views.AbstractAnetBean;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.result.ResultIterable;
import org.jdbi.v3.core.mapper.RowMapper;

import com.google.common.base.Joiner;

public class IdBatcher<T extends AbstractAnetBean> {

	private final Handle dbHandle;
	private final String sql;
	private final RowMapper<T> mapper;

	public IdBatcher(Handle dbHandle, String sql, RowMapper<T> mapper) {
		this.dbHandle = dbHandle;
		this.sql = sql;
		this.mapper = mapper;
	}

	public List<T> getByIds(List<String> uuids) {
		final Map<String, Object> args = new HashMap<String, Object>();
		final List<String> argNames = new LinkedList<String>();
		for (int i = 0; i < uuids.size(); i++) {
			final String arg = "uuid" + i;
			argNames.add(":" + arg);
			args.put(arg, uuids.get(i));
		}
		final String queryIds = uuids.isEmpty() ? "-1" : Joiner.on(", ").join(argNames);
		final ResultIterable<T> query = dbHandle.createQuery(String.format(sql, queryIds))
				.bindMap(args)
				.map(mapper);
		final Map<String, T> map = new HashMap<>();
		for (final T obj : query.list()) {
			map.put(obj.getUuid(), obj);
		}
		final List<T> result = new ArrayList<>();
		for (final String uuid : uuids) {
			result.add(map.get(uuid));
		}
		return result;
	}
}
