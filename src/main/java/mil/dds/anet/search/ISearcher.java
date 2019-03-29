package mil.dds.anet.search;

public interface ISearcher {

  public IReportSearcher getReportSearcher();

  public IPersonSearcher getPersonSearcher();

  public IOrganizationSearcher getOrganizationSearcher();

  public IPositionSearcher getPositionSearcher();

  public ITaskSearcher getTaskSearcher();

  public ILocationSearcher getLocationSearcher();

  public ITagSearcher getTagSearcher();

  public IAuthorizationGroupSearcher getAuthorizationGroupSearcher();

  public ISubscriptionSearcher getSubscriptionSearcher();

  public ISubscriptionUpdateSearcher getSubscriptionUpdateSearcher();

}
