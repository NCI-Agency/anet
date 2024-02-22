package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Fail.fail;

import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.util.List;
import javax.ws.rs.ForbiddenException;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.test.client.AnetBeanList_AuthorizationGroup;
import mil.dds.anet.test.client.AuthorizationGroup;
import mil.dds.anet.test.client.AuthorizationGroupInput;
import mil.dds.anet.test.client.AuthorizationGroupSearchQueryInput;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.util.MutationExecutor;
import org.junit.jupiter.api.Test;

class AuthorizationGroupResourceTest extends AbstractResourceTest {
  protected static final String FIELDS = "{ uuid name description status"
      + " administrativePositions { uuid name code type role status location { uuid name }"
      + " organization { uuid shortName longName identificationCode }"
      + " person { uuid name rank avatarUuid } }"
      + " authorizationGroupRelatedObjects { relatedObjectType relatedObjectUuid"
      + " relatedObject { " + "... on Organization { uuid shortName longName identificationCode }"
      + " ... on Person { uuid name rank avatarUuid }"
      + " ... on Position { uuid type name } } } }";

  @Test
  void searchTest() throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Search by name
    final AuthorizationGroupSearchQueryInput query =
        AuthorizationGroupSearchQueryInput.builder().withText("EF").build();
    AnetBeanList_AuthorizationGroup ags =
        jackQueryExecutor.authorizationGroupList(getListFields(FIELDS), query);
    assertThat(ags.getList()).isNotEmpty();
  }

  @Test
  void testCreateAsAdmin()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    final AuthorizationGroup authorizationGroup =
        adminMutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput);
    assertThat(authorizationGroup).isNotNull();
    assertThat(authorizationGroup.getUuid()).isNotNull();
    assertThat(authorizationGroup.getAdministrativePositions())
        .hasSameSizeAs(authorizationGroupInput.getAdministrativePositions());
    assertThat(authorizationGroup.getAuthorizationGroupRelatedObjects())
        .hasSameSizeAs(authorizationGroupInput.getAuthorizationGroupRelatedObjects());
  }

  @Test
  void testCreateAsSuperuser()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final MutationExecutor superuserMutationExecutor =
        getMutationExecutor(getSuperuser().getDomainUsername());
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    try {
      superuserMutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

  @Test
  void testEditAsWrongSuperuser()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final MutationExecutor superuserMutationExecutor = getMutationExecutor("jacob");
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    final AuthorizationGroup authorizationGroup =
        adminMutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput);
    assertThat(authorizationGroup).isNotNull();
    try {
      superuserMutationExecutor.updateAuthorizationGroup("",
          getAuthorizationGroupInput(authorizationGroup));
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

  @Test
  void testEditAsSuperuser()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final MutationExecutor superuserMutationExecutor =
        getMutationExecutor(getSuperuser().getDomainUsername());
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    final AuthorizationGroup authorizationGroup =
        adminMutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput);
    assertThat(authorizationGroup).isNotNull();
    final AuthorizationGroupInput updatedAuthorizationGroupInput =
        getAuthorizationGroupInput(authorizationGroup);
    updatedAuthorizationGroupInput.getAuthorizationGroupRelatedObjects().remove(0);
    updatedAuthorizationGroupInput.getAdministrativePositions().remove(0);
    final Integer nrUpdated =
        superuserMutationExecutor.updateAuthorizationGroup("", updatedAuthorizationGroupInput);
    assertThat(nrUpdated).isOne();
    final AuthorizationGroup updatedAuthorizationGroup =
        adminQueryExecutor.authorizationGroup(FIELDS, authorizationGroup.getUuid());
    assertThat(updatedAuthorizationGroup.getAdministrativePositions())
        .hasSize(authorizationGroupInput.getAdministrativePositions().size() - 1);
    assertThat(updatedAuthorizationGroup.getAuthorizationGroupRelatedObjects())
        .hasSize(authorizationGroupInput.getAuthorizationGroupRelatedObjects().size() - 1);
  }

  @Test
  void testCreateAsUser()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    try {
      jackMutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

  @Test
  void testEditAsUser()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    final AuthorizationGroup authorizationGroup =
        adminMutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput);
    assertThat(authorizationGroup).isNotNull();
    try {
      jackMutationExecutor.updateAuthorizationGroup("",
          getAuthorizationGroupInput(authorizationGroup));
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

  private static AuthorizationGroupInput getAuthorizationGroupInput() {
    return AuthorizationGroupInput.builder().withName("test authorization group")
        .withDescription("test authorization group description").withStatus(Status.ACTIVE)
        .withAdministrativePositions(
            getPositionsInput(List.of(admin.getPosition(), getSuperuser().getPosition())))
        .withAuthorizationGroupRelatedObjects(List.of(
            GenericRelatedObjectInput.builder().withRelatedObjectType(PositionDao.TABLE_NAME)
                .withRelatedObjectUuid(getRegularUser().getPosition().getUuid()).build(),
            GenericRelatedObjectInput.builder().withRelatedObjectType(PersonDao.TABLE_NAME)
                .withRelatedObjectUuid(getElizabethElizawell().getUuid()).build(),
            GenericRelatedObjectInput.builder().withRelatedObjectType(OrganizationDao.TABLE_NAME)
                .withRelatedObjectUuid(admin.getPosition().getOrganization().getUuid()).build()))
        .build();
  }
}
