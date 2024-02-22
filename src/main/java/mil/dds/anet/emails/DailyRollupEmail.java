package mil.dds.anet.emails;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.RollupGraph.RollupGraphType;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.ReportSearchSortBy;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.utils.DaoUtils;

public class DailyRollupEmail implements AnetEmailAction {

  public static String SHOW_REPORT_TEXT_FLAG = "showReportText";

  private Instant startDate;
  private Instant endDate;
  // show the table based off this organization type.
  private RollupGraphType chartOrgType = RollupGraphType.INTERLOCUTOR;
  private String orgUuid;
  private String comment;

  @Override
  public String getTemplateName() {
    return "/emails/rollup.ftlh";
  }

  @Override
  public String getSubject(Map<String, Object> context) {

    DateTimeFormatter dtf = (DateTimeFormatter) context.get("dateFormatter");

    if (startDate.atZone(DaoUtils.getServerNativeZoneId()).toLocalDate()
        .equals(endDate.atZone(DaoUtils.getServerNativeZoneId()).toLocalDate())) {
      return "Rollup for " + dtf.format(startDate);
    } else {
      return "Rollup from " + dtf.format(startDate) + " to " + dtf.format(endDate);
    }
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context)
      throws NumberFormatException {
    String maxReportAgeStr = AnetObjectEngine.getInstance()
        .getAdminSetting(AdminSettingKeys.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS);
    long maxReportAge = Long.parseLong(maxReportAgeStr);
    Instant engagementDateStart =
        startDate.atZone(DaoUtils.getServerNativeZoneId()).minusDays(maxReportAge).toInstant();
    ReportSearchQuery query = new ReportSearchQuery();
    query.setPageSize(0);
    query.setReleasedAtStart(startDate);
    query.setReleasedAtEnd(endDate);
    // FIXME: Do we want to filter on engagement date? It makes the rollup email different from the
    // on-screen rollup.
    query.setEngagementDateStart(engagementDateStart);
    query.setSortBy(ReportSearchSortBy.ENGAGEMENT_DATE);
    query.setSortOrder(SortOrder.DESC);
    query.setOrgUuid(orgUuid);
    query.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);

    List<Report> reports = AnetObjectEngine.getInstance().getReportDao().search(query).getList();

    ReportGrouping allReports = new ReportGrouping(reports);

    if (chartOrgType == null) {
      chartOrgType = RollupGraphType.INTERLOCUTOR;
    }

    context.put("reports", allReports);
    context.put("cancelledReasons", ReportCancelledReason.values());
    context.put("title", getSubject(context));
    context.put("comment", comment);

    final List<ReportGrouping> outerGrouping =
        (orgUuid == null) ? allReports.getByGrouping(chartOrgType)
            : allReports.getGroupingForParent(orgUuid, chartOrgType);
    context.put("innerOrgType",
        RollupGraphType.ADVISOR.equals(chartOrgType) ? RollupGraphType.INTERLOCUTOR
            : RollupGraphType.ADVISOR);
    context.put("outerGrouping", outerGrouping);
    context.put(SHOW_REPORT_TEXT_FLAG, false);

    return context;
  }

  public static class ReportGrouping {
    String name;
    List<Report> reports;

    public ReportGrouping() {
      this.reports = new LinkedList<>();
    }

    public ReportGrouping(List<Report> reports) {
      this.reports = reports;
    }

    public List<Report> getAll() {
      return reports;
    }

    public List<Report> getNonCancelled() {
      return reports.stream().filter(r -> r.getCancelledReason() == null).toList();
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

    public List<ReportGrouping> getByGrouping(RollupGraphType orgType) {
      final Map<String, Organization> orgUuidToTopOrg =
          AnetObjectEngine.getInstance().buildTopLevelOrgHash();
      return groupReports(orgUuidToTopOrg, orgType);
    }

    public List<ReportGrouping> getGroupingForParent(String parentOrgUuid,
        RollupGraphType orgType) {
      final Map<String, Organization> orgUuidToTopOrg =
          AnetObjectEngine.getInstance().buildTopLevelOrgHash(parentOrgUuid);
      return groupReports(orgUuidToTopOrg, orgType);
    }

    private List<ReportGrouping> groupReports(Map<String, Organization> orgUuidToTopOrg,
        RollupGraphType orgType) {
      final Map<String, ReportGrouping> orgUuidToReports = new HashMap<>();
      final Map<String, Object> context = AnetObjectEngine.getInstance().getContext();
      for (Report r : reports) {
        final Organization reportOrg =
            RollupGraphType.ADVISOR.equals(orgType) ? r.loadAdvisorOrg(context).join()
                : r.loadInterlocutorOrg(context).join();
        final String topOrgUuid;
        final String topOrgName;
        if (reportOrg == null) {
          topOrgUuid = Organization.DUMMY_ORG_UUID;
          topOrgName = "Other";
        } else {
          Organization topOrg = orgUuidToTopOrg.get(reportOrg.getUuid());
          if (topOrg == null) { // this should never happen unless the data in the database is bad.
            topOrgUuid = Organization.DUMMY_ORG_UUID;
            topOrgName = "Other";
          } else {
            topOrgUuid = topOrg.getUuid();
            topOrgName = topOrg.getShortName();
          }
        }
        ReportGrouping group = orgUuidToReports.computeIfAbsent(topOrgUuid, k -> {
          final ReportGrouping newGroup = new ReportGrouping();
          newGroup.setName(topOrgName);
          return newGroup;
        });
        group.addReport(r);
      }
      return orgUuidToReports.values().stream()
          .sorted(Comparator.comparing(ReportGrouping::getName)).toList();
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

  public RollupGraphType getChartOrgType() {
    return chartOrgType;
  }

  public void setChartOrgType(RollupGraphType chartOrgType) {
    this.chartOrgType = chartOrgType;
  }

  public String getOrgUuid() {
    return orgUuid;
  }

  public void setOrgUuid(String orgUuid) {
    this.orgUuid = orgUuid;
  }

  public String getComment() {
    return comment;
  }

  public void setComment(String comment) {
    this.comment = comment;
  }
}
