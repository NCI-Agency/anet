package mil.dds.anet.search;

import com.google.inject.Injector;

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
			IAuthorizationGroupSearcher authorizationGroupSearcher) {
		super();
		this.reportSearcher = reportSearcher;
		this.personSearcher = personSearcher;
		this.orgSearcher = orgSearcher;
		this.positionSearcher = positionSearcher;
		this.taskSearcher = taskSearcher;
		this.locationSearcher = locationSearcher;
		this.tagSearcher = tagSearcher;
		this.authorizationGroupSearcher = authorizationGroupSearcher;
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
}
