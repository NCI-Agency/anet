package mil.dds.anet.emails;

import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Report;
import org.apache.commons.lang3.StringUtils;

public class ReportPublishedEmail implements AnetEmailAction {
  private Report report;

  @Override
  public String getTemplateName() {
    return "/emails/reportPublished.ftlh";
  }

  @Override
  public String getSubject(Map<String, Object> context) {
    return "ANET Report Approved";
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context) {
    Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());

    context.put("report", r);
    context.put("reportIntent", StringUtils.abbreviate(r.getIntent(), MAX_REPORT_INTENT_LENGTH));

    return context;
  }

  public Report getReport() {
    return report;
  }

  public void setReport(Report report) {
    this.report = Report.createWithUuid(report.getUuid());
  }

}
