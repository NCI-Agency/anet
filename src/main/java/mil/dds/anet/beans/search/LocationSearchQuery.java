package mil.dds.anet.beans.search;

public class LocationSearchQuery extends AbstractSearchQuery {

	public enum LocationSearchSortBy { CREATED_AT, NAME }

	private LocationSearchSortBy sortBy;
	private SortOrder sortOrder;

	public LocationSearchSortBy getSortBy() {
		return sortBy;
	}

	public void setSortBy(LocationSearchSortBy sortBy) {
		this.sortBy = sortBy;
	}

	public SortOrder getSortOrder() {
		return sortOrder;
	}

	public void setSortOrder(SortOrder sortOrder) {
		this.sortOrder = sortOrder;
	}

	public static LocationSearchQuery withText(String text, int pageNum, int pageSize) {
		LocationSearchQuery query = new LocationSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}
