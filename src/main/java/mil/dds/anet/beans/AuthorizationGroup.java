package mil.dds.anet.beans;

import java.util.List;
import java.util.Objects;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.GraphQLIgnore;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class AuthorizationGroup extends AbstractAnetBean {

	private String name;
	private String description;
	private List<Position> positions;

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

	@GraphQLFetcher("positions")
	public List<Position> loadPositions() {
		if (positions == null) {
			positions = AnetObjectEngine.getInstance().getAuthorizationGroupDao().getPositionsForAuthorizationGroup(this);
		}
		return positions;
	}

	@GraphQLIgnore
	public List<Position> getPositions() {
		return positions;
	}

	public void setPositions(List<Position> positions) {
		this.positions = positions;
	}

	@Override
	public boolean equals(Object o) {
		if (o == null || o.getClass() != this.getClass()) {
			return false;
		}
		AuthorizationGroup a = (AuthorizationGroup) o;
		return Objects.equals(a.getId(), id)
				&& Objects.equals(a.getName(), name)
				&& Objects.equals(a.getDescription(), description)
				&& Objects.equals(a.getPositions(), positions);
	}

	@Override
	public int hashCode() {
		return Objects.hash(id, name, description, positions);
	}

	@Override
	public String toString() {
		return String.format("(%d) - %s", id, name);
	}

}
