package mil.dds.anet.search.mssql;

import java.util.HashMap;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.AuthorizationGroupList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.search.IAuthorizationGroupSearcher;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.utils.DaoUtils;

public class MssqlAuthorizationGroupSearcher implements IAuthorizationGroupSearcher {

	@Override
	public AuthorizationGroupList runSearch(AuthorizationGroupSearchQuery query, Handle dbHandle) {
		AuthorizationGroupList result = new AuthorizationGroupList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());
		if (query.getText() == null || query.getText().trim().length() == 0) {
			return result;
		}

		final Map<String,Object> args = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder(
				"/* MssqlAuthorizationGroupSearch */ SELECT *, count(*) over() as totalCount "
						+ "FROM authorizationGroups WHERE CONTAINS (name, :name) "
						+ (query.getStatus() != null ? "status = :status " : "")
						+ "ORDER BY name ASC, id ASC");
		args.put("name", Utils.getSqlServerFullTextQuery(query.getText()));

		if (query.getStatus() != null) { 
			args.put("status", DaoUtils.getEnumId(query.getStatus()));
		}

		final Query<AuthorizationGroup> map = MssqlSearcher.addPagination(query, dbHandle, sql, args)
			.map(new AuthorizationGroupMapper());
		return AuthorizationGroupList.fromQuery(map, query.getPageNum(), query.getPageSize());
	}

}
