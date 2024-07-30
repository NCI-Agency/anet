package mil.dds.anet.search;

import graphql.GraphQLContext;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ReportSearchQuery;

public interface IReportSearcher {

  public CompletableFuture<AnetBeanList<Report>> runSearch(GraphQLContext context,
      Set<String> subFields, ReportSearchQuery query);

}
