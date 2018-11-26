package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

import org.joda.time.DateTime;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.core.mapper.RowMapper;

import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
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
		
		Timestamp engagementDate = rs.getTimestamp("reports_engagementDate");
		if (engagementDate != null) { 
			r.setEngagementDate(new DateTime(engagementDate));
		}
		
		Timestamp releasedAt = rs.getTimestamp("reports_releasedAt");
		if (releasedAt != null) { 
			r.setReleasedAt(new DateTime(releasedAt));
		}
		
		String locationUuid = rs.getString("reports_locationUuid");
		if (locationUuid != null) {
			Location l = Location.createWithUuid(locationUuid);
			r.setLocation(l);
		}
		
		String approvalStepUuid = rs.getString("reports_approvalStepUuid");
		if (approvalStepUuid != null) {
			r.setApprovalStep(ApprovalStep.createWithUuid(approvalStepUuid));
		}
		
		r.setIntent(rs.getString("reports_intent"));
		r.setExsum(rs.getString("reports_exsum"));
		r.setAtmosphere(MapperUtils.getEnumIdx(rs, "reports_atmosphere", Atmosphere.class));
		r.setAtmosphereDetails(rs.getString("reports_atmosphereDetails"));
		r.setCancelledReason(MapperUtils.getEnumIdx(rs, "reports_cancelledReason", ReportCancelledReason.class));
		
		r.setReportText(rs.getString("reports_text"));
		r.setKeyOutcomes(rs.getString("reports_keyOutcomes"));
		r.setNextSteps(rs.getString("reports_nextSteps"));
		
		Person author = Person.createWithUuid((rs.getString("reports_authorUuid")));
		PersonMapper.fillInFields(author, rs);
		r.setAuthor(author);
		
		String advisorOrgUuid = rs.getString("reports_advisorOrganizationUuid");
		if (advisorOrgUuid != null) {
			r.setAdvisorOrg(Organization.createWithUuid(advisorOrgUuid));
		}
		
		String principalOrgUuid = rs.getString("reports_principalOrganizationUuid");
		if (principalOrgUuid != null) {
			r.setPrincipalOrg(Organization.createWithUuid(principalOrgUuid));
		}
		
		if (MapperUtils.containsColumnNamed(rs, "totalCount")) { 
			ctx.define("totalCount", rs.getInt("totalCount"));
		}
		if (MapperUtils.containsColumnNamed(rs, "engagementDayOfWeek")) {
			r.setEngagementDayOfWeek(rs.getInt("engagementDayOfWeek"));
		}
		
		return r;
	}
}
