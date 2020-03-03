package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class ApprovalStepMapper implements RowMapper<ApprovalStep> {

  @Override
  public ApprovalStep map(ResultSet r, StatementContext ctx) throws SQLException {
    ApprovalStep step = new ApprovalStep();
    MapperUtils.setCommonBeanFields(step, r, null);
    step.setNextStepUuid(r.getString("nextStepUuid"));
    step.setRelatedObjectUuid(r.getString("relatedObjectUuid"));
    step.setName(r.getString("name"));
    step.setType(MapperUtils.getEnumIdx(r, "type", ApprovalStepType.class));

    return step;
  }

}
