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
import mil.dds.anet.beans.Task.TaskStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.utils.DaoUtils;

@RegisterMapper(TaskMapper.class)
public class TaskDao implements IAnetDao<Task> {

	private final Handle dbHandle;
	private final IdBatcher<Task> idBatcher;

	public TaskDao(Handle h) { 
		this.dbHandle = h; 
		final String idBatcherSql = "/* batch.getTasksByIds */ SELECT * from tasks where id IN ( %1$s )";
		this.idBatcher = new IdBatcher<Task>(h, idBatcherSql, new TaskMapper());
	}
	
	public AnetBeanList<Task> getAll(int pageNum, int pageSize) {
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
		return new AnetBeanList<Task>(query, pageNum, pageSize, null);
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
	public List<Task> getByIds(List<Integer> ids) {
		return idBatcher.getByIds(ids);
	}

	@Override
	public Task insert(Task p) {
		p.setCreatedAt(DateTime.now());
		p.setUpdatedAt(DateTime.now());
		GeneratedKeys<Map<String, Object>> keys = dbHandle.createStatement("/* inserTask */ INSERT INTO tasks "
				+ "(\"longName\", \"shortName\", category, \"customFieldRef1Id\", \"organizationId\", \"createdAt\", \"updatedAt\", status, "
				+ "\"customField\", \"customFieldEnum1\", \"customFieldEnum2\", \"plannedCompletion\", \"projectedCompletion\") "
				+ "VALUES (:longName, :shortName, :category, :customFieldRef1Id, :organizationId, :createdAt, :updatedAt, :status, "
				+ ":customField, :customFieldEnum1, :customFieldEnum2, :plannedCompletion, :projectedCompletion)")
			.bindFromProperties(p)
			.bind("customFieldRef1Id", DaoUtils.getId(p.getCustomFieldRef1()))
			.bind("organizationId", DaoUtils.getId(p.getResponsibleOrg()))
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.executeAndReturnGeneratedKeys();
		p.setId(DaoUtils.getGeneratedId(keys));
		return p;
	}
	
	@Override
	public int update(Task p) { 
		p.setUpdatedAt(DateTime.now());
		return dbHandle.createStatement("/* updateTask */ UPDATE tasks set \"longName\" = :longName, \"shortName\" = :shortName, "
				+ "category = :category, \"customFieldRef1Id\" = :customFieldRef1Id, \"updatedAt\" = :updatedAt, "
				+ "\"organizationId\" = :organizationId, status = :status, "
				+ "\"customField\" = :customField, \"customFieldEnum1\" = :customFieldEnum1, \"customFieldEnum2\" = :customFieldEnum2, "
				+ "\"plannedCompletion\" = :plannedCompletion, \"projectedCompletion\" = :projectedCompletion "
				+ "WHERE id = :id")
			.bindFromProperties(p)
			.bind("customFieldRef1Id", DaoUtils.getId(p.getCustomFieldRef1()))
			.bind("organizationId", DaoUtils.getId(p.getResponsibleOrg()))
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.execute();
	}
	
	public int setResponsibleOrgForTask(Task p, Organization org) { 
		p.setUpdatedAt(DateTime.now());
		return dbHandle.createStatement("/* setReponsibleOrgForTask */ UPDATE tasks "
				+ "SET \"organizationId\" = :orgId, \"updatedAt\" = :updatedAt WHERE id = :id")
			.bind("orgId", DaoUtils.getId(org))
			.bind("id", p.getId())
			.bind("updatedAt", p.getUpdatedAt())
			.execute();
	}
	
	public List<Task> getTopLevelTasks() {
		return dbHandle.createQuery("/* getTopTasks */ SELECT * FROM tasks WHERE \"customFieldRef1Id\" IS NULL")
			.map(new TaskMapper())
			.list();
	}

	public AnetBeanList<Task> search(TaskSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getTaskSearcher().runSearch(query, dbHandle);
	}
	
	public List<Task> getRecentTasks(Person author, int maxResults) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* getRecentTasks */ SELECT tasks.* FROM tasks WHERE tasks.status = :status AND tasks.id IN ("
					+ "SELECT TOP(:maxResults) \"reportTasks\".\"taskId\" "
					+ "FROM reports JOIN \"reportTasks\" ON reports.id = \"reportTasks\".\"reportId\" "
					+ "WHERE \"authorId\" = :authorId "
					+ "GROUP BY \"taskId\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC"
				+ ")";
		} else {
			sql =  "/* getRecentTask */ SELECT tasks.* FROM tasks WHERE tasks.status = :status AND tasks.id IN ("
					+ "SELECT \"reportTasks\".\"taskId\" "
					+ "FROM reports JOIN \"reportTasks\" ON reports.id = \"reportTasks\".\"reportId\" "
					+ "WHERE \"authorId\" = :authorId "
					+ "GROUP BY \"taskId\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC "
					+ "LIMIT :maxResults"
				+ ")";
		}
		return dbHandle.createQuery(sql)
				.bind("authorId", author.getId())
				.bind("maxResults", maxResults)
				.bind("status", DaoUtils.getEnumId(TaskStatus.ACTIVE))
				.map(new TaskMapper())
				.list();
	}

	public List<Task> getTasksByOrganizationId(Integer orgId) {
		return dbHandle.createQuery("/* getTasksByOrg */ SELECT * from tasks WHERE \"organizationId\" = :orgId")
			.bind("orgId", orgId)
			.map(new TaskMapper())
			.list();
	}
}
