package mil.dds.anet.database;

import mil.dds.anet.beans.UserActivity;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.UserActivitySearchQuery;
import mil.dds.anet.search.pg.PostgresqlUserActivitySearcher;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class UserActivityDao extends AbstractDao {

  public UserActivityDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Transactional
  public int insert(final UserActivity userActivity) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "INSERT INTO \"userActivities\" (\"personUuid\", \"organizationUuid\", \"visitedAt\") "
              + "VALUES (:personUuid, :organizationUuid, :visitedAt) ON CONFLICT DO NOTHING")
          .bind("personUuid", userActivity.getPersonUuid())
          .bind("organizationUuid", userActivity.getOrganizationUuid())
          .bind("visitedAt", DaoUtils.asLocalDateTime(userActivity.getVisitedAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public AnetBeanList<UserActivity> search(final UserActivitySearchQuery query) {
    return new PostgresqlUserActivitySearcher(databaseHandler).runSearch(query);
  }
}
