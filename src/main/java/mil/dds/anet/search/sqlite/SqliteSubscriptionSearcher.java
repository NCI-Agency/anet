package mil.dds.anet.search.sqlite;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.jdbi.v3.core.statement.Query;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionSearchQuery;
import mil.dds.anet.database.mappers.SubscriptionMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.ISubscriptionSearcher;
import mil.dds.anet.utils.DaoUtils;

public class SqliteSubscriptionSearcher extends AbstractSearcherBase implements ISubscriptionSearcher {

	@Override
	public AnetBeanList<Subscription> runSearch(SubscriptionSearchQuery query, Person user) {
		final Position position = user.loadPosition();
		final Map<String,Object> args = new HashMap<String,Object>();
		args.put("positionUuid", DaoUtils.getUuid(position));
		final StringBuilder sql = new StringBuilder("/* getSubscriptionsForPosition */ SELECT * FROM \"subscriptions\" "
				+ "WHERE \"subscriptions\".\"subscriberUuid\" = :positionUuid "
				+ "ORDER BY subscriptions.\"updatedAt\" DESC");
		sql.append(" LIMIT :limit OFFSET :offset)");
		final AnetBeanList<Subscription> result = new AnetBeanList<>(query.getPageNum(), query.getPageSize(), new ArrayList<Subscription>());

		final Query q = getDbHandle().createQuery(sql.toString())
			.bindMap(args)
			.bind("offset", query.getPageSize() * query.getPageNum())
			.bind("limit", query.getPageSize());
		final List<Subscription> list = q
				.map(new SubscriptionMapper())
				.list();
			result.setList(list);
			result.setTotalCount(list.size()); // Sqlite cannot do true total counts, so this is a crutch. 
			return result;
	}

}
