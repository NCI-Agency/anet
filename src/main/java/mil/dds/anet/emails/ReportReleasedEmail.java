package mil.dds.anet.emails;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Report;

public class ReportReleasedEmail extends AnetEmailAction {
	Report report;
	
	public ReportReleasedEmail() { 
		templateName = "/emails/reportReleased.ftlh";
		subject = "ANET Report Approved";
	}
	
	@Override
	public Map<String, Object> execute() {
		Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
		
		Map<String,Object> context = new HashMap<String,Object>();
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
