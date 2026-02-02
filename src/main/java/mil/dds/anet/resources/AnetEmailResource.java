package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import org.springframework.stereotype.Component;

@Component
public class AnetEmailResource {

  private final EmailDao emailDao;

  public AnetEmailResource(EmailDao emailDao) {
    this.emailDao = emailDao;
  }

  @GraphQLQuery(name = "pendingEmails")
  public AnetBeanList<AnetEmail> getPendingEmails(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "pageNum", defaultValue = "0") int pageNum,
      @GraphQLArgument(name = "pageSize", defaultValue = "0") int pageSize) {
    AuthUtils.assertAdministrator(DaoUtils.getUserFromContext(context));
    return emailDao.getAll(pageNum, pageSize);
  }

}
