package mil.dds.anet.search.mssql;

import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.search.IOrganizationSearcher;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.search.IPoamSearcher;
import mil.dds.anet.search.IPositionSearcher;
import mil.dds.anet.search.IReportSearcher;
import mil.dds.anet.search.ISearcher;
import mil.dds.anet.search.ITagSearcher;

public class MssqlSearcher implements ISearcher {

	MssqlReportSearcher reportSearcher;
	MssqlPersonSearcher personSearcher;
	MssqlOrganizationSearcher orgSearcher;
	MssqlPositionSearcher positionSearcher;
	MssqlPoamSearcher poamSearcher;
	MssqlLocationSearcher locationSearcher;
	private final MssqlTagSearcher tagSearcher;

	public MssqlSearcher() { 
		this.reportSearcher = new MssqlReportSearcher();
		this.personSearcher = new MssqlPersonSearcher();
		this.orgSearcher = new MssqlOrganizationSearcher();
		this.positionSearcher = new MssqlPositionSearcher();
		this.poamSearcher = new MssqlPoamSearcher();
		this.locationSearcher = new MssqlLocationSearcher();
		this.tagSearcher = new MssqlTagSearcher();
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
	public IPoamSearcher getPoamSearcher() {
		return poamSearcher;
	}

	@Override
	public ILocationSearcher getLocationSearcher() {
		return locationSearcher;
	}

	@Override
	public ITagSearcher getTagSearcher() {
		return tagSearcher;
	}

}
