package mil.dds.anet.database;

import java.time.Instant;
import java.util.List;
import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.database.mappers.AnetEmailMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class EmailDao {

  @Inject
  private Provider<Handle> handle;
  private AnetEmailMapper emailMapper;

  public EmailDao() {
    this.emailMapper = new AnetEmailMapper();
  }

  protected Handle getDbHandle() {
    return handle.get();
  }

  @InTransaction
  public List<AnetEmail> getAll() {
    return getDbHandle()
        .createQuery(
            "/* PendingEmailCheck */ SELECT * FROM \"pendingEmails\" ORDER BY \"createdAt\" ASC")
        .map(emailMapper).list();
  }

  @InTransaction
  public void deletePendingEmails(List<Integer> processedEmails) {
    if (!processedEmails.isEmpty()) {
      getDbHandle()
          .createUpdate(
              "/* PendingEmailDelete*/ DELETE FROM \"pendingEmails\" WHERE id IN ( <emailIds> )")
          .bindList("emailIds", processedEmails).execute();
    }
  }

  @InTransaction
  public void createPendingEmail(String jobSpec) {
    getDbHandle().createUpdate(
        "/* SendEmailAsync */ INSERT INTO \"pendingEmails\" (\"jobSpec\", \"createdAt\") VALUES (:jobSpec, :createdAt)")
        .bind("jobSpec", jobSpec).bind("createdAt", DaoUtils.asLocalDateTime(Instant.now()))
        .execute();
  }
}
