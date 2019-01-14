package mil.dds.anet.database.mappers;

import java.lang.invoke.MethodHandles;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.core.mapper.RowMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;

import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.utils.DaoUtils;

public class AnetEmailMapper implements RowMapper<AnetEmail> {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	ObjectMapper mapper;

	public AnetEmailMapper() {
		this.mapper = MapperUtils.getDefaultMapper();
	}

	@Override
	public AnetEmail map(ResultSet rs, StatementContext ctx) throws SQLException {
		String jobSpec = rs.getString("jobSpec");
		try {
			AnetEmail email = mapper.readValue(jobSpec, AnetEmail.class);

			email.setId(rs.getInt("id"));
			email.setCreatedAt(DaoUtils.getInstantAsLocalDateTime(rs, "createdAt"));
			return email;
		} catch (Exception e) {
			logger.error("Error mapping email", e);
		}
		return null;
	}
}
