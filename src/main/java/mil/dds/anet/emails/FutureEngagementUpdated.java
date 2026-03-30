package mil.dds.anet.emails;

import java.util.Map;
import mil.dds.anet.beans.Report;

public class FutureEngagementUpdated implements AnetEmailAction {

  private Report report;

  @Override
  public String getTemplateName() {
    return "/emails/futureEngagementUpdated.ftlh";
  }

  @Override
  public String getSubject(Map<String, Object> context) {
    return "ANET planned engagement report";
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context) {
    Report r = engine().getReportDao().getByUuid(report.getUuid());
    if (r == null) {
      return null;
    }

    context.put("report", r);
    context.put("reportIntent", getReportLabel(r));

    return context;
  }

  public Report getReport() {
    return report;
  }

  public void setReport(Report report) {
    this.report = Report.createWithUuid(report.getUuid());
  }

}
