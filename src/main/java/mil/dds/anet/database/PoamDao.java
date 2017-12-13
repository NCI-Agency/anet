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
import mil.dds.anet.beans.Poam;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.TaskList;
import mil.dds.anet.beans.search.PoamSearchQuery;
import mil.dds.anet.database.mappers.PoamMapper;
import mil.dds.anet.utils.DaoUtils;

@RegisterMapper(PoamMapper.class)
public class PoamDao implements IAnetDao<Poam> {

	Handle dbHandle;
	
	public PoamDao(Handle h) { 
		this.dbHandle = h; 
	}
	
	public TaskList getAll(int pageNum, int pageSize) { 
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) { 
			sql = "/* getAllPoams */ SELECT poams.*, COUNT(*) OVER() AS totalCount "
					+ "FROM poams ORDER BY createdAt ASC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else { 
			sql = "/* getAllPoams */ SELECT * from poams ORDER BY createdAt ASC LIMIT :limit OFFSET :offset";
		}
		Query<Poam> query = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum)
				.map(new PoamMapper());
		return TaskList.fromQuery(query, pageNum, pageSize);
	}
	
	@Override
	public Poam getById(int id) { 
		Query<Poam> query = dbHandle.createQuery("/* getPoamById */ SELECT * from poams where id = :id")
			.bind("id",id)
			.map(new PoamMapper());
		List<Poam> results = query.list();
		if (results.size() == 0) { return null; } 
		return results.get(0);
	}
	
	@Override
	public Poam insert(Poam p) {
		p.setCreatedAt(DateTime.now());
		p.setUpdatedAt(DateTime.now());
		GeneratedKeys<Map<String, Object>> keys = dbHandle.createStatement("/* inserPoam */ INSERT INTO poams "
				+ "(longName, shortName, category, parentPoamId, organizationId, createdAt, updatedAt, status) " 
				+ "VALUES (:longName, :shortName, :category, :parentPoamId, :organizationId, :createdAt, :updatedAt, :status)")
			.bindFromProperties(p)
			.bind("parentPoamId", DaoUtils.getId(p.getParentPoam()))
			.bind("organizationId", DaoUtils.getId(p.getResponsibleOrg()))
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.executeAndReturnGeneratedKeys();
		p.setId(DaoUtils.getGeneratedId(keys));
		return p;
	}
	
	@Override
	public int update(Poam p) { 
		p.setUpdatedAt(DateTime.now());
		return dbHandle.createStatement("/* updatePoam */ UPDATE poams set longName = :longName, shortName = :shortName, "
				+ "category = :category, parentPoamId = :parentPoamId, updatedAt = :updatedAt, "
				+ "organizationId = :organizationId, status = :status " 
				+ "WHERE id = :id")
			.bindFromProperties(p)
			.bind("parentPoamId", DaoUtils.getId(p.getParentPoam()))
			.bind("organizationId", DaoUtils.getId(p.getResponsibleOrg()))
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.execute();
	}
	
	public int setResponsibleOrgForPoam(Poam p, Organization org) { 
		p.setUpdatedAt(DateTime.now());
		return dbHandle.createStatement("/* setReponsibleOrgForPoam */ UPDATE poams "
				+ "SET organizationId = :orgId, updatedAt = :updatedAt WHERE id = :id")
			.bind("orgId", DaoUtils.getId(org))
			.bind("id", p.getId())
			.bind("updatedAt", p.getUpdatedAt())
			.execute();
	}
	
	public List<Poam> getPoamsByParentId(int parentPoamId) { 
		return dbHandle.createQuery("/* getPoamsByParent */ SELECT * from poams where parentPoamId = :parentPoamId")
			.bind("parentPoamId", parentPoamId)
			.map(new PoamMapper())
			.list();
	}
	
	/* Returns the poam and all poams under this one (to all depths) */
	public List<Poam> getPoamAndChildren(int poamId) {
		StringBuilder sql = new StringBuilder("/* getPoamsAndChildren */ ");
		if (DaoUtils.isMsSql(dbHandle)) { 
			sql.append("WITH");
		} else { 
			sql.append("WITH RECURSIVE");
		}
		sql.append(" parent_poams(id, shortName, longName, category, parentPoamId, "
				+ "organizationId, createdAt, updatedAt, status) AS ("
				+ "SELECT id, shortName, longName, category, parentPoamId, "
				+ "organizationId, createdAt, updatedAt, status FROM poams WHERE id = :poamId "
			+ "UNION ALL "
				+ "SELECT p.id, p.shortName, p.longName, p.category, p.parentPoamId, p.organizationId, p.createdAt, p.updatedAt, p.status "
				+ "from parent_poams pp, poams p WHERE p.parentPoamId = pp.id "
			+ ") SELECT * from parent_poams;");
		return dbHandle.createQuery(sql.toString())
			.bind("poamId", poamId)
			.map(new PoamMapper())
			.list();
	}

	public List<Poam> getTopLevelPoams() {
		return dbHandle.createQuery("/* getTopPoams */ SELECT * FROM poams WHERE parentPoamId IS NULL")
			.map(new PoamMapper())
			.list();
	}

	public TaskList search(PoamSearchQuery query) { 
		return AnetObjectEngine.getInstance().getSearcher()
				.getPoamSearcher().runSearch(query, dbHandle);
	}
	
	public List<Poam> getRecentPoams(Person author, int maxResults) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* getRecentPoams */ SELECT poams.* FROM poams WHERE poams.id IN ("
					+ "SELECT TOP(:maxResults) reportPoams.poamId "
					+ "FROM reports JOIN reportPoams ON reports.id = reportPoams.reportId "
					+ "WHERE authorId = :authorId "
					+ "GROUP BY poamId "
					+ "ORDER BY MAX(reports.createdAt) DESC"
				+ ")";
		} else {
			sql =  "/* getRecentPoams */ SELECT poams.* FROM poams WHERE poams.id IN ("
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
				.map(new PoamMapper())
				.list();
	}

	public List<Poam> getPoamsByOrganizationId(Integer orgId) {
		return dbHandle.createQuery("/* getPoamsByOrg */ SELECT * from poams WHERE organizationId = :orgId")
			.bind("orgId", orgId)
			.map(new PoamMapper())
			.list();
	}
}
