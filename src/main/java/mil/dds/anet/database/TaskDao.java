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
			sql = "/* getAllTasks */ SELECT tasks.*, COUNT(*) OVER() AS totalCount "
					+ "FROM tasks ORDER BY createdAt ASC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else { 
			sql = "/* getAllTasks */ SELECT * from tasks ORDER BY createdAt ASC LIMIT :limit OFFSET :offset";
		}
		Query<Task> query = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum)
				.map(new TaskMapper());
		return TaskList.fromQuery(query, pageNum, pageSize);
	}
	
	@Override
	public Task getById(int id) { 
		Query<Task> query = dbHandle.createQuery("/* getTaskById */ SELECT * from tasks where id = :id")
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
		GeneratedKeys<Map<String, Object>> keys = dbHandle.createStatement("/* inserTask */ INSERT INTO tasks "
				+ "(longName, shortName, category, parentTaskId, organizationId, createdAt, updatedAt, status, "
				+ "customField, customFieldEnum, plannedCompletion, projectedCompletion) "
				+ "VALUES (:longName, :shortName, :category, :parentTaskId, :organizationId, :createdAt, :updatedAt, :status, "
				+ ":customField, :customFieldEnum, :plannedCompletion, :projectedCompletion)")
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
		return dbHandle.createStatement("/* updateTask */ UPDATE tasks set longName = :longName, shortName = :shortName, "
				+ "category = :category, parentTaskId = :parentTaskId, updatedAt = :updatedAt, "
				+ "organizationId = :organizationId, status = :status, "
				+ "customField = :customField, customFieldEnum = :customFieldEnum, "
				+ "plannedCompletion = :plannedCompletion, projectedCompletion = :projectedCompletion "
				+ "WHERE id = :id")
			.bindFromProperties(p)
			.bind("parentTaskId", DaoUtils.getId(p.getParentTask()))
			.bind("organizationId", DaoUtils.getId(p.getResponsibleOrg()))
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.execute();
	}
	
	public int setResponsibleOrgForTask(Task p, Organization org) { 
		p.setUpdatedAt(DateTime.now());
		return dbHandle.createStatement("/* setReponsibleOrgForTask */ UPDATE tasks "
				+ "SET organizationId = :orgId, updatedAt = :updatedAt WHERE id = :id")
			.bind("orgId", DaoUtils.getId(org))
			.bind("id", p.getId())
			.bind("updatedAt", p.getUpdatedAt())
			.execute();
	}
	
	public List<Task> getTasksByParentId(int parentTaskId) { 
		return dbHandle.createQuery("/* getTasksByParent */ SELECT * from tasks where parentTaskId = :parentTaskId")
			.bind("parentTaskId", parentTaskId)
			.map(new TaskMapper())
			.list();
	}
	
	/* Returns the task and all tasks under this one (to all depths) */
	public List<Task> getTaskAndChildren(int taskId) {
		StringBuilder sql = new StringBuilder("/* getTasksAndChildren */ ");
		if (DaoUtils.isMsSql(dbHandle)) { 
			sql.append("WITH");
		} else { 
			sql.append("WITH RECURSIVE");
		}
		sql.append(" parent_tasks(id, shortName, longName, category, parentTaskId, "
				+ "organizationId, createdAt, updatedAt, status,"
				+ "customField, customFieldEnum, plannedCompletion, projectedCompletion) AS ("
				+ "SELECT id, shortName, longName, category, parentTaskId, "
				+ "organizationId, createdAt, updatedAt, status, "
				+ "customField, customFieldEnum, plannedCompletion, projectedCompletion "
				+ "FROM tasks WHERE id = :taskId "
			+ "UNION ALL "
				+ "SELECT p.id, p.shortName, p.longName, p.category, p.parentTaskId, "
				+ "p.organizationId, p.createdAt, p.updatedAt, p.status, "
				+ "p.customField, p.customFieldEnum, p.plannedCompletion, p.projectedCompletion "
				+ "FROM parent_tasks pp, tasks p WHERE p.parentTaskId = pp.id "
			+ ") SELECT * from parent_tasks;");
		return dbHandle.createQuery(sql.toString())
			.bind("taskId", taskId)
			.map(new TaskMapper())
			.list();
	}

	public List<Task> getTopLevelTasks() {
		return dbHandle.createQuery("/* getTopTasks */ SELECT * FROM tasks WHERE parentTaskId IS NULL")
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
			sql = "/* getRecentTasks */ SELECT tasks.* FROM tasks WHERE tasks.id IN ("
					+ "SELECT TOP(:maxResults) reportTasks.taskId "
					+ "FROM reports JOIN reportTasks ON reports.id = reportTasks.reportId "
					+ "WHERE authorId = :authorId "
					+ "GROUP BY taskId "
					+ "ORDER BY MAX(reports.createdAt) DESC"
				+ ")";
		} else {
			sql =  "/* getRecentTask */ SELECT tasks.* FROM tasks WHERE tasks.id IN ("
					+ "SELECT reportTasks.taskId "
					+ "FROM reports JOIN reportTasks ON reports.id = reportTasks.reportId "
					+ "WHERE authorId = :authorId "
					+ "GROUP BY taskId "
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
		return dbHandle.createQuery("/* getTasksByOrg */ SELECT * from tasks WHERE organizationId = :orgId")
			.bind("orgId", orgId)
			.map(new TaskMapper())
			.list();
	}
}
