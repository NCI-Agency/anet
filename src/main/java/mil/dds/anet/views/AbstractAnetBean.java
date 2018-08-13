package mil.dds.anet.views;

import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;

import java.util.Objects;

import org.joda.time.DateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

public abstract class AbstractAnetBean {

	protected LoadLevel loadLevel;
	protected Integer id;
	protected DateTime createdAt;
	protected DateTime updatedAt;

	public AbstractAnetBean() { 
		id = null;
	}
		
	public static enum LoadLevel { ID_ONLY, PROPERTIES, INCLUDE;
		public boolean contains(LoadLevel other) { 
			return other.ordinal() <= this.ordinal();
		}
	}
	
	@JsonIgnore
	@GraphQLIgnore
	public LoadLevel getLoadLevel() { 
		return loadLevel;
	}
	
	public void setLoadLevel(LoadLevel ll) { 
		this.loadLevel = ll;
	}
	
	@GraphQLQuery(name="id")
	public Integer getId() { 
		return id;
	}
	
	public void setId(Integer id) { 
		this.id = id;
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
	
	/*Determines if two beans are "id" equal. 
	 * That is they have the same Id. (or are null)
	 */
	public static boolean idEqual(AbstractAnetBean a, AbstractAnetBean b) { 
		if (a == null && b == null) { return true; }
		if (a == null || b == null) { return false; }
		if (a.getId() != null && b.getId() != null) { 
			return Objects.equals(a.getId(), b.getId());
		}
		return a.equals(b);
	}
}
