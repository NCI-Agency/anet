package mil.dds.anet.beans.search;

public class AuthorizationGroupSearchQuery
    extends SubscribableObjectSearchQuery<AuthorizationGroupSearchSortBy> {

  public AuthorizationGroupSearchQuery() {
    super(AuthorizationGroupSearchSortBy.NAME);
  }

  @Override
  public AuthorizationGroupSearchQuery clone() throws CloneNotSupportedException {
    return (AuthorizationGroupSearchQuery) super.clone();
  }

}
