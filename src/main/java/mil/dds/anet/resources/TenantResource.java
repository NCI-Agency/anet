package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Tenant;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.database.TenantDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class TenantResource {
  private final AnetObjectEngine engine;
  private final AuditTrailDao auditTrailDao;
  private final TenantDao tenantDao;

  public TenantResource(AnetObjectEngine engine, AuditTrailDao auditTrailDao, TenantDao tenantDao) {
    this.engine = engine;
    this.auditTrailDao = auditTrailDao;
    this.tenantDao = tenantDao;
  }

  @GraphQLQuery(name = "tenant")
  public Tenant getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    final Tenant tenant = tenantDao.getByUuid(uuid);
    if (tenant == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
    }
    return tenant;
  }

  @GraphQLQuery(name = "tenantList")
  public List<Tenant> getTenantList(@GraphQLRootContext GraphQLContext context) {
    return tenantDao.getAll();
  }

  @GraphQLMutation(name = "createTenant")
  public Tenant createTenant(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "tenant") Tenant t) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    final Tenant created = tenantDao.insert(t);

    // Log the change
    auditTrailDao.logCreate(user, TenantDao.TABLE_NAME, created);
    return created;
  }

  @GraphQLMutation(name = "updateTenant")
  public Integer updateTenant(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "tenant") Tenant t,
      @GraphQLArgument(name = "force", defaultValue = "false") boolean force) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Tenant existing = tenantDao.getByUuid(t.getUuid());
    if (existing == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
    }

    AuthUtils.assertAdministrator(user);
    DaoUtils.assertObjectIsFresh(t, existing, force);

    final int numRows = tenantDao.update(t);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process tenant update");
    }

    // Update members:
    if (t.getMembers() != null) {
      final List<Person> existingPeople =
          tenantDao.getMembersForTenant(engine.getContext(), t.getUuid()).join();
      Utils.addRemoveElementsByUuid(existingPeople, t.getMembers(),
          newPerson -> tenantDao.addMemberToTenant(newPerson, t),
          oldPerson -> tenantDao.removeMemberFromTenant(oldPerson, t));
    }

    // Log the change
    auditTrailDao.logUpdate(user, TenantDao.TABLE_NAME, t);
    return numRows;
  }
}
