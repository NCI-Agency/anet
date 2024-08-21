package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import jakarta.inject.Inject;
import jakarta.inject.Provider;
import java.time.Instant;
import java.util.List;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.AnetEmailMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class EmailDao {

  @Inject
  private Provider<Handle> handle;

  protected Handle getDbHandle() {
    return handle.get();
  }

  @InTransaction
  public List<AnetEmail> getAll() {
    return getAll(0, 0).getList();
  }

  @InTransaction
  public AnetBeanList<AnetEmail> getAll(int pageNum, int pageSize) {
    final StringBuilder sql = new StringBuilder(
        "/* PendingEmailCheck */ SELECT * FROM \"pendingEmails\" ORDER BY \"createdAt\" ASC");
    sql.insert(0, "SELECT *, COUNT(*) OVER() AS \"totalCount\" FROM (");
    sql.append(") AS results");
    sql.append(" ORDER BY \"createdAt\" ASC");
    if (pageSize > 0) {
      sql.append(" OFFSET :offset LIMIT :limit");
    }
    final Query query = getDbHandle().createQuery(sql);
    if (pageSize > 0) {
      query.bind("offset", pageSize * pageNum).bind("limit", pageSize);
    }
    return new AnetBeanList<>(query, pageNum, pageSize, new AnetEmailMapper());
  }

  @InTransaction
  public void deletePendingEmails(List<Integer> processedEmails) {
    if (!processedEmails.isEmpty()) {
      getDbHandle()
          .createUpdate("/* PendingEmailDelete*/ DELETE FROM \"pendingEmails\" "
              + "WHERE id IN ( <emailIds> )")
          .bindList(NULL_KEYWORD, "emailIds", processedEmails).execute();
    }
  }

  @InTransaction
  public void createPendingEmail(String jobSpec) {
    getDbHandle()
        .createUpdate(
            "/* SendEmailAsync */ INSERT INTO \"pendingEmails\" (\"jobSpec\", \"createdAt\")"
                + " VALUES (:jobSpec, :createdAt)")
        .bind("jobSpec", jobSpec).bind("createdAt", DaoUtils.asLocalDateTime(Instant.now()))
        .execute();
  }

  @InTransaction
  public void setErrorMessage(final int id, final String errorMessage) {
    getDbHandle().createUpdate(
        "/* SetEmailErrorMessage */ UPDATE \"pendingEmails\" SET \"errorMessage\" = :errorMessage WHERE \"id\" = :id")
        .bind("errorMessage", errorMessage).bind("id", id).execute();
  }
}
