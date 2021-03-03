package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.type.TypeReference;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.ws.rs.ForbiddenException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.userActivity.RecentActivities;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import mil.dds.anet.utils.AnetConstants;
import org.junit.jupiter.api.Test;

public class AdminResourceTest extends AbstractResourceTest {

  @Test
  public void saveAdminPermissionTest() throws UnsupportedEncodingException {
    saveSettings(admin);
  }

  @Test
  public void saveSuperUserPermissionTest() throws UnsupportedEncodingException {
    saveSettings(getSuperUser());
  }

  @Test
  public void saveRegularUserPermissionTest() throws UnsupportedEncodingException {
    saveSettings(getRegularUser());
  }

  @Test
  public void clearCacheAdminTest() {
    clearCache(admin);
  }

  @Test
  public void clearCacheRegularUserTest() {
    clearCache(getRegularUser());
  }

  @Test
  public void clearCacheSuperUserTest() {
    clearCache(getSuperUser());
  }

  @Test
  public void reloadDictionaryAdminTest() {
    reloadDictionary(admin);
  }

  @Test
  public void reloadDictionaryRegularUserTest() {
    reloadDictionary(getRegularUser());
  }

  @Test
  public void userActivitiesSuperUserTest() {
    userActivities(getSuperUser());
  }

  @Test
  public void userActivitiesAdminTest() {
    userActivities(admin);
  }

  @Test
  public void userActivitiesRegularUserTest() {
    userActivities(getRegularUser());
  }

  private void saveSettings(Person user) {
    final Position position = user.getPosition();
    final boolean isAdmin = position.getType() == PositionType.ADMINISTRATOR;

    final List<AdminSetting> settings = graphQLHelper.getObjectList(user, "adminSettings",
        "key value", new TypeReference<GraphQlResponse<List<AdminSetting>>>() {});
    final Map<String, Object> variables = new HashMap<>();
    variables.put("settings", settings);

    try {
      final Integer nrUpdated = graphQLHelper.updateObject(user,
          "mutation ($settings: [AdminSettingInput]) { payload: saveAdminSettings (settings: $settings) }",
          variables);
      if (isAdmin) {
        assertThat(nrUpdated).isEqualTo(settings.size());
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

  private void clearCache(Person user) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    // Cache a person
    engine.getPersonDao().findByDomainUsername(user.getDomainUsername());

    try {
      final String result = graphQLHelper.getObjectOfType(user, "mutation { payload: clearCache }",
          new TypeReference<GraphQlResponse<String>>() {});
      if (isAdmin) {
        assertThat(result).isEqualTo(AnetConstants.USERCACHE_MESSAGE);
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

  private void reloadDictionary(Person user) {
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final String result =
          graphQLHelper.getObjectOfType(user, "mutation { payload: reloadDictionary }",
              new TypeReference<GraphQlResponse<String>>() {});
      if (isAdmin) {
        assertThat(result).isEqualTo(AnetConstants.DICTIONARY_RELOAD_MESSAGE);
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

  private void userActivities(Person user) {
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final RecentActivities recentActivities = graphQLHelper.getObjectOfType(user,
          "query { payload: userActivities {"
              + " byActivity { ...userActivity } byUser { ...userActivity } } }"
              + " fragment userActivity on UserActivity {"
              + " user { uuid rank name domainUsername } activity { time ip request } }",
          new TypeReference<GraphQlResponse<RecentActivities>>() {});
      if (isAdmin) {
        assertThat(recentActivities.getByUser()).isNotEmpty();
        assertThat(recentActivities.getByActivity()).isNotEmpty();
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

}
