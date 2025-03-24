package mil.dds.anet.search;

import com.google.common.base.Joiner;
import com.google.common.collect.Iterables;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.beans.search.AssessmentSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;

public abstract class AbstractSearcher<B, T extends AbstractSearchQuery<?>> {

  private static final int MIN_UUID_PREFIX = 4;

  protected final DatabaseHandler databaseHandler;
  protected final AbstractSearchQueryBuilder<B, T> qb;

  protected AbstractSearcher(DatabaseHandler databaseHandler, AbstractSearchQueryBuilder<B, T> qb) {
    this.databaseHandler = databaseHandler;
    this.qb = qb;
  }

  protected Handle getDbHandle() {
    return databaseHandler.getHandle();
  }

  protected void closeDbHandle(Handle handle) {
    databaseHandler.closeHandle(handle);
  }

  protected abstract void buildQuery(T query);

  protected String getTableFields(String tableName, Set<String> allFields,
      Set<String> minimalFields, Map<String, String> fieldMapping, Set<String> subFields) {
    final String[] fieldsArray;
    if (subFields == null) {
      fieldsArray = Iterables.toArray(allFields, String.class);
    } else {
      final Set<String> fields = subFields.stream().map(f -> f.replaceFirst("^list/", ""))
          .map(f -> fieldMapping.getOrDefault(f, f)).filter(f -> !f.contains("/"))
          .collect(Collectors.toSet());
      fields.retainAll(allFields);
      fields.addAll(minimalFields);
      fieldsArray = Iterables.toArray(fields, String.class);
    }
    return DaoUtils.buildFieldAliases(tableName, fieldsArray, true);
  }

  protected boolean hasTextQuery(T query) {
    if (!query.isTextPresent()) {
      return false;
    }
    final String text = query.getText();
    return qb.getContainsQuery(text) != null && qb.getFullTextQuery(text) != null;
  }

  protected abstract void addTextQuery(T query);

  protected void addFullTextSearch(String tableName, String text, boolean isSortByPresent) {
    final List<String> whereClauses = new ArrayList<>();
    final List<String> selectClauses = new ArrayList<>();

    if (text.trim().length() >= MIN_UUID_PREFIX) {
      whereClauses
          .add(String.format("SELECT uuid FROM \"%1$s\" WHERE uuid ILIKE :likeQuery", tableName));
      selectClauses.add(
          String.format("CASE WHEN \"%1$s\".uuid ILIKE :likeQuery THEN 1 ELSE 0 END", tableName));
      qb.addSqlArg("likeQuery", qb.getLikeQuery(text));
    }

    final String materializedView = String.format("\"mv_fts_%1$s\"", tableName);
    final String fullTextColumn = String.format("%1$s.full_text", materializedView);
    final String tsQuery = getTsQuery();
    whereClauses.add(String.format("SELECT uuid FROM %1$s WHERE %2$s @@ %3$s", materializedView,
        fullTextColumn, tsQuery));
    qb.addWhereClause(String.format("\"%1$s\".uuid IN (%2$s)", tableName,
        Joiner.on(" UNION ").join(whereClauses)));
    qb.addSqlArg("fullTextQuery", qb.getFullTextQuery(text));

    if (!isSortByPresent) {
      selectClauses.add(String.format("ts_rank(%1$s, %2$s)", fullTextColumn, tsQuery));
      qb.addFromClause(String.format("LEFT JOIN %1$s ON %1$s.uuid = \"%2$s\".uuid",
          materializedView, tableName));
      qb.addSelectClause(
          String.format("(%1$s) AS search_rank", Joiner.on(" + ").join(selectClauses)));
    }
  }

  private String getTsQuery() {
    final String tsQueryTpl = "to_tsquery('%1$s', :fullTextQuery)";
    final String tsQueryAnet = String.format(tsQueryTpl, "anet");
    final String tsQuerySimple = String.format(tsQueryTpl, "simple");
    return String.format("(%1$s || %2$s)", tsQueryAnet, tsQuerySimple);
  }

  protected List<String> getOrderBy(SortOrder sortOrder, String... columns) {
    final List<String> clauses = new ArrayList<>();
    for (final String column : columns) {
      clauses.add(String.format("\"%1$s\" %2$s", column, sortOrder));
    }
    return clauses;
  }

  protected AnetObjectEngine engine() {
    return ApplicationContextProvider.getEngine();
  }

  protected void addAssessmentQuery(AssessmentSearchQuery query, String tableName,
      String fieldsType) {
    final var assessmentKey =
        String.format("fields.%1$s.assessments.%2$s", fieldsType, query.key());
    final var dict = ApplicationContextProvider.getDictionary();
    final var isOndemand =
        "ondemand".equals(dict.getDictionaryEntry(String.format("%s.recurrence", assessmentKey)));
    final var fromAssessmentsClause = getFromAssessmentsClause(tableName, isOndemand);
    qb.addSqlArg("assessmentKey", assessmentKey);
    final var filterClauses = new ArrayList<>();
    if (isOndemand) {
      // If it is an ondemand assessment, it may be expired.
      final var expirationClause = getOndemandAssessmentExpirationClause(dict, assessmentKey);
      if (!expirationClause.isEmpty()) {
        filterClauses.add(expirationClause);
      }
    }
    final var filters = query.filters();
    if (filters != null && !filters.isEmpty()) {
      filters.forEach((k, v) -> {
        final var keyParam = String.format("%1$s.questions.%2$s", assessmentKey, k);
        final var valueParam = String.format("%s.value", keyParam);
        final var filterType = dict.getDictionaryEntry(String.format("%s.type", keyParam));
        if ("enum".equals(filterType)) {
          filterClauses.add(String.format(
              "assessments.\"assessmentValues\"::jsonb->>:%1$s IN (<%2$s>)", keyParam, valueParam));
        } else if ("enumset".equals(filterType)) {
          filterClauses
              .add(String.format("assessments.\"assessmentValues\"::jsonb->:%1$s ??| array[<%2$s>]",
                  keyParam, valueParam));
        } else {
          // Can't handle this filter type, just skip
          return;
        }
        qb.addSqlArg(keyParam, k);
        qb.addListArg(valueParam, (List<?>) v);
      });
    }
    final var inAssessmentsClause = new StringBuilder(String.format(
        "SELECT assessments.\"relatedObjectUuid\" FROM (%s) assessments", fromAssessmentsClause));
    if (!filterClauses.isEmpty()) {
      inAssessmentsClause
          .append(String.format(" WHERE %s", Joiner.on(" AND ").join(filterClauses)));
    }
    qb.addWhereClause(String.format("\"%1$s\".uuid IN (%2$s)", tableName, inAssessmentsClause));
  }

  private String getFromAssessmentsClause(String tableName, boolean isOndemand) {
    final var fromAssessments = new StringBuilder(
        String.format("SELECT asmnt_aro.\"relatedObjectUuid\", asmnt.\"assessmentValues\""
            + " FROM \"assessmentRelatedObjects\" asmnt_aro"
            + " JOIN assessments asmnt ON asmnt.uuid = asmnt_aro.\"assessmentUuid\""
            + " WHERE asmnt_aro.\"relatedObjectType\" = '%1$s'"
            + " AND asmnt_aro.\"relatedObjectUuid\" = \"%1$s\".uuid"
            + " AND asmnt.\"assessmentKey\" = :assessmentKey", tableName));
    if (isOndemand) {
      // If it is an ondemand assessment, it will have an assessmentDate,
      // only the most recent one will be valid.
      fromAssessments.append(
          " ORDER BY (asmnt.\"assessmentValues\"::jsonb->>'assessmentDate')::date DESC LIMIT 1");
    }
    return fromAssessments.toString();
  }

  private String getOndemandAssessmentExpirationClause(AnetDictionary dict, String assessmentKey) {
    final var leftClauses = new ArrayList<>();
    final var rightClauses = new ArrayList<>();

    // If it is an ondemand assessment, it may be expired, which can happen because:
    // - the assessment has an expirationDate that has passed
    // - the assessment does not have an expirationDate, but it does have
    // onDemandAssessmentExpirationDays that have passed
    final var hasExpirationDate = dict
        .getDictionaryEntry(String.format("%s.questions.expirationDate", assessmentKey)) != null;
    if (hasExpirationDate) {
      leftClauses.add("assessments.\"assessmentValues\"::jsonb->>'expirationDate' IS NULL");
      rightClauses
          .add("(assessments.\"assessmentValues\"::jsonb->>'expirationDate')::date > CURRENT_DATE");
    }

    final Integer expirationDays = (Integer) dict
        .getDictionaryEntry(String.format("%s.onDemandAssessmentExpirationDays", assessmentKey));
    if (expirationDays != null) {
      leftClauses.add(String.format(
          "(assessments.\"assessmentValues\"::jsonb->>'assessmentDate')::date + INTERVAL '%d days' > CURRENT_DATE",
          expirationDays));
    }

    final var expirationClause = new StringBuilder();
    if (!leftClauses.isEmpty()) {
      expirationClause.append(String.format("(%s)", Joiner.on(" AND ").join(leftClauses)));
    }
    if (!rightClauses.isEmpty()) {
      if (!expirationClause.isEmpty()) {
        expirationClause.append(" OR ");
      }
      expirationClause.append(String.format("(%s)", Joiner.on(" AND ").join(rightClauses)));
    }
    return expirationClause.isEmpty() ? "" : String.format("(%s)", expirationClause);
  }

}
