package mil.dds.anet.emails;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;

public class ReportRejectionEmail extends AnetEmailAction {
	Report report;
	Person rejector;
	Comment comment;
	
	public ReportRejectionEmail() { 
		templateName = "/emails/reportRejection.ftl";
		subject = "ANET Report Returned to You for Editing";
	}
	
	@Override
	public Map<String, Object> execute() {
		Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
		rejector = AnetObjectEngine.getInstance().getPersonDao().getByUuid(rejector.getUuid());
		comment = AnetObjectEngine.getInstance().getCommentDao().getByUuid(comment.getUuid());
		
		Map<String,Object> context = new HashMap<String,Object>();
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
