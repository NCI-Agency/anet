package mil.dds.anet.database;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.views.AbstractAnetBean;
import org.apache.commons.lang3.tuple.ImmutablePair;

public abstract class SearchQueryBatcher<T extends AbstractAnetBean, Q extends AbstractSearchQuery<?>> {

  private static final List<String> defaultIfEmpty = Arrays.asList("-1");

  private final AnetBaseDao<T, Q> dao;

  public SearchQueryBatcher(AnetBaseDao<T, Q> dao) {
    this.dao = dao;
  }

  public List<List<T>> getByForeignKeys(List<ImmutablePair<String, Q>> foreignKeys) {
    final Map<ImmutablePair<String, Q>, List<T>> resultsMap = new HashMap<>();

    // group in smaller batches by query
    final Map<Q, List<String>> queryToForeignKeyListMap =
        foreignKeys.stream().collect(Collectors.groupingBy(ImmutablePair::getRight,
            Collectors.mapping(ImmutablePair::getLeft, Collectors.toList())));
    for (Map.Entry<Q, List<String>> gqlQuery : queryToForeignKeyListMap.entrySet()) {
      try {
        @SuppressWarnings("unchecked")
        final Q searchQuery = (Q) gqlQuery.getKey().clone();
        final List<String> foreignKeysForQuery = gqlQuery.getValue();
        searchQuery.getBatchParams()
            .setBatchUuids(foreignKeysForQuery.isEmpty() ? defaultIfEmpty : foreignKeysForQuery);
        final AnetBeanList<T> results = dao.search(searchQuery);
        final Map<ImmutablePair<String, Q>, List<T>> map = results.getList().stream()
            .collect(Collectors.toMap(
                result -> new ImmutablePair<String, Q>(result.getBatchUuid(), searchQuery), // key
                result -> new ArrayList<>(Collections.singletonList(result)), // value
                (obj1, obj2) -> {
                  obj1.addAll(obj2);
                  return obj1;
                })); // collect results with the same key in one list
        resultsMap.putAll(map);
      } catch (CloneNotSupportedException e) {
        throw new RuntimeException(e);
      }
    }

    return foreignKeys.stream().map(foreignKey -> resultsMap.get(foreignKey))
        .map(l -> (l == null) ? new ArrayList<T>() : l) // when null, use an empty list
        .collect(Collectors.toList());
  }
}
