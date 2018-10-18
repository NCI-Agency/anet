package mil.dds.anet.emails;

import java.lang.invoke.MethodHandles;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery.ReportSearchSortBy;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;

public class DailyRollupEmail extends AnetEmailAction {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	public static DateTimeFormatter dtf = DateTimeFormat.forPattern("dd MMM YYYY");
	public static String SHOW_REPORT_TEXT_FLAG = "showReportText";

	DateTime startDate;
	DateTime endDate;
	OrganizationType chartOrgType = OrganizationType.PRINCIPAL_ORG; // show the table based off this organization type. 
	Integer advisorOrganizationId;
	Integer principalOrganizationId;
	String comment;

	public DailyRollupEmail() {
		templateName = "/emails/rollup.ftl";
	}

	@Override
	public String getSubject() {
		return "Daily Rollup for " + dtf.print(endDate);
	}

	@Override
	public Map<String, Object> execute() {
		String maxReportAgeStr = AnetObjectEngine.getInstance().getAdminSetting(AdminSettingKeys.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS);
		Integer maxReportAge = Integer.parseInt(maxReportAgeStr);
		DateTime engagementDateStart = startDate.minusDays(maxReportAge);
		ReportSearchQuery query = new ReportSearchQuery();
		query.setPageSize(Integer.MAX_VALUE);
		query.setReleasedAtStart(startDate);
		query.setReleasedAtEnd(endDate);
		query.setEngagementDateStart(engagementDateStart);
		query.setSortBy(ReportSearchSortBy.ENGAGEMENT_DATE);
		query.setSortOrder(SortOrder.DESC);
		
		query.setPrincipalOrgId(principalOrganizationId);
		query.setIncludePrincipalOrgChildren(true);
		query.setAdvisorOrgId(advisorOrganizationId);
		query.setIncludeAdvisorOrgChildren(true);

		List<Report> reports = AnetObjectEngine.getInstance().getReportDao().search(query).getList();

		ReportGrouping allReports = new ReportGrouping(reports);

		if (chartOrgType == null) { chartOrgType = OrganizationType.PRINCIPAL_ORG; } 
		
		Map<String,Object> context = new HashMap<String,Object>();
		context.put("reports", allReports);
		context.put("cancelledReasons", ReportCancelledReason.values());
		context.put("title", getSubject());
		context.put("comment", comment);
		
		List<ReportGrouping> outerGrouping = null;
		if (principalOrganizationId != null) { 
			outerGrouping = allReports.getGroupingForParent(principalOrganizationId);
		} else if (advisorOrganizationId != null) { 
			outerGrouping = allReports.getGroupingForParent(advisorOrganizationId);
		} else { 
			outerGrouping = allReports.getByGrouping(chartOrgType);
		}
		
		context.put("innerOrgType", 
			(OrganizationType.ADVISOR_ORG.equals(chartOrgType)) ? OrganizationType.PRINCIPAL_ORG : OrganizationType.ADVISOR_ORG);
		context.put("outerGrouping", outerGrouping);
		context.put(SHOW_REPORT_TEXT_FLAG, false);
		return context;
	}

	public static class ReportGrouping {
		String name;
		List<Report> reports;

		public ReportGrouping() {
			this.reports = new LinkedList<Report>();
		}

		public ReportGrouping(List<Report> reports) {
			this.reports = reports;
		}
		
		public List<Report> getAll() {
			return reports;
		}

		public List<Report> getNonCancelled() {
			return reports.stream().filter(r -> r.getCancelledReason() == null)
					.collect(Collectors.toList());
		}

		public void addReport(Report r) {
			reports.add(r);
		}

		public String getName() {
			return name;
		}

		public void setName(String name) {
			this.name = name;
		}

		public List<ReportGrouping> getByGrouping(String groupByOrgType) {
			return getByGrouping(OrganizationType.valueOf(groupByOrgType));
		}

		public List<ReportGrouping> getByGrouping(OrganizationType orgType) {
			
			Map<Integer, Organization> orgIdToTopOrg = AnetObjectEngine.getInstance().buildTopLevelOrgHash(orgType);
			return groupReports(orgIdToTopOrg, orgType);
		}
		
		public List<ReportGrouping> getGroupingForParent(Integer parentOrgId) { 
			Map<Integer, Organization> orgIdToTopOrg = AnetObjectEngine.getInstance().buildTopLevelOrgHash(parentOrgId);
			OrganizationType orgType = orgIdToTopOrg.get(parentOrgId).getType();
			return groupReports(orgIdToTopOrg, orgType);
		}
		
		private List<ReportGrouping> groupReports(Map<Integer,Organization> orgIdToTopOrg, OrganizationType orgType) { 
			Map<Integer, ReportGrouping> orgIdToReports = new HashMap<Integer,ReportGrouping>();
			for (Report r : reports) {
				final Map<String, Object> context = AnetObjectEngine.getInstance().getContext();
				Organization reportOrg;
				try {
					reportOrg = (orgType == OrganizationType.ADVISOR_ORG)
							? r.loadAdvisorOrg(context).get()
							: r.loadPrincipalOrg(context).get();
				} catch (InterruptedException | ExecutionException e) {
					logger.error("failed to load AdvisorOrg/PrincipalOrg", e);
					return null;
				}
				int topOrgId;
				String topOrgName;
				if (reportOrg == null) {
					topOrgId = -1;
					topOrgName = "Other";
				} else {
					Organization topOrg = orgIdToTopOrg.get(reportOrg.getId());
					if (topOrg == null) {  //this should never happen unless the data in the database is bad. 
						topOrgId = -1;
						topOrgName = "Other";
					} else { 
						topOrgId = topOrg.getId();
						topOrgName = topOrg.getShortName();
					}
				}
				ReportGrouping group = orgIdToReports.get(topOrgId);
				if (group == null) {
					group = new ReportGrouping();
					group.setName(topOrgName);
					orgIdToReports.put(topOrgId, group);
				}
				group.addReport(r);
			}
			return orgIdToReports.values().stream()
					.sorted((a, b) -> a.getName().compareTo(b.getName()))
					.collect(Collectors.toList());

		}

		public long getCountByCancelledReason(ReportCancelledReason reason) {
			return reports.stream().filter(r -> reason.equals(r.getCancelledReason())).count();
		}

		public long getCountByCancelledReason(String reason) {
			return getCountByCancelledReason(ReportCancelledReason.valueOf(reason));
		}

	}

	public DateTime getStartDate() {
		return startDate;
	}

	public void setStartDate(DateTime startDate) {
		this.startDate = startDate;
	}

	public DateTime getEndDate() {
		return endDate;
	}

	public void setEndDate(DateTime endDate) {
		this.endDate = endDate;
	}

	public OrganizationType getChartOrgType() {
		return chartOrgType;
	}

	public void setChartOrgType(OrganizationType chartOrgType) {
		this.chartOrgType = chartOrgType;
	}

	public Integer getAdvisorOrganizationId() {
		return advisorOrganizationId;
	}

	public void setAdvisorOrganizationId(Integer advisorOrganizationId) {
		this.advisorOrganizationId = advisorOrganizationId;
	}

	public Integer getPrincipalOrganizationId() {
		return principalOrganizationId;
	}

	public void setPrincipalOrganizationId(Integer principalOrganizationId) {
		this.principalOrganizationId = principalOrganizationId;
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}


}
