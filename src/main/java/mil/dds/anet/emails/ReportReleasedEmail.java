package mil.dds.anet.emails;

import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Report;

public class ReportReleasedEmail implements AnetEmailAction {
	Report report;
	
	@Override
	public String getTemplateName() {
		return "/emails/reportReleased.ftlh";
	}

	@Override
	public String getSubject(Map<String, Object> context) {
		return "ANET Report Approved";
	}
	
	@Override
	public void buildContext(Map<String, Object> context) {
		Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
		
		context.put("report", r);
		context.put("reportIntent", StringUtils.abbreviate(r.getIntent(), MAX_REPORT_INTENT_LENGTH));
	}

	public Report getReport() {
		return report;
	}

	public void setReport(Report report) {
		this.report = Report.createWithUuid(report.getUuid());
	}

}
