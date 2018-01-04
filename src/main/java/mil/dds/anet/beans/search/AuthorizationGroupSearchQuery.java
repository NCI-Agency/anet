package mil.dds.anet.beans.search;

public class AuthorizationGroupSearchQuery extends AbstractSearchQuery {

	public enum AuthorizationGroupSearchSortBy { CREATED_AT, NAME }

	private AuthorizationGroupSearchSortBy sortBy;
	private SortOrder sortOrder;

	public AuthorizationGroupSearchSortBy getSortBy() {
		return sortBy;
	}

	public void setSortBy(AuthorizationGroupSearchSortBy sortBy) {
		this.sortBy = sortBy;
	}

	public SortOrder getSortOrder() {
		return sortOrder;
	}

	public void setSortOrder(SortOrder sortOrder) {
		this.sortOrder = sortOrder;
	}

	public static AuthorizationGroupSearchQuery withText(String text, int pageNum, int pageSize) {
		final AuthorizationGroupSearchQuery query = new AuthorizationGroupSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}
