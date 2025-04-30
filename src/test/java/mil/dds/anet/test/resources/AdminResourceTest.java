package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.util.List;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.test.client.AdminSetting;
import mil.dds.anet.test.client.AdminSettingInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.RecentActivities;
import mil.dds.anet.utils.AnetConstants;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class AdminResourceTest extends AbstractResourceTest {

  @Autowired
  private PersonDao personDao;

  @Test
  void saveAdminPermissionTest() {
    saveSettings(admin);
  }

  @Test
  void saveSuperuserPermissionTest() {
    saveSettings(getSuperuser());
  }

  @Test
  void saveRegularUserPermissionTest() {
    saveSettings(getRegularUser());
  }

  @Test
  void clearCacheAdminTest() {
    clearCache(admin);
  }

  @Test
  void clearCacheRegularUserTest() {
    clearCache(getRegularUser());
  }

  @Test
  void clearCacheSuperuserTest() {
    clearCache(getSuperuser());
  }

  @Test
  void reloadDictionaryAdminTest() {
    reloadDictionary(admin);
  }

  @Test
  void reloadDictionaryRegularUserTest() {
    reloadDictionary(getRegularUser());
  }

  @Test
  void recentActivitiesSuperuserTest() {
    recentActivities(getSuperuser());
  }

  @Test
  void recentActivitiesAdminTest() {
    recentActivities(admin);
  }

  @Test
  void recentActivitiesRegularUserTest() {
    recentActivities(getRegularUser());
  }

  private void saveSettings(Person user) {
    final Position position = user.getPosition();
    final boolean isAdmin = position.getType() == PositionType.ADMINISTRATOR;

    final List<AdminSetting> settings = withCredentials(user.getDomainUsername(),
        t -> queryExecutor.adminSettings("{ key value }"));
    final List<AdminSettingInput> input = settings.stream()
        .map(
            as -> AdminSettingInput.builder().withKey(as.getKey()).withValue(as.getValue()).build())
        .toList();

    try {
      final Integer nrUpdated = withCredentials(user.getDomainUsername(),
          t -> mutationExecutor.saveAdminSettings("", input));
      if (isAdmin) {
        assertThat(nrUpdated).isEqualTo(input.size());
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }

  private void clearCache(Person user) {
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    // Cache a person
    personDao.findByDomainUsername(user.getDomainUsername(), true);

    try {
      final String result =
          withCredentials(user.getDomainUsername(), t -> mutationExecutor.clearCache(""));
      if (isAdmin) {
        assertThat(result).isEqualTo(AnetConstants.USERCACHE_MESSAGE);
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }

  private void reloadDictionary(Person user) {
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final String result =
          withCredentials(user.getDomainUsername(), t -> mutationExecutor.reloadDictionary(""));
      if (isAdmin) {
        assertThat(result).isEqualTo(AnetConstants.DICTIONARY_RELOAD_MESSAGE);
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }

  private void recentActivities(Person user) {
    final String recentActivityFields =
        "user { uuid rank name domainUsername } activity { time ip request }";
    final String fields =
        String.format("{ byActivity { %1$s } byUser { %1$s } }", recentActivityFields);
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final RecentActivities recentActivities =
          withCredentials(user.getDomainUsername(), t -> queryExecutor.recentActivities(fields));
      if (isAdmin) {
        assertThat(recentActivities.getByUser()).isNotEmpty();
        assertThat(recentActivities.getByActivity()).isNotEmpty();
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }

}
