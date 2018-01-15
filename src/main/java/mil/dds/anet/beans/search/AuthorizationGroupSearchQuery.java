package mil.dds.anet.beans.search;

import mil.dds.anet.beans.AuthorizationGroup.AuthorizationGroupStatus;

public class AuthorizationGroupSearchQuery extends AbstractSearchQuery {

	private AuthorizationGroupStatus status;

	public AuthorizationGroupStatus getStatus() {
		return status;
	}

	public void setStatus(AuthorizationGroupStatus status) {
		this.status = status;
	}

	public static AuthorizationGroupSearchQuery withText(String text, int pageNum, int pageSize) {
		final AuthorizationGroupSearchQuery query = new AuthorizationGroupSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}
