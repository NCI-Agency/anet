package mil.dds.anet.emails;

import java.util.Map;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import org.apache.commons.lang3.StringUtils;

public class ReportEmail implements AnetEmailAction {
  private Report report;
  private Person sender;
  private String comment;

  @Override
  public String getTemplateName() {
    return "/emails/emailReport.ftlh";
  }

  @Override
  public String getSubject(Map<String, Object> context) {
    return "Sharing a report in ANET";
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context) {
    Report r = engine().getReportDao().getByUuid(report.getUuid());
    if (r == null) {
      return null;
    }
    sender = engine().getPersonDao().getByUuid(sender.getUuid());

    context.put("report", r);
    context.put("reportIntent", StringUtils.abbreviate(r.getIntent(), MAX_REPORT_INTENT_LENGTH));
    context.put("sender", sender);
    context.put("comment", comment);

    // See if we have an avatar image for this person
    if (sender.getEntityAvatar() != null) {
      String avatar = "/api/attachment/view/" + sender.getEntityAvatar().getAttachmentUuid();
      context.put("avatar", avatar);
    }

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
