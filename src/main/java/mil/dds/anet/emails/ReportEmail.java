package mil.dds.anet.emails;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;

public class ReportEmail extends AnetEmailAction {
	Report report;
	Person sender;
	String comment;
	
	public ReportEmail() { 
		templateName = "/emails/emailReport.ftlh";
		subject = "Sharing a report in ANET";
	}
	
	@Override
	public Map<String, Object> execute() {
		Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
		sender = AnetObjectEngine.getInstance().getPersonDao().getByUuid(sender.getUuid());
		Map<String,Object> context = new HashMap<String,Object>();
		context.put("report", r);
		context.put("reportIntent", StringUtils.abbreviate(r.getIntent(), MAX_REPORT_INTENT_LENGTH));
		context.put("sender", sender);
		context.put("comment", comment);
		return context;
	}

	public Report getReport() {
		return report;
	}

	public void setReport(Report report) {
		this.report = Report.createWithUuid(report.getUuid());
	}

	public Person getSender() {
		return sender;
	}

	public void setSender(Person sender) {
		this.sender = Person.createWithUuid(sender.getUuid());
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}
}
