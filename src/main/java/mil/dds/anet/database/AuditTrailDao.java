package mil.dds.anet.database;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import mil.dds.anet.beans.AuditTrail;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuditTrailSearchQuery;
import mil.dds.anet.database.mappers.AuditTrailMapper;
import mil.dds.anet.search.pg.PostgresqlAuditTrailSearcher;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AuditTrailDao extends AnetBaseDao<AuditTrail, AuditTrailSearchQuery> {

  private static final String[] fields = {"uuid", "updateType", "updateDescription",
      "updateDetails", "personUuid", "relatedObjectType", "relatedObjectUuid", "createdAt"};
  public static final String TABLE_NAME = "auditTrail";
  public static final String AUDIT_TRAIL_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public AuditTrailDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Transactional
  public String logCreate(Person p, String relatedObjectType, AbstractAnetBean o) {
    return getInsertedUuid(AuditTrail.getCreateInstance(p, relatedObjectType, o));
  }

  @Transactional
  public String logCreate(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription) {
    return getInsertedUuid(
        AuditTrail.getCreateInstance(p, relatedObjectType, o, updateDescription));
  }

  @Transactional
  public String logCreate(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription, String updateDetails) {
    return getInsertedUuid(
        AuditTrail.getCreateInstance(p, relatedObjectType, o, updateDescription, updateDetails));
  }

  @Transactional
  public String logUpdate(Person p, Instant timestamp, String updateDescription) {
    return getInsertedUuid(AuditTrail.getUpdateInstance(p, timestamp, updateDescription));
  }

  @Transactional
  public String logUpdate(Person p, String relatedObjectType, AbstractAnetBean o) {
    return getInsertedUuid(AuditTrail.getUpdateInstance(p, relatedObjectType, o));
  }

  @Transactional
  public String logUpdate(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription) {
    return getInsertedUuid(
        AuditTrail.getUpdateInstance(p, relatedObjectType, o, updateDescription));
  }

  @Transactional
  public String logUpdate(Person p, Instant timestamp, String relatedObjectType, AbstractAnetBean o,
      String updateDescription) {
    return getInsertedUuid(
        AuditTrail.getUpdateInstance(p, timestamp, relatedObjectType, o, updateDescription));
  }

  @Transactional
  public String logUpdate(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription, String updateDetails) {
    return getInsertedUuid(
        AuditTrail.getUpdateInstance(p, relatedObjectType, o, updateDescription, updateDetails));
  }

  @Transactional
  public String logUpdate(Person p, Instant timestamp, String relatedObjectType, AbstractAnetBean o,
      String updateDescription, String updateDetails) {
    return getInsertedUuid(AuditTrail.getUpdateInstance(p, timestamp, relatedObjectType, o,
        updateDescription, updateDetails));
  }

  @Transactional
  public String logDelete(Person p, String relatedObjectType, AbstractAnetBean o) {
    return getInsertedUuid(AuditTrail.getDeleteInstance(p, relatedObjectType, o));
  }

  @Transactional
  public String logDelete(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription) {
    return getInsertedUuid(
        AuditTrail.getDeleteInstance(p, relatedObjectType, o, updateDescription));
  }

  @Transactional
  public String logDelete(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription, String updateDetails) {
    return getInsertedUuid(
        AuditTrail.getDeleteInstance(p, relatedObjectType, o, updateDescription, updateDetails));
  }

  private String getInsertedUuid(AuditTrail auditTrail) {
    return DaoUtils.getUuid(insert(auditTrail));
  }

  @Override
  public AuditTrail getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<AuditTrail> {
    private static final String SQL = "/* batch.getAuditTrailByUuids */ SELECT "
        + AUDIT_TRAIL_FIELDS + " FROM \"" + TABLE_NAME + "\" WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(AuditTrailDao.this.databaseHandler, SQL, "uuids", new AuditTrailMapper());
    }
  }

  @Override
  public List<AuditTrail> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Override
  public AuditTrail insertInternal(AuditTrail auditTrail) {
    final Handle handle = getDbHandle();
    try {
      handle
          .createUpdate("INSERT INTO \"" + TABLE_NAME + "\" "
              + "(uuid, \"updateType\", \"updateDescription\", \"updateDetails\", \"personUuid\", "
              + "\"relatedObjectType\", \"relatedObjectUuid\", \"createdAt\") VALUES "
              + "(:uuid, :updateType, :updateDescription, :updateDetails, :objectUuid, "
              + ":relatedObjectType, :relatedObjectUuid, :createdAt)")
          .bindBean(auditTrail).bind("updateType", DaoUtils.getEnumId(auditTrail.getUpdateType()))
          .bind("createdAt", DaoUtils.asLocalDateTime(auditTrail.getCreatedAt())).execute();

      AnetAuditLogger.log(auditTrail);

      return auditTrail;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int updateInternal(AuditTrail obj) {
    throw new UnsupportedOperationException();
  }

  @Override
  public AnetBeanList<AuditTrail> search(AuditTrailSearchQuery query) {
    return new PostgresqlAuditTrailSearcher(databaseHandler).runSearch(query);
  }

}
