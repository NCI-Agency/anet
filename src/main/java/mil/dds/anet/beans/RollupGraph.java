package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLQuery;

public class RollupGraph {

	Organization org;
	int released;
	int cancelled;
	
	@GraphQLQuery(name="org")
	public Organization getOrg() {
		return org;
	}
	
	public void setOrg(Organization org) {
		this.org = org;
	}
	
	@GraphQLQuery(name="released")
	public int getReleased() {
		return released;
	}
	
	public void setReleased(int released) {
		this.released = released;
	}
	
	@GraphQLQuery(name="cancelled")
	public int getCancelled() {
		return cancelled;
	}
	
	public void setCancelled(int cancelled) {
		this.cancelled = cancelled;
	}
	
}
