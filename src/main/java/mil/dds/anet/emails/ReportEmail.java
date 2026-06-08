package mil.dds.anet.emails;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.beans.ConfidentialityRecord;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.utils.Utils;

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
    final Report r = (Report) context.get("report");
    return String.format("ANET report: %s", getReportLabel(r));
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context) {
    Report r = engine().getReportDao().getByUuid(report.getUuid());
    if (r == null) {
      return null;
    }
    if (sender != null) {
      sender = engine().getPersonDao().getByUuid(sender.getUuid());
    }

    context.put("report", r);
    context.put("reportIntent", getReportLabel(r));
    context.put("reportAuthors", getReportAuthors(r));
    context.put("reportPeople", getReportPeople(r));
    context.put("sender", sender);
    context.put("comment", comment);
    // Gather all attachments, either directly linked, or referenced in rich-text
    context.put("attachments", Utils.getAttachments(r, r.getReportText()));
    // Override the classification
    final AnetDictionary dict = ApplicationContextProvider.getDictionary();
    final var siteClassification = ConfidentialityRecord.getConfidentialityLabelForChoice(dict,
        (String) dict.getDictionaryEntry("siteClassification"));
    final var reportClassification =
        ConfidentialityRecord.getConfidentialityLabelForChoice(dict, r.getClassification());
    final var classification = Objects.requireNonNullElse(reportClassification, siteClassification);
    context.put("SECURITY_BANNER_CLASSIFICATION",
        ConfidentialityRecord.create(classification).toString());
    context.put("SECURITY_BANNER_COLOR", classification.get("color"));

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
    if (sender != null) {
      this.sender = Person.createWithUuid(sender.getUuid());
    }
  }

  public String getComment() {
    return comment;
  }

  public void setComment(String comment) {
    this.comment = comment;
  }

  private List<ReportPerson> getReportAuthors(Report r) {
    final List<ReportPerson> reportAuthors = r.loadAuthors(engine().getContext()).join();
    reportAuthors.sort(Person.COMPARATOR);
    return reportAuthors;
  }

  private List<ReportPerson> getReportPeople(Report r) {
    final List<ReportPerson> reportPeople = r.loadReportPeople(engine().getContext()).join();
    reportPeople.sort(ReportPerson.COMPARATOR);
    return reportPeople;
  }

}
