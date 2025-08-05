package mil.dds.anet.search;


import java.util.Set;
import mil.dds.anet.beans.Preference;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PreferenceSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.PreferenceDao;
import mil.dds.anet.database.mappers.PreferenceMapper;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractPreferenceSearcher
    extends AbstractSearcher<Preference, PreferenceSearchQuery> implements IPreferenceSearcher {

  protected AbstractPreferenceSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<Preference, PreferenceSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<Preference> runSearch(Set<String> subFields, PreferenceSearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      buildQuery(query);
      return qb.buildAndRun(handle, query, new PreferenceMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(PreferenceSearchQuery query) {
    qb.addSelectClause(PreferenceDao.PREFERENCE_FIELDS);
    qb.addFromClause("preferences");
    if (query.getCategory() != null) {
      qb.addStringEqualsClause("category", "preferences.category", query.getCategory());
    }
    addOrderByClauses(qb, query);
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      PreferenceSearchQuery query) {
    qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "preferences_category"));
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "preferences_name"));
  }
}
