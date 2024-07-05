package mil.dds.anet.database;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Event;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSearchQuery;
import mil.dds.anet.database.mappers.EventMapper;
import mil.dds.anet.utils.DaoUtils;

public class EventDao extends AnetSubscribableObjectDao<Event, EventSearchQuery> {

  private static final String[] fields = {"uuid", "status", "type", "name", "description",
      "hostOrgUuid", "adminOrgUuid", "eventSeriesUuid", "locationUuid", "startDate", "endDate",
      "outcomes", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "events";
  public static final String EVENT_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  @Override
  public Event getByUuid(String uuid) {
    return getByIds(Collections.singletonList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Event> {
    private static final String sql = "/* batch.getEventsByUuids */ SELECT " + EVENT_FIELDS
        + " from events where uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new EventMapper());
    }
  }

  @Override
  public List<Event> getByIds(List<String> uuids) {
    final IdBatcher<Event> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public Event insertInternal(Event event) {
    getDbHandle().createUpdate(
        "/* insertEvents */ INSERT INTO events (uuid, status, type, name, description, "
            + "\"startDate\", \"endDate\", outcomes, "
            + "\"hostOrgUuid\",\"adminOrgUuid\", \"eventSeriesUuid\", \"locationUuid\", "
            + "\"createdAt\", \"updatedAt\") "
            + "VALUES (:uuid, :status, :type, :name, :description, :startDate, :endDate, :outcomes, "
            + ":hostOrgUuid, :adminOrgUuid, :eventSeriesUuid, :locationUuid, :createdAt, :updatedAt)")
        .bindBean(event).bind("createdAt", DaoUtils.asLocalDateTime(event.getCreatedAt()))
        .bind("status", DaoUtils.getEnumId(event.getStatus()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(event.getUpdatedAt()))
        .bind("hostOrgUuid", DaoUtils.getUuid(event.getHostOrg()))
        .bind("adminOrgUuid", DaoUtils.getUuid(event.getAdminOrg()))
        .bind("eventSeriesUuid", DaoUtils.getUuid(event.getEventSeries()))
        .bind("locationId", DaoUtils.getUuid(event.getLocation())).execute();

    return event;
  }

  @Override
  public int updateInternal(Event event) {
    return getDbHandle().createUpdate("/* updateEvent */ UPDATE events "
        + "SET status = :status, type = :type, name = :name, description = :description, "
        + "\"startDate\" = :startDate, \"endDate\" = :endDate, outcomes = :outcomes, "
        + "\"hostOrgUuid\" = :hostOrgUuid, \"adminOrgUuid\" = :adminOrgUuid, \"eventSeriesUuid\" = :eventSeriesUuid, "
        + "\"locationUuid\" = :locationUuid, \"updatedAt\" = :updatedAt " + " WHERE uuid = :uuid")
        .bindBean(event).bind("updatedAt", DaoUtils.asLocalDateTime(event.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(event.getStatus()))
        .bind("hostOrgUuid", DaoUtils.getUuid(event.getHostOrg()))
        .bind("adminOrgUuid", DaoUtils.getUuid(event.getAdminOrg()))
        .bind("eventSeriesUuid", DaoUtils.getUuid(event.getEventSeries()))
        .bind("eventSeriesUuid", DaoUtils.getUuid(event.getEventSeries()))
        .bind("locationUuid", DaoUtils.getUuid(event.getLocation())).execute();
  }


  @Override
  public AnetBeanList<Event> search(EventSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getEventSearcher().runSearch(query);
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Event obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "events.uuid");
  }
}
