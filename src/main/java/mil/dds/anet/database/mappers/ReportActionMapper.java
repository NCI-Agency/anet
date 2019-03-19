package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.core.mapper.RowMapper;

import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportAction.ActionType;
import mil.dds.anet.utils.DaoUtils;

public class ReportActionMapper implements RowMapper<ReportAction> {

	@Override
	public ReportAction map(ResultSet rs, StatementContext ctx) throws SQLException {
		final ReportAction aa = new ReportAction();
		aa.setPersonUuid(rs.getString("personUuid"));
		aa.setReportUuid(rs.getString("reportUuid"));
		aa.setStepUuid(rs.getString("approvalStepUuid"));
		aa.setCreatedAt(DaoUtils.getInstantAsLocalDateTime(rs, "createdAt"));
		aa.setType(MapperUtils.getEnumIdx(rs, "type", ActionType.class));
		return aa;
	}

}
