package mil.dds.anet.search.pg;

import mil.dds.anet.beans.UserActivity;
import mil.dds.anet.beans.search.UserActivitySearchQuery;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractUserActivitySearcher;

public class PostgresqlUserActivitySearcher extends AbstractUserActivitySearcher {

  public PostgresqlUserActivitySearcher() {
    super(new PostgresqlSearchQueryBuilder<>("PostgresqlUserActivitySearch"));
  }

  @Override
  protected void buildQuery(final UserActivitySearchQuery query) {
    final PostgresqlSearchQueryBuilder<UserActivity, UserActivitySearchQuery> withQb =
        new PostgresqlSearchQueryBuilder<>("with-clause");
    switch (query.getSearchType()) {
      case PERSON:
        queryByPerson(query, withQb);
        break;
      case ORGANIZATION:
        queryByOrganization(query, withQb);
        break;
      case TOP_LEVEL_ORGANIZATION:
        queryByTopLevelOrganization(query, withQb);
        break;
    }
    qb.addWithClause(String.format("%1$s AS (%2$s)", WITH_CLAUSE_NAME, withQb.build()));
    qb.addSqlArgs(withQb.getSqlArgs());
    super.buildQuery(query);
  }

  private void queryByPerson(final UserActivitySearchQuery query,
      final PostgresqlSearchQueryBuilder<UserActivity, UserActivitySearchQuery> withQb) {
    withQb.addSelectClause("u.\"personUuid\", COUNT(*)");
    withQb.addFromClause("\"userActivities\" u");
    withQb.addDateRangeClause("startDate", "u.\"visitedAt\"",
        AbstractSearchQueryBuilder.Comparison.AFTER, query.getStartDate(), "endDate",
        "u.\"visitedAt\"", AbstractSearchQueryBuilder.Comparison.BEFORE, query.getEndDate());
    if (!query.getShowDeleted()) {
      withQb.addWhereClause("EXISTS (SELECT uuid FROM people WHERE uuid = u.\"personUuid\")");
    }
    withQb.addGroupByClause("u.\"personUuid\"");
  }

  private void queryByOrganization(final UserActivitySearchQuery query,
      final PostgresqlSearchQueryBuilder<UserActivity, UserActivitySearchQuery> withQb) {
    withQb.addSelectClause("u.\"organizationUuid\", COUNT(*)");
    withQb.addFromClause("\"userActivities\" u");
    withQb.addDateRangeClause("startDate", "u.\"visitedAt\"",
        AbstractSearchQueryBuilder.Comparison.AFTER, query.getStartDate(), "endDate",
        "u.\"visitedAt\"", AbstractSearchQueryBuilder.Comparison.BEFORE, query.getEndDate());
    if (!query.getShowDeleted()) {
      withQb.addWhereClause(
          "EXISTS (SELECT uuid FROM organizations WHERE uuid = u.\"organizationUuid\")");
    }
    withQb.addGroupByClause("u.\"organizationUuid\"");
  }

  private void queryByTopLevelOrganization(final UserActivitySearchQuery query,
      final PostgresqlSearchQueryBuilder<UserActivity, UserActivitySearchQuery> withQb) {
    withQb.createWithClause(null, "parent_orgs", "organizations", "\"parentOrgUuid\"", false);
    withQb.addSelectClause("parent_orgs.parent_uuid AS \"organizationUuid\", COUNT(*)");
    withQb.addFromClause("\"userActivities\" u");
    withQb.addFromClause("LEFT JOIN parent_orgs ON parent_orgs.uuid = u.\"organizationUuid\"");
    withQb.addDateRangeClause("startDate", "u.\"visitedAt\"",
        AbstractSearchQueryBuilder.Comparison.AFTER, query.getStartDate(), "endDate",
        "u.\"visitedAt\"", AbstractSearchQueryBuilder.Comparison.BEFORE, query.getEndDate());
    final String parentQueryFmt =
        "(%s parent_orgs.parent_uuid IN (SELECT uuid FROM organizations WHERE \"parentOrgUuid\" IS NULL))";
    withQb.addWhereClause(String.format(parentQueryFmt,
        !query.getShowDeleted() ? "" : "parent_orgs.uuid IS NULL OR"));
    withQb.addGroupByClause("parent_orgs.parent_uuid");
  }
}
