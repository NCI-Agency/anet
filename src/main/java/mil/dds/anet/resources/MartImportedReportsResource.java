package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.search.MartImportedReportSearchQuery;
import mil.dds.anet.database.MartImportedReportDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import org.springframework.stereotype.Component;

@Component
public class MartImportedReportsResource {

  private final MartImportedReportDao martImportedReportDao;

  public MartImportedReportsResource(MartImportedReportDao martImportedReportDao) {
    this.martImportedReportDao = martImportedReportDao;
  }

  @GraphQLQuery(name = "martImportedReportList")
  public AnetBeanList<MartImportedReport> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") MartImportedReportSearchQuery query) {
    AuthUtils.assertAdministrator(DaoUtils.getUserFromContext(context));
    return martImportedReportDao.search(query);
  }

}
