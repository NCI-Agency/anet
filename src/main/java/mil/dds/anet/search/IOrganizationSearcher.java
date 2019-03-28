package mil.dds.anet.search;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;

public interface IOrganizationSearcher {

	public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query);
	
}
