package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.AccessTokenDao;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AccessTokenResource {

  private final AuditTrailDao auditTrailDao;
  private final AccessTokenDao accessTokenDao;

  public AccessTokenResource(AuditTrailDao auditTrailDao, AccessTokenDao accessTokenDao) {
    this.auditTrailDao = auditTrailDao;
    this.accessTokenDao = accessTokenDao;
  }

  @GraphQLQuery(name = "accessToken")
  public AccessToken getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    final AccessToken accessToken = accessTokenDao.getByUuid(uuid);
    if (accessToken == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Access token not found");
    }
    return accessToken;
  }

  @GraphQLQuery(name = "accessTokenList")
  public List<AccessToken> getAccessTokenList(@GraphQLRootContext GraphQLContext context) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    return accessTokenDao.getAll();
  }

  @GraphQLMutation(name = "createAccessToken")
  public AccessToken createAccessToken(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "accessToken") AccessToken at) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    final AccessToken created = accessTokenDao.insert(at);

    // Log the change
    auditTrailDao.logCreate(user, AccessTokenDao.TABLE_NAME, created);
    return created;
  }

  @GraphQLMutation(name = "updateAccessToken")
  public Integer updateAccessToken(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "accessToken") AccessToken at,
      @GraphQLArgument(name = "force", defaultValue = "false") boolean force) {
    final Person user = DaoUtils.getUserFromContext(context);
    final AccessToken existing = accessTokenDao.getByUuid(at.getUuid());
    if (existing == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Access token not found");
    }

    AuthUtils.assertAdministrator(user);
    DaoUtils.assertObjectIsFresh(at, existing, force);

    final int numRows = accessTokenDao.update(at);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process access token update");
    }

    // Log the change
    auditTrailDao.logUpdate(user, AccessTokenDao.TABLE_NAME, at);
    return numRows;
  }

  @GraphQLMutation(name = "deleteAccessToken")
  public Integer deleteAccessToken(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String uuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final AccessToken existing = accessTokenDao.getByUuid(uuid);
    if (existing == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Access token not found");
    }

    AuthUtils.assertAdministrator(user);

    final int numRows = accessTokenDao.delete(uuid);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process access token delete");
    }

    // Log the change
    auditTrailDao.logDelete(user, AccessTokenDao.TABLE_NAME, existing);
    return numRows;
  }

}
