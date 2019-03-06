package mil.dds.anet.search;

import com.google.inject.Injector;

import java.util.ArrayList;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;

import com.google.common.base.Joiner;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.database.SubscriptionUpdateGroup;
import mil.dds.anet.database.SubscriptionUpdateStatement;
import mil.dds.anet.search.mssql.MssqlSearcher;
import mil.dds.anet.search.pg.PostgresqlSearcher;
import mil.dds.anet.search.sqlite.SqliteSearcher;
import mil.dds.anet.utils.DaoUtils;

public abstract class Searcher implements ISearcher {

	private final IReportSearcher reportSearcher;
	private final IPersonSearcher personSearcher;
	private final IOrganizationSearcher orgSearcher;
	private final IPositionSearcher positionSearcher;
	private final ITaskSearcher taskSearcher;
	private final ILocationSearcher locationSearcher;
	private final ITagSearcher tagSearcher;
	private final IAuthorizationGroupSearcher authorizationGroupSearcher;
	private final ISubscriptionSearcher subscriptionSearcher;
	private final ISubscriptionUpdateSearcher subscriptionUpdateSearcher;

	public static Searcher getSearcher(DaoUtils.DbType dbType, Injector injector) {
		switch (dbType) {
			case MSSQL: return new MssqlSearcher(injector);
			case SQLITE:	 return new SqliteSearcher(injector);
			case POSTGRESQL: return new PostgresqlSearcher(injector);
			default: throw new RuntimeException("No searcher found for " + dbType);
		}
	}

	protected Searcher(IReportSearcher reportSearcher, IPersonSearcher personSearcher, IOrganizationSearcher orgSearcher,
			IPositionSearcher positionSearcher, ITaskSearcher taskSearcher, ILocationSearcher locationSearcher, ITagSearcher tagSearcher,
			IAuthorizationGroupSearcher authorizationGroupSearcher, ISubscriptionSearcher subscriptionSearcher,
			ISubscriptionUpdateSearcher subscriptionUpdateSearcher) {
		super();
		this.reportSearcher = reportSearcher;
		this.personSearcher = personSearcher;
		this.orgSearcher = orgSearcher;
		this.positionSearcher = positionSearcher;
		this.taskSearcher = taskSearcher;
		this.locationSearcher = locationSearcher;
		this.tagSearcher = tagSearcher;
		this.authorizationGroupSearcher = authorizationGroupSearcher;
		this.subscriptionSearcher = subscriptionSearcher;
		this.subscriptionUpdateSearcher = subscriptionUpdateSearcher;
	}

	@Override
	public IReportSearcher getReportSearcher() {
		return reportSearcher;
	}

	@Override
	public IPersonSearcher getPersonSearcher() {
		return personSearcher;
	}

	@Override
	public IOrganizationSearcher getOrganizationSearcher() {
		return orgSearcher;
	}

	@Override
	public IPositionSearcher getPositionSearcher() {
		return positionSearcher;
	}

	@Override
	public ITaskSearcher getTaskSearcher() {
		return taskSearcher;
	}

	@Override
	public ILocationSearcher getLocationSearcher() {
		return locationSearcher;
	}

	@Override
	public ITagSearcher getTagSearcher() {
		return tagSearcher;
	}

	@Override
	public IAuthorizationGroupSearcher getAuthorizationGroupSearcher() {
		return authorizationGroupSearcher;
	}

	@Override
	public ISubscriptionSearcher getSubscriptionSearcher() {
		return subscriptionSearcher;
	}

	@Override
	public ISubscriptionUpdateSearcher getSubscriptionUpdateSearcher() {
		return subscriptionUpdateSearcher;
	}

	public static String getSubscriptionReferences(Person user, Map<String, Object> args, SubscriptionUpdateGroup subscriptionUpdate) {
		final String paramObjectTypeTpl = "objectType%1$d";
		final String stmtTpl = "( \"subscribedObjectType\" = :%1$s"
					+ " AND \"subscribedObjectUuid\" IN ( %2$s ) )";
		final List<String> stmts = new ArrayList<>();
		final ListIterator<SubscriptionUpdateStatement> iter = subscriptionUpdate.stmts.listIterator();
		while (iter.hasNext()) {
			final String objectTypeParam = String.format(paramObjectTypeTpl, iter.nextIndex());
			final SubscriptionUpdateStatement stmt = iter.next();
			if (stmt != null && stmt.sql != null && stmt.objectType != null) {
				stmts.add(String.format(stmtTpl, objectTypeParam, stmt.sql));
				args.put(objectTypeParam, stmt.objectType);
			}
		}
		final String sql = "EXISTS ( SELECT uuid FROM subscriptions WHERE "
				+ "\"subscriberUuid\" = :subscriberUuid "
				+ "AND ( " + Joiner.on(" OR ").join(stmts) + " ) )";
		final Position position = user.loadPosition();
		args.put("subscriberUuid", DaoUtils.getUuid(position));
		return sql;
	}
}
