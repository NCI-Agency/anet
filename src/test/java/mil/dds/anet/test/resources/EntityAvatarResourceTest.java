package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.test.client.EntityAvatar;
import mil.dds.anet.test.client.EntityAvatarInput;
import mil.dds.anet.test.client.Organization;
import org.junit.jupiter.api.Test;

public class EntityAvatarResourceTest extends AbstractResourceTest {

  private static final String _ENTITY_AVATAR_FIELDS =
      "{ relatedObjectType relatedObjectUuid applyCrop attachmentUuid cropLeft cropTop cropWidth cropHeight }";
  private static final String EF22_ORGANIZATION_UUID = "ccbee4bb-08b8-42df-8cb5-65e8172f657b";
  private static final String EF22_ORGANIZATION_ATTACHMENT_UUID =
      "9ac41246-25ac-457c-b7d6-946c5f625f1f";

  @Test
  void testEntityAvatar() {
    // For the test we use organization EF 2.2 which already has an attachment associated
    final EntityAvatarInput newEntityAvatarInput = EntityAvatarInput.builder().withApplyCrop(true)
        .withAttachmentUuid(EF22_ORGANIZATION_ATTACHMENT_UUID)
        .withRelatedObjectType(OrganizationDao.TABLE_NAME)
        .withRelatedObjectUuid(EF22_ORGANIZATION_UUID).withCropHeight(1).withCropLeft(2)
        .withCropWidth(3).withCropTop(4).build();

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
    assertThat(numRows).isEqualTo(1);

    // Get the entity avatar
    EntityAvatar entityAvatar =
        withCredentials(adminUser, t -> queryExecutor.entityAvatar(_ENTITY_AVATAR_FIELDS,
            OrganizationDao.TABLE_NAME, "ccbee4bb-08b8-42df-8cb5-65e8172f657b"));
    assertThat(entityAvatar).isNotNull();
    assertThat(entityAvatar.getRelatedObjectUuid()).isEqualTo(EF22_ORGANIZATION_UUID);
    assertThat(entityAvatar.getAttachmentUuid()).isEqualTo(EF22_ORGANIZATION_ATTACHMENT_UUID);
    assertThat(entityAvatar.getApplyCrop()).isTrue();
    assertThat(entityAvatar.getCropHeight()).isEqualTo(1);
    assertThat(entityAvatar.getCropLeft()).isEqualTo(2);
    assertThat(entityAvatar.getCropWidth()).isEqualTo(3);
    assertThat(entityAvatar.getCropTop()).isEqualTo(4);

    // Update the entity avatar
    newEntityAvatarInput.setCropHeight(10);
    numRows = withCredentials(adminUser,
        t -> mutationExecutor.createOrUpdateEntityAvatar("", newEntityAvatarInput));
    assertThat(numRows).isEqualTo(1);
    entityAvatar = withCredentials(adminUser, t -> queryExecutor.entityAvatar(_ENTITY_AVATAR_FIELDS,
        OrganizationDao.TABLE_NAME, "ccbee4bb-08b8-42df-8cb5-65e8172f657b"));
    assertThat(entityAvatar).isNotNull();
    assertThat(entityAvatar.getCropHeight()).isEqualTo(10);

    // Delete the entity avatar
    numRows = withCredentials(adminUser, t -> mutationExecutor.deleteEntityAvatar("",
        OrganizationDao.TABLE_NAME, EF22_ORGANIZATION_UUID));
    assertThat(numRows).isEqualTo(1);
    entityAvatar = withCredentials(adminUser, t -> queryExecutor.entityAvatar(_ENTITY_AVATAR_FIELDS,
        OrganizationDao.TABLE_NAME, "ccbee4bb-08b8-42df-8cb5-65e8172f657b"));
    assertThat(entityAvatar).isNull();
  }
}
