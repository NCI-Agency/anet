package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLQuery;

import java.util.Objects;

import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class Comment extends AbstractAnetBean {

	private String reportUuid;
	
	private Person author;
	private String text;

	@GraphQLQuery(name="reportUuid")
	public String getReportUuid() {
		return reportUuid;
	}

	public void setReportUuid(String reportUuid) {
		this.reportUuid = reportUuid;
	}

	@GraphQLQuery(name="author")
	public Person getAuthor() {
		return author;
	}

	public void setAuthor(Person author) {
		this.author = author;
	}

	@GraphQLQuery(name="text")
	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = Utils.trimStringReturnNull(text);
	}
	
	
	@Override
	public boolean equals(Object o) {
		if (o == null || o.getClass() != this.getClass()) {
			return false;
		}
		Comment c = (Comment) o;
		return Objects.equals(c.getUuid(), uuid)
				&& uuidEqual(c.getAuthor(), author)
				&& Objects.equals(c.getText(), text)
				&& Objects.equals(c.getReportUuid(), reportUuid)
				&& Objects.equals(c.getUpdatedAt(), updatedAt)
				&& Objects.equals(c.getCreatedAt(), createdAt);
	}
	
	@Override
	public int hashCode() {
		return Objects.hash(uuid, author, createdAt, text, reportUuid, updatedAt);
	}
	
	@Override
	public String toString() {
		return String.format("[%s] - [Author:%s,Report:%d] - (%s)", uuid, author.getUuid(), reportUuid, text);
	}

	public static Comment createWithUuid(String uuid) {
		final Comment c = new Comment();
		c.setUuid(uuid);
		return c;
	}

}
