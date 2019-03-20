package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.inject.Inject;
import javax.inject.Provider;

import mil.dds.anet.views.AbstractAnetBean;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.result.ResultIterable;
import org.jdbi.v3.core.mapper.RowMapper;

@InTransaction
public class IdBatcher<T extends AbstractAnetBean> {

	private static final List<String> defaultIfEmpty = Arrays.asList("-1");

	@Inject
	private Provider<Handle> handle;
	private final String sql;
	private final String paramName;
	private final RowMapper<T> mapper;

	public IdBatcher(String sql, String paramName, RowMapper<T> mapper) {
		this.sql = sql;
		this.paramName = paramName;
		this.mapper = mapper;
	}

	protected Handle getDbHandle() {
		return handle.get();
	}

	public List<T> getByIds(List<String> uuids) {
		final List<String> args = uuids.isEmpty() ? defaultIfEmpty : uuids;
		final ResultIterable<T> query = getDbHandle().createQuery(sql)
				.bindList(paramName, args)
				.map(mapper);
		final Map<String, T> map = query.collect(Collectors.toMap(
				obj -> obj.getUuid(), // key
				obj -> obj)); //value
		return uuids.stream().map(uuid -> map.get(uuid)).collect(Collectors.toList());
	}
}
