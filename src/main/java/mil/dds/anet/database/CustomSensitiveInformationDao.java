package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.CustomSensitiveInformation;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.CustomSensitiveInformationMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;

public class CustomSensitiveInformationDao
    extends AnetBaseDao<CustomSensitiveInformation, AbstractSearchQuery<?>> {

  @Override
  public CustomSensitiveInformation getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<CustomSensitiveInformation> {
    private static final String sql = "/* batch.getCustomSensitiveInformationByUuids */ "
        + "SELECT * FROM \"customSensitiveInformation\" WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new CustomSensitiveInformationMapper());
    }
  }

  @Override
  public List<CustomSensitiveInformation> getByIds(List<String> uuids) {
    final IdBatcher<CustomSensitiveInformation> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public CustomSensitiveInformation insertInternal(CustomSensitiveInformation csi) {
    getDbHandle()
        .createUpdate("/* insertCustomSensitiveInformation */ "
            + "INSERT INTO \"customSensitiveInformation\" (uuid, \"customFieldName\", "
            + "\"customFieldValue\", \"relatedObjectType\", \"relatedObjectUuid\", \"createdAt\", "
            + "\"updatedAt\") VALUES (:uuid, :customFieldName, :customFieldValue, "
            + ":relatedObjectType, :relatedObjectUuid, :createdAt, :updatedAt)")
        .bindBean(csi).bind("createdAt", DaoUtils.asLocalDateTime(csi.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(csi.getUpdatedAt())).execute();
    return csi;
  }

  @Override
  public int updateInternal(CustomSensitiveInformation csi) {
    return getDbHandle()
        .createUpdate("/* updateCustomSensitiveInformation */ "
            + "UPDATE \"customSensitiveInformation\" SET \"customFieldName\" = :customFieldName, "
            + "\"customFieldValue\" = :customFieldValue, "
            + "\"relatedObjectType\" = :relatedObjectType, "
            + "\"relatedObjectUuid\" = :relatedObjectUuid, \"updatedAt\" = :updatedAt "
            + "WHERE uuid = :uuid")
        .bindBean(csi).bind("updatedAt", DaoUtils.asLocalDateTime(csi.getUpdatedAt())).execute();
  }

  public CompletableFuture<List<CustomSensitiveInformation>> getCustomSensitiveInformationForRelatedObject(
      @GraphQLRootContext Map<String, Object> context, String relatedObjectUuid) {
    // FIXME: check whether DaoUtils.getUserFromContext(context) has access to elements in the
    // resulting list
    return new ForeignKeyFetcher<CustomSensitiveInformation>().load(context,
        FkDataLoaderKey.RELATED_OBJECT_CUSTOM_SENSITIVE_INFORMATION, relatedObjectUuid);
  }

  static class SensitiveInformationBatcher extends ForeignKeyBatcher<CustomSensitiveInformation> {
    private static final String sql = "/* batch.getCustomSensitiveInformationForRelatedObject */ "
        + "SELECT * FROM \"customSensitiveInformation\" "
        + "WHERE \"customSensitiveInformation\".\"relatedObjectUuid\" IN ( <foreignKeys> ) "
        + "ORDER BY \"customSensitiveInformation\".\"customFieldName\"";

    public SensitiveInformationBatcher() {
      super(sql, "foreignKeys", new CustomSensitiveInformationMapper(), "relatedObjectUuid");
    }
  }

  public List<List<CustomSensitiveInformation>> getCustomSensitiveInformation(
      List<String> foreignKeys) {
    final ForeignKeyBatcher<CustomSensitiveInformation> notesBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SensitiveInformationBatcher.class);
    return notesBatcher.getByForeignKeys(foreignKeys);
  }

}
