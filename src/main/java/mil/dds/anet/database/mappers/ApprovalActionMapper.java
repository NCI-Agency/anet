package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.core.mapper.RowMapper;

import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.ApprovalAction.ApprovalType;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;

public class ApprovalActionMapper implements RowMapper<ApprovalAction> {

	@Override
	public ApprovalAction map(ResultSet rs, StatementContext ctx) throws SQLException {
		ApprovalAction aa = new ApprovalAction();
		aa.setPerson(Person.createWithUuid(rs.getString("personUuid")));
		aa.setReport(Report.createWithUuid(rs.getString("reportUuid")));
		
		String approvalStepUuid = rs.getString("approvalStepUuid");
		if (approvalStepUuid != null) {
			aa.setStep(ApprovalStep.createWithUuid(approvalStepUuid));
		}
		
		aa.setCreatedAt(new DateTime(rs.getTimestamp("createdAt")));
		aa.setType(MapperUtils.getEnumIdx(rs, "type", ApprovalType.class));
	
		return aa;
	}

}
