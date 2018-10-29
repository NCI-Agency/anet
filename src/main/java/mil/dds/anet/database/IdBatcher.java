package mil.dds.anet.database;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import mil.dds.anet.views.AbstractAnetBean;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.result.ResultIterable;
import org.jdbi.v3.core.mapper.RowMapper;

public class IdBatcher<T extends AbstractAnetBean> {

	private static final List<String> defaultIfEmpty = Arrays.asList("-1");

	private final Handle dbHandle;
	private final String sql;
	private final String paramName;
	private final RowMapper<T> mapper;

	public IdBatcher(Handle dbHandle, String sql, String paramName, RowMapper<T> mapper) {
		this.dbHandle = dbHandle;
		this.sql = sql;
		this.paramName = paramName;
		this.mapper = mapper;
	}

	public List<T> getByIds(List<String> uuids) {
		final List<String> args = uuids.isEmpty() ? defaultIfEmpty : uuids;
		final ResultIterable<T> query = dbHandle.createQuery(sql)
				.bindList(paramName, args)
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
