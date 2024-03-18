package mil.dds.anet.database.mappers;

import static mil.dds.anet.database.mappers.MapperUtils.*;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class ReportMapper implements RowMapper<Report> {

  @Override
  public Report map(ResultSet rs, StatementContext ctx) throws SQLException {
    Report r = new Report();
    MapperUtils.setCustomizableBeanFields(r, rs, "reports");

    r.setState(getEnumIdx(rs, "reports_state", ReportState.class));
    r.setEngagementDate(getInstantAsLocalDateTime(rs, "reports_engagementDate"));
    r.setDuration(getOptionalInt(rs, "reports_duration"));
    r.setReleasedAt(getInstantAsLocalDateTime(rs, "reports_releasedAt"));
    r.setLocationUuid(getOptionalString(rs, "reports_locationUuid"));
    r.setApprovalStepUuid(getOptionalString(rs, "reports_approvalStepUuid"));

    r.setIntent(getOptionalString(rs, "reports_intent"));
    r.setExsum(getOptionalString(rs, "reports_exsum"));
    r.setAtmosphere(getEnumIdx(rs, "reports_atmosphere", Atmosphere.class));
    r.setAtmosphereDetails(getOptionalString(rs, "reports_atmosphereDetails"));
    r.setCancelledReason(getEnumIdx(rs, "reports_cancelledReason", ReportCancelledReason.class));

    r.setReportText(getOptionalString(rs, "reports_text"));
    r.setKeyOutcomes(getOptionalString(rs, "reports_keyOutcomes"));
    r.setNextSteps(getOptionalString(rs, "reports_nextSteps"));

    r.setAdvisorOrgUuid(getOptionalString(rs, "reports_advisorOrganizationUuid"));
    r.setInterlocutorOrgUuid(getOptionalString(rs, "reports_interlocutorOrganizationUuid"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }
    if (MapperUtils.containsColumnNamed(rs, "engagementDayOfWeek")) {
      r.setEngagementDayOfWeek(rs.getInt("engagementDayOfWeek"));
    }

    r.setClassification(getOptionalString(rs, "reports_classification"));

    return r;
  }
}
