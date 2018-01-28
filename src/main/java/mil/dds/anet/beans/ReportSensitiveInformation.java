package mil.dds.anet.beans;

import java.util.Objects;

import mil.dds.anet.views.AbstractAnetBean;

public class ReportSensitiveInformation extends AbstractAnetBean {

	private String text;
	private int reportId;

	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
	}

	public int getReportId() {
		return reportId;
	}

	public void setReportId(int reportId) {
		this.reportId = reportId;
	}

	@Override
	public boolean equals(Object o) {
		if (o == null || o.getClass() != this.getClass()) {
			return false;
		}
		final ReportSensitiveInformation rsi = (ReportSensitiveInformation) o;
		return Objects.equals(rsi.getId(), id)
				&& Objects.equals(rsi.getText(), text)
				&& Objects.equals(rsi.getReportId(), reportId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(id, text, reportId);
	}

	@Override
	public String toString() {
		return String.format("[id:%d, reportId:%d]", id, reportId);
	}

}
