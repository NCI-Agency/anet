package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import javax.cache.Cache;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.UserActivity;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.recentActivity.Activity;
import mil.dds.anet.beans.recentActivity.RecentActivities;
import mil.dds.anet.beans.recentActivity.RecentUserActivity;
import mil.dds.anet.beans.search.UserActivitySearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.UserActivityDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AnetConstants;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

@Path("/api/admin")
public class AdminResource {

  private final AdminDao dao;
  private final UserActivityDao userActivityDao;
  private final AnetConfiguration config;

  public AdminResource(AnetObjectEngine engine, AnetConfiguration config) {
    this.dao = engine.getAdminDao();
    this.userActivityDao = engine.getUserActivityDao();
    this.config = config;
  }

  @GraphQLQuery(name = "adminSettings")
  @AllowUnverifiedUsers
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
  // The dictionary should be public, as it contains information needed for the client-side
  // authentication
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
  @AllowUnverifiedUsers
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
   * Returns recent user activities in descending order of time
   */
  @GraphQLQuery(name = "recentActivities")
  public RecentActivities recentActivities(@GraphQLRootContext Map<String, Object> context) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);

    final List<RecentUserActivity> byActivity = new ArrayList<>();
    final List<RecentUserActivity> byUser = new ArrayList<>();

    final Cache<String, Person> domainUsersCache =
        AnetObjectEngine.getInstance().getPersonDao().getDomainUsersCache();
    for (final Cache.Entry<String, Person> entry : domainUsersCache) {
      final Person person = entry.getValue();
      final Deque<Activity> activities = person.getRecentActivities();
      if (!Utils.isEmptyOrNull(activities)) {
        byUser.add(new RecentUserActivity(person, activities.getFirst()));
        activities.forEach(activity -> {
          byActivity.add(new RecentUserActivity(person, activity));
        });
      }
    }

    // Sort them by time descending
    Collections.sort(byUser);
    Collections.sort(byActivity);
    return new RecentActivities(byActivity, byUser);
  }

  /**
   * @return user activities aggregated for the time period given in the query
   */
  @GraphQLQuery(name = "userActivityList")
  public AnetBeanList<UserActivity> search(@GraphQLRootContext final Map<String, Object> context,
      @GraphQLArgument(name = "query") final UserActivitySearchQuery query) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    return userActivityDao.search(query);
  }

}
