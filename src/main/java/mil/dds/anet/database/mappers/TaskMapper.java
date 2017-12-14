package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Task.TaskStatus;

public class TaskMapper implements ResultSetMapper<Task> {

	@Override
	public Task map(int index, ResultSet r, StatementContext ctx) throws SQLException {
		Task p = new Task();
		p.setId(r.getInt("id"));
		p.setLongName(r.getString("longName"));
		p.setShortName(r.getString("shortName"));
		p.setCategory(r.getString("category"));
		p.setStatus(MapperUtils.getEnumIdx(r, "status", TaskStatus.class));
		
		Integer parentTaskId = MapperUtils.getInteger(r, "parentTaskId");
		if (parentTaskId != null) { 
			p.setParentTask(Task.createWithId(parentTaskId));
		}
		
		Integer responsibleOrgId = MapperUtils.getInteger(r, "organizationId");
		if (responsibleOrgId != null) { 
			p.setResponsibleOrg(Organization.createWithId(responsibleOrgId));
		}
		
		p.setCreatedAt(new DateTime(r.getTimestamp("createdAt")));
		p.setUpdatedAt(new DateTime(r.getTimestamp("updatedAt")));
		
		if (MapperUtils.containsColumnNamed(r, "totalCount")) { 
			ctx.setAttribute("totalCount", r.getInt("totalCount"));
		}
		
		return p;
	}

	
}
