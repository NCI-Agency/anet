package mil.dds.anet.search.sqlite;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import jersey.repackaged.com.google.common.base.Joiner;

import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.AuthorizationGroupList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery.AuthorizationGroupSearchSortBy;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.search.IAuthorizationGroupSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class SqliteAuthorizationGroupSearcher implements IAuthorizationGroupSearcher {

	@Override
	public AuthorizationGroupList runSearch(AuthorizationGroupSearchQuery query, Handle dbHandle) {
		final List<String> whereClauses = new LinkedList<String>();
		final Map<String,Object> sqlArgs = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder("/* SqliteAuthorizationGroupSearch */ SELECT * FROM \"authorizationGroups\"");

		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
		if (doFullTextSearch) {
			whereClauses.add("(name LIKE '%' || :text || '%' OR description LIKE '%' || :text || '%' )");
			sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
		}

		if (query.getStatus() != null) {
			whereClauses.add("status = :status");
			sqlArgs.put("status", DaoUtils.getEnumId(query.getStatus()));
		}

		if (query.getPositionId() != null) {
			// Search for authorization groups related to a given position
			whereClauses.add("id IN ( SELECT \"authorizationGroupId\" FROM \"authorizationGroupPositions\" "
							+ "WHERE \"positionId\" = :positionId) ");
			sqlArgs.put("positionId", query.getPositionId());
		}

		final AuthorizationGroupList result = new AuthorizationGroupList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());

		if (whereClauses.isEmpty()) {
			return result;
		}

		sql.append(" WHERE ");
		sql.append(Joiner.on(" AND ").join(whereClauses));

		//Sort Ordering
		final List<String> orderByClauses = new LinkedList<>();
		if (query.getSortBy() == null) { query.setSortBy(AuthorizationGroupSearchSortBy.NAME); }
		if (query.getSortOrder() == null) { query.setSortOrder(SortOrder.ASC); }
		switch (query.getSortBy()) {
			case CREATED_AT:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "\"createdAt\""));
				break;
			case NAME:
			default:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "name"));
				break;
		}
		orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, null, "id"));
		sql.append(" ORDER BY ");
		sql.append(Joiner.on(", ").join(orderByClauses));

		sql.append(" LIMIT :limit OFFSET :offset");

		final List<AuthorizationGroup> list = dbHandle.createQuery(sql.toString())
			.bindFromMap(sqlArgs)
			.bind("offset", query.getPageSize() * query.getPageNum())
			.bind("limit", query.getPageSize())
			.map(new AuthorizationGroupMapper())
			.list();

		result.setList(list);
		result.setTotalCount(result.getList().size()); // Sqlite cannot do true total counts, so this is a crutch.
		return result;
	}

}
