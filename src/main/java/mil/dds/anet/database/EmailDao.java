package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import java.time.Instant;
import java.util.List;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.AnetEmailMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class EmailDao {

  protected final DatabaseHandler databaseHandler;

  public EmailDao(DatabaseHandler databaseHandler) {
    this.databaseHandler = databaseHandler;
  }

  protected Handle getDbHandle() {
    return databaseHandler.getHandle();
  }

  protected void closeDbHandle(Handle handle) {
    databaseHandler.closeHandle(handle);
  }

  @Transactional
  public List<AnetEmail> getAll() {
    return getAll(0, 0).getList();
  }

  @Transactional
  public AnetBeanList<AnetEmail> getAll(int pageNum, int pageSize) {
    final Handle handle = getDbHandle();
    try {
      final StringBuilder sql = new StringBuilder(
          "/* PendingEmailCheck */ SELECT * FROM \"pendingEmails\" ORDER BY \"createdAt\" ASC");
      sql.insert(0, "SELECT *, COUNT(*) OVER() AS \"totalCount\" FROM (");
      sql.append(") AS results");
      sql.append(" ORDER BY \"createdAt\" ASC");
      if (pageSize > 0) {
        sql.append(" OFFSET :offset LIMIT :limit");
      }
      final Query query = handle.createQuery(sql);
      if (pageSize > 0) {
        query.bind("offset", pageSize * pageNum).bind("limit", pageSize);
      }
      return new AnetBeanList<>(query, pageNum, pageSize, new AnetEmailMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void deletePendingEmails(List<Integer> processedEmails) {
    final Handle handle = getDbHandle();
    try {
      if (!processedEmails.isEmpty()) {
        handle
            .createUpdate("/* PendingEmailDelete*/ DELETE FROM \"pendingEmails\""
                + " WHERE id IN ( <emailIds> )")
            .bindList(NULL_KEYWORD, "emailIds", processedEmails).execute();
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void createPendingEmail(String jobSpec) {
    final Handle handle = getDbHandle();
    try {
      handle
          .createUpdate(
              "/* SendEmailAsync */ INSERT INTO \"pendingEmails\" (\"jobSpec\", \"createdAt\")"
                  + " VALUES (:jobSpec, :createdAt)")
          .bind("jobSpec", jobSpec).bind("createdAt", DaoUtils.asLocalDateTime(Instant.now()))
          .execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void setErrorMessage(final int id, final String errorMessage) {
    final Handle handle = getDbHandle();
    try {
      handle
          .createUpdate("/* SetEmailErrorMessage */ UPDATE \"pendingEmails\""
              + " SET \"errorMessage\" = :errorMessage WHERE \"id\" = :id")
          .bind("errorMessage", errorMessage).bind("id", id).execute();
    } finally {
      closeDbHandle(handle);
    }
  }
}
