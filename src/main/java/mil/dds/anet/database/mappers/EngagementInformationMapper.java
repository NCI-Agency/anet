package mil.dds.anet.database.mappers;

import static mil.dds.anet.database.mappers.MapperUtils.getInstantAsLocalDateTime;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.EngagementInformation;
import mil.dds.anet.beans.GenericRelatedObject;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class EngagementInformationMapper implements RowMapper<EngagementInformation> {

  @Override
  public EngagementInformation map(ResultSet r, StatementContext ctx) throws SQLException {
    final EngagementInformation engagementInformation = new EngagementInformation();
    engagementInformation.setEngagementDate(getInstantAsLocalDateTime(r, "engagementDate"));
    engagementInformation.setReportUuid(r.getString("reportUuid"));

    final GenericRelatedObject advisorGenericRelatedObject = new GenericRelatedObject();
    advisorGenericRelatedObject.setRelatedObjectType(r.getString("advisorRelatedObjectType"));
    advisorGenericRelatedObject.setRelatedObjectUuid(r.getString("advisorRelatedObjectUuid"));
    engagementInformation.setAdvisor(advisorGenericRelatedObject);

    final GenericRelatedObject interlocutorGenericRelatedObject = new GenericRelatedObject();
    interlocutorGenericRelatedObject
        .setRelatedObjectType(r.getString("interlocutorRelatedObjectType"));
    interlocutorGenericRelatedObject
        .setRelatedObjectUuid(r.getString("interlocutorRelatedObjectUuid"));
    engagementInformation.setInterlocutor(interlocutorGenericRelatedObject);

    return engagementInformation;
  }
}
