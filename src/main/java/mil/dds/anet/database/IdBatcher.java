package mil.dds.anet.database;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import mil.dds.anet.views.AbstractAnetBean;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import com.google.common.base.Joiner;

public class IdBatcher<T extends AbstractAnetBean> {

	private final Handle dbHandle;
	private final String sql;
	private final ResultSetMapper<T> mapper;

	public IdBatcher(Handle dbHandle, String sql, ResultSetMapper<T> mapper) {
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
		final Query<T> query = dbHandle.createQuery(String.format(sql, queryIds))
				.bindFromMap(args)
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
