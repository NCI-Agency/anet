package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Fail.fail;

import java.util.List;
import java.util.UUID;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.test.client.AnetBeanList_AuthorizationGroup;
import mil.dds.anet.test.client.AuthorizationGroup;
import mil.dds.anet.test.client.AuthorizationGroupInput;
import mil.dds.anet.test.client.AuthorizationGroupSearchQueryInput;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.Status;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClientResponseException;

class AuthorizationGroupResourceTest extends AbstractResourceTest {
  protected static final String FIELDS = "{ uuid updatedAt name description status"
      + " distributionList forSensitiveInformation"
      + " administrativePositions { uuid name code type role status location { uuid name }"
      + " organization { uuid shortName longName identificationCode }"
      + " person { uuid name rank } }"
      + " authorizationGroupRelatedObjects { relatedObjectType relatedObjectUuid"
      + " relatedObject { " + "... on Organization { uuid shortName longName identificationCode }"
      + " ... on Person { uuid name rank }" + " ... on Position { uuid type name } } } }";

  @Test
  void searchTest() {
    // Search by name
    final AuthorizationGroupSearchQueryInput query =
        AuthorizationGroupSearchQueryInput.builder().withText("EF").build();
    AnetBeanList_AuthorizationGroup ags = withCredentials(jackUser,
        t -> queryExecutor.authorizationGroupList(getListFields(FIELDS), query));
    assertThat(ags.getList()).isNotEmpty();
  }

  @Test
  void testCreateAsAdmin() {
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    final AuthorizationGroup authorizationGroup = withCredentials(adminUser,
        t -> mutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput));
    assertThat(authorizationGroup).isNotNull();
    assertThat(authorizationGroup.getUuid()).isNotNull();
    assertThat(authorizationGroup.getAdministrativePositions())
        .hasSameSizeAs(authorizationGroupInput.getAdministrativePositions());
    assertThat(authorizationGroup.getAuthorizationGroupRelatedObjects())
        .hasSameSizeAs(authorizationGroupInput.getAuthorizationGroupRelatedObjects());
  }

  @Test
  void testCreateAsSuperuser() {
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    try {
      withCredentials(getDomainUsername(getSuperuser()),
          t -> mutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void testEditAsAdmin() {
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    final AuthorizationGroup authorizationGroup = withCredentials(adminUser,
        t -> mutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput));
    assertThat(authorizationGroup).isNotNull();
    final AuthorizationGroupInput updatedAuthorizationGroupInput =
        getAuthorizationGroupInput(authorizationGroup);
    updatedAuthorizationGroupInput.setDistributionList(true);
    updatedAuthorizationGroupInput.setForSensitiveInformation(true);
    updatedAuthorizationGroupInput.getAuthorizationGroupRelatedObjects().remove(0);
    updatedAuthorizationGroupInput.getAdministrativePositions().remove(0);
    final Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateAuthorizationGroup("", updatedAuthorizationGroupInput, false));
    assertThat(nrUpdated).isOne();
    final AuthorizationGroup updatedAuthorizationGroup = withCredentials(adminUser,
        t -> queryExecutor.authorizationGroup(FIELDS, authorizationGroup.getUuid()));
    assertThat(updatedAuthorizationGroup.getDistributionList()).isTrue();
    assertThat(updatedAuthorizationGroup.getForSensitiveInformation()).isTrue();
    assertThat(updatedAuthorizationGroup.getAdministrativePositions())
        .hasSize(authorizationGroupInput.getAdministrativePositions().size() - 1);
    assertThat(updatedAuthorizationGroup.getAuthorizationGroupRelatedObjects())
        .hasSize(authorizationGroupInput.getAuthorizationGroupRelatedObjects().size() - 1);
  }

  @Test
  void testEditAsWrongSuperuser() {
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    final AuthorizationGroup authorizationGroup = withCredentials(adminUser,
        t -> mutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput));
    assertThat(authorizationGroup).isNotNull();
    try {
      withCredentials("jacob", t -> mutationExecutor.updateAuthorizationGroup("",
          getAuthorizationGroupInput(authorizationGroup), false));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void testEditAsSuperuser() {
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    final AuthorizationGroup authorizationGroup = withCredentials(adminUser,
        t -> mutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput));
    assertThat(authorizationGroup).isNotNull();
    final AuthorizationGroupInput updatedAuthorizationGroupInput =
        getAuthorizationGroupInput(authorizationGroup);
    updatedAuthorizationGroupInput.setDistributionList(true);
    updatedAuthorizationGroupInput.setForSensitiveInformation(true);
    updatedAuthorizationGroupInput.getAuthorizationGroupRelatedObjects().remove(0);
    updatedAuthorizationGroupInput.getAdministrativePositions().remove(0);
    final Integer nrUpdated = withCredentials(getDomainUsername(getSuperuser()),
        t -> mutationExecutor.updateAuthorizationGroup("", updatedAuthorizationGroupInput, false));
    assertThat(nrUpdated).isOne();
    final AuthorizationGroup updatedAuthorizationGroup = withCredentials(adminUser,
        t -> queryExecutor.authorizationGroup(FIELDS, authorizationGroup.getUuid()));
    assertThat(updatedAuthorizationGroup.getDistributionList()).isTrue();
    // Superuser should not be able to change this field!
    assertThat(updatedAuthorizationGroup.getForSensitiveInformation()).isFalse();
    assertThat(updatedAuthorizationGroup.getAdministrativePositions())
        .hasSize(authorizationGroupInput.getAdministrativePositions().size() - 1);
    assertThat(updatedAuthorizationGroup.getAuthorizationGroupRelatedObjects())
        .hasSize(authorizationGroupInput.getAuthorizationGroupRelatedObjects().size() - 1);
  }

  @Test
  void testCreateAsUser() {
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    try {
      withCredentials(jackUser,
          t -> mutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void testEditAsUser() {
    final AuthorizationGroupInput authorizationGroupInput = getAuthorizationGroupInput();
    final AuthorizationGroup authorizationGroup = withCredentials(adminUser,
        t -> mutationExecutor.createAuthorizationGroup(FIELDS, authorizationGroupInput));
    assertThat(authorizationGroup).isNotNull();
    try {
      withCredentials(jackUser, t -> mutationExecutor.updateAuthorizationGroup("",
          getAuthorizationGroupInput(authorizationGroup), false));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private AuthorizationGroupInput getAuthorizationGroupInput() {
    final String noposPersonUuid = "bdd91de7-09c7-4f09-97e4-d3325bb92dab";
    return AuthorizationGroupInput.builder().withName("test community")
        .withDescription("test community description").withStatus(Status.ACTIVE)
        .withDistributionList(false).withForSensitiveInformation(false)
        .withAdministrativePositions(
            getPositionsInput(List.of(admin.getPosition(), getSuperuser().getPosition())))
        .withAuthorizationGroupRelatedObjects(List.of(
            GenericRelatedObjectInput.builder().withRelatedObjectType(PositionDao.TABLE_NAME)
                .withRelatedObjectUuid(getRegularUser().getPosition().getUuid()).build(),
            GenericRelatedObjectInput.builder().withRelatedObjectType(PersonDao.TABLE_NAME)
                .withRelatedObjectUuid(noposPersonUuid).build(),
            GenericRelatedObjectInput.builder().withRelatedObjectType(OrganizationDao.TABLE_NAME)
                .withRelatedObjectUuid(admin.getPosition().getOrganization().getUuid()).build()))
        .build();
  }

  @Test
  void testAuthorizationGroupsByRelatedObject() {
    // Community EF 5 should transitively contain all related objects below
    final String expectedAuthorizationGroupUuid = "ab1a7d99-4529-44b1-a118-bdee3ca8296b";
    final String fields = "{ uuid authorizationGroups { uuid } }";

    // CIV Bratton, Creed
    final Person person = withCredentials(jackUser,
        t -> queryExecutor.person(fields, "31cba227-f6c6-49e9-9483-fce441bea624"));
    assertThat(person).isNotNull();
    assertThat(person.getAuthorizationGroups()).hasSize(2);
    assertThat(person.getAuthorizationGroups().get(0).getUuid())
        .isEqualTo(expectedAuthorizationGroupUuid);

    // EF 5.1 Advisor Quality Assurance
    final Position position = withCredentials(jackUser,
        t -> queryExecutor.position(fields, "05c42ce0-34a0-4391-8b2f-c4cd85ee6b47"));
    assertThat(position).isNotNull();
    assertThat(position.getAuthorizationGroups()).hasSize(1);
    assertThat(position.getAuthorizationGroups().get(0).getUuid())
        .isEqualTo(expectedAuthorizationGroupUuid);

    // EF 5.1
    final Organization organization = withCredentials(jackUser,
        t -> queryExecutor.organization(fields, "7f939a44-b9e4-48e0-98f5-7d0ea38a6ecf"));
    assertThat(organization).isNotNull();
    assertThat(organization.getAuthorizationGroups()).hasSize(1);
    assertThat(organization.getAuthorizationGroups().get(0).getUuid())
        .isEqualTo(expectedAuthorizationGroupUuid);
  }

  @Test
  void testUpdateConflict() {
    final String testUuid = "90a5196d-acf3-4a81-8ff9-3a8c7acabdf3";
    final AuthorizationGroup test =
        withCredentials(adminUser, t -> queryExecutor.authorizationGroup(FIELDS, testUuid));

    // Update it
    final AuthorizationGroupInput updatedInput = getAuthorizationGroupInput(test);
    final String updatedDescription = UUID.randomUUID().toString();
    updatedInput.setDescription(updatedDescription);
    final Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateAuthorizationGroup("", updatedInput, false));
    assertThat(nrUpdated).isOne();
    final AuthorizationGroup updated =
        withCredentials(adminUser, t -> queryExecutor.authorizationGroup(FIELDS, testUuid));
    assertThat(updated.getUpdatedAt()).isAfter(test.getUpdatedAt());
    assertThat(updated.getDescription()).isEqualTo(updatedDescription);

    // Try to update it again, with the input that is now outdated
    final AuthorizationGroupInput outdatedInput = getAuthorizationGroupInput(test);
    try {
      withCredentials(adminUser,
          t -> mutationExecutor.updateAuthorizationGroup("", outdatedInput, false));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      final Throwable rootCause = ExceptionUtils.getRootCause(expectedException);
      if (!(rootCause instanceof WebClientResponseException.Conflict)) {
        fail("Expected WebClientResponseException.Conflict");
      }
    }

    // Now do a force-update
    final Integer nrForceUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateAuthorizationGroup("", outdatedInput, true));
    assertThat(nrForceUpdated).isOne();
    final AuthorizationGroup forceUpdated =
        withCredentials(adminUser, t -> queryExecutor.authorizationGroup(FIELDS, testUuid));
    assertThat(forceUpdated.getUpdatedAt()).isAfter(updated.getUpdatedAt());
    assertThat(forceUpdated.getDescription()).isEqualTo(test.getDescription());
  }
}
