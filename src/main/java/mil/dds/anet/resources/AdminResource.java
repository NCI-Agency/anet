package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import javax.cache.Cache;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.UserActivity;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.recentActivity.Activity;
import mil.dds.anet.beans.recentActivity.RecentActivities;
import mil.dds.anet.beans.recentActivity.RecentUserActivity;
import mil.dds.anet.beans.search.UserActivitySearchQuery;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.UserActivityDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.services.IMartDictionaryService;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AnetConstants;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.SecurityUtils;
import mil.dds.anet.utils.Utils;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

@RestController
@RequestMapping(AdminResource.ADMIN_RESOURCE_PATH)
@GraphQLApi
public class AdminResource {

  public static final String ADMIN_RESOURCE_PATH = "/api/admin";
  public static final String DICTIONARY_PATH = "/dictionary";
  public static final String DICTIONARY_MART_PATH = "/mart";
  public static final String ADMIN_DICTIONARY_RESOURCE_PATH = ADMIN_RESOURCE_PATH + DICTIONARY_PATH;

  private final AnetConfig config;
  private final AnetDictionary dict;
  private final AdminDao adminDao;
  private final UserActivityDao userActivityDao;
  private final IMartDictionaryService martDictionaryService;

  public AdminResource(AnetConfig config, AnetDictionary dict, AdminDao adminDao,
      UserActivityDao userActivityDao, IMartDictionaryService martDictionaryService) {
    this.config = config;
    this.dict = dict;
    this.adminDao = adminDao;
    this.userActivityDao = userActivityDao;
    this.martDictionaryService = martDictionaryService;
  }

  @GraphQLQuery(name = "adminSettings")
  @AllowUnverifiedUsers
  public List<AdminSetting> getAll() {
    return adminDao.getAllSettings();
  }

  @GraphQLMutation(name = "saveAdminSettings")
  public Integer saveAdminSettings(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "settings") List<AdminSetting> settings) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    int numRows = 0;
    for (AdminSetting setting : settings) {
      numRows += adminDao.saveSetting(setting);
    }
    AnetAuditLogger.log("Admin settings updated by {}", user);
    return numRows;
  }

  @GetMapping(path = DICTIONARY_PATH, produces = MediaType.APPLICATION_JSON_VALUE)
  // The dictionary should be public, as it contains information needed for the client-side
  // authentication
  public Map<String, Object> getDictionary() {
    return dict.getDictionary();
  }

  @GetMapping(path = DICTIONARY_PATH + DICTIONARY_MART_PATH)
  public ResponseEntity<StreamingResponseBody> getMartDictionary(Principal principal) {
    if (Boolean.FALSE.equals(dict.getDictionaryEntry("featureMartGuiEnabled"))) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MART Feature is not enabled");
    }
    final Person user = SecurityUtils.getPersonFromPrincipal(principal);
    AuthUtils.assertAdministrator(user);

    // Create MART dictionary
    final Map<String, Object> dictionaryForMart = martDictionaryService.createDictionaryForMart();

    // Dump to Yaml and return
    final DumperOptions options = new DumperOptions();
    options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
    options.setIndent(2);
    options.setIndicatorIndent(2);
    options.setIndentWithIndicator(true);

    final Yaml yaml = new Yaml(options);
    final StreamingResponseBody responseBody = outputStream -> {
      try (final Writer writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8)) {
        yaml.dump(dictionaryForMart, writer);
      }
    };

    final HttpHeaders headers = new HttpHeaders();
    headers.setContentDisposition(
        ContentDisposition.attachment().filename("anet-dictionary.yml").build());

    return ResponseEntity.ok().contentType(MediaType.APPLICATION_YAML).headers(headers)
        .body(responseBody);
  }

  /**
   * If anet-dictionary.yml file is changed manually while ANET is up and running ,this method can
   * be used to reload the dictionary with new values without restarting the server
   */
  @GraphQLMutation(name = "reloadDictionary")
  public String reloadDictionary(@GraphQLRootContext GraphQLContext context) throws IOException {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    dict.loadDictionary();
    AnetAuditLogger.log("Dictionary updated by {}", user);
    return AnetConstants.DICTIONARY_RELOAD_MESSAGE;
  }

  /**
   * Returns the project version which is saved during project build (See project.version definition
   * in build.gradle file) Right after project information is written into version.properties file
   * on startup,it is read and set with AnetConfig getVersion method
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
  public String clearCache(@GraphQLRootContext GraphQLContext context) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    return ApplicationContextProvider.getEngine().getPersonDao().clearCache();
  }

  /**
   * Returns recent user activities in descending order of time
   */
  @GraphQLQuery(name = "recentActivities")
  public RecentActivities recentActivities(@GraphQLRootContext GraphQLContext context) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);

    final List<RecentUserActivity> byActivity = new ArrayList<>();
    final List<RecentUserActivity> byUser = new ArrayList<>();

    final Cache<String, Person> domainUsersCache =
        ApplicationContextProvider.getEngine().getPersonDao().getDomainUsersCache();
    for (final Cache.Entry<String, Person> entry : domainUsersCache) {
      final Person person = entry.getValue();
      final Deque<Activity> activities = person.getRecentActivities();
      if (!Utils.isEmptyOrNull(activities)) {
        byUser.add(new RecentUserActivity(person, activities.getFirst()));
        activities.forEach(activity -> byActivity.add(new RecentUserActivity(person, activity)));
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
  public AnetBeanList<UserActivity> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") final UserActivitySearchQuery query) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    return userActivityDao.search(query);
  }

}
