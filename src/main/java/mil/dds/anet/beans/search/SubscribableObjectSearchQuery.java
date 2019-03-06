package mil.dds.anet.beans.search;

public abstract class SubscribableObjectSearchQuery extends AbstractSearchQuery {

	private Boolean subscribed;

	public boolean getSubscribed() {
		return Boolean.TRUE.equals(subscribed);
	}

	public void setSubscribed(Boolean subscribed) {
		this.subscribed = subscribed;
	}

}
