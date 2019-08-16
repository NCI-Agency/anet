package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.TagDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;

@PermitAll
public class TagResource {

  private final TagDao dao;

  public TagResource(AnetObjectEngine engine) {
    this.dao = engine.getTagDao();
  }

  @GraphQLQuery(name = "tag")
  public Tag getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    final Tag t = dao.getByUuid(uuid);
    if (t == null) {
      throw new WebApplicationException("Tag not found", Status.NOT_FOUND);
    }
    return t;
  }

  @GraphQLQuery(name = "tagList")
  public AnetBeanList<Tag> search(@GraphQLArgument(name = "query") TagSearchQuery query) {
    return dao.search(query);
  }

  @GraphQLMutation(name = "createTag")
  @RolesAllowed("SUPER_USER")
  public Tag createTag(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "tag") Tag t) {
    if (t.getName() == null || t.getName().trim().length() == 0) {
      throw new WebApplicationException("Tag name must not be empty", Status.BAD_REQUEST);
    }
    t = dao.insert(t);
    AnetAuditLogger.log("Tag {} created by {}", t, DaoUtils.getUserFromContext(context));
    return t;
  }

  @GraphQLMutation(name = "updateTag")
  @RolesAllowed("SUPER_USER")
  public Integer updateTag(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "tag") Tag t) {
    final int numRows = dao.update(t);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process tag update", Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Tag {} updated by {}", t, DaoUtils.getUserFromContext(context));
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

}
