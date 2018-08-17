package mil.dds.anet.beans;

import java.util.Objects;

import io.leangen.graphql.annotations.GraphQLQuery;

public class ReportPerson extends Person {

	boolean primary;

	public ReportPerson() { 
		this.primary = false; // Default
	}
	
	@GraphQLQuery(name="primary")
	public boolean isPrimary() {
		return primary;
	}

	public void setPrimary(boolean primary) {
		this.primary = primary;
	}

	@Override
	public boolean equals(Object o) { 
		if (o == null || getClass() != o.getClass()) { 
			return false;
		}
		ReportPerson rp = (ReportPerson) o;
		return super.equals(o) 
			&& Objects.equals(rp.isPrimary(), primary);
	}
	
	@Override
	public int hashCode() { 
		return Objects.hash(super.hashCode(), primary);
	}

	public static ReportPerson createWithUuid(String uuid) {
		final ReportPerson rp = new ReportPerson();
		rp.setUuid(uuid);
		return rp;
	}

}
