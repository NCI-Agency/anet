package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

import com.fasterxml.jackson.annotation.JsonSetter;

import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.IdFetcher;

public class Note extends AbstractAnetBean {

	private String text;
	private Person author;

	@GraphQLQuery(name="text")
	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = Utils.trimStringReturnNull(text);
	}

	@GraphQLQuery(name="author")
	public CompletableFuture<Person> loadAuthor(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Person>().load(context, "people", author)
				.thenApply(o -> { author = o; return o; });
	}

	@JsonSetter("author")
	public void setAuthor(Person author) {
		this.author = author;
	}

	@GraphQLIgnore
	public Person getAuthor() {
		return author;
	}

	@Override
	public boolean equals(Object o) {
		if (o == null || o.getClass() != this.getClass()) {
			return false;
		}
		final Note n = (Note) o;
		return Objects.equals(n.getUuid(), uuid)
				&& uuidEqual(n.getAuthor(), author)
				&& Objects.equals(n.getText(), text);
	}

	@Override
	public int hashCode() {
		return Objects.hash(uuid, text);
	}

	@Override
	public String toString() {
		return String.format("[uuid:%s, author:%s]", uuid, DaoUtils.getUuid(author));
	}

}
