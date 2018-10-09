package mil.dds.anet.views;

import io.leangen.graphql.annotations.GraphQLQuery;

import java.util.Objects;

import org.joda.time.DateTime;

public abstract class AbstractAnetBean {

	protected String uuid;
	protected DateTime createdAt;
	protected DateTime updatedAt;

	public AbstractAnetBean() { 
		uuid = null;
	}

	@GraphQLQuery(name="uuid")
	public String getUuid() {
		return uuid;
	}

	public void setUuid(String uuid) {
		this.uuid = uuid;
	}

	@GraphQLQuery(name="createdAt")
	public DateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(DateTime createdAt) {
		this.createdAt = createdAt;
	}

	@GraphQLQuery(name="updatedAt")
	public DateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(DateTime updatedAt) {
		this.updatedAt = updatedAt;
	}
	
	/*Determines if two beans are "uuid" equal.
	 * That is they have the same uuid. (or are null)
	 */
	public static boolean uuidEqual(AbstractAnetBean a, AbstractAnetBean b) {
		if (a == null && b == null) { return true; }
		if (a == null || b == null) { return false; }
		if (a.getUuid() != null && b.getUuid() != null) {
			return Objects.equals(a.getUuid(), b.getUuid());
		}
		return a.equals(b);
	}
}
