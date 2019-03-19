package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLQuery;

public class RollupGraph {

	Organization org;
	int published;
	int cancelled;
	
	@GraphQLQuery(name="org")
	public Organization getOrg() {
		return org;
	}
	
	public void setOrg(Organization org) {
		this.org = org;
	}
	
	@GraphQLQuery(name="published")
	public int getPublished() {
		return published;
	}
	
	public void setPublished(int published) {
		this.published = published;
	}
	
	@GraphQLQuery(name="cancelled")
	public int getCancelled() {
		return cancelled;
	}
	
	public void setCancelled(int cancelled) {
		this.cancelled = cancelled;
	}
	
}
