package mil.dds.anet.search.sqlite;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.jdbi.v3.core.statement.Query;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import mil.dds.anet.database.mappers.SubscriptionUpdateMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.ISubscriptionUpdateSearcher;
import mil.dds.anet.utils.DaoUtils;

public class SqliteSubscriptionUpdateSearcher extends AbstractSearcherBase implements ISubscriptionUpdateSearcher {

	@Override
	public AnetBeanList<SubscriptionUpdate> runSearch(SubscriptionUpdateSearchQuery query, Person user) {
		final Position position = user.loadPosition();
		final Map<String,Object> args = new HashMap<String,Object>();
		args.put("positionUuid", DaoUtils.getUuid(position));
		final StringBuilder sql = new StringBuilder("/* getSubscriptionUpdatesForPosition */ SELECT * FROM \"subscriptionUpdates\" "
				+ "WHERE \"subscriptionUpdates\".\"subscriptionUuid\" IN ("
				+ "  SELECT uuid FROM subscriptions "
				+ "  WHERE subscriptions.\"subscriberUuid\" = :positionUuid "
				+ ") ORDER BY \"subscriptionUpdates\".\"createdAt\" DESC,"
				+ " \"subscriptionUpdates\".\"updatedObjectType\","
				+ " \"subscriptionUpdates\".\"updatedObjectUuid\"");
		sql.append(" LIMIT :limit OFFSET :offset)");
		final AnetBeanList<SubscriptionUpdate> result = new AnetBeanList<>(query.getPageNum(), query.getPageSize(), new ArrayList<SubscriptionUpdate>());

		final Query q = getDbHandle().createQuery(sql.toString())
			.bindMap(args)
			.bind("offset", query.getPageSize() * query.getPageNum())
			.bind("limit", query.getPageSize());
		final List<SubscriptionUpdate> list = q
				.map(new SubscriptionUpdateMapper())
				.list();
			result.setList(list);
			result.setTotalCount(list.size()); // Sqlite cannot do true total counts, so this is a crutch. 
			return result;
	}

}
