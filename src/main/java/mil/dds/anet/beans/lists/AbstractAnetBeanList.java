package mil.dds.anet.beans.lists;

import java.util.List;

import org.skife.jdbi.v2.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Poam;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.graphql.IGraphQLBean;

public abstract class AbstractAnetBeanList<T extends IGraphQLBean> implements IGraphQLBean {

	private static final Logger LOGGER = LoggerFactory.getLogger(AbstractAnetBeanList.class);

	List<T> list;
	Integer pageNum;
	Integer pageSize;
	Integer totalCount;
	
	public AbstractAnetBeanList() { /*Serialization Constructor */ } 
	
	protected AbstractAnetBeanList(List<T> list) {
		this(null, null, list);
		this.totalCount = list.size();
	}
	
	protected AbstractAnetBeanList(Integer pageNum, Integer pageSize, List<T> list) {
		this.pageNum = pageNum;
		this.pageSize = pageSize;
		this.list = list;
	}

	protected AbstractAnetBeanList(Query<T> query, int pageNum, int pageSize, Long manualRowCount) {
		this(pageNum, pageSize, query.list());
		int resultSize = getList().size();
		if (manualRowCount != null) {
			setTotalCount(manualRowCount.intValue());
		} else if (resultSize == 0) {
			setTotalCount(0);
		} else {
			LOGGER.debug("Bulk query context attributes are {}", query.getContext().getAttributes());
			Integer foundCount = (Integer) query.getContext().getAttribute("totalCount");
			setTotalCount(foundCount == null ? resultSize : foundCount);
		}
	}

	public List<T> getList() {
		return list;
	}
	
	public void setList(List<T> list) {
		this.list = list;
	}
	
	public Integer getPageNum() {
		return pageNum;
	}
	
	public void setPageNum(Integer pageNum) {
		this.pageNum = pageNum;
	}
	
	public Integer getPageSize() {
		return pageSize;
	}
	
	public void setPageSize(Integer pageSize) {
		this.pageSize = pageSize;
	}
	
	public Integer getTotalCount() {
		return totalCount;
	}
	
	public void setTotalCount(Integer totalCount) {
		this.totalCount = totalCount;
	}
	
	/* Because of Java Type Erasure we actually have to have the 
	 * getList() method live on every implementation of the List
	 */
	public static class ReportList extends AbstractAnetBeanList<Report> {
		public ReportList() { /*Serialization Constructor */ } 
		
		public ReportList(Query<Report> query, int pageNum, int pageSize, Long manualRowCount) {
			super(query, pageNum, pageSize, manualRowCount);
		}

		public List<Report> getList() {
			return list; 
		}

		public static ReportList fromQuery(Person user, Query<Report> query, int pageNum, int pageSize, Long manualRowCount) {
			ReportList results = new ReportList(query, pageNum, pageSize, manualRowCount);
			for (final Report report : results.getList()) {
				report.setUser(user);
			}
			return results;
		}

		public static ReportList fromQuery(Person user, Query<Report> query, int pageNum, int pageSize) {
			return fromQuery(user, query, pageNum, pageSize, null);
		}
	}
	
	public static class PersonList extends AbstractAnetBeanList<Person> {
		public PersonList() { /*Serialization Constructor */ } 

		public PersonList(Query<Person> query, int pageNum, int pageSize, Long manualRowCount) {
			super(query, pageNum, pageSize, manualRowCount);
		}

		public PersonList(List<Person> list) { 
			super(list);
		}

		public List<Person> getList() {
			return list; 
		}

		public static PersonList fromQuery(Query<Person> query, int pageNum, int pageSize) {
			return fromQuery(query, pageNum, pageSize, null);
		}

		public static PersonList fromQuery(Query<Person> query, int pageNum, int pageSize, Long manualCount) {
			return new PersonList(query, pageNum, pageSize, manualCount);
		}
	}
	
	public static class OrganizationList extends AbstractAnetBeanList<Organization> {
		public OrganizationList() { /*Serialization Constructor */ } 
		
		public OrganizationList(Query<Organization> query, int pageNum, int pageSize, Long manualRowCount) {
			super(query, pageNum, pageSize, manualRowCount);
		}

		public OrganizationList(Integer pageNum, Integer pageSize, List<Organization> list) {
			super(pageNum, pageSize, list);
		}
		
		public OrganizationList(List<Organization> list) { 
			super(list);
		}
		
		public List<Organization> getList() {
			return list;
		}

		public static OrganizationList fromQuery(Query<Organization> query, int pageNum, int pageSize, Long manualRowCount) {
			return new OrganizationList(query, pageNum, pageSize, manualRowCount);
		}

		public static OrganizationList fromQuery(Query<Organization> query, int pageNum, int pageSize) { 
			return fromQuery(query, pageNum, pageSize, null);
		}
	}
	
	public static class PositionList extends AbstractAnetBeanList<Position> {
		public PositionList() { /*Serialization Constructor */ } 
		
		public PositionList(Query<Position> query, Integer pageNum, Integer pageSize, Long manualRowCount) {
			super(query, pageNum, pageSize, manualRowCount);
		}
		
		public PositionList(List<Position> list) { 
			super(list);
		}
		
		public List<Position> getList() {
			return list;
		}
		
		public static PositionList fromQuery(Query<Position> query, int pageNum, int pageSize) {
			return fromQuery(query, pageNum, pageSize, null);
		}

		public static PositionList fromQuery(Query<Position> query, int pageNum, int pageSize, Long manualRowCount) {
			return new PositionList(query, pageNum, pageSize, manualRowCount);
		}
	}
	
	public static class PoamList extends AbstractAnetBeanList<Poam> {
		public PoamList() { /*Serialization Constructor */ } 
		
		public PoamList(Integer pageNum, Integer pageSize, List<Poam> list) {
			super(pageNum, pageSize, list);
		}
		
		public PoamList(List<Poam> list) { 
			super(list);
		}
		
		public List<Poam> getList() {
			return list;
		}
		
		public static PoamList fromQuery(Query<Poam> query, int pageNum, int pageSize) { 
			PoamList results = new PoamList(pageNum, pageSize, query.list());
			results.setList(query.list());
			if (results.getList().size() == 0) { 
				results.setTotalCount(0);
			} else {
				//This value gets set by the PoamMapper on each row.
				results.setTotalCount((Integer) query.getContext().getAttribute("totalCount"));
			}
			return results;
		}
	}
	
	public static class LocationList extends AbstractAnetBeanList<Location> {
		public LocationList() { /*Serialization Constructor */ }
		
		public LocationList(Integer pageNum, Integer pageSize, List<Location> list) {
			super(pageNum, pageSize, list);
		}
		
		public LocationList(List<Location> list) { 
			super(list);
		}
		
		public List<Location> getList() {
			return list;
		}
		
		public static LocationList fromQuery(Query<Location> query, int pageNum, int pageSize) { 
			LocationList results = new LocationList(pageNum, pageSize, query.list());
			results.setList(query.list());
			if (results.getList().size() == 0) { 
				results.setTotalCount(0);
			} else {
				//This value gets set by the LocationMapper on each row.
				results.setTotalCount((Integer) query.getContext().getAttribute("totalCount"));
			}
			return results;
		}
	}

	public static class TagList extends AbstractAnetBeanList<Tag> {
		public TagList() { /*Serialization Constructor */ }

		public TagList(Integer pageNum, Integer pageSize, List<Tag> list) {
			super(pageNum, pageSize, list);
		}

		public TagList(List<Tag> list) {
			super(list);
		}

		public List<Tag> getList() {
			return list;
		}

		public static TagList fromQuery(Query<Tag> query, int pageNum, int pageSize) {
			final TagList results = new TagList(pageNum, pageSize, query.list());
			results.setList(query.list());
			if (results.getList().size() == 0) {
				results.setTotalCount(0);
			} else {
				// This value gets set by the TagMapper on each row.
				results.setTotalCount((Integer) query.getContext().getAttribute("totalCount"));
			}
			return results;
		}
	}

}
