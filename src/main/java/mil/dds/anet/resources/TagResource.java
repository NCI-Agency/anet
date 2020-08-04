package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.TagDao;

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

}
