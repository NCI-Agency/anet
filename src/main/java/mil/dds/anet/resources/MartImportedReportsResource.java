package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.search.MartImportedReportSearchQuery;
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

  @GraphQLQuery(name = "martImportedReportHistory")
  public AnetBeanList<MartImportedReport> getMartImportedReportHistory(
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") MartImportedReportSearchQuery query) {
    AuthUtils.assertAdministrator(DaoUtils.getUserFromContext(context));
    // We want to get all entries for this specific MartImportedReport
    return martImportedReportDao.getMartImportedReportHistory(query);
  }

  @GraphQLQuery(name = "martImportedReportList")
  public AnetBeanList<MartImportedReport> getMartImportedReportList(
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") MartImportedReportSearchQuery query) {
    AuthUtils.assertAdministrator(DaoUtils.getUserFromContext(context));
    // Get all MartImportedReports grouped by reportUuid and showing most recently received
    return martImportedReportDao.getMartImportedReports(query);
  }


  @GraphQLQuery(name = "uniqueMartReportAuthors")
  public AnetBeanList<Person> getUniqueMartReportAuthors(
      @GraphQLRootContext GraphQLContext context) {
    AuthUtils.assertAdministrator(DaoUtils.getUserFromContext(context));
    return martImportedReportDao.getUniqueMartReportAuthors();
  }

  @GraphQLQuery(name = "uniqueMartReportReports")
  public AnetBeanList<Report> getUniqueMartReportReports(
      @GraphQLRootContext GraphQLContext context) {
    AuthUtils.assertAdministrator(DaoUtils.getUserFromContext(context));
    return martImportedReportDao.getUniqueMartReportReports();
  }

}
