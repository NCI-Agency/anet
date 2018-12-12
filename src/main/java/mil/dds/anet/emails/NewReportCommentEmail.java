package mil.dds.anet.emails;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Report;

public class NewReportCommentEmail extends AnetEmailAction {
	Report report;
	Comment comment;
	
	public NewReportCommentEmail() { 
		templateName = "/emails/newReportComment.ftl";
		subject = "New Comment on your ANET Report";
	}
	
	@Override
	public Map<String, Object> execute() {
		Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
		comment = AnetObjectEngine.getInstance().getCommentDao().getByUuid(comment.getUuid());
		
		Map<String,Object> context = new HashMap<String,Object>();
		context.put("report", r);
		context.put("reportIntent", StringUtils.abbreviate(r.getIntent(), MAX_REPORT_INTENT_LENGTH));
		context.put("comment", comment);
		return context;
	}

	public Report getReport() {
		return report;
	}

	public void setReport(Report report) {
		this.report = Report.createWithUuid(report.getUuid());
	}

	public Comment getComment() {
		return comment;
	}

	public void setComment(Comment comment) {
		this.comment = new Comment();
		this.comment.setUuid(comment.getUuid());
	}

}
