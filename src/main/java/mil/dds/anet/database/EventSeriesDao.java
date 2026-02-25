package mil.dds.anet.database;

import graphql.GraphQLContext;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.EventSeries;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSeriesSearchQuery;
import mil.dds.anet.database.mappers.EventSeriesMapper;
import mil.dds.anet.database.mappers.GenericRelatedObjectMapper;
import mil.dds.anet.search.pg.PostgresqlEventSeriesSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.springframework.stereotype.Component;

@Component
public class EventSeriesDao extends AnetSubscribableObjectDao<EventSeries, EventSeriesSearchQuery> {

  private static final String[] fields = {"uuid", "status", "name", "description", "ownerOrgUuid",
      "adminOrgUuid", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "eventSeries";
  public static final String EVENT_SERIES_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public EventSeriesDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public EventSeries getByUuid(String uuid) {
    return getByIds(Collections.singletonList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<EventSeries> {
    private static final String sql = "/* batch.getEventSeriesByUuids */ SELECT "
        + EVENT_SERIES_FIELDS + " from \"eventSeries\" where uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(EventSeriesDao.this.databaseHandler, sql, "uuids", new EventSeriesMapper());
    }
  }

  class EventSeriesHostRelatedObjectsBatcher extends ForeignKeyBatcher<GenericRelatedObject> {
    private static final String SQL =
        "/* batch.getEventSeriesHostRelatedObjects */ SELECT * FROM \"eventSeriesHostRelatedObjects\" "
            + "WHERE \"eventSeriesUuid\" IN ( <foreignKeys> ) ORDER BY \"relatedObjectType\", \"relatedObjectUuid\" ASC";

    public EventSeriesHostRelatedObjectsBatcher() {
      super(EventSeriesDao.this.databaseHandler, SQL, "foreignKeys",
          new GenericRelatedObjectMapper("eventSeriesUuid"), "eventSeriesUuid");
    }
  }

  public List<List<GenericRelatedObject>> getEventSeriesHostRelatedObjects(
      List<String> foreignKeys) {
    return new EventSeriesDao.EventSeriesHostRelatedObjectsBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<GenericRelatedObject>> getRelatedObjects(GraphQLContext context,
      EventSeries eventSeries) {
    return new ForeignKeyFetcher<GenericRelatedObject>().load(context,
        FkDataLoaderKey.EVENT_SERIES_EVENT_SERIES_HOST_RELATED_OBJECTS, eventSeries.getUuid());
  }

  @Override
  public List<EventSeries> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Override
  public EventSeries insertInternal(EventSeries eventSeries) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate(
          "/* insertEventSeries */ INSERT INTO \"eventSeries\" (uuid, status, name, description, "
              + "\"ownerOrgUuid\", \"adminOrgUuid\", \"createdAt\", \"updatedAt\") "
              + "VALUES (:uuid, :status, :name, :description, :ownerOrgUuid, "
              + ":adminOrgUuid, :createdAt, :updatedAt)")
          .bindBean(eventSeries).bind("status", DaoUtils.getEnumId(eventSeries.getStatus()))
          .bind("createdAt", DaoUtils.asLocalDateTime(eventSeries.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(eventSeries.getUpdatedAt()))
          .bind("ownerOrgUuid", DaoUtils.getUuid(eventSeries.getOwnerOrg()))
          .bind("adminOrgUuid", DaoUtils.getUuid(eventSeries.getAdminOrg())).execute();

      final EventSeriesDao.EventSeriesBatch rb =
          handle.attach(EventSeriesDao.EventSeriesBatch.class);

      if (!Utils.isEmptyOrNull(eventSeries.getHostRelatedObjects())) {
        rb.insertEventSeriesHostRelatedObjects(eventSeries.getUuid(),
            eventSeries.getHostRelatedObjects());
      }

      return eventSeries;
    } finally {
      closeDbHandle(handle);
    }
  }

  public interface EventSeriesBatch {
    @SqlBatch("INSERT INTO \"eventSeriesHostRelatedObjects\""
        + " (\"eventSeriesUuid\", \"relatedObjectType\", \"relatedObjectUuid\")"
        + " VALUES (:eventSeriesUuid, :relatedObjectType, :relatedObjectUuid)")
    void insertEventSeriesHostRelatedObjects(@Bind("eventSeriesUuid") String eventSeriesUuid,
        @BindBean List<GenericRelatedObject> eventHostRelatedObjects);

    @SqlUpdate("DELETE FROM \"eventSeriesHostRelatedObjects\""
        + " WHERE \"eventSeriesUuid\" = :eventSeriesUuid")
    void deleteEventSeriesHostRelatedObjects(@Bind("eventSeriesUuid") String eventUuid);
  }

  @Override
  public int updateInternal(EventSeries eventSeries) {
    final Handle handle = getDbHandle();
    try {
      final EventSeriesDao.EventSeriesBatch eb =
          handle.attach(EventSeriesDao.EventSeriesBatch.class);
      eb.deleteEventSeriesHostRelatedObjects(DaoUtils.getUuid(eventSeries)); // seems the easiest
                                                                             // thing to do
      if (!Utils.isEmptyOrNull(eventSeries.getHostRelatedObjects())) {
        eb.insertEventSeriesHostRelatedObjects(DaoUtils.getUuid(eventSeries),
            eventSeries.getHostRelatedObjects());
      }
      return handle
          .createUpdate("/* updateEventSeries */ UPDATE \"eventSeries\" "
              + "SET name = :name, status = :status, description = :description, "
              + "\"ownerOrgUuid\" = :ownerOrgUuid, "
              + "\"adminOrgUuid\" = :adminOrgUuid, \"updatedAt\" = :updatedAt "
              + "WHERE uuid = :uuid")
          .bindBean(eventSeries).bind("status", DaoUtils.getEnumId(eventSeries.getStatus()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(eventSeries.getUpdatedAt()))
          .bind("ownerOrgUuid", DaoUtils.getUuid(eventSeries.getOwnerOrg()))
          .bind("adminOrgUuid", DaoUtils.getUuid(eventSeries.getAdminOrg())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public AnetBeanList<EventSeries> search(EventSeriesSearchQuery query) {
    return new PostgresqlEventSeriesSearcher(databaseHandler).runSearch(query);
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(EventSeries obj, String auditTrailUuid,
      boolean isDelete) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, auditTrailUuid, "eventSeries.uuid",
        isDelete);
  }
}
