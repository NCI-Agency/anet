package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;

public class ReportMapper implements ResultSetMapper<Report> {

	@Override
	public Report map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		Report r = new Report();
		r.setId(rs.getInt("reports_id"));
		
		r.setState(MapperUtils.getEnumIdx(rs, "reports_state", ReportState.class));
		r.setCreatedAt(new DateTime(rs.getTimestamp("reports_createdAt")));
		r.setUpdatedAt(new DateTime(rs.getTimestamp("reports_updatedAt")));
		
		Timestamp engagementDate = rs.getTimestamp("reports_engagementDate");
		if (engagementDate != null) { 
			r.setEngagementDate(new DateTime(engagementDate));
		}
		
		Timestamp releasedAt = rs.getTimestamp("reports_releasedAt");
		if (releasedAt != null) { 
			r.setReleasedAt(new DateTime(releasedAt));
		}
		
		Integer locationId = MapperUtils.getInteger(rs, "reports_locationId");
		if (locationId != null) { 
			Location l = Location.createWithId(locationId);
			r.setLocation(l);
		}
		
		Integer approvalStepId = MapperUtils.getInteger(rs, "reports_approvalStepId");
		if (approvalStepId != null) { 
			r.setApprovalStep(ApprovalStep.createWithId(approvalStepId));
		}
		
		r.setIntent(rs.getString("reports_intent"));
		r.setExsum(rs.getString("reports_exsum"));
		r.setAtmosphere(MapperUtils.getEnumIdx(rs, "reports_atmosphere", Atmosphere.class));
		r.setAtmosphereDetails(rs.getString("reports_atmosphereDetails"));
		r.setCancelledReason(MapperUtils.getEnumIdx(rs, "reports_cancelledReason", ReportCancelledReason.class));
		
		r.setReportText(rs.getString("reports_text"));
		r.setKeyOutcomes(rs.getString("reports_keyOutcomes"));
		r.setNextSteps(rs.getString("reports_nextSteps"));
		
		Person author = Person.createWithId((MapperUtils.getInteger(rs, "reports_authorId")));
		PersonMapper.fillInFields(author, rs);
		r.setAuthor(author);
		
		Integer advisorOrgId = MapperUtils.getInteger(rs, "reports_advisorOrganizationId");
		if (advisorOrgId != null) { 
			r.setAdvisorOrg(Organization.createWithId(advisorOrgId));
		}
		
		Integer principalOrgId = MapperUtils.getInteger(rs, "reports_principalOrganizationId");
		if (principalOrgId != null) { 
			r.setPrincipalOrg(Organization.createWithId(principalOrgId));
		}
		
		if (MapperUtils.containsColumnNamed(rs, "totalCount")) { 
			ctx.setAttribute("totalCount", rs.getInt("totalCount"));
		}
		if (MapperUtils.containsColumnNamed(rs, "engagementDayOfWeek")) {
			r.setEngagementDayOfWeek(rs.getInt("engagementDayOfWeek"));
		}
		
		return r;
	}
}
