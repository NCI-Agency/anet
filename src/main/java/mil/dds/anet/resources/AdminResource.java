package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.cache.Cache;
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

  /**
   * If anet-dictionary.yml file is changed manually while ANET is up and running ,this method can
   * be used to reload the dictionary with new values without restarting the server
   */
  @GraphQLMutation(name = "reloadDictionary")
  public String reloadDictionary(@GraphQLRootContext Map<String, Object> context)
      throws IOException {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    config.loadDictionary();
    AnetAuditLogger.log("Dictionary updated by {}", user);
    return AnetConstants.DICTIONARY_RELOAD_MESSAGE;
  }

  /**
   * Returns the project version which is saved during project build (See project.version definition
   * in build.gradle file) Right after project information is written into version.properties file
   * on startup,it is read and set with AnetConfiguration loadVersion method
   */
  @GraphQLQuery(name = "projectVersion")
  public String getProjectVersion() {
    return config.getVersion();
  }

  /**
   * Clears Domain Users Cache
   */
  @GraphQLMutation(name = "clearCache")
  public String clearCache(@GraphQLRootContext Map<String, Object> context) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    return AnetObjectEngine.getInstance().getPersonDao().clearCache();
  }

  /**
   * Returns user logs in descending order of time
   */
  @GraphQLQuery(name = "userActivities")
  public Map<String, Object> userActivities(@GraphQLRootContext Map<String, Object> context) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    final Map<String, LinkedHashSet<Map<String, String>>> userActivities = new HashMap<>();
    final Map<String, LinkedHashSet<Map<String, String>>> recentCalls = new HashMap<>();
    final Cache<String, Person> domainUsersCache =
        AnetObjectEngine.getInstance().getPersonDao().getDomainUsersCache();

    for (final Cache.Entry<String, Person> entry : domainUsersCache) {
      entry.getValue().getUserActivities().removeAll(Collections.singleton(null));
      entry.getValue().getUserActivities().forEach(k -> {
        // Group all entries through user value
        userActivities.computeIfAbsent(k.get("user"), l -> new LinkedHashSet<>()).add(k);
        // In addition to keeping entries with the user key value,
        // it is also necessary to hold all these entries with recentCalls key
        // so we will have 2 result set : One is grouped by user values
        // the other one is "recentCalls" which holds all entries without grouping them
        recentCalls.computeIfAbsent("recentCalls", l -> new LinkedHashSet<>()).add(k);
      });
    }
    final Map<String, Object> allActivities = new HashMap<>();
    // Sort userActivities by time
    if (!userActivities.isEmpty()) {
      allActivities.put("users", userActivities.values().stream().map(s -> {
        final ArrayList<Map<String, String>> activities = new ArrayList<>(s);
        final List<Map<String, String>> sortedList =
            activities.stream().sorted((o1, o2) -> o2.get("time").compareTo(o1.get("time")))
                .collect(Collectors.toList());
        return new LinkedHashSet<>(sortedList);
      }).collect(Collectors.toMap(k -> k.iterator().next().get("user"), Function.identity())));
    } else {
      allActivities.put("users", "");
    }
    // Sort recentCalls by time
    if (!recentCalls.isEmpty()) {
      allActivities.put("recentCalls", recentCalls.values().stream().map(s -> {
        final ArrayList<Map<String, String>> activities = new ArrayList<>(s);
        final List<Map<String, String>> sortedList =
            activities.stream().sorted((o1, o2) -> o2.get("time").compareTo(o1.get("time")))
                .collect(Collectors.toList());
        return new LinkedHashSet<>(sortedList);
      }).collect(Collectors.toMap(k -> k.iterator().next().get("activity"), Function.identity()))
          .get("activity"));
    } else {
      allActivities.put("recentCalls", "");
    }
    return allActivities;
  }

}
