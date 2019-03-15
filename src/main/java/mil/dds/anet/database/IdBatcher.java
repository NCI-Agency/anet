package mil.dds.anet.database;

import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.AnetObjectEngine.HandleWrapper;
import mil.dds.anet.views.AbstractAnetBean;

import org.jdbi.v3.core.result.ResultIterable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.jdbi.v3.core.mapper.RowMapper;

public class IdBatcher<T extends AbstractAnetBean> {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	private static final List<String> defaultIfEmpty = Arrays.asList("-1");

	private final AnetObjectEngine engine;
	private final String sql;
	private final String paramName;
	private final RowMapper<T> mapper;

	public IdBatcher(AnetObjectEngine engine, String sql, String paramName, RowMapper<T> mapper) {
		this.engine = engine;
		this.sql = sql;
		this.paramName = paramName;
		this.mapper = mapper;
	}

	public List<T> getByIds(List<String> uuids) {
		try (final HandleWrapper h = engine.openDbHandleWrapper()) {
			final List<String> args = uuids.isEmpty() ? defaultIfEmpty : uuids;
			final ResultIterable<T> query = engine.getDbHandle().createQuery(sql)
					.bindList(paramName, args)
					.map(mapper);
			final Map<String, T> map = query.collect(Collectors.toMap(
					obj -> obj.getUuid(), // key
					obj -> obj)); //value
			return uuids.stream().map(uuid -> map.get(uuid)).collect(Collectors.toList());
		} catch (IOException e) {
			logger.error("closing handle wrapper failed", e);
			return new ArrayList<>();
		}
	}
}
