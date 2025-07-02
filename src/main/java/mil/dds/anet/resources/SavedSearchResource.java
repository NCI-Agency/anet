package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.database.SavedSearchDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class SavedSearchResource {

  private final SavedSearchDao dao;

  public SavedSearchResource(SavedSearchDao dao) {
    this.dao = dao;
  }

  @GraphQLMutation(name = "createSavedSearch")
  public SavedSearch createSavedSearch(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "savedSearch") SavedSearch savedSearch) {
    Person user = DaoUtils.getUserFromContext(context);
    savedSearch.setOwnerUuid(user.getUuid());
    Double maxPriority = dao.getMaxPriorityForOwner(user.getUuid());
    savedSearch.setPriority(maxPriority == null ? 0.0 : maxPriority + 1.0);
    if (savedSearch.getDisplayInHomepage()) {
      Double maxHomepagePriority = dao.getMaxHomepagePriorityForOwner(user.getUuid());
      savedSearch
          .setHomepagePriority(maxHomepagePriority == null ? 0.0 : maxHomepagePriority + 1.0);
    }
    final SavedSearch created = dao.insert(savedSearch);
    AnetAuditLogger.log("SavedSearch {} created by {}", created, user);
    return created;
  }

  @GraphQLQuery(name = "mySearches")
  public List<SavedSearch> getMySearches(@GraphQLRootContext GraphQLContext context) {
    return dao.getSearchesByOwner(DaoUtils.getUserFromContext(context)).stream()
        .sorted(
            Comparator.comparing(SavedSearch::getPriority, Comparator.nullsLast(Double::compareTo)))
        .toList();
  }

  @GraphQLQuery(name = "myHomepageSearches")
  public List<SavedSearch> getMyHomepageSearches(@GraphQLRootContext GraphQLContext context) {
    Person user = DaoUtils.getUserFromContext(context);
    return dao.getSearchesByOwner(user).stream()
        .filter(s -> Boolean.TRUE.equals(s.getDisplayInHomepage())).sorted(Comparator
            .comparing(SavedSearch::getHomepagePriority, Comparator.nullsLast(Double::compareTo)))
        .toList();
  }

  @GraphQLMutation(name = "deleteSavedSearch")
  public Integer deleteSavedSearch(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String savedSearchUuid) {
    final SavedSearch s = dao.getByUuid(savedSearchUuid);
    if (s == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved search not found");
    }
    if (!Objects.equals(s.getOwnerUuid(), DaoUtils.getUserFromContext(context).getUuid())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Saved search can only be deleted by owner");
    }
    int numDeleted = dao.delete(savedSearchUuid);
    if (numDeleted == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process saved search delete");
    }
    return numDeleted;
  }

  @GraphQLMutation(name = "updateSavedSearchPriority")
  public Integer updateSavedSearchPriority(@GraphQLArgument(name = "uuid") String uuid,
      @GraphQLArgument(name = "priority") Double priority) {
    return dao.updatePriority(uuid, priority);
  }

  @GraphQLMutation(name = "updateSavedSearchHomepagePriority")
  public Integer updateSavedSearchHomepagePriority(@GraphQLArgument(name = "uuid") String uuid,
      @GraphQLArgument(name = "homepagePriority") Double homepagePriority) {
    return dao.updateHomepagePriority(uuid, homepagePriority);
  }

  @GraphQLMutation(name = "updateSavedSearchDisplayInHomepage")
  public Integer updateSavedSearchDisplayInHomepage(@GraphQLArgument(name = "uuid") String uuid,
      @GraphQLArgument(name = "displayInHomepage") Boolean displayInHomepage) {
    return dao.updateSavedSearchDisplayInHomepage(uuid, displayInHomepage);
  }
}
