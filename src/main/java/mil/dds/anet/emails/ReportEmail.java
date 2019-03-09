package mil.dds.anet.emails;

import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;

public class ReportEmail implements AnetEmailAction {
	Report report;
	Person sender;
	String comment;
	
	@Override
	public String getTemplateName() {
		return "/emails/emailReport.ftlh";
	}

	@Override
	public String getSubject(Map<String, Object> context) {
		return "Sharing a report in ANET";
	}

	@Override
	public void buildContext(Map<String, Object> context) {
		Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
		sender = AnetObjectEngine.getInstance().getPersonDao().getByUuid(sender.getUuid());

		context.put("report", r);
		context.put("reportIntent", StringUtils.abbreviate(r.getIntent(), MAX_REPORT_INTENT_LENGTH));
		context.put("sender", sender);
		context.put("comment", comment);
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
