package mil.dds.anet.beans;

import java.util.Objects;

import mil.dds.anet.views.AbstractAnetBean;

public class ReportSensitiveInformation extends AbstractAnetBean {

	private String text;
	private String reportUuid;

	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
	}

	public String getReportUuid() {
		return reportUuid;
	}

	public void setReportUuid(String reportUuid) {
		this.reportUuid = reportUuid;
	}

	@Override
	public boolean equals(Object o) {
		if (o == null || o.getClass() != this.getClass()) {
			return false;
		}
		final ReportSensitiveInformation rsi = (ReportSensitiveInformation) o;
		return Objects.equals(rsi.getUuid(), uuid)
				&& Objects.equals(rsi.getText(), text)
				&& Objects.equals(rsi.getReportUuid(), reportUuid);
	}

	@Override
	public int hashCode() {
		return Objects.hash(uuid, text, reportUuid);
	}

	@Override
	public String toString() {
		return String.format("[uuid:%s, reportUuid:%s]", uuid, reportUuid);
	}

}
