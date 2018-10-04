package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.IdFetcher;

public class Position extends AbstractAnetBean {

	public static enum PositionType { ADVISOR, PRINCIPAL, SUPER_USER, ADMINISTRATOR }
	public static enum PositionStatus { ACTIVE, INACTIVE } 
	
	String name;
	String code;
	PositionType type;
	PositionStatus status;
	//Lazy Loaded
	Organization organization;
	Person person; //The Current person.
	List<Position> associatedPositions;
	Location location;
	List<PersonPositionHistory> previousPeople;
	Boolean isApprover;

	public static Position createWithId(Integer id) {
		Position b = new Position();
		b.setId(id);
		return b;
	}
	
	@GraphQLQuery(name="name")
	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = Utils.trimStringReturnNull(name);
	}
	
	@GraphQLQuery(name="code")
	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = Utils.trimStringReturnNull(code);
	}

	@GraphQLQuery(name="type")
	public PositionType getType() {
		return type;
	}

	public void setType(PositionType type) {
		this.type = type;
	}

	@GraphQLQuery(name="status")
	public PositionStatus getStatus() {
		return status;
	}

	public void setStatus(PositionStatus status) {
		this.status = status;
	}

	@GraphQLQuery(name="organization")
	public CompletableFuture<Organization> loadOrganization(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Organization>().load(context, "organizations", organization)
				.thenApply(o -> { organization = o; return o; });
	}
	
	public void setOrganization(Organization ao) {
		this.organization = ao;
	}
	
	@GraphQLIgnore
	public Organization getOrganization() { 
		return organization;
	}
	
	@GraphQLQuery(name="person")
	public CompletableFuture<Person> loadPerson(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Person>().load(context, "people", person)
				.thenApply(o -> { person = o; return o; });
	}
	
	@GraphQLIgnore
	public Person getPerson() { 
		return person;
	}
	
	public void setPerson(Person p) {
		this.person = p;
	}
	
	@GraphQLQuery(name="associatedPositions") // TODO: batch load? (used in positions/{Edit,Show}.js, {organizations,people}/Show.js)
	public List<Position> loadAssociatedPositions() { 
		if (associatedPositions == null) { 
			associatedPositions = AnetObjectEngine.getInstance()
				.getPositionDao().getAssociatedPositions(this);
		}
		return associatedPositions;
	}
	
	@GraphQLIgnore
	public List<Position> getAssociatedPositions() { 
		return associatedPositions;
	}
	
	public void setAssociatedPositions(List<Position> associatedPositions) { 
		this.associatedPositions = associatedPositions;
	}
	
	@GraphQLQuery(name="location")
	public CompletableFuture<Location> loadLocation(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Location>().load(context, "locations", location)
				.thenApply(o -> { location = o; return o; });
	}
	
	@GraphQLIgnore
	public Location getLocation() { 
		return location;
	}
	
	public void setLocation(Location location) { 
		this.location = location;
	}
	
	@GraphQLQuery(name="previousPeople")
	public CompletableFuture<List<PersonPositionHistory>> loadPreviousPeople(@GraphQLRootContext Map<String, Object> context) {
		return AnetObjectEngine.getInstance().getPositionDao().getPositionHistory(context, this)
				.thenApply(o -> { previousPeople = o; return o; });
	}

	@GraphQLIgnore
	public List<PersonPositionHistory> getPreviousPeople() {
		return previousPeople;
	}

	public void setPreviousPeople(List<PersonPositionHistory> previousPeople) {
		this.previousPeople = previousPeople;
	}

	@GraphQLQuery(name="isApprover")
	public Boolean loadIsApprover() { 
		if (this.isApprover == null) { 
			this.isApprover = AnetObjectEngine.getInstance().getPositionDao().getIsApprover(this);
		}
		return isApprover;
	}
	
	@Override
	public boolean equals(Object o) { 
		if (o == null || o.getClass() != this.getClass()) {
			return false; 
		}
		Position other = (Position) o;
		return Objects.equals(id, other.getId()) 
			&& Objects.equals(name, other.getName()) 
			&& Objects.equals(code,  other.getCode()) 
			&& Objects.equals(type, other.getType()) 
			&& idEqual(organization, other.getOrganization());
	}
	
	@Override
	public int hashCode() { 
		return Objects.hash(id, name, code, type, organization);
	}
	
	@Override
	public String toString() { 
		return String.format("[id:%s name:%s orgId:%d]", id, name, DaoUtils.getId(organization));
	}
}
