package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLEnvironment;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.execution.ResolutionEnvironment;
import java.time.Instant;
import java.util.List;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Preference;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PreferenceSearchQuery;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.database.PreferenceDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.springframework.stereotype.Component;

@Component
public class PreferencesResource {

  private final AuditTrailDao auditTrailDao;
  private final PreferenceDao dao;

  public PreferencesResource(AuditTrailDao auditTrailDao, PreferenceDao dao) {
    this.auditTrailDao = auditTrailDao;
    this.dao = dao;
  }

  @GraphQLQuery(name = "preferences")
  @AllowUnverifiedUsers
  public List<Preference> getAll() {
    return dao.getAllPreferences();
  }

  @GraphQLQuery(name = "preferenceList")
  public AnetBeanList<Preference> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLEnvironment ResolutionEnvironment env,
      @GraphQLArgument(name = "query") PreferenceSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(Utils.getSubFields(env), query);
  }

  @GraphQLMutation(name = "updatePreferences")
  public Integer updatePreferences(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "preferences") List<Preference> preferences) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    int numRows = 0;
    for (Preference preference : preferences) {
      numRows += dao.updatePreferenceValue(preference);
    }

    // Log the change
    auditTrailDao.logUpdate(user, Instant.now(), "system preferences have been updated");
    return numRows;
  }
}
