package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.core.mapper.RowMapper;

public class ForeignKeyMapper<T> implements RowMapper<ForeignKeyTuple<T>> {

	private final String foreignKeyName;
	private final RowMapper<T> objectMapper;

	public ForeignKeyMapper(String foreignKeyName, RowMapper<T> objectMapper) {
		this.foreignKeyName = foreignKeyName;
		this.objectMapper = objectMapper;
	}
	
	@Override
	public ForeignKeyTuple<T> map(ResultSet rs, StatementContext ctx)
			throws SQLException {
		final String foreignKey = rs.getString(foreignKeyName);
		final T object = objectMapper.map(rs, ctx);
		return new ForeignKeyTuple<T>(foreignKey, object);
	}

}
