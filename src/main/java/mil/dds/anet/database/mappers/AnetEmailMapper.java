package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.joda.JodaModule;

import mil.dds.anet.beans.AnetEmail;

public class AnetEmailMapper implements ResultSetMapper<AnetEmail> {

	private static final Logger logger = LoggerFactory.getLogger(AnetEmailMapper.class);

	ObjectMapper mapper;

	public AnetEmailMapper() {
		this.mapper = new ObjectMapper();
		mapper.registerModule(new JodaModule());
		//mapper.enableDefaultTyping();
	}

	@Override
	public AnetEmail map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		String jobSpec = rs.getString("jobSpec");
		try {
			AnetEmail email = mapper.readValue(jobSpec, AnetEmail.class);

			email.setId(rs.getInt("id"));
			email.setCreatedAt(new DateTime(rs.getTimestamp("createdAt")));
			return email;
		} catch (Exception e) {
			logger.error("Error mapping email", e);
		}
		return null;
	}
}
