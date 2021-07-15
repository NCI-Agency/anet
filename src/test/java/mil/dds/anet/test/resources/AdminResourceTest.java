package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.util.List;
import java.util.stream.Collectors;
import javax.ws.rs.ForbiddenException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.test.client.AdminSetting;
import mil.dds.anet.test.client.AdminSettingInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.RecentActivities;
import mil.dds.anet.test.client.util.GraphQLRequest;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.client.util.QueryExecutor;
import mil.dds.anet.utils.AnetConstants;
import org.junit.jupiter.api.Test;

public class AdminResourceTest extends AbstractResourceTest {

  @Test
  public void saveAdminPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    saveSettings(admin);
  }

  @Test
  public void saveSuperUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    saveSettings(getSuperUser());
  }

  @Test
  public void saveRegularUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    saveSettings(getRegularUser());
  }

  @Test
  public void clearCacheAdminTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    clearCache(admin);
  }

  @Test
  public void clearCacheRegularUserTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    clearCache(getRegularUser());
  }

  @Test
  public void clearCacheSuperUserTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    clearCache(getSuperUser());
  }

  @Test
  public void reloadDictionaryAdminTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    reloadDictionary(admin);
  }

  @Test
  public void reloadDictionaryRegularUserTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    reloadDictionary(getRegularUser());
  }

  @Test
  public void userActivitiesSuperUserTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    userActivities(getSuperUser());
  }

  @Test
  public void userActivitiesAdminTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    userActivities(admin);
  }

  @Test
  public void userActivitiesRegularUserTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    userActivities(getRegularUser());
  }

  private void saveSettings(Person user)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final QueryExecutor userQueryExecutor = getQueryExecutor(user.getDomainUsername());
    final MutationExecutor userMutationExecutor = getMutationExecutor(user.getDomainUsername());
    final Position position = user.getPosition();
    final boolean isAdmin = position.getType() == PositionType.ADMINISTRATOR;

    final List<AdminSetting> settings = userQueryExecutor.adminSettings("{ key value }");
    final List<AdminSettingInput> input = settings.stream()
        .map(
            as -> AdminSettingInput.builder().withKey(as.getKey()).withValue(as.getValue()).build())
        .collect(Collectors.toList());

    try {
      final Integer nrUpdated = userMutationExecutor.saveAdminSettings("", input);
      if (isAdmin) {
        assertThat(nrUpdated).isEqualTo(input.size());
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

  private void clearCache(Person user)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final MutationExecutor userMutationExecutor = getMutationExecutor(user.getDomainUsername());
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    // Cache a person
    engine.getPersonDao().findByOpenIdSubject(user.getOpenIdSubject());

    try {
      final String result = userMutationExecutor.clearCache("");
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

  private void reloadDictionary(Person user)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final MutationExecutor userMutationExecutor = getMutationExecutor(user.getDomainUsername());
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final String result = userMutationExecutor.reloadDictionary("");
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

  private void userActivities(Person user)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final GraphQLRequest graphQlRequest = getGraphQlRequest(user.getDomainUsername(),
        "query { userActivities { byActivity { ...userActivity } byUser { ...userActivity } } }"
            + " fragment userActivity on UserActivity {"
            + " user { uuid rank name domainUsername } activity { time ip request } }");
    final boolean isAdmin = user.getPosition().getType() == PositionType.ADMINISTRATOR;

    try {
      final RecentActivities recentActivities = graphQlRequest.execQuery().getUserActivities();
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
