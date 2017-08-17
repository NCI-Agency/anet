package mil.dds.anet.search.mssql;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.TagList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.search.ITagSearcher;
import mil.dds.anet.utils.Utils;

public class MssqlTagSearcher implements ITagSearcher {

	@Override
	public TagList runSearch(TagSearchQuery query, Handle dbHandle) {
		final TagList result = new TagList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());
		final String text = query.getText();
		if (text == null || text.trim().length() == 0) {
			return result;
		}

		final Query<Tag> sqlQuery = dbHandle.createQuery("/* MssqlTagSearch */ SELECT *, count(*) over() as totalCount "
				+ "FROM tags "
				+ "WHERE CONTAINS((name, description), :containsQuery) "
				+ "OR FREETEXT((name, description), :freetextQuery) "
				+ "ORDER BY name ASC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY")
			.bind("containsQuery", Utils.getSqlServerFullTextQuery(text))
			.bind("freetextQuery", text)
			.bind("offset", query.getPageSize() * query.getPageNum())
			.bind("limit", query.getPageSize())
			.map(new TagMapper());

		result.setList(sqlQuery.list());
		if (result.getList().size() > 0) {
			result.setTotalCount((Integer) sqlQuery.getContext().getAttribute("totalCount"));
		} else {
			result.setTotalCount(0);
		}
		return result;
	}

}
