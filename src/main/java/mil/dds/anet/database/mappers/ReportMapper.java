package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.core.mapper.RowMapper;

import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.utils.DaoUtils;

public class ReportMapper implements RowMapper<Report> {

	@Override
	public Report map(ResultSet rs, StatementContext ctx) throws SQLException {
		Report r = new Report();
		DaoUtils.setCommonBeanFields(r, rs, "reports");
		
		r.setState(MapperUtils.getEnumIdx(rs, "reports_state", ReportState.class));
		r.setEngagementDate(DaoUtils.getInstantAsLocalDateTime(rs, "reports_engagementDate"));
		r.setReleasedAt(DaoUtils.getInstantAsLocalDateTime(rs, "reports_releasedAt"));
		r.setLocationUuid(rs.getString("reports_locationUuid"));
		r.setApprovalStepUuid(rs.getString("reports_approvalStepUuid"));
		
		r.setIntent(rs.getString("reports_intent"));
		r.setExsum(rs.getString("reports_exsum"));
		r.setAtmosphere(MapperUtils.getEnumIdx(rs, "reports_atmosphere", Atmosphere.class));
		r.setAtmosphereDetails(rs.getString("reports_atmosphereDetails"));
		r.setCancelledReason(MapperUtils.getEnumIdx(rs, "reports_cancelledReason", ReportCancelledReason.class));
		
		r.setReportText(rs.getString("reports_text"));
		r.setKeyOutcomes(rs.getString("reports_keyOutcomes"));
		r.setNextSteps(rs.getString("reports_nextSteps"));
		
		r.setAuthorUuid(rs.getString("reports_authorUuid"));
		r.setAdvisorOrgUuid(rs.getString("reports_advisorOrganizationUuid"));
		r.setPrincipalOrgUuid(rs.getString("reports_principalOrganizationUuid"));
		
		if (MapperUtils.containsColumnNamed(rs, "totalCount")) { 
			ctx.define("totalCount", rs.getInt("totalCount"));
		}
		if (MapperUtils.containsColumnNamed(rs, "engagementDayOfWeek")) {
			r.setEngagementDayOfWeek(rs.getInt("engagementDayOfWeek"));
		}
		
		return r;
	}
}
