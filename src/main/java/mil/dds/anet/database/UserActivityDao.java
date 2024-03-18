package mil.dds.anet.database;

import jakarta.inject.Inject;
import jakarta.inject.Provider;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.UserActivity;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.UserActivitySearchQuery;
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
  public int insert(final UserActivity userActivity) {
    return getDbHandle()
        .createUpdate(
            "INSERT INTO \"userActivities\" (\"personUuid\", \"organizationUuid\", \"visitedAt\") "
                + "VALUES (:personUuid, :organizationUuid, :visitedAt) ON CONFLICT DO NOTHING")
        .bind("personUuid", userActivity.getPersonUuid())
        .bind("organizationUuid", userActivity.getOrganizationUuid())
        .bind("visitedAt", DaoUtils.asLocalDateTime(userActivity.getVisitedAt())).execute();
  }

  public AnetBeanList<UserActivity> search(final UserActivitySearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getUserActivitySearcher().runSearch(query);
  }
}
