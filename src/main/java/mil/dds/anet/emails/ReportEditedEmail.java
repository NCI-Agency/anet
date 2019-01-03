package mil.dds.anet.emails;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;

public class ReportEditedEmail extends AnetEmailAction {
	Report report;
	Person editor;
	
	public ReportEditedEmail() { 
		templateName = "/emails/reportEdited.ftlh";
		subject = "New Edit to your ANET Report";
	}
	
	@Override
	public Map<String, Object> execute() {
		Report r = AnetObjectEngine.getInstance().getReportDao().getByUuid(report.getUuid());
		editor = AnetObjectEngine.getInstance().getPersonDao().getByUuid(editor.getUuid());
		
		Map<String,Object> context = new HashMap<String,Object>();
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