package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;

@Path("/api/admin")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class AdminResource {

  private final AdminDao dao;
  private final AnetConfiguration config;

  public AdminResource(AnetObjectEngine engine, AnetConfiguration config) {
    this.dao = engine.getAdminDao();
    this.config = config;
  }

  @GraphQLQuery(name = "adminSettings")
  public List<AdminSetting> getAll() {
    return dao.getAllSettings();
  }

  @GraphQLMutation(name = "saveAdminSettings")
  @RolesAllowed("ADMINISTRATOR")
  public Integer saveAdminSettings(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "settings") List<AdminSetting> settings) {
    int numRows = 0;
    for (AdminSetting setting : settings) {
      numRows = dao.saveSetting(setting);
    }
    AnetAuditLogger.log("Admin settings updated by {}", DaoUtils.getUserFromContext(context));
    return numRows;
  }

  @GET
  @Timed
  @Path("/dictionary")
  public Map<String, Object> getDictionary() {
    return config.getDictionary();
  }

}
