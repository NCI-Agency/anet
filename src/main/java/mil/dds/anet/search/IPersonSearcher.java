package mil.dds.anet.search;

import java.util.Set;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;

public interface IPersonSearcher {

  public AnetBeanList<Person> runSearch(Set<String> subFields, PersonSearchQuery query);

}
