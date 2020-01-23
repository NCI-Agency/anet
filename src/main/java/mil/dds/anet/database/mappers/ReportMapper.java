package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class ReportMapper implements RowMapper<Report> {

  @Override
  public Report map(ResultSet rs, StatementContext ctx) throws SQLException {
    Report r = new Report();
    DaoUtils.setCustomizableBeanFields(r, rs, "reports");

    r.setState(MapperUtils.getEnumIdx(rs, "reports_state", ReportState.class));
    r.setEngagementDate(MapperUtils.getInstantAsLocalDateTime(rs, "reports_engagementDate"));
    r.setDuration(MapperUtils.getOptionalInt(rs, "reports_duration"));
    r.setReleasedAt(MapperUtils.getInstantAsLocalDateTime(rs, "reports_releasedAt"));
    r.setLocationUuid(MapperUtils.getOptionalString(rs, "reports_locationUuid"));
    r.setApprovalStepUuid(MapperUtils.getOptionalString(rs, "reports_approvalStepUuid"));

    r.setIntent(MapperUtils.getOptionalString(rs, "reports_intent"));
    r.setExsum(MapperUtils.getOptionalString(rs, "reports_exsum"));
    r.setAtmosphere(MapperUtils.getEnumIdx(rs, "reports_atmosphere", Atmosphere.class));
    r.setAtmosphereDetails(MapperUtils.getOptionalString(rs, "reports_atmosphereDetails"));
    r.setCancelledReason(
        MapperUtils.getEnumIdx(rs, "reports_cancelledReason", ReportCancelledReason.class));

    r.setReportText(MapperUtils.getOptionalString(rs, "reports_text"));
    r.setKeyOutcomes(MapperUtils.getOptionalString(rs, "reports_keyOutcomes"));
    r.setNextSteps(MapperUtils.getOptionalString(rs, "reports_nextSteps"));

    r.setAuthorUuid(MapperUtils.getOptionalString(rs, "reports_authorUuid"));
    r.setAdvisorOrgUuid(MapperUtils.getOptionalString(rs, "reports_advisorOrganizationUuid"));
    r.setPrincipalOrgUuid(MapperUtils.getOptionalString(rs, "reports_principalOrganizationUuid"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }
    if (MapperUtils.containsColumnNamed(rs, "engagementDayOfWeek")) {
      r.setEngagementDayOfWeek(rs.getInt("engagementDayOfWeek"));
    }

    return r;
  }
}
