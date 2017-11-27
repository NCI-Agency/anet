package mil.dds.anet.beans.search;

public class LocationSearchQuery extends AbstractSearchQuery {

	public static LocationSearchQuery withText(String text, int pageNum, int pageSize) {
		LocationSearchQuery query = new LocationSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}
