package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
		final Map<String, T> map = query.collect(Collectors.toMap(
				obj -> obj.getUuid(), // key
				obj -> obj)); //value
		return uuids.stream().map(uuid -> map.get(uuid)).collect(Collectors.toList());
	}
}
