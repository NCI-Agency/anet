package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.core.mapper.RowMapper;

import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.ApprovalAction.ApprovalType;
import mil.dds.anet.utils.DaoUtils;

public class ApprovalActionMapper implements RowMapper<ApprovalAction> {

	@Override
	public ApprovalAction map(ResultSet rs, StatementContext ctx) throws SQLException {
		final ApprovalAction aa = new ApprovalAction();
		aa.setPersonUuid(rs.getString("personUuid"));
		aa.setReportUuid(rs.getString("reportUuid"));
		aa.setStepUuid(rs.getString("approvalStepUuid"));
		aa.setCreatedAt(DaoUtils.getInstantAsLocalDateTime(rs, "createdAt"));
		aa.setType(MapperUtils.getEnumIdx(rs, "type", ApprovalType.class));
		return aa;
	}

}
