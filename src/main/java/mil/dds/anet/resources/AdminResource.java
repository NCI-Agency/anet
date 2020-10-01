package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
    final Map<String, LinkedHashSet<Map<String, String>>> recentCalls = new HashMap<>();
    final Cache<String, Person> domainUsersCache =
        AnetObjectEngine.getInstance().getPersonDao().getDomainUsersCache();

    for (final Cache.Entry<String, Person> entry : domainUsersCache) {
      entry.getValue().getUserActivities().removeAll(Collections.singleton(null));
      entry.getValue().getUserActivities().forEach(k -> {
        // Hold all entries with recentCalls key
        recentCalls.computeIfAbsent("recentCalls", l -> new LinkedHashSet<>()).add(k);
      });
    }

    final HashMap<String, Object> allActivities = new HashMap<>();

    // Sort recentCalls by time in descending order
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
      allActivities.put("recentCalls", new LinkedHashSet<HashMap<String, String>>());
    }

    // We have recentCalls in time-sorted order ,
    // Since all processes are in order by date descending, all we have to do is just putting the
    // most recent activity of related user in a separate list according to the "user" key
    // At the end, the user with the most current transaction will be listed at the top, the oldest
    // user will be listed at the bottom.
    final LinkedHashMap<String, LinkedHashSet<HashMap<String, String>>> sortedUsers =
        new LinkedHashMap<>();
    @SuppressWarnings("unchecked")
    final LinkedHashSet<HashMap<String, String>> recentCallsHashSet =
        (LinkedHashSet<HashMap<String, String>>) allActivities.get("recentCalls");
    // We know that recentCalls are sorted by time in descending order
    // Assume that recentCalls has some info like below
    // An activity for erin at 2020/09/30 15:34
    // An activity for arthur at 2020/09/30 15:29
    // An activity for erin at 2020/09/30 12:01
    // An activity for arthur at 2020/09/30 11:09
    // An activity for rebecca at 2020/09/30 09:07
    // After executing for loop , sortedUsers will be filtered like below
    // Activity of erin at 2020/09/30 15:34
    // Activity of arthur at 2020/09/30 15:29
    // Activity of rebecca at 2020/09/30 09:07
    for (HashMap<String, String> recentCall : recentCallsHashSet) {
      if (!sortedUsers.containsKey(recentCall.get("user"))) {
        final LinkedHashSet<HashMap<String, String>> recentCallSet = new LinkedHashSet<>();
        recentCallSet.add(recentCall);
        sortedUsers.put(recentCall.get("user"), recentCallSet);
      }
    }
    // Put sorted users to the list
    allActivities.put("users", sortedUsers);

    return allActivities;
  }

}
