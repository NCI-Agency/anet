package mil.dds.anet.search;

import java.util.Set;
import mil.dds.anet.beans.Preference;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PreferenceSearchQuery;

public interface IPreferenceSearcher {

  AnetBeanList<Preference> runSearch(Set<String> subFields, PreferenceSearchQuery query);

}
