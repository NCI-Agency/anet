package mil.dds.anet.database;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.CustomSensitiveInformation;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.CustomSensitiveInformationMapper;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class CustomSensitiveInformationDao
    extends AnetBaseDao<CustomSensitiveInformation, AbstractSearchQuery<?>> {

  @Override
  public CustomSensitiveInformation getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<CustomSensitiveInformation> {
    private static final String sql = "/* batch.getCustomSensitiveInformationByUuids */ "
        + "SELECT * FROM \"customSensitiveInformation\" WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new CustomSensitiveInformationMapper());
    }
  }

  @Override
  public List<CustomSensitiveInformation> getByIds(List<String> uuids) {
    final IdBatcher<CustomSensitiveInformation> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public CustomSensitiveInformation insertInternal(CustomSensitiveInformation csi) {
    getDbHandle()
        .createUpdate("/* insertCustomSensitiveInformation */ "
            + "INSERT INTO \"customSensitiveInformation\" (uuid, \"customFieldName\", "
            + "\"customFieldValue\", \"relatedObjectType\", \"relatedObjectUuid\", \"createdAt\", "
            + "\"updatedAt\") VALUES (:uuid, :customFieldName, :customFieldValue, "
            + ":relatedObjectType, :relatedObjectUuid, :createdAt, :updatedAt)")
        .bindBean(csi).bind("createdAt", DaoUtils.asLocalDateTime(csi.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(csi.getUpdatedAt())).execute();
    return csi;
  }

  @Override
  public int updateInternal(CustomSensitiveInformation csi) {
    return getDbHandle()
        .createUpdate("/* updateCustomSensitiveInformation */ "
            + "UPDATE \"customSensitiveInformation\" SET \"customFieldName\" = :customFieldName, "
            + "\"customFieldValue\" = :customFieldValue, "
            + "\"relatedObjectType\" = :relatedObjectType, "
            + "\"relatedObjectUuid\" = :relatedObjectUuid, \"updatedAt\" = :updatedAt "
            + "WHERE uuid = :uuid")
        .bindBean(csi).bind("updatedAt", DaoUtils.asLocalDateTime(csi.getUpdatedAt())).execute();
  }

  @InTransaction
  public int deleteFor(String relatedObjectUuid) {
    return getDbHandle().execute(
        "/* deleteCustomSensitiveInformation */ "
            + "DELETE FROM \"customSensitiveInformation\" WHERE \"relatedObjectUuid\" = ?",
        relatedObjectUuid);
  }

  public CompletableFuture<List<CustomSensitiveInformation>> getCustomSensitiveInformationForRelatedObject(
      @GraphQLRootContext Map<String, Object> context, String relatedObjectUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position position = DaoUtils.getPosition(user);
    final CompletableFuture<List<AuthorizationGroup>> authorizationGroupsFuture =
        (user == null || position == null)
            ? CompletableFuture.completedFuture(Collections.emptyList())
            : position.loadAuthorizationGroups(context);
    return authorizationGroupsFuture.thenCompose(authorizationGroups -> {
      final Set<String> authorizationGroupUuids =
          authorizationGroups.stream().map(ag -> ag.getUuid()).collect(Collectors.toSet());
      return new ForeignKeyFetcher<CustomSensitiveInformation>()
          .load(context, FkDataLoaderKey.RELATED_OBJECT_CUSTOM_SENSITIVE_INFORMATION,
              relatedObjectUuid)
          .thenApply(csiList -> csiList.stream().filter(
              csi -> hasCustomSensitiveInformationAuthorization(user, authorizationGroupUuids, csi))
              .collect(Collectors.toList()));
    });
  }

  static class SensitiveInformationBatcher extends ForeignKeyBatcher<CustomSensitiveInformation> {
    private static final String sql = "/* batch.getCustomSensitiveInformationForRelatedObject */ "
        + "SELECT * FROM \"customSensitiveInformation\" "
        + "WHERE \"customSensitiveInformation\".\"relatedObjectUuid\" IN ( <foreignKeys> ) "
        + "ORDER BY \"customSensitiveInformation\".\"customFieldName\"";

    public SensitiveInformationBatcher() {
      super(sql, "foreignKeys", new CustomSensitiveInformationMapper(), "relatedObjectUuid");
    }
  }

  public List<List<CustomSensitiveInformation>> getCustomSensitiveInformation(
      List<String> foreignKeys) {
    final ForeignKeyBatcher<CustomSensitiveInformation> notesBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SensitiveInformationBatcher.class);
    return notesBatcher.getByForeignKeys(foreignKeys);
  }

  public void insertOrUpdateCustomSensitiveInformation(final Person user,
      final Set<String> userAuthorizationGroupUuids, final String relatedObjectType,
      final String relatedObjectUuid,
      final List<CustomSensitiveInformation> customSensitiveInformation) {
    if (!Utils.isEmptyOrNull(customSensitiveInformation)) {
      for (final CustomSensitiveInformation csi : customSensitiveInformation) {
        try {
          // Sanitize JSON
          csi.setCustomFieldValue(Utils.sanitizeJson(csi.getCustomFieldValue()));
          // Set relatedObject ourselves (ignore what was passed by the client)
          csi.setRelatedObjectType(relatedObjectType);
          csi.setRelatedObjectUuid(relatedObjectUuid);
          if (DaoUtils.getUuid(csi) == null) {
            checkAndInsert(user, userAuthorizationGroupUuids, relatedObjectType, relatedObjectUuid,
                csi);
          } else {
            checkAndUpdate(user, userAuthorizationGroupUuids, relatedObjectType, relatedObjectUuid,
                csi);
          }
        } catch (JsonProcessingException e) {
          // Audit and ignore
          AnetAuditLogger.log("Person {} tried to insert CustomSensitiveInformation {}"
              + " with invalid JSON, refused", user, csi);
          csi.setCustomFieldValue(null);
        }
      }
    }
  }

  @SuppressWarnings("lgtm[java/unused-parameter]") // match the signature of checkAndUpdate
  private void checkAndInsert(final Person user, final Set<String> userAuthorizationGroupUuids,
      final String relatedObjectType, final String relatedObjectUuid,
      final CustomSensitiveInformation csi) {
    if (!hasCustomSensitiveInformationAuthorization(user, userAuthorizationGroupUuids, csi)) {
      // Audit and ignore
      AnetAuditLogger.log("Person {} tried to insert CustomSensitiveInformation {}"
          + " which they don't have access to, refused", user, csi);
    } else {
      // Insert and audit
      insert(csi);
      AnetAuditLogger.log("Person {} inserted CustomSensitiveInformation {}", user, csi);
    }
  }

  private void checkAndUpdate(final Person user, final Set<String> userAuthorizationGroupUuids,
      final String relatedObjectType, final String relatedObjectUuid,
      final CustomSensitiveInformation csi) {
    // Retrieve existing and check
    final CustomSensitiveInformation existingCsi = getByUuid(csi.getUuid());
    if (existingCsi == null) {
      // Audit and ignore
      AnetAuditLogger.log(
          "Person {} tried to update non-existing CustomSensitiveInformation {}, refused", user,
          csi.getUuid());
    } else if (!existingCsi.getCustomFieldName().equals(csi.getCustomFieldName())) {
      // Audit and ignore
      AnetAuditLogger.log("Person {} tried to update CustomSensitiveInformation {}"
          + " with a different customFieldName to {}, refused", user, existingCsi, csi);
    } else if (!existingCsi.getRelatedObjectType().equals(relatedObjectType)
        || !existingCsi.getRelatedObjectUuid().equals(relatedObjectUuid)) {
      // Audit and ignore
      AnetAuditLogger.log("Person {} tried to update CustomSensitiveInformation {}"
          + " with a different relatedObject to {}, refused", user, existingCsi, csi);
    } else if (!hasCustomSensitiveInformationAuthorization(user, userAuthorizationGroupUuids,
        csi)) {
      // Audit and ignore
      AnetAuditLogger.log("Person {} tried to update CustomSensitiveInformation {}"
          + " which they don't have access to, refused", user, csi);
    } else {
      // Update and audit
      update(csi);
      AnetAuditLogger.log("Person {} updated CustomSensitiveInformation {}", user, csi);
    }
  }

  @InTransaction
  public boolean hasCustomSensitiveInformationAuthorization(final Person user,
      final Set<String> userAuthorizationGroupUuids, final CustomSensitiveInformation csi) {
    // Admins always have access
    // Note that a `null` user means this is called through a merge function, by an admin
    if (user == null || AuthUtils.isAdmin(user)) {
      return true;
    }

    // Check for the user's counterparts
    final boolean isForPosition = PositionDao.TABLE_NAME.equals(csi.getRelatedObjectType());
    final boolean isForPerson = PersonDao.TABLE_NAME.equals(csi.getRelatedObjectType());
    if (isForPosition || isForPerson) {
      final AnetObjectEngine engine = AnetObjectEngine.getInstance();
      final Position currentPosition = DaoUtils.getPosition(user);
      if (currentPosition != null) {
        final List<Position> associatedPositions =
            currentPosition.loadAssociatedPositions(engine.getContext()).join();
        if (associatedPositions.stream()
            .anyMatch(ap -> (isForPosition && csi.getRelatedObjectUuid().equals(ap.getUuid()))
                || (isForPerson && csi.getRelatedObjectUuid().equals(ap.getCurrentPersonUuid())))) {
          // Is one of the user's counterparts
          return true;
        }
      }
    }

    // If this is for a report, check whether the user is an author
    if (ReportDao.TABLE_NAME.equals(csi.getRelatedObjectType())) {
      final AnetObjectEngine engine = AnetObjectEngine.getInstance();
      final Report report = engine.getReportDao().getByUuid(csi.getRelatedObjectUuid());
      if (report != null) {
        final List<ReportPerson> authors = report.loadAuthors(engine.getContext()).join();
        if (authors.stream().anyMatch(author -> author.getUuid().equals(DaoUtils.getUuid(user)))) {
          // User is an author of this report
          return true;
        }
      }
    }

    // Check against the dictionary whether the user is authorized
    final List<String> authorizationGroupUuids =
        getAuthorizationGroupUuids(csi.getRelatedObjectType(), csi.getCustomFieldName());
    if (Utils.isEmptyOrNull(authorizationGroupUuids)) {
      // No authorization groups defined for this field
      return false;
    }

    // Check against authorization groups
    return DaoUtils.isInAuthorizationGroup(userAuthorizationGroupUuids, authorizationGroupUuids);
  }

  private List<String> getAuthorizationGroupUuids(final String tableName, final String fieldName) {
    final String keyPath =
        String.format("fields.%1$s.customSensitiveInformation.%2$s.authorizationGroupUuids",
            getObjectType(tableName), fieldName);
    @SuppressWarnings("unchecked")
    final List<String> authorizationGroupUuids =
        (List<String>) AnetObjectEngine.getConfiguration().getDictionaryEntry(keyPath);
    return authorizationGroupUuids;
  }

  private String getObjectType(final String tableName) {
    switch (tableName) {
      case LocationDao.TABLE_NAME:
        return "location";
      case OrganizationDao.TABLE_NAME:
        return "organization";
      case PersonDao.TABLE_NAME:
        return "person";
      case PositionDao.TABLE_NAME:
        return "position";
      case ReportDao.TABLE_NAME:
        return "report";
      case TaskDao.TABLE_NAME:
        return "task";
      default:
        return null;
    }
  }

}
