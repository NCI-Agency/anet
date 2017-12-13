package mil.dds.anet.database;

import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.sqlobject.customizers.RegisterMapper;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.TaskList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.utils.DaoUtils;

@RegisterMapper(TaskMapper.class)
public class TaskDao implements IAnetDao<Task> {

	Handle dbHandle;
	
	public TaskDao(Handle h) { 
		this.dbHandle = h; 
	}
	
	public TaskList getAll(int pageNum, int pageSize) { 
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) { 
			sql = "/* getAllTasks */ SELECT poams.*, COUNT(*) OVER() AS totalCount "
					+ "FROM poams ORDER BY createdAt ASC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else { 
			sql = "/* getAllTasks */ SELECT * from poams ORDER BY createdAt ASC LIMIT :limit OFFSET :offset";
		}
		Query<Task> query = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum)
				.map(new TaskMapper());
		return TaskList.fromQuery(query, pageNum, pageSize);
	}
	
	@Override
	public Task getById(int id) { 
		Query<Task> query = dbHandle.createQuery("/* getTaskById */ SELECT * from poams where id = :id")
			.bind("id",id)
			.map(new TaskMapper());
		List<Task> results = query.list();
		if (results.size() == 0) { return null; } 
		return results.get(0);
	}
	
	@Override
	public Task insert(Task p) {
		p.setCreatedAt(DateTime.now());
		p.setUpdatedAt(DateTime.now());
		GeneratedKeys<Map<String, Object>> keys = dbHandle.createStatement("/* inserTask */ INSERT INTO poams "
				+ "(longName, shortName, category, parentPoamId, organizationId, createdAt, updatedAt, status) " 
				+ "VALUES (:longName, :shortName, :category, :parentTaskId, :organizationId, :createdAt, :updatedAt, :status)")
			.bindFromProperties(p)
			.bind("parentTaskId", DaoUtils.getId(p.getParentTask()))
			.bind("organizationId", DaoUtils.getId(p.getResponsibleOrg()))
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.executeAndReturnGeneratedKeys();
		p.setId(DaoUtils.getGeneratedId(keys));
		return p;
	}
	
	@Override
	public int update(Task p) { 
		p.setUpdatedAt(DateTime.now());
		return dbHandle.createStatement("/* updateTask */ UPDATE poams set longName = :longName, shortName = :shortName, "
				+ "category = :category, parentPoamId = :parentTaskId, updatedAt = :updatedAt, "
				+ "organizationId = :organizationId, status = :status " 
				+ "WHERE id = :id")
			.bindFromProperties(p)
			.bind("parentTaskId", DaoUtils.getId(p.getParentTask()))
			.bind("organizationId", DaoUtils.getId(p.getResponsibleOrg()))
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.execute();
	}
	
	public int setResponsibleOrgForTask(Task p, Organization org) { 
		p.setUpdatedAt(DateTime.now());
		return dbHandle.createStatement("/* setReponsibleOrgForTask */ UPDATE poams "
				+ "SET organizationId = :orgId, updatedAt = :updatedAt WHERE id = :id")
			.bind("orgId", DaoUtils.getId(org))
			.bind("id", p.getId())
			.bind("updatedAt", p.getUpdatedAt())
			.execute();
	}
	
	public List<Task> getTasksByParentId(int parentTaskId) { 
		return dbHandle.createQuery("/* getTasksByParent */ SELECT * from poams where parentPoamId = :parentTaskId")
			.bind("parentTaskId", parentTaskId)
			.map(new TaskMapper())
			.list();
	}
	
	/* Returns the poam and all tasks under this one (to all depths) */
	public List<Task> getTaskAndChildren(int taskId) {
		StringBuilder sql = new StringBuilder("/* getTasksAndChildren */ ");
		if (DaoUtils.isMsSql(dbHandle)) { 
			sql.append("WITH");
		} else { 
			sql.append("WITH RECURSIVE");
		}
		sql.append(" parent_poams(id, shortName, longName, category, parentPoamId, "
				+ "organizationId, createdAt, updatedAt, status) AS ("
				+ "SELECT id, shortName, longName, category, parentPoamId, "
				+ "organizationId, createdAt, updatedAt, status FROM poams WHERE id = :taskId "
			+ "UNION ALL "
				+ "SELECT p.id, p.shortName, p.longName, p.category, p.parentPoamId, p.organizationId, p.createdAt, p.updatedAt, p.status "
				+ "from parent_poams pp, poams p WHERE p.parentPoamId = pp.id "
			+ ") SELECT * from parent_poams;");
		return dbHandle.createQuery(sql.toString())
			.bind("taskId", taskId)
			.map(new TaskMapper())
			.list();
	}

	public List<Task> getTopLevelTasks() {
		return dbHandle.createQuery("/* getTopTasks */ SELECT * FROM poams WHERE parentPoamId IS NULL")
			.map(new TaskMapper())
			.list();
	}

	public TaskList search(TaskSearchQuery query) { 
		return AnetObjectEngine.getInstance().getSearcher()
				.getTaskSearcher().runSearch(query, dbHandle);
	}
	
	public List<Task> getRecentTasks(Person author, int maxResults) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* getRecentTasks */ SELECT poams.* FROM poams WHERE poams.id IN ("
					+ "SELECT TOP(:maxResults) reportPoams.poamId "
					+ "FROM reports JOIN reportPoams ON reports.id = reportPoams.reportId "
					+ "WHERE authorId = :authorId "
					+ "GROUP BY poamId "
					+ "ORDER BY MAX(reports.createdAt) DESC"
				+ ")";
		} else {
			sql =  "/* getRecentPoam */ SELECT poams.* FROM poams WHERE poams.id IN ("
					+ "SELECT reportPoams.poamId "
					+ "FROM reports JOIN reportPoams ON reports.id = reportPoams.reportId "
					+ "WHERE authorId = :authorId "
					+ "GROUP BY poamId "
					+ "ORDER BY MAX(reports.createdAt) DESC "
					+ "LIMIT :maxResults"
				+ ")";
		}
		return dbHandle.createQuery(sql)
				.bind("authorId", author.getId())
				.bind("maxResults", maxResults)
				.map(new TaskMapper())
				.list();
	}

	public List<Task> getTasksByOrganizationId(Integer orgId) {
		return dbHandle.createQuery("/* getTasksByOrg */ SELECT * from poams WHERE organizationId = :orgId")
			.bind("orgId", orgId)
			.map(new TaskMapper())
			.list();
	}
}
