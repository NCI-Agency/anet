package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Avatar;
import mil.dds.anet.database.mappers.AvatarMapper;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
public class AvatarDao extends AnetBaseDao<Avatar> {

  public AvatarDao() {
    super("Avatars", "avatars", "*", null);
  }

  public Avatar getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Avatar> {
    private static final String sql =
        "/* batch.getAvatarsByUuids */ SELECT * FROM avatars WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new AvatarMapper());
    }
  }

  @Override
  public List<Avatar> getByIds(List<String> uuids) {
    final IdBatcher<Avatar> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public Avatar insertInternal(Avatar n) {
    getDbHandle().createUpdate(
        "/* insertAvatar */ INSERT INTO avatars (uuid, \"personUuid\", imageData, \"createdAt\", \"updatedAt\") "
            + "VALUES (:uuid, :personUuid, :imageData, :createdAt, :updatedAt)")
        .bindBean(n).bind("createdAt", DaoUtils.asLocalDateTime(n.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(n.getUpdatedAt()))
        .bind("personUuid", n.getPersonUuid())
        .execute();
    return n;
  }

  @Override
  public int updateInternal(Avatar n) {
    return getDbHandle()
        .createUpdate("/* updateAvatar */ UPDATE avatars "
            + "SET imageData = :imageData, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
        .bindBean(n).bind("updatedAt", DaoUtils.asLocalDateTime(n.getUpdatedAt())).execute();
  }

  @Override
  public int deleteInternal(String uuid) {
    return getDbHandle().createUpdate("/* deleteAvatar */ DELETE FROM avatars where uuid = :uuid")
        .bind("uuid", uuid).execute();
  }

}
