package mil.dds.anet.resources;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import javax.annotation.security.PermitAll;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.jdbi.v3.core.statement.UnableToExecuteStatementException;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.database.SubscriptionDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;

@PermitAll
public class SubscriptionResource {

	private SubscriptionDao dao;

	public SubscriptionResource(AnetObjectEngine engine) {
		this.dao = engine.getSubscriptionDao();
	}

	@GraphQLMutation(name="createSubscription")
	public Subscription createSubscription(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="subscription") Subscription s) {
		final Person user = DaoUtils.getUserFromContext(context);
		final Position position = user.loadPosition();
		checkSubscriber(position);
		s.setSubscriberUuid(DaoUtils.getUuid(position));
		try {
			s = dao.insert(s);
			AnetAuditLogger.log("Subscription {} created by {}", s, user);
			return s;
		} catch (UnableToExecuteStatementException e) {
			throw ResponseUtils.handleSqlException(e, "Your position is already subscribed");
		}
	}

	@GraphQLMutation(name="deleteSubscription")
	public Integer deleteSubscription(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="uuid") String subscriptionUuid) {
		final Subscription s = dao.getByUuid(subscriptionUuid);
		if (s == null) {
			throw new WebApplicationException("Subscription not found", Status.NOT_FOUND);
		}
		final Person user = DaoUtils.getUserFromContext(context);
		checkPermission(s, user);
		final int numRows = dao.delete(subscriptionUuid);
		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process subscription delete", Status.NOT_FOUND);
		}
		AnetAuditLogger.log("Subscription {} deleted by {}", s, user);
		// GraphQL mutations *have* to return something, so we return the number of deleted rows
		return numRows;
	}

	@GraphQLQuery(name="mySubscriptions")
	public CompletableFuture<List<Subscription>> getMySubscriptions(@GraphQLRootContext Map<String, Object> context) {
		final Person user = DaoUtils.getUserFromContext(context);
		final Position position = user.loadPosition();
		return dao.getSubscriptionsForPosition(context, DaoUtils.getUuid(position));
	}

	private void checkPermission(Subscription s, Person user) {
		final Position position = user.loadPosition();
		if (!s.getSubscriberUuid().equals(DaoUtils.getUuid(position)) && !AuthUtils.isAdmin(user)) {
			throw new WebApplicationException("Only the subscriber or an admin can do this", Status.FORBIDDEN);
		}
	}

	private void checkSubscriber(Position position) {
		if (DaoUtils.getUuid(position) == null) {
			throw new WebApplicationException("User must have a current position to subscribe", Status.BAD_REQUEST);
		}
	}

}
