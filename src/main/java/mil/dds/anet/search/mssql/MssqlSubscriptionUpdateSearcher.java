package mil.dds.anet.search.mssql;

import java.util.HashMap;
import java.util.Map;

import org.jdbi.v3.core.statement.Query;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.SubscriptionUpdateMapper;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.ISubscriptionUpdateSearcher;
import mil.dds.anet.utils.DaoUtils;

public class MssqlSubscriptionUpdateSearcher extends AbstractSearcherBase implements ISubscriptionUpdateSearcher {

	@Override
	public AnetBeanList<SubscriptionUpdate> runSearch(SubscriptionUpdateSearchQuery query, Person user) {
		final Position position = user.loadPosition();
		final Map<String,Object> args = new HashMap<String,Object>();
		args.put("positionUuid", DaoUtils.getUuid(position));
		final StringBuilder sql = new StringBuilder("/* getSubscriptionUpdatesForPosition */ SELECT *"
				+ ", count(*) over() as totalCount"
				+ " FROM \"subscriptionUpdates\" "
				+ "WHERE \"subscriptionUpdates\".\"subscriptionUuid\" IN ("
				+ "  SELECT uuid FROM subscriptions "
				+ "  WHERE subscriptions.\"subscriberUuid\" = :positionUuid "
				+ ") ORDER BY \"subscriptionUpdates\".\"createdAt\" DESC,"
				+ " \"subscriptionUpdates\".\"updatedObjectType\","
				+ " \"subscriptionUpdates\".\"updatedObjectUuid\"");
		final Query sqlQuery = MssqlSearcher.addPagination(query, getDbHandle(), sql, args);
		return new AnetBeanList<SubscriptionUpdate>(sqlQuery, query.getPageNum(), query.getPageSize(), new SubscriptionUpdateMapper(), null);
	}

}
