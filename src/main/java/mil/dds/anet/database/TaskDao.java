package mil.dds.anet.database;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Task.TaskStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.utils.DaoUtils;

@RegisterRowMapper(TaskMapper.class)
public class TaskDao extends AnetBaseDao<Task> {

	private final IdBatcher<Task> idBatcher;

	public TaskDao(Handle h) { 
		super(h, "Tasks", "tasks", "*", null);
		final String idBatcherSql = "/* batch.getTasksByUuids */ SELECT * from tasks where uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<Task>(h, idBatcherSql, "uuids", new TaskMapper());
	}
	
	public AnetBeanList<Task> getAll(int pageNum, int pageSize) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) { 
			sql = "/* getAllTasks */ SELECT tasks.*, COUNT(*) OVER() AS totalCount "
					+ "FROM tasks ORDER BY \"createdAt\" ASC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else { 
			sql = "/* getAllTasks */ SELECT * from tasks ORDER BY \"createdAt\" ASC LIMIT :limit OFFSET :offset";
		}
		final Query query = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum);
		return new AnetBeanList<Task>(query, pageNum, pageSize, new TaskMapper(), null);
	}

	public Task getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	@Override
	public List<Task> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	@Override
	public Task insertInternal(Task p) {
		dbHandle.createUpdate("/* insertTask */ INSERT INTO tasks "
				+ "(uuid, \"longName\", \"shortName\", category, \"customFieldRef1Uuid\", \"organizationUuid\", \"createdAt\", \"updatedAt\", status, "
				+ "\"customField\", \"customFieldEnum1\", \"customFieldEnum2\", \"plannedCompletion\", \"projectedCompletion\") "
				+ "VALUES (:uuid, :longName, :shortName, :category, :customFieldRef1Uuid, :responsibleOrgUuid, :createdAt, :updatedAt, :status, "
				+ ":customField, :customFieldEnum1, :customFieldEnum2, :plannedCompletion, :projectedCompletion)")
			.bindBean(p)
			.bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
			.bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
			.bind("plannedCompletion", DaoUtils.asLocalDateTime(p.getPlannedCompletion()))
			.bind("projectedCompletion", DaoUtils.asLocalDateTime(p.getProjectedCompletion()))
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.execute();
		return p;
	}

	@Override
	public int updateInternal(Task p) {
		return dbHandle.createUpdate("/* updateTask */ UPDATE tasks set \"longName\" = :longName, \"shortName\" = :shortName, "
				+ "category = :category, \"customFieldRef1Uuid\" = :customFieldRef1Uuid, \"updatedAt\" = :updatedAt, "
				+ "\"organizationUuid\" = :responsibleOrgUuid, status = :status, "
				+ "\"customField\" = :customField, \"customFieldEnum1\" = :customFieldEnum1, \"customFieldEnum2\" = :customFieldEnum2, "
				+ "\"plannedCompletion\" = :plannedCompletion, \"projectedCompletion\" = :projectedCompletion "
				+ "WHERE uuid = :uuid")
			.bindBean(p)
			.bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
			.bind("plannedCompletion", DaoUtils.asLocalDateTime(p.getPlannedCompletion()))
			.bind("projectedCompletion", DaoUtils.asLocalDateTime(p.getProjectedCompletion()))
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.execute();
	}

	@Override
	public int deleteInternal(String uuid) {
		throw new UnsupportedOperationException();
	}

	public int setResponsibleOrgForTask(String taskUuid, String organizationUuid) {
		return dbHandle.createUpdate("/* setReponsibleOrgForTask */ UPDATE tasks "
				+ "SET \"organizationUuid\" = :orgUuid, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
			.bind("orgUuid", organizationUuid)
			.bind("uuid", taskUuid)
			.bind("updatedAt", DaoUtils.asLocalDateTime(Instant.now()))
			.execute();
	}
	
	public List<Task> getTopLevelTasks() {
		return dbHandle.createQuery("/* getTopTasks */ SELECT * FROM tasks WHERE \"customFieldRef1Uuid\" IS NULL")
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
