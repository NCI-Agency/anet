package mil.dds.anet.beans;

import java.util.Objects;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class Tag extends AbstractAnetBean {

	private String name;
	private String description;

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = Utils.trimStringReturnNull(name);
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = Utils.trimStringReturnNull(description);
	}

	@Override
	public boolean equals(Object o) {
		if (o == null || o.getClass() != Tag.class) {
			return false;
		}
		Tag t = (Tag) o;
		return Objects.equals(t.getId(), id)
				&& Objects.equals(t.getName(), name)
				&& Objects.equals(t.getDescription(), description);
	}

	@Override
	public int hashCode() {
		return Objects.hash(id, name, description);
	}

	@Override
	public String toString() {
		return String.format("(%d) - %s", id, name);
	}

}
