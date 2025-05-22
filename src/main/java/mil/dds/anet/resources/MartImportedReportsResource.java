package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import java.util.List;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.database.MartImportedReportDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import org.springframework.stereotype.Component;

@Component
@GraphQLApi
public class MartImportedReportsResource {

  private final MartImportedReportDao martImportedReportDao;

  public MartImportedReportsResource(MartImportedReportDao emailDao) {
    this.martImportedReportDao = emailDao;
  }

  @GraphQLQuery(name = "martImportedReports")
  public AnetBeanList<MartImportedReport> getMartImportedReports(
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "pageNum", defaultValue = "0") int pageNum,
      @GraphQLArgument(name = "pageSize", defaultValue = "0") int pageSize,
      @GraphQLArgument(name = "states") List<String> states,
      @GraphQLArgument(name = "sortBy", defaultValue = "sequence") String sortBy,
      @GraphQLArgument(name = "sortOrder", defaultValue = "desc") String sortOrder) {
    AuthUtils.assertAdministrator(DaoUtils.getUserFromContext(context));
    return martImportedReportDao.getAll(pageNum, pageSize, states, sortBy, sortOrder);
  }

}
