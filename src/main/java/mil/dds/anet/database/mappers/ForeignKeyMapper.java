package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

public class ForeignKeyMapper<T> implements ResultSetMapper<ForeignKeyTuple<T>> {

	private final String foreignKeyName;
	private final ResultSetMapper<T> objectMapper;

	public ForeignKeyMapper(String foreignKeyName, ResultSetMapper<T> objectMapper) {
		this.foreignKeyName = foreignKeyName;
		this.objectMapper = objectMapper;
	}
	
	@Override
	public ForeignKeyTuple<T> map(int index, ResultSet rs, StatementContext ctx)
			throws SQLException {
		final Integer foreignKey = rs.getInt(foreignKeyName);
		final T object = objectMapper.map(index, rs, ctx);
		return new ForeignKeyTuple<T>(foreignKey, object);
	}

}
