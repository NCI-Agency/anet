package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.ReportSensitiveInformation;

public class ReportSensitiveInformationMapper implements ResultSetMapper<ReportSensitiveInformation> {

	@Override
	public ReportSensitiveInformation map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		final ReportSensitiveInformation rsi = new ReportSensitiveInformation();
		rsi.setId(rs.getInt("reportsSensitiveInformation_id"));
		rsi.setText(rs.getString("reportsSensitiveInformation_text"));
		rsi.setCreatedAt(new DateTime(rs.getTimestamp("reportsSensitiveInformation_createdAt")));
		rsi.setUpdatedAt(new DateTime(rs.getTimestamp("reportsSensitiveInformation_updatedAt")));
		return rsi;
	}

}
