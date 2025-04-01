package mil.dds.anet.utils;

import com.google.common.base.Joiner;
import graphql.GraphQLContext;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.beans.Assessment;
import mil.dds.anet.beans.CustomSensitiveInformation;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.views.AbstractAnetBean;

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

  public static AccessToken getGraphQLWebServiceAccessToken(GraphQLContext context) {
    if (context == null) {
      return null;
    }
    return context.get("graphQLWebServiceToken");
  }

  public static Person getUserFromContext(GraphQLContext context) {
    if (context == null) {
      // Called from e.g. merge
      return null;
    }
    return context.get("user");
  }

  public static Position getPosition(final Person user) {
    return user == null ? null : user.loadPosition();
  }

  public static void saveCustomSensitiveInformation(final Person user, final String tableName,
      final String uuid, final List<CustomSensitiveInformation> customSensitiveInformation) {
    ApplicationContextProvider.getEngine().getCustomSensitiveInformationDao()
        .insertOrUpdateCustomSensitiveInformation(user, getAuthorizationGroupUuids(user), tableName,
            uuid, customSensitiveInformation);
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

  /*
   * For all search interfaces we accept either specific dates as number of milliseconds since the
   * Unix Epoch, OR a number of milliseconds before today's date, where these relative times should
   * be negative, i.e. before Epoch.
   */
  public static boolean isRelativeDate(Instant input) {
    if (input == null) {
      return false;
    }
    return input.toEpochMilli() < 0;
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
