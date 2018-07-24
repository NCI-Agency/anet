package mil.dds.anet.views;

import java.util.Objects;

import org.joda.time.DateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import mil.dds.anet.graphql.GraphQLIgnore;
import mil.dds.anet.graphql.IGraphQLBean;

public abstract class AbstractAnetBean implements IGraphQLBean {

	protected LoadLevel loadLevel;
	protected String uuid;
	protected DateTime createdAt;
	protected DateTime updatedAt;
 
	public AbstractAnetBean() { 
		uuid = null;
	}
		
	public static enum LoadLevel { ID_ONLY, PROPERTIES, INCLUDE;
		public boolean contains(LoadLevel other) { 
			return other.ordinal() <= this.ordinal();
		}
	}
	
	@GraphQLIgnore
	@JsonIgnore
	public LoadLevel getLoadLevel() { 
		return loadLevel;
	}
	
	public void setLoadLevel(LoadLevel ll) { 
		this.loadLevel = ll;
	}

	public String getUuid() {
		return uuid;
	}

	public void setUuid(String uuid) {
		this.uuid = uuid;
	}

	public DateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(DateTime createdAt) {
		this.createdAt = createdAt;
	}

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
