package mil.dds.anet.search.mssql;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Poam;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.PoamList;
import mil.dds.anet.beans.search.PoamSearchQuery;
import mil.dds.anet.database.mappers.PoamMapper;
import mil.dds.anet.search.IPoamSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class MssqlPoamSearcher implements IPoamSearcher {

	@Override
	public PoamList runSearch(PoamSearchQuery query, Handle dbHandle) {
		StringBuilder sql = new StringBuilder("/* MssqlPoamSearch */ SELECT poams.*, COUNT(*) OVER() AS totalCount FROM poams");
		Map<String,Object> args = new HashMap<String,Object>();
		
		sql.append(" WHERE ");
		List<String> whereClauses = new LinkedList<String>();
		String commonTableExpression = null;

		PoamList result =  new PoamList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());
		
		String text = query.getText();
		if (text != null && text.trim().length() > 0) { 
			whereClauses.add("(CONTAINS((longName), :text) OR shortName LIKE :likeQuery)");
			args.put("text", Utils.getSqlServerFullTextQuery(text));
			args.put("likeQuery", Utils.prepForLikeQuery(text) + "%");
		}
		
		if (query.getResponsibleOrgId() != null) { 
			if (query.getIncludeChildrenOrgs() != null && query.getIncludeChildrenOrgs()) {
				commonTableExpression = "WITH parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :orgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.parentOrgId = po.id "
					+ ") ";
				whereClauses.add(" organizationId IN (SELECT id from parent_orgs)");
			} else { 
				whereClauses.add("organizationId = :orgId");
			}
			args.put("orgId", query.getResponsibleOrgId());
		}
		
		if (query.getCategory() != null) { 
			whereClauses.add("category = :category");
			args.put("category", query.getCategory());
		}
		
		if (query.getStatus() != null) { 
			whereClauses.add("status = :status");
			args.put("status", DaoUtils.getEnumId(query.getStatus()));
		}
		
		if (whereClauses.size() == 0) { return result; }
		
		sql.append(Joiner.on(" AND ").join(whereClauses));
		sql.append(" ORDER BY shortName ASC, longName ASC, id ASC");

		if (commonTableExpression != null) { 
			sql.insert(0, commonTableExpression);
		}

		final Query<Poam> sqlQuery = MssqlSearcher.addPagination(query, dbHandle, sql, args)
			.map(new PoamMapper());
		return PoamList.fromQuery(sqlQuery, query.getPageNum(), query.getPageSize());
	}
	
}
