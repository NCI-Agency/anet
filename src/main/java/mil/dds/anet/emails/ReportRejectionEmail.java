package mil.dds.anet.emails;

import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;

public class ReportRejectionEmail implements AnetEmailAction {
	private Report report;
	private Person rejector;
	private Comment comment;
	
	@Override
	public String getTemplateName() {
		return "/emails/reportRejection.ftlh";
	}

	@Override
	public String getSubject(Map<String, Object> context) {
		return "ANET Report Returned to You for Editing";
	}
	
	@Override
	public Map<String, Object> buildContext(Map<String, Object> context) {
		Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
		rejector = AnetObjectEngine.getInstance().getPersonDao().getByUuid(rejector.getUuid());
		comment = AnetObjectEngine.getInstance().getCommentDao().getByUuid(comment.getUuid());
		
		context.put("report", r);
		context.put("reportIntent", StringUtils.abbreviate(r.getIntent(), MAX_REPORT_INTENT_LENGTH));
		context.put("rejector", rejector);
		context.put("comment", comment);

		return context;
	}

	public Report getReport() {
		return report;
	}

	public void setReport(Report report) {
		this.report = Report.createWithUuid(report.getUuid());
	}

	public Person getRejector() {
		return rejector;
	}

	public void setRejector(Person rejector) {
		this.rejector = rejector;
	}

	public Comment getComment() {
		return comment;
	}

	public void setComment(Comment comment) {
		this.comment = comment;
	}

}
