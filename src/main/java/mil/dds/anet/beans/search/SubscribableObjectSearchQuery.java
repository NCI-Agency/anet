package mil.dds.anet.beans.search;

public abstract class SubscribableObjectSearchQuery<T extends ISortBy>
    extends AbstractSearchQuery<T> {

  public SubscribableObjectSearchQuery(T defaultSortBy) {
    super(defaultSortBy);
  }

  private Boolean subscribed;

  public boolean getSubscribed() {
    return Boolean.TRUE.equals(subscribed);
  }

  public void setSubscribed(Boolean subscribed) {
    this.subscribed = subscribed;
  }

}
