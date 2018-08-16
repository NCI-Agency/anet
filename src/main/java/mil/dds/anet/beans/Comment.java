package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLQuery;

import java.util.Objects;

import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class Comment extends AbstractAnetBean {

	private Integer reportId;
	
	private Person author;
	private String text;

	@GraphQLQuery(name="reportId")
	public Integer getReportId() {
		return reportId;
	}

	public void setReportId(Integer reportId) {
		this.reportId = reportId;
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
		return Objects.equals(c.getId(), id) 
				&& idEqual(c.getAuthor(), author) 
				&& Objects.equals(c.getText(), text) 
				&& Objects.equals(c.getReportId(), reportId) 
				&& Objects.equals(c.getUpdatedAt(), updatedAt) 
				&& Objects.equals(c.getCreatedAt(), createdAt);
	}
	
	@Override
	public int hashCode() { 
		return Objects.hash(id, author, createdAt, text, reportId, updatedAt);
	}
	
	@Override
	public String toString() { 
		return String.format("[%d] - [Author:%d,Report:%d] - (%s)", id, author.getId(), reportId, text);
	}

	public static Comment createWithId(Integer id) {
		Comment c = new Comment();
		c.setId(id);
		return c;
	}
	
}
