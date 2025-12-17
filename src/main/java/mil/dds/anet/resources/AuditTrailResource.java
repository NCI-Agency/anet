package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.beans.AuditTrail;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuditTrailSearchQuery;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.utils.DaoUtils;
import org.springframework.stereotype.Component;

@Component
public class AuditTrailResource {

  private final AuditTrailDao dao;

  public AuditTrailResource(AuditTrailDao dao) {
    this.dao = dao;
  }

  @GraphQLQuery(name = "auditTrailList")
  public AnetBeanList<AuditTrail> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") AuditTrailSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

}
