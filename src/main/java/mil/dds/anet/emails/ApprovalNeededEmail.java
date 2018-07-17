package mil.dds.anet.emails;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Report;

public class ApprovalNeededEmail extends AnetEmailAction {

	Report report;
	
	public ApprovalNeededEmail() { 
		templateName = "/emails/approvalNeeded.ftl";
		subject = "ANET Report needs your approval";
	}
	
	@Override
	public Map<String, Object> execute() {
		Report r = AnetObjectEngine.getInstance().getReportDao().getById(report.getId());
		ApprovalStep step = r.loadApprovalStep();
		
		Map<String,Object> context = new HashMap<String,Object>();
		context.put("report", r);
		context.put("reportIntent", StringUtils.abbreviate(r.getIntent(), MAX_REPORT_INTENT_LENGTH));
		context.put("approvalStepName", (step != null) ? step.getName() : "");
		return context;
	}

	public Report getReport() {
		return report;
	}

	public void setReport(Report report) {
		this.report = Report.createWithId(report.getId());
	}

}
