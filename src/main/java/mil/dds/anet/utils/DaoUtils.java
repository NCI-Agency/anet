package mil.dds.anet.utils;

import com.google.common.base.Joiner;
import graphql.GraphQLContext;
import java.security.Principal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import mil.dds.anet.beans.Assessment;
import mil.dds.anet.beans.CustomSensitiveInformation;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.views.AbstractAnetBean;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class DaoUtils {

  public static String getUuid(AbstractAnetBean obj) {
    if (obj == null) {
      return null;
    }
    return obj.getUuid();
  }

  public static Integer getEnumId(Enum<?> o) {
    if (o == null) {
      return null;
    }
    return o.ordinal();
  }

  public static String getEnumString(Enum<?> o) {
    if (o == null) {
      return null;
    }
    return o.toString();
  }

  public static String getNewUuid() {
    return UUID.randomUUID().toString();
  }

  public static void setInsertFields(AbstractAnetBean bean) {
    bean.setUuid(getNewUuid());
    final Instant now = Instant.now();
    bean.setCreatedAt(now);
    bean.setUpdatedAt(now);
  }

  public static void setUpdateFields(AbstractAnetBean bean) {
    final Instant now = Instant.now();
    bean.setUpdatedAt(now);
  }

  public static void assertObjectIsFresh(AbstractAnetBean objectToBeUpdated,
      AbstractAnetBean existingObject, boolean force) {
    if (force) {
      return;
    }
    if (!hasSameUpdatedAtInMillis(objectToBeUpdated, existingObject)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, String.format(
          "Saving these changes (timestamped at %s) would overwrite later updates (timestamped at %s)",
          formatUpdateDate(objectToBeUpdated.getUpdatedAt()),
          formatUpdateDate(existingObject.getUpdatedAt())));
    }
  }

  private static boolean hasSameUpdatedAtInMillis(AbstractAnetBean objectToBeUpdated,
      AbstractAnetBean existingObject) {
    if (objectToBeUpdated.getUpdatedAt() == null || existingObject.getUpdatedAt() == null) {
      // If either of them is null, we can't compare them, so return false
      return false;
    }
    return objectToBeUpdated.getUpdatedAt().truncatedTo(ChronoUnit.MILLIS)
        .equals(existingObject.getUpdatedAt().truncatedTo(ChronoUnit.MILLIS));
  }

  private static String formatUpdateDate(Instant updatedAt) {
    final DateTimeFormatter dateTimeFormatter = Utils.getDateTimeFormatter(
        ApplicationContextProvider.getDictionary(), "dateFormats.upToDateCheck");
    return updatedAt == null ? "unknown time" : dateTimeFormatter.format(updatedAt);
  }

  public static String buildFieldAliases(String tableName, String[] fields, boolean addAs) {
    final List<String> fieldAliases = new LinkedList<>();
    for (String field : fields) {
      final StringBuilder sb = new StringBuilder(String.format("\"%s\".\"%s\"", tableName, field));
      if (addAs) {
        sb.append(String.format(" AS \"%s_%s\"", tableName, field));
      }
      fieldAliases.add(sb.toString());
    }
    return " " + Joiner.on(", ").join(fieldAliases) + " ";
  }

  public static Principal getPrincipalFromContext(GraphQLContext context) {
    if (context == null) {
      return null;
    }
    return context.get("principal");
  }

  public static Person getUserFromContext(GraphQLContext context) {
    if (!(getPrincipalFromContext(context) instanceof Person user)) {
      return null;
    }
    return user;
  }

  public static Position getPosition(final Person user) {
    return user == null ? null
        : user.loadPosition(ApplicationContextProvider.getEngine().getContext()).join();
  }

  public static void saveCustomSensitiveInformation(final Person user, final String tableName,
      final String uuid, String customSensitiveInformationDictKey,
      final List<CustomSensitiveInformation> customSensitiveInformation) {
    ApplicationContextProvider.getEngine().getCustomSensitiveInformationDao()
        .insertOrUpdateCustomSensitiveInformation(user, getAuthorizationGroupUuids(user), tableName,
            uuid, customSensitiveInformationDictKey, customSensitiveInformation);
  }

  public static Set<String> getAuthorizationGroupUuids(final Person user) {
    if (user == null) {
      return Collections.emptySet();
    }
    return user.getAuthorizationGroupUuids();
  }

  public static boolean isUserInAuthorizationGroup(final Set<String> userAuthorizationGroupUuids,
      final Assessment assessment, final boolean forReading) {
    return forReading ? isUserInReadAuthorizationGroup(userAuthorizationGroupUuids, assessment)
        : isUserInWriteAuthorizationGroup(userAuthorizationGroupUuids, assessment);
  }

  public static boolean isUserInReadAuthorizationGroup(
      final Set<String> userAuthorizationGroupUuids, final Assessment assessment) {
    // Check against the dictionary whether the user is authorized
    final List<String> readAuthorizationGroupUuids =
        getAuthorizationGroupUuids(assessment.getAssessmentKey(), "read");
    if (readAuthorizationGroupUuids == null) {
      // Not defined in dictionary: anyone can read!
      return true;
    }

    // Note: write access implies read access!
    final List<String> writeAuthorizationGroupUuids =
        getAuthorizationGroupUuids(assessment.getAssessmentKey(), "write");
    if (writeAuthorizationGroupUuids != null) {
      readAuthorizationGroupUuids.addAll(writeAuthorizationGroupUuids);
    }

    // Check defined uuids against the user
    return DaoUtils.isInAuthorizationGroup(userAuthorizationGroupUuids,
        readAuthorizationGroupUuids);
  }

  public static boolean isUserInWriteAuthorizationGroup(
      final Set<String> userAuthorizationGroupUuids, final Assessment assessment) {
    // Check against the dictionary whether the user is authorized
    final List<String> writeAuthorizationGroupUuids =
        getAuthorizationGroupUuids(assessment.getAssessmentKey(), "write");
    if (writeAuthorizationGroupUuids == null) {
      // Not defined in dictionary: anyone can write!
      return true;
    }

    // Check defined uuids against the user
    return DaoUtils.isInAuthorizationGroup(userAuthorizationGroupUuids,
        writeAuthorizationGroupUuids);
  }

  @SuppressWarnings("unchecked")
  private static List<String> getAuthorizationGroupUuids(final String assessmentKey,
      final String accessType) {
    final String keyPath =
        String.format("%1$s.authorizationGroupUuids.%2$s", assessmentKey, accessType);
    return (List<String>) ApplicationContextProvider.getDictionary().getDictionaryEntry(keyPath);
  }

  public static boolean isInAuthorizationGroup(final Set<String> userAuthorizationGroupUuids,
      final List<String> checkAuthorizationGroupUuids) {
    final Set<String> checkAuthGroupUuids = new HashSet<>(checkAuthorizationGroupUuids);
    checkAuthGroupUuids.retainAll(userAuthorizationGroupUuids);
    return !checkAuthGroupUuids.isEmpty();
  }

  public static String getAuthorizationGroupUuidsForRelatedObject(String queryComment,
      String relatedObjectParam, String relatedObjectType, String relatedTableAlias,
      String mainSelectClause, String mainWhereClause) {
    final StringBuilder sql = getAuthorizationOuterQuery(queryComment);
    sql.append(getAuthorizationInnerQuery(relatedObjectParam, relatedObjectType, relatedTableAlias,
        mainSelectClause, mainWhereClause));
    return sql.toString();
  }

  private static StringBuilder getAuthorizationOuterQuery(String queryComment) {
    final StringBuilder sql = new StringBuilder(queryComment);
    sql.append(" WITH RECURSIVE parent_orgs(uuid, parent_uuid) AS"
        + " (SELECT uuid, uuid as parent_uuid FROM organizations"
        + " UNION SELECT pt.uuid, bt.\"parentOrgUuid\" FROM organizations bt"
        + " INNER JOIN parent_orgs pt ON bt.uuid = pt.parent_uuid) ");
    return sql;
  }

  private static StringBuilder getAuthorizationInnerQuery(String relatedObjectParam,
      String relatedObjectType, String relatedTableAlias, String mainSelectClause,
      String mainWhereClause) {
    // Build the query using UNION ALL, so it can be optimized
    final StringBuilder sql = new StringBuilder();
    final String positionClause = isForPerson(relatedObjectType)
        ? " AND positions.\"currentPersonUuid\" = :" + relatedObjectParam
        : " AND positions.uuid = :" + relatedObjectParam;

    if (isForPerson(relatedObjectType)) {
      // Check for person
      sql.append(mainSelectClause);
      sql.append(mainWhereClause + " AND " + relatedTableAlias + ".\"relatedObjectType\" = '"
          + PersonDao.TABLE_NAME + "' AND " + relatedTableAlias + ".\"relatedObjectUuid\" = :"
          + relatedObjectParam);
      sql.append(" UNION ALL ");
    }

    if (isForPersonOrPosition(relatedObjectType)) {
      // Check for position
      sql.append(mainSelectClause + ", positions");
      sql.append(mainWhereClause + positionClause + " AND " + relatedTableAlias
          + ".\"relatedObjectType\" = '" + PositionDao.TABLE_NAME + "' AND " + relatedTableAlias
          + ".\"relatedObjectUuid\" = positions.uuid");
      sql.append(" UNION ALL ");
    }

    // Recursively check for organization (and transitive parents thereof)
    sql.append(mainSelectClause);
    if (isForPersonOrPosition(relatedObjectType)) {
      sql.append(", positions");
    }
    sql.append(", parent_orgs");
    sql.append(mainWhereClause);
    if (isForPersonOrPosition(relatedObjectType)) {
      sql.append(positionClause);
    }
    sql.append(
        " AND " + relatedTableAlias + ".\"relatedObjectType\" = '" + OrganizationDao.TABLE_NAME
            + "' AND " + relatedTableAlias + ".\"relatedObjectUuid\" = parent_orgs.parent_uuid");
    if (isForPersonOrPosition(relatedObjectType)) {
      sql.append(" AND positions.\"organizationUuid\" = parent_orgs.uuid");
    } else {
      sql.append(" AND parent_orgs.uuid = :" + relatedObjectParam);
    }
    return sql;
  }

  public static String getReportsWhenAuthorized(String isAuthorParam, String relatedObjectParam) {
    // Author
    final String authorQuery =
        "SELECT \"reportUuid\" FROM \"reportPeople\"" + " WHERE \"isAuthor\" = :" + isAuthorParam
            + " AND \"personUuid\" = :" + relatedObjectParam;

    // Authorized through person, position or organization
    final String memberTableAlias = "ram";
    final String memberSelectClause =
        "SELECT r.uuid FROM reports r INNER JOIN \"reportAuthorizedMembers\" " + memberTableAlias
            + " ON r.uuid = " + memberTableAlias + ".\"reportUuid\"";
    final String mainWhereClause = " WHERE TRUE";
    final StringBuilder memberQuery = DaoUtils.getAuthorizationInnerQuery(relatedObjectParam,
        PersonDao.TABLE_NAME, memberTableAlias, memberSelectClause, mainWhereClause);

    // Authorized through community
    final String communityTableAlias = "agro";
    final String communitySelectClause =
        memberSelectClause + " INNER JOIN \"authorizationGroupRelatedObjects\" "
            + communityTableAlias + " ON " + memberTableAlias + ".\"relatedObjectType\" = '"
            + AuthorizationGroupDao.TABLE_NAME + "' AND " + memberTableAlias
            + ".\"relatedObjectUuid\" = " + communityTableAlias + ".\"authorizationGroupUuid\"";
    final StringBuilder communityQuery = DaoUtils.getAuthorizationInnerQuery(relatedObjectParam,
        PersonDao.TABLE_NAME, communityTableAlias, communitySelectClause, mainWhereClause);

    return "(reports.uuid IN (" + authorQuery + ") OR reports.uuid IN ("
        + getAuthorizationOuterQuery("") + memberQuery + " UNION ALL " + communityQuery + "))";
  }

  private static boolean isForPerson(String relatedObjectType) {
    return PersonDao.TABLE_NAME.equals(relatedObjectType);
  }

  private static boolean isForPosition(String relatedObjectType) {
    return PositionDao.TABLE_NAME.equals(relatedObjectType);
  }

  private static boolean isForPersonOrPosition(String relatedObjectType) {
    return isForPerson(relatedObjectType) || isForPosition(relatedObjectType);
  }

  public static ZoneId getServerNativeZoneId() {
    return ZoneId.of("UTC");
  }

  public static ZoneId getServerLocalZoneId() {
    return ZoneId.systemDefault();
  }

  public static ZoneOffset getServerNativeZoneOffset() {
    return ZoneOffset.UTC;
  }

  public static void addInstantAsLocalDateTime(Map<String, Object> args, String parameterName,
      Instant parameterValue) {
    // For the JDBC driver, convert from java.time.Instant to java.time.LocalDateTime with an
    // explicit time zone.
    final LocalDateTime localValue;
    if (parameterValue == null) {
      localValue = null;
    } else {
      // Convert relative time if needed
      final Instant convertedParameterValue = handleRelativeDate(parameterValue);
      localValue = asLocalDateTime(convertedParameterValue);
    }
    args.put(parameterName, localValue);
  }

  public static LocalDateTime asLocalDateTime(final Instant instant) {
    return instant == null ? null : LocalDateTime.ofInstant(instant, getServerNativeZoneId());
  }

  private static final long MAX_RELATIVE_TIME = 999L * 24L * 60L * 60L * 1000L; // 999 days

  /*
   * For all search interfaces we accept either specific dates as number of milliseconds since the
   * Unix Epoch, OR a number of milliseconds before or after today's date, where these relative
   * times should be at most 999 days before or after Epoch.
   */
  public static boolean isRelativeDate(Instant input) {
    if (input == null) {
      return false;
    }
    return Math.abs(input.toEpochMilli()) <= MAX_RELATIVE_TIME;
  }

  private static Instant handleRelativeDate(Instant input) {
    if (isRelativeDate(input)) {
      final long now = Instant.now().toEpochMilli();
      return Instant.ofEpochMilli(now + input.toEpochMilli());
    }
    return input;
  }

  public static Instant getCurrentMinute() {
    final ZonedDateTime now = Instant.now().atZone(getServerNativeZoneId());
    final ZonedDateTime bom = now.truncatedTo(ChronoUnit.MINUTES);
    return bom.toInstant();
  }
}
