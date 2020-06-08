package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.beans.Person;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AnetConstants;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;

@Path("/api/admin")
public class AdminResource {

  private final AdminDao dao;
  private final AnetConfiguration config;

  private static final ObjectMapper jsonMapper = new ObjectMapper();

  public AdminResource(AnetObjectEngine engine, AnetConfiguration config) {
    this.dao = engine.getAdminDao();
    this.config = config;
  }

  @GraphQLQuery(name = "adminSettings")
  public List<AdminSetting> getAll() {
    return dao.getAllSettings();
  }

  @GraphQLMutation(name = "saveAdminSettings")
  public Integer saveAdminSettings(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "settings") List<AdminSetting> settings) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    int numRows = 0;
    for (AdminSetting setting : settings) {
      numRows += dao.saveSetting(setting);
    }
    AnetAuditLogger.log("Admin settings updated by {}", user);
    return numRows;
  }

  @GET
  @Timed
  @Path("/dictionary")
  @Produces(MediaType.APPLICATION_JSON)
  public Map<String, Object> getDictionary() {
    return config.getDictionary();
  }

  @GraphQLQuery(name = "reloadDictionary")
  public String reloadDictionary(@GraphQLRootContext Map<String, Object> context) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    config.loadDictionary();
    AnetAuditLogger.log("Dictionary updated by {}", user);
    return AnetConstants.DICTIONARY_RELOAD_MESSAGE;
  }

  @GraphQLQuery(name = "clearCache")
  public String clearCache(@GraphQLRootContext Map<String, Object> context) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    return AnetObjectEngine.getInstance().getPersonDao().clearCache();
  }

  /**
   * Returns the project version saved during project build (build.gradle project.version)
   */
  @GraphQLQuery(name = "projectVersion")
  public String getProjectVersion() {
    return config.getVersion();
  }

  @GraphQLQuery(name = "userActivities")
  public Map<String, LinkedHashSet<Map<String, String>>> userActivities() throws IOException {
    Map<String, LinkedHashSet<Map<String, String>>> userActivities = new HashMap<>();
    File file = new File(System.getProperty("user.dir") + "/logs/userActivities.log");
    BufferedReader br = new BufferedReader(new FileReader(file));
    String st;
    while ((st = br.readLine()) != null) {
      Map<String, String> map = jsonMapper.readValue(st, Map.class);
      userActivities.computeIfAbsent(map.get("user"), k -> new LinkedHashSet<>())
          .add(new HashMap() {
            {
              put("user", map.get("user"));
              put("time", map.get("time"));
              put("ip", map.get("ip"));
              put("request", map.get("referer"));
            }
          });
    }
    br.close();
    if (!userActivities.isEmpty()) {
      return userActivities.entrySet().stream().map(s -> {
        ArrayList<Map<String, String>> activities = new ArrayList(s.getValue());
        Collections.reverse(activities);
        LinkedHashSet<Map<String, String>> sortedActivities = new LinkedHashSet<>(activities);
        return sortedActivities;
      }).collect(Collectors.toMap(k -> k.iterator().next().get("user"), Function.identity()));
    }
    return userActivities;
  }

}
