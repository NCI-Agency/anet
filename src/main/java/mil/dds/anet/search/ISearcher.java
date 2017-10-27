package mil.dds.anet.search;

public interface ISearcher {

	public IReportSearcher getReportSearcher();
	
	public IPersonSearcher getPersonSearcher();
	
	public IOrganizationSearcher getOrganizationSearcher();
	
	public IPositionSearcher getPositionSearcher();
	
	public IPoamSearcher getPoamSearcher();
	
	public ILocationSearcher getLocationSearcher();
	
	public ITagSearcher getTagSearcher();

}
