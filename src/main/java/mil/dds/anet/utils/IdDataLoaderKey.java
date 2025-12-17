package mil.dds.anet.utils;

import java.util.HashMap;
import java.util.Map;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.database.AssessmentDao;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.CommentDao;
import mil.dds.anet.database.EntityAvatarDao;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.database.EventSeriesDao;
import mil.dds.anet.database.EventTypeDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.PreferenceDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.SavedSearchDao;
import mil.dds.anet.database.SubscriptionDao;
import mil.dds.anet.database.TaskDao;

// ID batching data loaders
public enum IdDataLoaderKey {
  APPROVAL_STEPS(ApprovalStepDao.TABLE_NAME), // -
  ASSESSMENTS(AssessmentDao.TABLE_NAME), // -
  ATTACHMENTS(AttachmentDao.TABLE_NAME), // -
  AUDIT_TRAIL(AuditTrailDao.TABLE_NAME), // -
  AUTHORIZATION_GROUPS(AuthorizationGroupDao.TABLE_NAME), // -
  COMMENTS(CommentDao.TABLE_NAME), // -
  ENTITY_AVATARS(EntityAvatarDao.TABLE_NAME), // -
  EVENTS(EventDao.TABLE_NAME), // -
  EVENT_SERIES(EventSeriesDao.TABLE_NAME), // -
  EVENT_TYPE(EventTypeDao.TABLE_NAME), // -
  LOCATIONS(LocationDao.TABLE_NAME), // -
  NOTES(NoteDao.TABLE_NAME), // -
  ORGANIZATIONS(OrganizationDao.TABLE_NAME), // -
  PEOPLE(PersonDao.TABLE_NAME), // -
  PREFERENCES(PreferenceDao.TABLE_NAME), // -
  POSITIONS(PositionDao.TABLE_NAME), // -
  REPORTS(ReportDao.TABLE_NAME), // -
  SAVED_SEARCHES(SavedSearchDao.TABLE_NAME), // -
  SUBSCRIPTIONS(SubscriptionDao.TABLE_NAME), // -
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
