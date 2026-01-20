package mil.dds.anet.beans.search;

public class EventSeriesSearchQuery
    extends AbstractCommonEventSearchQuery<EventSeriesSearchSortBy> {

  public EventSeriesSearchQuery() {
    super(EventSeriesSearchSortBy.NAME);
  }

  @Override
  public EventSeriesSearchQuery clone() throws CloneNotSupportedException {
    return (EventSeriesSearchQuery) super.clone();
  }
}
