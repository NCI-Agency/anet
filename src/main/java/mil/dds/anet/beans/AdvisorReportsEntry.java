package mil.dds.anet.beans;

import java.util.List;

import io.leangen.graphql.annotations.GraphQLQuery;

public class AdvisorReportsEntry {

	String uuid;
	String name;
	List<AdvisorReportsStats> stats;
	
	
	@GraphQLQuery(name="uuid")
	public String getUuid() {
		return uuid;
	}
	
	public void setUuid(String uuid) {
		this.uuid = uuid;
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
