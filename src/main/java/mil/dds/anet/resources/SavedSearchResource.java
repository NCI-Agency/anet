package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.SavedSearch;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.database.SavedSearchDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SavedSearchResource {

  private final AuditTrailDao auditTrailDao;
  private final SavedSearchDao dao;

  public SavedSearchResource(AuditTrailDao auditTrailDao, SavedSearchDao dao) {
    this.auditTrailDao = auditTrailDao;
    this.dao = dao;
  }

  public static boolean hasPermission(final Person user, final SavedSearch savedSearch) {
    if (savedSearch == null
        || !Objects.equals(DaoUtils.getUuid(user), savedSearch.getOwnerUuid())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "You must be the owner of the saved search");
    }
    return true;
  }

  public static void assertPermission(final Person user, final SavedSearch savedSearch) {
    if (!hasPermission(user, savedSearch)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, AuthUtils.UNAUTH_MESSAGE);
    }
  }

  @GraphQLMutation(name = "createSavedSearch")
  public SavedSearch createSavedSearch(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "savedSearch") SavedSearch savedSearch) {
    final Person user = DaoUtils.getUserFromContext(context);
    savedSearch.setOwnerUuid(DaoUtils.getUuid(user));
    final SavedSearch created = dao.insert(savedSearch);

    // Log the change
    auditTrailDao.logCreate(user, SavedSearchDao.TABLE_NAME, created);
    return created;
  }

  @GraphQLQuery(name = "mySearches")
  public List<SavedSearch> getMySearches(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "forHomepage", defaultValue = "false") boolean forHomepage) {
    return dao.getSearchesByOwner(DaoUtils.getUserFromContext(context), forHomepage);
  }

  @GraphQLMutation(name = "deleteSavedSearch")
  public Integer deleteSavedSearch(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String savedSearchUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final SavedSearch existing = dao.getByUuid(savedSearchUuid);
    assertPermission(user, existing);
    int numDeleted = dao.delete(savedSearchUuid);
    if (numDeleted == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process saved search delete");
    }

    // Log the change
    auditTrailDao.logDelete(user, SavedSearchDao.TABLE_NAME, existing);
    return numDeleted;
  }

  @GraphQLMutation(name = "updateSavedSearch")
  public Integer updateSavedSearch(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "savedSearch") SavedSearch savedSearch) {
    final Person user = DaoUtils.getUserFromContext(context);
    final SavedSearch existing = dao.getByUuid(DaoUtils.getUuid(savedSearch));
    assertPermission(user, existing);
    int numRows = dao.update(savedSearch);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process saved search update");
    }

    // Log the change
    auditTrailDao.logUpdate(user, SavedSearchDao.TABLE_NAME, savedSearch);
    return numRows;
  }

}
