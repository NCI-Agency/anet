package mil.dds.anet.database;

import java.util.List;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.sqlobject.customizers.RegisterMapper;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Task.TaskStatus;
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
					+ "FROM tasks ORDER BY \"createdAt\" ASC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else { 
			sql = "/* getAllTasks */ SELECT * from tasks ORDER BY \"createdAt\" ASC LIMIT :limit OFFSET :offset";
		}
		Query<Task> query = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum)
				.map(new TaskMapper());
		return TaskList.fromQuery(query, pageNum, pageSize);
	}

	@Deprecated
	public Task getById(int id) { 
		Query<Task> query = dbHandle.createQuery("/* getTaskById */ SELECT * from tasks where id = :id")
			.bind("id", id)
			.map(new TaskMapper());
		List<Task> results = query.list();
		if (results.size() == 0) { return null; } 
		return results.get(0);
	}

	public Task getByUuid(String uuid) {
		return dbHandle.createQuery("/* getTaskByUuid */ SELECT * from tasks where uuid = :uuid")
				.bind("uuid", uuid)
				.map(new TaskMapper())
				.first();
	}
	
	public Task insert(Task p) {
		DaoUtils.setInsertFields(p);
		dbHandle.createStatement("/* inserTask */ INSERT INTO tasks "
				+ "(uuid, \"longName\", \"shortName\", category, \"customFieldRef1Uuid\", \"organizationUuid\", \"createdAt\", \"updatedAt\", status, "
				+ "\"customField\", \"customFieldEnum1\", \"customFieldEnum2\", \"plannedCompletion\", \"projectedCompletion\") "
				+ "VALUES (:uuid, :longName, :shortName, :category, :customFieldRef1Uuid, :organizationUuid, :createdAt, :updatedAt, :status, "
				+ ":customField, :customFieldEnum1, :customFieldEnum2, :plannedCompletion, :projectedCompletion)")
			.bindFromProperties(p)
			.bind("customFieldRef1Uuid", DaoUtils.getUuid(p.getCustomFieldRef1()))
			.bind("organizationUuid", DaoUtils.getUuid(p.getResponsibleOrg()))
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.execute();
		return p;
	}
	
	public int update(Task p) { 
		DaoUtils.setUpdateFields(p);
		return dbHandle.createStatement("/* updateTask */ UPDATE tasks set \"longName\" = :longName, \"shortName\" = :shortName, "
				+ "category = :category, \"customFieldRef1Uuid\" = :customFieldRef1Uuid, \"updatedAt\" = :updatedAt, "
				+ "\"organizationUuid\" = :organizationUuid, status = :status, "
				+ "\"customField\" = :customField, \"customFieldEnum1\" = :customFieldEnum1, \"customFieldEnum2\" = :customFieldEnum2, "
				+ "\"plannedCompletion\" = :plannedCompletion, \"projectedCompletion\" = :projectedCompletion "
				+ "WHERE uuid = :uuid")
			.bindFromProperties(p)
			.bind("customFieldRef1Uuid", DaoUtils.getUuid(p.getCustomFieldRef1()))
			.bind("organizationUuid", DaoUtils.getUuid(p.getResponsibleOrg()))
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.execute();
	}
	
	public int setResponsibleOrgForTask(Task p, Organization org) { 
		DaoUtils.setUpdateFields(p);
		return dbHandle.createStatement("/* setReponsibleOrgForTask */ UPDATE tasks "
				+ "SET \"organizationUuid\" = :orgUuid, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
			.bind("orgUuid", DaoUtils.getUuid(org))
			.bind("uuid", p.getUuid())
			.bind("updatedAt", p.getUpdatedAt())
			.execute();
	}
	
	public List<Task> getTopLevelTasks() {
		return dbHandle.createQuery("/* getTopTasks */ SELECT * FROM tasks WHERE \"customFieldRef1Uuid\" IS NULL")
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
			sql = "/* getRecentTasks */ SELECT tasks.* FROM tasks WHERE tasks.status = :status AND tasks.uuid IN ("
					+ "SELECT TOP(:maxResults) \"reportTasks\".\"taskUuid\" "
					+ "FROM reports JOIN \"reportTasks\" ON reports.uuid = \"reportTasks\".\"reportUuid\" "
					+ "WHERE \"authorUuid\" = :authorUuid "
					+ "GROUP BY \"taskUuid\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC"
				+ ")";
		} else {
			sql =  "/* getRecentTask */ SELECT tasks.* FROM tasks WHERE tasks.status = :status AND tasks.uuid IN ("
					+ "SELECT \"reportTasks\".\"taskUuid\" "
					+ "FROM reports JOIN \"reportTasks\" ON reports.uuid = \"reportTasks\".\"reportUuid\" "
					+ "WHERE \"authorUuid\" = :authorUuid "
					+ "GROUP BY \"taskUuid\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC "
					+ "LIMIT :maxResults"
				+ ")";
		}
		return dbHandle.createQuery(sql)
				.bind("authorUuid", author.getUuid())
				.bind("maxResults", maxResults)
				.bind("status", DaoUtils.getEnumId(TaskStatus.ACTIVE))
				.map(new TaskMapper())
				.list();
	}

	public List<Task> getTasksByOrganizationUuid(String orgUuid) {
		return dbHandle.createQuery("/* getTasksByOrg */ SELECT * from tasks WHERE \"organizationUuid\" = :orgUuid")
			.bind("orgUuid", orgUuid)
			.map(new TaskMapper())
			.list();
	}
}
