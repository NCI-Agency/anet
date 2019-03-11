package mil.dds.anet.emails;

import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;

public class ReportEditedEmail implements AnetEmailAction {
	private Report report;
	private Person editor;
	
	@Override
	public String getTemplateName() {
		return "/emails/reportEdited.ftlh";
	}

	@Override
	public String getSubject(Map<String, Object> context) {
		return "New Edit to your ANET Report";
	}
	
	@Override
	public Map<String, Object> buildContext(Map<String, Object> context) {
		Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
		editor = AnetObjectEngine.getInstance().getPersonDao().getByUuid(editor.getUuid());
		
		context.put("report", r);
		context.put("reportIntent", StringUtils.abbreviate(r.getIntent(), MAX_REPORT_INTENT_LENGTH));
		context.put("editor", editor);

		return context;
	}

	public Report getReport() {
		return report;
	}

	public void setReport(Report report) {
		this.report = Report.createWithUuid(report.getUuid());
	}

	public Person getEditor() {
		return editor;
	}

	public void setEditor(Person editor) {
		this.editor = Person.createWithUuid(editor.getUuid());
	}

}