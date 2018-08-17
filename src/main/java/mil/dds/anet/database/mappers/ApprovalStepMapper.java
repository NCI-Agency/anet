package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.ApprovalStep;

public class ApprovalStepMapper implements ResultSetMapper<ApprovalStep> {

	@Override
	public ApprovalStep map(int index, ResultSet r, StatementContext ctx) throws SQLException {
		ApprovalStep step = new ApprovalStep();
		step.setId(r.getInt("id"));
		step.setNextStepId(MapperUtils.getInteger(r, "nextStepId"));
		step.setAdvisorOrganizationId(MapperUtils.getInteger(r, "advisorOrganizationId"));
		step.setName(r.getString("name"));
		
		return step;
	}

}
