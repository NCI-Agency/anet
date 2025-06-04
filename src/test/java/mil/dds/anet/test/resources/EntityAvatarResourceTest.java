package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.test.client.Attachment;
import mil.dds.anet.test.client.EntityAvatar;
import mil.dds.anet.test.client.EntityAvatarInput;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import org.junit.jupiter.api.Test;

class EntityAvatarResourceTest extends AbstractResourceTest {

  private static final String _ENTITY_AVATAR_FIELDS =
      "{ relatedObjectType relatedObjectUuid applyCrop attachmentUuid cropLeft cropTop cropWidth cropHeight }";
  protected static final String FIELDS =
      String.format("{ uuid entityAvatar %s attachments { uuid } }", _ENTITY_AVATAR_FIELDS);

  @Test
  void testLocationAvatar() {
    // For the test we use location Antarctica which already has an attachment associated
    final String ENTITY_UUID = "e5b3a4b9-acf7-4c79-8224-f248b9a7215d";
    final String ENTITY_ATTACHMENT_UUID = "f7cd5b02-ef73-4ee8-814b-c5a7a916685d";

    final EntityAvatarInput newEntityAvatarInput =
        EntityAvatarInput.builder().withApplyCrop(true).withAttachmentUuid(ENTITY_ATTACHMENT_UUID)
            .withRelatedObjectType(LocationDao.TABLE_NAME).withRelatedObjectUuid(ENTITY_UUID)
            .withCropHeight(1).withCropLeft(2).withCropWidth(3).withCropTop(4).build();

    // Regular user can not do this
    try {
      withCredentials(getRegularUser().getDomainUsername(),
          t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
      fail("Expected exception creating entity avatar");
    } catch (Exception expectedException) {
      // OK
    }

    // Superuser can do this
    Integer numRows = withCredentials(getSuperuser().getDomainUsername(),
        t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
    assertThat(numRows).isOne();

    // Admin can do this
    numRows = withCredentials(adminUser,
        t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
    assertThat(numRows).isOne();

    // Get the entity avatar via the location
    Location location =
        withCredentials(adminUser, t -> queryExecutor.location(FIELDS, ENTITY_UUID));
    EntityAvatar entityAvatar = location.getEntityAvatar();
    assertThat(entityAvatar).isNotNull();
    assertThat(entityAvatar.getRelatedObjectUuid()).isEqualTo(ENTITY_UUID);
    assertThat(entityAvatar.getAttachmentUuid()).isEqualTo(ENTITY_ATTACHMENT_UUID);
    assertThat(entityAvatar.getApplyCrop()).isTrue();
    assertThat(entityAvatar.getCropHeight()).isEqualTo(1);
    assertThat(entityAvatar.getCropLeft()).isEqualTo(2);
    assertThat(entityAvatar.getCropWidth()).isEqualTo(3);
    assertThat(entityAvatar.getCropTop()).isEqualTo(4);

    // Update the entity avatar
    newEntityAvatarInput.setCropHeight(10);
    numRows = withCredentials(adminUser,
        t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
    assertThat(numRows).isOne();
    location = withCredentials(adminUser, t -> queryExecutor.location(FIELDS, ENTITY_UUID));
    entityAvatar = location.getEntityAvatar();
    assertThat(entityAvatar).isNotNull();
    assertThat(entityAvatar.getCropHeight()).isEqualTo(10);

    // Delete the entity avatar
    numRows = withCredentials(adminUser,
        t -> mutationExecutor.deleteEntityAvatar("", LocationDao.TABLE_NAME, ENTITY_UUID));
    assertThat(numRows).isOne();
    location = withCredentials(adminUser, t -> queryExecutor.location(FIELDS, ENTITY_UUID));
    entityAvatar = location.getEntityAvatar();
    assertThat(entityAvatar).isNull();
  }

  @Test
  void testOrganizationAvatar() {
    // For the test we use organization EF 2.2 which already has an attachment associated
    final String ENTITY_UUID = "ccbee4bb-08b8-42df-8cb5-65e8172f657b";
    final String ENTITY_ATTACHMENT_UUID = "9ac41246-25ac-457c-b7d6-946c5f625f1f";

    final EntityAvatarInput newEntityAvatarInput =
        EntityAvatarInput.builder().withApplyCrop(true).withAttachmentUuid(ENTITY_ATTACHMENT_UUID)
            .withRelatedObjectType(OrganizationDao.TABLE_NAME).withRelatedObjectUuid(ENTITY_UUID)
            .withCropHeight(1).withCropLeft(2).withCropWidth(3).withCropTop(4).build();

    // Jack Jackson can not do this
    try {
      withCredentials(jackUser,
          t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
      fail("Expected exception creating entity avatar");
    } catch (Exception expectedException) {
      // OK
    }

    // Admin can do this
    Integer numRows = withCredentials(adminUser,
        t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
    assertThat(numRows).isOne();

    // Get the entity avatar via the organization
    Organization organization =
        withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, ENTITY_UUID));
    EntityAvatar entityAvatar = organization.getEntityAvatar();
    assertThat(entityAvatar).isNotNull();
    assertThat(entityAvatar.getRelatedObjectUuid()).isEqualTo(ENTITY_UUID);
    assertThat(entityAvatar.getAttachmentUuid()).isEqualTo(ENTITY_ATTACHMENT_UUID);
    assertThat(entityAvatar.getApplyCrop()).isTrue();
    assertThat(entityAvatar.getCropHeight()).isEqualTo(1);
    assertThat(entityAvatar.getCropLeft()).isEqualTo(2);
    assertThat(entityAvatar.getCropWidth()).isEqualTo(3);
    assertThat(entityAvatar.getCropTop()).isEqualTo(4);

    // Update the entity avatar
    newEntityAvatarInput.setCropHeight(10);
    numRows = withCredentials(adminUser,
        t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
    assertThat(numRows).isOne();
    organization = withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, ENTITY_UUID));
    entityAvatar = organization.getEntityAvatar();
    assertThat(entityAvatar).isNotNull();
    assertThat(entityAvatar.getCropHeight()).isEqualTo(10);

    // Delete the entity avatar
    numRows = withCredentials(adminUser,
        t -> mutationExecutor.deleteEntityAvatar("", OrganizationDao.TABLE_NAME, ENTITY_UUID));
    assertThat(numRows).isOne();
    organization = withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, ENTITY_UUID));
    entityAvatar = organization.getEntityAvatar();
    assertThat(entityAvatar).isNull();
  }

  @Test
  void testPersonAvatar() {
    final Person erin = getRegularUser();

    Person retPerson = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.person(FIELDS, erin.getUuid()));
    assertThat(retPerson).isNotNull();
    assertThat(retPerson.getAttachments()).isNotEmpty();
    assertThat(retPerson.getEntityAvatar()).isNull();

    final Attachment attachment = retPerson.getAttachments().get(0);
    final EntityAvatarInput newEntityAvatarInput =
        EntityAvatarInput.builder().withApplyCrop(true).withAttachmentUuid(attachment.getUuid())
            .withRelatedObjectType(PersonDao.TABLE_NAME).withRelatedObjectUuid(erin.getUuid())
            .withCropHeight(1).withCropLeft(2).withCropWidth(3).withCropTop(4).build();

    // Set own avatar
    Integer nrUpdated = withCredentials(erin.getDomainUsername(),
        t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
    assertThat(nrUpdated).isOne();
    retPerson = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.person(FIELDS, erin.getUuid()));
    assertThat(retPerson.getEntityAvatar()).isNotNull();
    assertThat(retPerson.getEntityAvatar().getAttachmentUuid()).isEqualTo(attachment.getUuid());

    // Update as someone else
    try {
      withCredentials(jackUser,
          t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
      fail("Expected exception updating entity avatar");
    } catch (Exception expectedException) {
      // OK
    }

    // Update as Erin's superuser
    nrUpdated = withCredentials("rebecca",
        t -> mutationExecutor.deleteEntityAvatar("", PersonDao.TABLE_NAME, erin.getUuid()));
    assertThat(nrUpdated).isOne();
    retPerson = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.person(FIELDS, erin.getUuid()));
    assertThat(retPerson.getEntityAvatar()).isNull();

    // Update as admin
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
    assertThat(nrUpdated).isOne();
    retPerson = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.person(FIELDS, erin.getUuid()));
    assertThat(retPerson.getEntityAvatar()).isNotNull();
    assertThat(retPerson.getEntityAvatar().getAttachmentUuid()).isEqualTo(attachment.getUuid());

    // Erase own avatar again
    nrUpdated = withCredentials(erin.getDomainUsername(),
        t -> mutationExecutor.deleteEntityAvatar("", PersonDao.TABLE_NAME, erin.getUuid()));
    assertThat(nrUpdated).isOne();
    retPerson = withCredentials(getRegularUser().getDomainUsername(),
        t -> queryExecutor.person(FIELDS, erin.getUuid()));
    assertThat(retPerson.getEntityAvatar()).isNull();
  }

  @Test
  void testPositionAvatar() {
    // For the test we use position EF 1.1 Advisor G which already has an attachment associated
    final String ENTITY_UUID = "888d6c4b-deaa-4218-b8fd-abfb7c81a4c6";
    final String ENTITY_ATTACHMENT_UUID = "1d234036-1d6c-4cb0-8b1a-e4305aeca1e2";

    final EntityAvatarInput newEntityAvatarInput =
        EntityAvatarInput.builder().withApplyCrop(true).withAttachmentUuid(ENTITY_ATTACHMENT_UUID)
            .withRelatedObjectType(PositionDao.TABLE_NAME).withRelatedObjectUuid(ENTITY_UUID)
            .withCropHeight(1).withCropLeft(2).withCropWidth(3).withCropTop(4).build();

    // Regular user can not do this
    try {
      withCredentials(getRegularUser().getDomainUsername(),
          t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
      fail("Expected exception creating entity avatar");
    } catch (Exception expectedException) {
      // OK
    }

    // Superuser of other organization can not do this
    try {
      withCredentials("rebecca",
          t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
      fail("Expected exception creating entity avatar");
    } catch (Exception expectedException) {
      // OK
    }

    // The organization's superuser can do this
    Integer numRows = withCredentials(getAndrewAnderson().getDomainUsername(),
        t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
    assertThat(numRows).isOne();

    // Admin can do this
    numRows = withCredentials(adminUser,
        t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
    assertThat(numRows).isOne();

    // Get the entity avatar via the position
    Position position =
        withCredentials(adminUser, t -> queryExecutor.position(FIELDS, ENTITY_UUID));
    EntityAvatar entityAvatar = position.getEntityAvatar();
    assertThat(entityAvatar).isNotNull();
    assertThat(entityAvatar.getRelatedObjectUuid()).isEqualTo(ENTITY_UUID);
    assertThat(entityAvatar.getAttachmentUuid()).isEqualTo(ENTITY_ATTACHMENT_UUID);
    assertThat(entityAvatar.getApplyCrop()).isTrue();
    assertThat(entityAvatar.getCropHeight()).isEqualTo(1);
    assertThat(entityAvatar.getCropLeft()).isEqualTo(2);
    assertThat(entityAvatar.getCropWidth()).isEqualTo(3);
    assertThat(entityAvatar.getCropTop()).isEqualTo(4);

    // Update the entity avatar
    newEntityAvatarInput.setCropHeight(10);
    numRows = withCredentials(adminUser,
        t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
    assertThat(numRows).isOne();
    position = withCredentials(adminUser, t -> queryExecutor.position(FIELDS, ENTITY_UUID));
    entityAvatar = position.getEntityAvatar();
    assertThat(entityAvatar).isNotNull();
    assertThat(entityAvatar.getCropHeight()).isEqualTo(10);

    // Delete the entity avatar
    numRows = withCredentials(adminUser,
        t -> mutationExecutor.deleteEntityAvatar("", PositionDao.TABLE_NAME, ENTITY_UUID));
    assertThat(numRows).isOne();
    position = withCredentials(adminUser, t -> queryExecutor.position(FIELDS, ENTITY_UUID));
    entityAvatar = position.getEntityAvatar();
    assertThat(entityAvatar).isNull();
  }
}
