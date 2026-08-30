package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Tenant;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.TenantDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
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
  private final PersonDao personDao;

  public TenantResource(AnetObjectEngine engine, AuditTrailDao auditTrailDao, TenantDao tenantDao,
      PersonDao personDao) {
    this.engine = engine;
    this.auditTrailDao = auditTrailDao;
    this.tenantDao = tenantDao;
    this.personDao = personDao;
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
  @AllowUnverifiedUsers
  public List<Tenant> getTenantList(@GraphQLRootContext GraphQLContext context) {
    return tenantDao.getAll();
  }

  @GraphQLMutation(name = "createTenant")
  public Tenant createTenant(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "tenant") Tenant t) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    final Tenant created = tenantDao.insert(t);

    // Add administrative positions
    tenantDao.addAdministrativePositions(t.getUuid(), t.getAdministrativePositions());

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

    final List<Position> existingAdministrativePositions = tenantDao
        .getAdministrativePositionsForTenant(engine.getContext(), DaoUtils.getUuid(t)).join();
    // User has to be admin or must hold an administrative position for the tenant
    if (!AuthUtils.isAdmin(user)) {
      final Position userPosition = DaoUtils.getPosition(user);
      final boolean canUpdate = existingAdministrativePositions.stream()
          .anyMatch(p -> Objects.equals(DaoUtils.getUuid(p), DaoUtils.getUuid(userPosition)));
      if (!canUpdate) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, AuthUtils.UNAUTH_MESSAGE);
      }
    }
    DaoUtils.assertObjectIsFresh(t, existing, force);

    final int numRows = tenantDao.update(t);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process tenant update");
    }

    // Update administrative positions
    if (AuthUtils.isAdmin(user) && t.getAdministrativePositions() != null) {
      Utils.addRemoveElementsByUuid(existingAdministrativePositions, t.getAdministrativePositions(),
          newPosition -> {
            tenantDao.addAdministrativePositions(t.getUuid(), List.of(newPosition));
            auditTrailDao.logUpdate(user, TenantDao.TABLE_NAME, t,
                "administrative position has been added to this tenant",
                Utils.getLinkedToDetails(PositionDao.TABLE_NAME, newPosition.getUuid()));
          }, oldPosition -> {
            tenantDao.removeAdministrativePositions(t.getUuid(),
                List.of(DaoUtils.getUuid(oldPosition)));
            auditTrailDao.logUpdate(user, TenantDao.TABLE_NAME, t,
                "administrative position has been removed from this tenant",
                Utils.getUnlinkedFromDetails(PositionDao.TABLE_NAME, oldPosition.getUuid()));
          });
    }

    final Map<String, Person> accessRequestsPendingVerification = new HashMap<>();
    // Update access requests:
    if (t.getAccessRequests() != null) {
      final List<Person> existingAccessRequests =
          tenantDao.getAccessRequestsForTenant(engine.getContext(), t.getUuid()).join();
      final Instant now = Instant.now();
      Utils.addRemoveElementsByUuid(existingAccessRequests, t.getAccessRequests(), newPerson -> {
        tenantDao.addAccessRequestToTenant(newPerson, t, now);
        auditTrailDao.logUpdate(user, TenantDao.TABLE_NAME, t,
            "access request for person has been added to this tenant",
            Utils.getLinkedToDetails(PersonDao.TABLE_NAME, newPerson.getUuid()));
      }, oldPerson -> {
        tenantDao.removeAccessRequestFromTenant(oldPerson, t);
        auditTrailDao.logUpdate(user, TenantDao.TABLE_NAME, t,
            "access request for person has been removed from this tenant",
            Utils.getLinkedToDetails(PersonDao.TABLE_NAME, oldPerson.getUuid()));
        // If oldPerson was pending verification, add them for later processing
        final Person existingPerson = personDao.getByUuid(oldPerson.getUuid());
        if (Boolean.TRUE.equals(existingPerson.getPendingVerification())) {
          accessRequestsPendingVerification.put(existingPerson.getUuid(), existingPerson);
        }
      });
    }

    // Update members:
    if (t.getMembers() != null) {
      final List<Person> existingPeople =
          tenantDao.getMembersForTenant(engine.getContext(), t.getUuid()).join();
      Utils.addRemoveElementsByUuid(existingPeople, t.getMembers(), newPerson -> {
        tenantDao.addMemberToTenant(newPerson, t);
        auditTrailDao.logUpdate(user, TenantDao.TABLE_NAME, t,
            "person has been added to this tenant",
            Utils.getLinkedToDetails(PersonDao.TABLE_NAME, newPerson.getUuid()));
        // If newPerson was previously pending verification, approve them
        if (accessRequestsPendingVerification.containsKey(newPerson.getUuid())) {
          personDao.approve(newPerson);
          auditTrailDao.logUpdate(user, PersonDao.TABLE_NAME,
              accessRequestsPendingVerification.get(newPerson.getUuid()),
              "person has been allowed access");
          accessRequestsPendingVerification.remove(newPerson.getUuid());
        }
      }, oldPerson -> {
        tenantDao.removeMemberFromTenant(oldPerson, t);
        auditTrailDao.logUpdate(user, TenantDao.TABLE_NAME, t,
            "person has been removed from this tenant",
            Utils.getUnlinkedFromDetails(PersonDao.TABLE_NAME, oldPerson.getUuid()));
      });
    }

    // If a person pending verification had their access request to this tenant denied, doesn't have
    // any other access requests, and also doesn't have any tenants, remove them
    accessRequestsPendingVerification.forEach((uuid, person) -> {
      final List<Tenant> tenants = person.loadTenants(engine.getContext()).join();
      final List<Tenant> accessRequests =
          person.loadTenantAccessRequests(engine.getContext()).join();
      if (Utils.isEmptyOrNull(tenants)
          && (Utils.isEmptyOrNull(accessRequests) || accessRequests.size() == 1)) {
        personDao.delete(uuid);
        auditTrailDao.logDelete(user, PersonDao.TABLE_NAME, person,
            "person has been denied access");
      }
    });

    // Log the change
    auditTrailDao.logUpdate(user, TenantDao.TABLE_NAME, t);
    return numRows;
  }
}
