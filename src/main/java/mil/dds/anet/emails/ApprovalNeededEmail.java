package mil.dds.anet.emails;

import java.lang.invoke.MethodHandles;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Report;

public class ApprovalNeededEmail extends AnetEmailAction {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	Report report;
	
	public ApprovalNeededEmail() { 
		templateName = "/emails/approvalNeeded.ftl";
		subject = "ANET Report needs your approval";
	}
	
	@Override
	public Map<String, Object> execute() {
		Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
		ApprovalStep step;
		try {
			step = r.loadApprovalStep(AnetObjectEngine.getInstance().getContext()).get();
		} catch (InterruptedException | ExecutionException e) {
			logger.error("failed to load ApprovalStep", e);
			return null;
		}
		
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
		this.report = Report.createWithUuid(report.getUuid());
	}

}
