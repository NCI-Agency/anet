package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response.Status;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.database.SavedSearchDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;

public class SavedSearchResource {

  private final SavedSearchDao dao;

  public SavedSearchResource(AnetObjectEngine engine) {
    this.dao = engine.getSavedSearchDao();
  }

  @GraphQLMutation(name = "createSavedSearch")
  public SavedSearch createSavedSearch(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "savedSearch") SavedSearch savedSearch) {
    Person user = DaoUtils.getUserFromContext(context);
    savedSearch.setOwnerUuid(user.getUuid());
    try {
      final SavedSearch created = dao.insert(savedSearch);
      AnetAuditLogger.log("SavedSearch {} created by {}", created, user);
      return created;
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, "Duplicate name for saved search");
    }
  }

  @GraphQLQuery(name = "mySearches")
  public List<SavedSearch> getMySearches(@GraphQLRootContext Map<String, Object> context) {
    return dao.getSearchesByOwner(DaoUtils.getUserFromContext(context));
  }

  @GraphQLMutation(name = "deleteSavedSearch")
  public Integer deleteSavedSearch(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String savedSearchUuid) {
    final SavedSearch s = dao.getByUuid(savedSearchUuid);
    if (s == null) {
      throw new WebApplicationException("Saved search not found", Status.NOT_FOUND);
    }
    if (!Objects.equals(s.getOwnerUuid(), DaoUtils.getUserFromContext(context).getUuid())) {
      throw new WebApplicationException("Saved search can only be deleted by owner",
          Status.FORBIDDEN);
    }
    int numDeleted = dao.delete(savedSearchUuid);
    if (numDeleted == 0) {
      throw new WebApplicationException("Couldn't process saved search delete", Status.NOT_FOUND);
    }
    return numDeleted;
  }
}
