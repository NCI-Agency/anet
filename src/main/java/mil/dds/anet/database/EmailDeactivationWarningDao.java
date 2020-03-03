package mil.dds.anet.database;

import java.util.List;
import mil.dds.anet.beans.EmailDeactivationWarning;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.EmailDeactivationWarningMapper;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class EmailDeactivationWarningDao
    extends AnetBaseDao<EmailDeactivationWarning, AbstractSearchQuery<?>> {

  private static String[] fields = {"personUuid", "sentAt"};
  public static String TABLE_NAME = "emailDeactivationWarnings";
  public static String EDW_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  @Override
  public EmailDeactivationWarning getByUuid(final String uuid) {
    throw new UnsupportedOperationException();
  }

  @Override
  public List<EmailDeactivationWarning> getByIds(final List<String> uuids) {
    throw new UnsupportedOperationException();
  }

  @Override
  public EmailDeactivationWarning insertInternal(final EmailDeactivationWarning edw) {
    getDbHandle()
        .createUpdate("/* insertEmailDeactivationWarning */ "
            + "INSERT INTO \"emailDeactivationWarnings\" (\"personUuid\", \"sentAt\")"
            + "VALUES (:personUuid, :sentAt)")
        .bindBean(edw).bind("personUuid", edw.getPersonUuid())
        .bind("sentAt", DaoUtils.asLocalDateTime(edw.getSentAt())).execute();
    return edw;
  }

  @Override
  public int updateInternal(final EmailDeactivationWarning edw) {
    return getDbHandle().createUpdate(
        "/* updateEmailDeactivationWarning */ UPDATE \"emailDeactivationWarnings\" SET \"sentAt\" = :sentAt WHERE uuid = :uuid")
        .bindBean(edw).bind("sentAt", DaoUtils.asLocalDateTime(edw.getSentAt())).execute();
  }

  @InTransaction
  public EmailDeactivationWarning getEmailDeactivationWarningForPerson(final String personUuid) {
    final List<EmailDeactivationWarning> userEDW = getDbHandle()
        .createQuery("/* getEmailDeactivationWarning */ SELECT " + "\"personUuid\", \"sentAt\""
            + "FROM \"emailDeactivationWarnings\" "
            + "WHERE \"emailDeactivationWarnings\".\"personUuid\" = :personUuid ORDER BY \"emailDeactivationWarnings\".\"sentAt\" ASC")
        .bind("personUuid", personUuid).map(new EmailDeactivationWarningMapper()).list();
    return userEDW.isEmpty() ? null : userEDW.get(0);
  }

  @Override
  public int deleteInternal(final String edwUuid) {
    return getDbHandle().createUpdate(
        "/* deleteEmailDeactivationWarning */ DELETE FROM \"emailDeactivationWarnings\" WHERE \"personUuid\" = :personUuid")
        .bind("personUuid", edwUuid).execute();
  }

}
