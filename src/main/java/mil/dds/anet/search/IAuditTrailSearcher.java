package mil.dds.anet.search;

import mil.dds.anet.beans.AuditTrail;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuditTrailSearchQuery;

public interface IAuditTrailSearcher {

  public AnetBeanList<AuditTrail> runSearch(AuditTrailSearchQuery query);
}
