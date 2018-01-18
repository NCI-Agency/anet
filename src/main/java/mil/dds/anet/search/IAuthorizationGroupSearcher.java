package mil.dds.anet.search;

import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.lists.AbstractAnetBeanList.AuthorizationGroupList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;

public interface IAuthorizationGroupSearcher {

	public AuthorizationGroupList runSearch(AuthorizationGroupSearchQuery query, Handle dbHandle);

}
