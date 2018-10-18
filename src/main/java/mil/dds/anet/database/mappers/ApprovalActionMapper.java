package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.ApprovalAction.ApprovalType;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;

public class ApprovalActionMapper implements ResultSetMapper<ApprovalAction> {

	@Override
	public ApprovalAction map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		ApprovalAction aa = new ApprovalAction();
		aa.setPerson(Person.createWithId(MapperUtils.getInteger(rs, "personId")));
		aa.setReport(Report.createWithId(MapperUtils.getInteger(rs, "reportId")));
		
		Integer approvalStepId = MapperUtils.getInteger(rs, "approvalStepId");
		if (approvalStepId != null) { 
			aa.setStep(ApprovalStep.createWithId(approvalStepId));
		}
		
		aa.setCreatedAt(new DateTime(rs.getTimestamp("createdAt")));
		aa.setType(MapperUtils.getEnumIdx(rs, "type", ApprovalType.class));
	
		return aa;
	}

}
