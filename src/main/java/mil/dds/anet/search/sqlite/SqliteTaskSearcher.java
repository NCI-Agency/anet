package mil.dds.anet.search.sqlite;

import com.google.common.base.Joiner;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.ITaskSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class SqliteTaskSearcher extends AbstractSearcherBase implements ITaskSearcher {

  @Override
  public AnetBeanList<Task> runSearch(TaskSearchQuery query) {
    StringBuilder sql = new StringBuilder("/* SqliteTaskSearch */ SELECT tasks.* FROM tasks");
    Map<String, Object> args = new HashMap<String, Object>();

    sql.append(" WHERE ");
    List<String> whereClauses = new LinkedList<String>();
    final AnetBeanList<Task> result =
        new AnetBeanList<Task>(query.getPageNum(), query.getPageSize(), new ArrayList<Task>());

    final boolean doFullTextSearch = query.isTextPresent();
    if (doFullTextSearch) {
      final String text = query.getText();
      whereClauses
          .add("(\"longName\" LIKE '%' || :text || '%' OR \"shortName\" LIKE '%' || :text || '%')");
      args.put("text", Utils.getSqliteFullTextQuery(text));
    }

    if (query.getResponsibleOrgUuid() != null) {
      if (Boolean.TRUE.equals(query.getIncludeChildrenOrgs())) {
        sql.insert(0, "WITH RECURSIVE parent_orgs(uuid) AS ( "
            + "SELECT uuid FROM organizations WHERE uuid = :orgUuid " + "UNION ALL "
            + "SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid "
            + ") ");
        whereClauses.add(" \"organizationUuid\" IN (SELECT uuid from parent_orgs)");
      } else {
        whereClauses.add("\"organizationUuid\" = :orgUuid");
      }
      args.put("orgUuid", query.getResponsibleOrgUuid());
    }

    if (query.getCategory() != null) {
      whereClauses.add("category = :category");
      args.put("category", query.getCategory());
    }

    if (query.getStatus() != null) {
      whereClauses.add("status = :status");
      args.put("status", DaoUtils.getEnumId(query.getStatus()));
    }

    if (query.getCustomFieldRef1Uuid() != null) {
      if (Boolean.TRUE.equals(query.getCustomFieldRef1Recursively())) {
        whereClauses.add("(tasks.\"customFieldRef1Uuid\" IN ("
            + "WITH RECURSIVE parent_orgs(uuid) AS ( "
            + "SELECT uuid FROM tasks WHERE uuid = :customFieldRef1Uuid " + "UNION ALL "
            + "SELECT t.uuid from parent_tasks pt, tasks t WHERE t.\"customFieldRef1Uuid\" = pt.uuid "
            + ") SELECT uuid from parent_tasks) OR tasks.uuid = :customFieldRef1Uuid)");
      } else {
        whereClauses.add("tasks.\"customFieldRef1Uuid\" = :customFieldRef1Uuid");
      }
      args.put("customFieldRef1Uuid", query.getCustomFieldRef1Uuid());
    }

    if (whereClauses.size() == 0) {
      return result;
    }

    sql.append(Joiner.on(" AND ").join(whereClauses));
    sql.append(" ORDER BY \"shortName\" ASC LIMIT :limit OFFSET :offset");

    result.setList(getDbHandle().createQuery(sql.toString()).bindMap(args)
        .bind("offset", query.getPageSize() * query.getPageNum()).bind("limit", query.getPageSize())
        .map(new TaskMapper()).list());
    // Sqlite cannot do true total counts, so this is a crutch.
    result.setTotalCount(result.getList().size());
    return result;
  }

}
