package mil.dds.anet.beans;

import java.util.List;

import io.leangen.graphql.annotations.GraphQLQuery;

public class AdvisorReportsEntry {

	int id;
	String name;
	List<AdvisorReportsStats> stats;
	
	
	@GraphQLQuery(name="id")
	public int getId() {
		return id;
	}
	
	public void setId(int id) {
		this.id = id;
	}
	
	@GraphQLQuery(name="name")
	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	@GraphQLQuery(name="stats")
	public List<AdvisorReportsStats> getStats() {
		return stats;
	}
	
	public void setStats(List<AdvisorReportsStats> stats) {
		this.stats = stats;
	}

}
