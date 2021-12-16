package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AttachmentClassification;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.AttachmentClassificationMapper;
import mil.dds.anet.utils.DaoUtils;

public class AttachmentClassificationDao
    extends AnetBaseDao<AttachmentClassification, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "attachmentClassification";

  @Override
  public AttachmentClassification getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<AttachmentClassification> {
    private static final String sql = "/* batch.getAttachmentClassificationByUuids */ "
        + "SELECT * FROM \"attachmentClassification\" WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new AttachmentClassificationMapper());
    }
  }

  @Override
  public List<AttachmentClassification> getByIds(List<String> uuids) {
    final IdBatcher<AttachmentClassification> idBatcher = AnetObjectEngine.getInstance()
        .getInjector().getInstance(AttachmentClassificationDao.SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public AttachmentClassification insertInternal(AttachmentClassification obj) {
    getDbHandle().createUpdate("/* insertAttachment */ "
        + "INSERT INTO \"attachmentClassification\" (uuid, \"classification\", \"createdAt\", \"updatedAt\") VALUES (:uuid, :classification, "
        + " :createdAt, :updatedAt)").bindBean(obj)
        .bind("createdAt", DaoUtils.asLocalDateTime(obj.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt())).execute();
    return obj;
  }

  @Override
  public int updateInternal(AttachmentClassification obj) {
    return getDbHandle()
        .createUpdate("/* updateAttachment */ "
            + "UPDATE \"attachmentClassification\" SET \"classification\" = :classification "
            + "WHERE uuid = :uuid")
        .bindBean(obj).bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt())).execute();
  }
}
