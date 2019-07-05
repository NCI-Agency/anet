package mil.dds.anet.utils;

import java.util.HashMap;
import java.util.Map;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.CommentDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TagDao;
import mil.dds.anet.database.TaskDao;

// ID batching data loaders
public enum IdDataLoaderKey {
  APPROVAL_STEPS(ApprovalStepDao.TABLE_NAME), // -
  AUTHORIZATION_GROUPS(AuthorizationGroupDao.TABLE_NAME), // -
  COMMENTS(CommentDao.TABLE_NAME), // -
  LOCATIONS(LocationDao.TABLE_NAME), // -
  ORGANIZATIONS(OrganizationDao.TABLE_NAME), // -
  PEOPLE(PersonDao.TABLE_NAME), // -
  POSITIONS(PositionDao.TABLE_NAME), // -
  REPORTS(ReportDao.TABLE_NAME), // -
  TAGS(TagDao.TABLE_NAME), // -
  TASKS(TaskDao.TABLE_NAME);

  private static final Map<String, IdDataLoaderKey> BY_TABLE_NAME = new HashMap<>();
  static {
    for (final IdDataLoaderKey e : values()) {
      BY_TABLE_NAME.put(e.tableName, e);
    }
  }

  public static IdDataLoaderKey valueOfTableName(String tableName) {
    return BY_TABLE_NAME.get(tableName);
  }

  private String tableName;

  private IdDataLoaderKey(String tableName) {
    this.tableName = tableName;
  }

  @Override
  public String toString() {
    return tableName;
  }
}
