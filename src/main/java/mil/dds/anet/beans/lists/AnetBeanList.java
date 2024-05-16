package mil.dds.anet.beans.lists;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.List;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.Query;

public class AnetBeanList<T> {

  @GraphQLQuery
  @GraphQLInputField
  List<T> list;
  @GraphQLQuery
  @GraphQLInputField
  Integer pageNum;
  @GraphQLQuery
  @GraphQLInputField
  Integer pageSize;
  @GraphQLQuery
  @GraphQLInputField
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

  public AnetBeanList(Query query, int pageNum, int pageSize, RowMapper<T> mapper) {
    this(pageNum, pageSize, query.map(mapper).list());
    final Integer foundCount = (Integer) query.getContext().getAttribute("totalCount");
    if (foundCount != null) {
      // Total count was found in the query results, use it
      setTotalCount(foundCount);
    } else {
      // Get the number of results actually retrieved
      int resultSize = getList().size();
      // Check if that is zero
      if (resultSize == 0) {
        // We may have a pagination overshoot, so set the size to the last item on the previous page
        resultSize = pageNum * pageSize;
      }
      // Make sure size is always non-negative
      setTotalCount(Math.max(0, resultSize));
    }
  }

  @AllowUnverifiedUsers
  public List<T> getList() {
    return list;
  }

  public void setList(List<T> list) {
    this.list = list;
  }

  @AllowUnverifiedUsers
  public Integer getPageNum() {
    return pageNum;
  }

  public void setPageNum(Integer pageNum) {
    this.pageNum = pageNum;
  }

  @AllowUnverifiedUsers
  public Integer getPageSize() {
    return pageSize;
  }

  public void setPageSize(Integer pageSize) {
    this.pageSize = pageSize;
  }

  @AllowUnverifiedUsers
  public Integer getTotalCount() {
    return totalCount;
  }

  public void setTotalCount(Integer totalCount) {
    this.totalCount = totalCount;
  }

}
