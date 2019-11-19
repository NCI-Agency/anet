package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EmailDeactivationWarning;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.EmailDeactivationWarningMapper;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class EmailDeactivationWarningDao
    extends AnetBaseDao<EmailDeactivationWarning, AbstractSearchQuery<?>> {

  private static String[] fields = {"uuid", "createdAt", "updatedAt", "personUuid", "sentAt"};
  public static String TABLE_NAME = "emailDeactivationWarnings";
  public static String EDW_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public EmailDeactivationWarning getByUuid(final String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<EmailDeactivationWarning> {
    private static final String sql =
        "/* batch.getEmailDeactivationWarningByUuids */ SELECT " + EDW_FIELDS
            + "FROM emailDeactivationWarnings WHERE emailDeactivationWarnings.uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new EmailDeactivationWarningMapper());
    }
  }

  @Override
  public List<EmailDeactivationWarning> getByIds(final List<String> uuids) {
    final IdBatcher<EmailDeactivationWarning> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public EmailDeactivationWarning insertInternal(final EmailDeactivationWarning edw) {
    getDbHandle().createUpdate("/* insertEmailDeactivationWarning */ "
        + "INSERT INTO emailDeactivationWarnings (uuid, \"createdAt\", \"updatedAt\", personUuid, sentAt)"
        + "VALUES (:uuid, :createdAt, :updatedAt, :personUuid, :sentAt)").bindBean(edw)
        .bind("createdAt", DaoUtils.asLocalDateTime(edw.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(edw.getUpdatedAt())).execute();
    return edw;
  }

  @Override
  public int updateInternal(final EmailDeactivationWarning edw) {
    return getDbHandle().createUpdate(
        "/* updateEmailDeactivationWarning */ UPDATE emailDeactivationWarnings SET sentAt = :sentAt, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
        .bindBean(edw).bind("updatedAt", DaoUtils.asLocalDateTime(edw.getUpdatedAt())).execute();
  }

  @InTransaction
  public EmailDeactivationWarning getEmailDeactivationWarningForPerson(final String personUuid) {
    List<EmailDeactivationWarning> userEDW = getDbHandle()
        .createQuery("/* getEmailDeactivationWarning */ SELECT " + EDW_FIELDS
            + "FROM emailDeactivationWarnings "
            + "WHERE emailDeactivationWarnings.\"personUuid\" = :personUuid ORDER BY emailDeactivationWarnings.\"createdAt\" ASC")
        .bind("personUuid", personUuid).map(new EmailDeactivationWarningMapper()).list();
    return userEDW.isEmpty() ? null : userEDW.get(0);
  }

  @Override
  public int deleteInternal(final String edwUuid) {
    return getDbHandle().createUpdate(
        "/* deleteEmailDeactivationWarning */ DELETE FROM emailDeactivationWarnings where uuid = :uuid")
        .bind("uuid", edwUuid).execute();
  }

}
