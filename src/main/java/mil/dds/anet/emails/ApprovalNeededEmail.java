package mil.dds.anet.emails;

import java.lang.invoke.MethodHandles;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Report;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ApprovalNeededEmail implements AnetEmailAction {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

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
    Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
    ApprovalStep step;
    try {
      step = r.loadApprovalStep(AnetObjectEngine.getInstance().getContext()).get();
    } catch (InterruptedException | ExecutionException e) {
      logger.error("failed to load ApprovalStep", e);
      return context;
    }

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
