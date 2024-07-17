package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;

public class AnetEmailResource {
  private final EmailDao emailDao;

  public AnetEmailResource(final AnetObjectEngine engine) {
    this.emailDao = engine.getEmailDao();
  }

  @GraphQLQuery(name = "pendingEmails")
  public List<AnetEmail> getPendingEmails(@GraphQLRootContext Map<String, Object> context) {
    AuthUtils.assertAdministrator(DaoUtils.getUserFromContext(context));
    return emailDao.getAll();
  }
}
