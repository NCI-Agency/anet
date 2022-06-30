package mil.dds.anet.database;

import java.time.Instant;
import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class UserActivityDao {
  @Inject
  private Provider<Handle> handle;

  protected Handle getDbHandle() {
    return handle.get();
  }

  @InTransaction
  public int insert(String personUuid, Instant visitedAt) {
    return getDbHandle()
        .createUpdate("INSERT INTO \"userActivities\" (\"personUuid\", \"visitedAt\") "
            + "VALUES (:personUuid, :visitedAt) ON CONFLICT DO NOTHING")
        .bind("personUuid", personUuid).bind("visitedAt", DaoUtils.asLocalDateTime(visitedAt))
        .execute();
  }
}
