package mil.dds.anet.search.mssql;

import java.util.HashMap;
import java.util.Map;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.SubscriptionMapper;
import mil.dds.anet.beans.search.SubscriptionSearchQuery;
import mil.dds.anet.search.ISubscriptionSearcher;
import mil.dds.anet.utils.DaoUtils;

public class MssqlSubscriptionSearcher implements ISubscriptionSearcher {

	@Override
	public AnetBeanList<Subscription> runSearch(SubscriptionSearchQuery query, Handle dbHandle, Person user) {
		final Position position = user.loadPosition();
		final Map<String,Object> args = new HashMap<String,Object>();
		args.put("positionUuid", DaoUtils.getUuid(position));
		final StringBuilder sql = new StringBuilder("/* getSubscriptionsForPosition */ SELECT *"
				+ ", count(*) over() as totalCount"
				+ " FROM \"subscriptions\" "
				+ "WHERE \"subscriptions\".\"subscriberUuid\" = :positionUuid "
				+ "ORDER BY subscriptions.\"updatedAt\" DESC");
		final Query sqlQuery = MssqlSearcher.addPagination(query, AnetObjectEngine.getInstance().getDbHandle(), sql, args);
		return new AnetBeanList<Subscription>(sqlQuery, query.getPageNum(), query.getPageSize(), new SubscriptionMapper(), null);
	}

}
