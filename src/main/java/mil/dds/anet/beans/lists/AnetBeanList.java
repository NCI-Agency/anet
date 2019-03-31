package mil.dds.anet.beans.lists;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.List;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.Query;

public class AnetBeanList<T> {

  List<T> list;
  Integer pageNum;
  Integer pageSize;
  Integer totalCount;

  public AnetBeanList() { /* Serialization Constructor */ }

  public AnetBeanList(List<T> list) {
    this(null, null, list);
    this.totalCount = list.size();
  }

  public AnetBeanList(Integer pageNum, Integer pageSize, List<T> list) {
    this.pageNum = pageNum;
    this.pageSize = pageSize;
    this.list = list;
  }

  public AnetBeanList(Query query, int pageNum, int pageSize, RowMapper<T> mapper,
      Long manualRowCount) {
    this(pageNum, pageSize, query.map(mapper).list());
    int resultSize = getList().size();
    if (manualRowCount != null) {
      setTotalCount(manualRowCount.intValue());
    } else if (resultSize == 0) {
      setTotalCount(0);
    } else {
      Integer foundCount = (Integer) query.getContext().getAttribute("totalCount");
      setTotalCount(foundCount == null ? resultSize : foundCount);
    }
  }

  @GraphQLQuery(name = "list")
  public List<T> getList() {
    return list;
  }

  public void setList(List<T> list) {
    this.list = list;
  }

  public Integer getPageNum() {
    return pageNum;
  }

  public void setPageNum(Integer pageNum) {
    this.pageNum = pageNum;
  }

  public Integer getPageSize() {
    return pageSize;
  }

  public void setPageSize(Integer pageSize) {
    this.pageSize = pageSize;
  }

  public Integer getTotalCount() {
    return totalCount;
  }

  public void setTotalCount(Integer totalCount) {
    this.totalCount = totalCount;
  }

  public static AnetBeanList<Report> getReportList(Person user, Query query, int pageNum,
      int pageSize, RowMapper<Report> mapper) {
    final AnetBeanList<Report> results =
        new AnetBeanList<Report>(query, pageNum, pageSize, mapper, null);
    for (final Report report : results.getList()) {
      report.setUser(user);
    }
    return results;
  }
}
