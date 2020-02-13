package mil.dds.anet.emails;

import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Report;
import org.apache.commons.lang3.StringUtils;

public class ApprovalNeededEmail implements AnetEmailAction {

  private Report report;

  @Override
  public String getTemplateName() {
    return "/emails/approvalNeeded.ftlh";
  }

  @Override
  public String getSubject(Map<String, Object> context) {
    return "ANET Report needs your approval";
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context) {
    final Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
    final ApprovalStep step =
        r.loadApprovalStep(AnetObjectEngine.getInstance().getContext()).join();
    context.put("report", r);
    context.put("reportIntent", StringUtils.abbreviate(r.getIntent(), MAX_REPORT_INTENT_LENGTH));
    context.put("approvalStepName", (step != null) ? step.getName() : "");

    return context;
  }

  public Report getReport() {
    return report;
  }

  public void setReport(Report report) {
    this.report = Report.createWithUuid(report.getUuid());
  }
}
