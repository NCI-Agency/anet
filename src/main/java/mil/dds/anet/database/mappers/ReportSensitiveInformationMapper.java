package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.utils.DaoUtils;

public class ReportSensitiveInformationMapper implements ResultSetMapper<ReportSensitiveInformation> {

	@Override
	public ReportSensitiveInformation map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		final ReportSensitiveInformation rsi = new ReportSensitiveInformation();
		DaoUtils.setCommonBeanFields(rsi, rs, "reportsSensitiveInformation");
		rsi.setText(rs.getString("reportsSensitiveInformation_text"));
		return rsi;
	}

}
