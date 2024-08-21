package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;

public class AnetEmailResource {
  private final EmailDao emailDao;

  public AnetEmailResource(final AnetObjectEngine engine) {
    this.emailDao = engine.getEmailDao();
  }

  @GraphQLQuery(name = "pendingEmails")
  public AnetBeanList<AnetEmail> getPendingEmails(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "pageNum", defaultValue = "0") int pageNum,
      @GraphQLArgument(name = "pageSize", defaultValue = "0") int pageSize) {
    AuthUtils.assertAdministrator(DaoUtils.getUserFromContext(context));
    return emailDao.getAll(pageNum, pageSize);
  }
}
