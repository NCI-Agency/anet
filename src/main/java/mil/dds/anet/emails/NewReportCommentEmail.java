package mil.dds.anet.emails;

import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Report;
import org.apache.commons.lang3.StringUtils;

public class NewReportCommentEmail implements AnetEmailAction {
  private Report report;
  private Comment comment;

  @Override
  public String getTemplateName() {
    return "/emails/newReportComment.ftlh";
  }

  @Override
  public String getSubject(Map<String, Object> context) {
    return "New Comment on your ANET Report";
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context) {
    Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
    comment = AnetObjectEngine.getInstance().getCommentDao().getByUuid(comment.getUuid());

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
