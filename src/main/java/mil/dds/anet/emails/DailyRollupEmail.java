package mil.dds.anet.emails;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

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
import mil.dds.anet.utils.DaoUtils;

public class DailyRollupEmail implements AnetEmailAction {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	public static String SHOW_REPORT_TEXT_FLAG = "showReportText";

	private Instant startDate;
	private Instant endDate;
	private OrganizationType chartOrgType = OrganizationType.PRINCIPAL_ORG; // show the table based off this organization type. 
	private String advisorOrganizationUuid;
	private String principalOrganizationUuid;
	private String comment;

	@Override
	public String getTemplateName() {
		return "/emails/rollup.ftlh";
	}

	@Override
	public String getSubject(Map<String, Object> context) {

		DateTimeFormatter dtf = (DateTimeFormatter) context.get("dateFormatter");

		if (startDate.atZone(DaoUtils.getDefaultZoneId()).toLocalDate().equals(endDate.atZone(DaoUtils.getDefaultZoneId()).toLocalDate())) {
			return "Rollup for " + dtf.format(startDate);
		} else {
			return "Rollup from " + dtf.format(startDate) + " to " + dtf.format(endDate);
		}
	}

	@Override
	public Map<String, Object> buildContext(Map<String, Object> context) {
		String maxReportAgeStr = AnetObjectEngine.getInstance().getAdminSetting(AdminSettingKeys.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS);
		Integer maxReportAge = Integer.parseInt(maxReportAgeStr);
		Instant engagementDateStart = startDate.atZone(DaoUtils.getDefaultZoneId()).minusDays(maxReportAge).toInstant();
		ReportSearchQuery query = new ReportSearchQuery();
		query.setPageSize(Integer.MAX_VALUE);
		query.setReleasedAtStart(startDate);
		query.setReleasedAtEnd(endDate);
		query.setEngagementDateStart(engagementDateStart);
		query.setSortBy(ReportSearchSortBy.ENGAGEMENT_DATE);
		query.setSortOrder(SortOrder.DESC);
		query.setPrincipalOrgUuid(principalOrganizationUuid);
		query.setIncludePrincipalOrgChildren(true);
		query.setAdvisorOrgUuid(advisorOrganizationUuid);
		query.setIncludeAdvisorOrgChildren(true);

		List<Report> reports = AnetObjectEngine.getInstance().getReportDao().search(query).getList();

		ReportGrouping allReports = new ReportGrouping(reports);

		if (chartOrgType == null) { chartOrgType = OrganizationType.PRINCIPAL_ORG; } 
		
		context.put("reports", allReports);
		context.put("cancelledReasons", ReportCancelledReason.values());
		context.put("title", getSubject(context));
		context.put("comment", comment);
		
		List<ReportGrouping> outerGrouping = null;
		if (principalOrganizationUuid != null) {
			outerGrouping = allReports.getGroupingForParent(principalOrganizationUuid);
		} else if (advisorOrganizationUuid != null) {
			outerGrouping = allReports.getGroupingForParent(advisorOrganizationUuid);
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
			final Map<String, Organization> orgUuidToTopOrg = AnetObjectEngine.getInstance().buildTopLevelOrgHash(orgType);
			return groupReports(orgUuidToTopOrg, orgType);
		}
		
		public List<ReportGrouping> getGroupingForParent(String parentOrgUuid) {
			final Map<String, Organization> orgUuidToTopOrg = AnetObjectEngine.getInstance().buildTopLevelOrgHash(parentOrgUuid);
			final OrganizationType orgType = orgUuidToTopOrg.get(parentOrgUuid).getType();
			return groupReports(orgUuidToTopOrg, orgType);
		}
		
		private List<ReportGrouping> groupReports(Map<String,Organization> orgUuidToTopOrg, OrganizationType orgType) {
			final Map<String, ReportGrouping> orgUuidToReports = new HashMap<>();
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
				String topOrgUuid;
				String topOrgName;
				if (reportOrg == null) {
					topOrgUuid = Organization.DUMMY_ORG_UUID;
					topOrgName = "Other";
				} else {
					Organization topOrg = orgUuidToTopOrg.get(reportOrg.getUuid());
					if (topOrg == null) {  //this should never happen unless the data in the database is bad. 
						topOrgUuid = Organization.DUMMY_ORG_UUID;
						topOrgName = "Other";
					} else { 
						topOrgUuid = topOrg.getUuid();
						topOrgName = topOrg.getShortName();
					}
				}
				ReportGrouping group = orgUuidToReports.get(topOrgUuid);
				if (group == null) {
					group = new ReportGrouping();
					group.setName(topOrgName);
					orgUuidToReports.put(topOrgUuid, group);
				}
				group.addReport(r);
			}
			return orgUuidToReports.values().stream()
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

	public Instant getStartDate() {
		return startDate;
	}

	public void setStartDate(Instant startDate) {
		this.startDate = startDate;
	}

	public Instant getEndDate() {
		return endDate;
	}

	public void setEndDate(Instant endDate) {
		this.endDate = endDate;
	}

	public OrganizationType getChartOrgType() {
		return chartOrgType;
	}

	public void setChartOrgType(OrganizationType chartOrgType) {
		this.chartOrgType = chartOrgType;
	}

	public String getAdvisorOrganizationUuid() {
		return advisorOrganizationUuid;
	}

	public void setAdvisorOrganizationUuid(String advisorOrganizationUuid) {
		this.advisorOrganizationUuid = advisorOrganizationUuid;
	}

	public String getPrincipalOrganizationUuid() {
		return principalOrganizationUuid;
	}

	public void setPrincipalOrganizationUuid(String principalOrganizationUuid) {
		this.principalOrganizationUuid = principalOrganizationUuid;
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}
}
