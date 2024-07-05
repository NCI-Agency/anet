package mil.dds.anet.database;

import java.util.Collections;
import java.util.List;
import mil.dds.anet.beans.EventSeries;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSeriesSearchQuery;
import mil.dds.anet.database.mappers.EventSeriesMapper;
import mil.dds.anet.search.pg.PostgresqlEventSeriesSearcher;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;

@Component
public class EventSeriesDao extends AnetSubscribableObjectDao<EventSeries, EventSeriesSearchQuery> {

  private static final String[] fields = {"uuid", "status", "name", "description", "hostOrgUuid",
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
      super(databaseHandler, sql, "uuids", new EventSeriesMapper());
    }
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
              + "\"hostOrgUuid\", \"adminOrgUuid\",  \"createdAt\", \"updatedAt\") "
              + "VALUES (:uuid, :status, :name, :description, :hostOrgUuid, :adminOrgUuid, "
              + ":createdAt, :updatedAt)")
          .bindBean(eventSeries).bind("status", DaoUtils.getEnumId(eventSeries.getStatus()))
          .bind("createdAt", DaoUtils.asLocalDateTime(eventSeries.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(eventSeries.getUpdatedAt()))
          .bind("hostOrgUuid", DaoUtils.getUuid(eventSeries.getHostOrg()))
          .bind("adminOrgUuid", DaoUtils.getUuid(eventSeries.getAdminOrg())).execute();

      return eventSeries;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int updateInternal(EventSeries eventSeries) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate("/* updateEventSeries */ UPDATE \"eventSeries\" "
          + "SET name = :name, status = :status, description = :description, "
          + "\"hostOrgUuid\" = :hostOrgUuid, \"adminOrgUuid\" = :adminOrgUuid, \"updatedAt\" = :updatedAt "
          + " WHERE uuid = :uuid").bindBean(eventSeries)
          .bind("status", DaoUtils.getEnumId(eventSeries.getStatus()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(eventSeries.getUpdatedAt()))
          .bind("hostOrgUuid", DaoUtils.getUuid(eventSeries.getHostOrg()))
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
  public SubscriptionUpdateGroup getSubscriptionUpdate(EventSeries obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "eventSeries.uuid");
  }
}
