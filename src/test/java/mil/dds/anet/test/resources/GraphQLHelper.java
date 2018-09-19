package mil.dds.anet.test.resources;

import javax.ws.rs.client.Client;
import javax.ws.rs.core.GenericType;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.views.AbstractAnetBean;

public final class GraphQLHelper<T extends AbstractAnetBean, S extends AbstractSearchQuery> {

	private static final String getWithParamFmt = "query ($%1$s: %2$s!) { payload: %3$s (%1$s: $%1$s) { %4$s } }";
	private static final String getFmt = "query { payload: %1$s { %2$s } }";
	private static final String getAllFmt = "query { payload: %1$s { pageNum pageSize totalCount list { %2$s } } }";
	private static final String createFmt = "mutation ($%1$s: %2$s!) { payload: %3$s (%1$s: $%1$s) { id } }";
	private static final String updateFmt = "mutation ($%1$s: %2$s!) { payload: %3$s (%1$s: $%1$s) }";
	private static final String searchFmt = "query ($%1$s: %2$s!) { payload: %3$s (%1$s: $%1$s) { pageNum pageSize totalCount list { %4$s } } }";

	private final GraphQLRequest<T> graphQLObjectRequest;
	private final GraphQLRequest<Integer> graphQLUpdateRequest;
	private final GraphQLRequest<AnetBeanList<T>> graphQLSearchRequest;

	public GraphQLHelper(Client client, int localPort) {
		graphQLObjectRequest = new GraphQLRequest<T>(client, localPort);
		graphQLUpdateRequest = new GraphQLRequest<Integer>(client, localPort);
		graphQLSearchRequest = new GraphQLRequest<AnetBeanList<T>>(client, localPort);
	}

	/**
	 * @return the object matching the id
	 */
	public T getObjectById(Person user, String getQuery, String fields, Integer id, GenericType<GraphQLResponse<T>> responseType) {
		return getObject(user, getQuery, "id", fields, "Int", id, responseType);
	}

	/**
	 * @return the object matching the param (usually the id)
	 */
	public T getObject(Person user, String getQuery, String paramName, String fields, String paramType, Object param, GenericType<GraphQLResponse<T>> responseType) {
		final String q = String.format(getWithParamFmt, paramName, paramType, getQuery, fields);
		return graphQLObjectRequest.doGraphQLQuery(user, q, paramName, param, responseType);
	}

	/**
	 * @return the requested object
	 */
	public T getObject(Person user, String getQuery, String fields, GenericType<GraphQLResponse<T>> responseType) {
		final String q = String.format(getFmt, getQuery, fields);
		return graphQLObjectRequest.doGraphQLQuery(user, q, null, null, responseType);
	}

	/**
	 * @return all objects of the requested type
	 */
	public AnetBeanList<T> getAllObjects(Person user, String getQuery, String fields, GenericType<GraphQLResponse<AnetBeanList<T>>> responseType) {
		final String q = String.format(getAllFmt, getQuery, fields);
		return graphQLSearchRequest.doGraphQLQuery(user, q, null, null, responseType);
	}

	/**
	 * @return id of the newly created object
	 */
	public Integer createObject(Person user, String createQuery, String paramName, String paramType, T param, GenericType<GraphQLResponse<T>> responseType) {
		final String q = String.format(createFmt, paramName, paramType, createQuery);
		final T obj = graphQLObjectRequest.doGraphQLQuery(user, q, paramName, param, responseType);
		return (obj == null) ? null : obj.getId();
	}

	/**
	 * @return the number of objects updated
	 */
	public Integer updateObject(Person user, String updateQuery, String paramName, String paramType, T param) {
		final String q = String.format(updateFmt, paramName, paramType, updateQuery);
		return graphQLUpdateRequest.doGraphQLQuery(user, q, paramName, param, new GenericType<GraphQLResponse<Integer>>() {});
	}

	/**
	 * @return the object list matching the search query
	 */
	public AnetBeanList<T> searchObjects(Person user, String searchQuery, String paramName, String paramType, String fields, S param, GenericType<GraphQLResponse<AnetBeanList<T>>> responseType) {
		final String q = String.format(searchFmt, paramName, paramType, searchQuery, fields);
		return graphQLSearchRequest.doGraphQLQuery(user, q, paramName, param, responseType);
	}

}
