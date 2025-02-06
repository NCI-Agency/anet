package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import java.util.List;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.AccessTokenDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import org.springframework.stereotype.Component;

@Component
@GraphQLApi
public class AccessTokenResource {

  private final AccessTokenDao accessTokenDao;

  public AccessTokenResource(AccessTokenDao accessTokenDao) {
    this.accessTokenDao = accessTokenDao;
  }

  @GraphQLQuery(name = "accessTokenList")
  public List<AccessToken> getAccessTokenList(@GraphQLRootContext GraphQLContext context) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    return accessTokenDao.getAll();
  }

  @GraphQLMutation(name = "createAccessToken")
  public Integer createAccessToken(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "accessToken") AccessToken at) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    return accessTokenDao.insert(at);
  }

  @GraphQLMutation(name = "updateAccessToken")
  public Integer updateAccessToken(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "accessToken") AccessToken at) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    return accessTokenDao.update(at);
  }

  @GraphQLMutation(name = "deleteAccessToken")
  public Integer deleteAccessToken(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "accessToken") AccessToken at) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    return accessTokenDao.delete(at);
  }

}
