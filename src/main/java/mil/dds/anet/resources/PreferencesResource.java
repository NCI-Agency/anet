package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Preference;
import mil.dds.anet.database.PreferenceDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import org.springframework.stereotype.Component;

@Component
@GraphQLApi
public class PreferencesResource {

  private final PreferenceDao dao;

  public PreferencesResource(AnetObjectEngine engine) {
    this.dao = engine.getPreferenceDao();
  }

  @GraphQLQuery(name = "preferences")
  @AllowUnverifiedUsers
  public List<Preference> getAll() {
    return dao.getAllPreferences();
  }
}
