package mil.dds.anet.test.resources.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import java.util.List;
import java.util.Map;
import javax.ws.rs.client.Client;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.views.AbstractAnetBean;

public final class GraphQlHelper {

  private static final String getWithParamFmt =
      "query ($%1$s: %2$s!) { payload: %3$s (%1$s: $%1$s) { %4$s } }";
  private static final String getFmt = "query { payload: %1$s { %2$s } }";
  private static final String getAllFmt =
      "query { payload: %1$s { pageNum pageSize totalCount list { %2$s } } }";
  private static final String createFmt =
      "mutation ($%1$s: %2$s!) { payload: %3$s (%1$s: $%1$s) { uuid } }";
  private static final String updateFmt = "mutation ($%1$s: %2$s!) { payload: %3$s (%1$s: $%1$s) }";
  private static final String updateObjectFmt =
      "mutation ($%1$s: %2$s!) { payload: %3$s (%1$s: $%1$s) { %4$s } }";
  private static final String searchFmt =
      "query ($%1$s: %2$s!) { payload: %3$s (%1$s: $%1$s) { pageNum pageSize totalCount list { %4$s } } }";

  private final GraphQlClient graphlLClient;

  public GraphQlHelper(Client client, int localPort) {
    graphlLClient = new GraphQlClient(client, localPort);
  }

  /**
   * @return the object matching the uuid
   */
  public <T extends AbstractAnetBean> T getObjectById(Person user, String getQuery, String fields,
      String uuid, TypeReference<GraphQlResponse<T>> responseType) {
    return getObject(user, getQuery, "uuid", fields, "String", uuid, responseType);
  }

  /**
   * @return the object matching the param (usually the uuid)
   */
  public <T extends AbstractAnetBean> T getObject(Person user, String getQuery, String paramName,
      String fields, String paramType, Object param,
      TypeReference<GraphQlResponse<T>> responseType) {
    final String q = String.format(getWithParamFmt, paramName, paramType, getQuery, fields);
    return graphlLClient.doGraphQlQuery(user, q, paramName, param, responseType);
  }

  /**
   * @return the requested object
   */
  public <T extends AbstractAnetBean> T getObject(Person user, String getQuery, String fields,
      TypeReference<GraphQlResponse<T>> responseType) {
    final String q = String.format(getFmt, getQuery, fields);
    return graphlLClient.doGraphQlQuery(user, q, null, null, responseType);
  }

  /**
   * @return all objects of the requested type
   */
  public <T extends AbstractAnetBean> AnetBeanList<T> getAllObjects(Person user, String getQuery,
      String fields, TypeReference<GraphQlResponse<AnetBeanList<T>>> responseType) {
    final String q = String.format(getAllFmt, getQuery, fields);
    return graphlLClient.doGraphQlQuery(user, q, null, null, responseType);
  }

  /**
   * @return a list of objects of the requested type
   */
  public <T extends AbstractAnetBean> List<T> getObjectList(Person user, String getQuery,
      String fields, TypeReference<GraphQlResponse<List<T>>> responseType) {
    final String q = String.format(getFmt, getQuery, fields);
    return graphlLClient.doGraphQlQuery(user, q, null, null, responseType);
  }

  /**
   * @return a list of objects of the requested type matching the variables
   */
  public <T> List<T> getObjectList(Person user, String getQuery, Map<String, Object> variables,
      TypeReference<GraphQlResponse<List<T>>> responseType) {
    return graphlLClient.doGraphQlQuery(user, getQuery, variables, responseType);
  }

  /**
   * @return uuid of the newly created object
   */
  public <T extends AbstractAnetBean> String createObject(Person user, String createQuery,
      String paramName, String paramType, T param, TypeReference<GraphQlResponse<T>> responseType) {
    final String q = String.format(createFmt, paramName, paramType, createQuery);
    final T obj = graphlLClient.doGraphQlQuery(user, q, paramName, param, responseType);
    return (obj == null) ? null : obj.getUuid();
  }

  /**
   * @return the number of objects updated
   */
  public <T extends AbstractAnetBean> Integer updateObject(Person user, String updateQuery,
      String paramName, String paramType, T param) {
    final String q = String.format(updateFmt, paramName, paramType, updateQuery);
    return graphlLClient.doGraphQlQuery(user, q, paramName, param,
        new TypeReference<GraphQlResponse<Integer>>() {});
  }

  /**
   * @return the updated object
   */
  public <T extends AbstractAnetBean> T updateObject(Person user, String updateQuery,
      String paramName, String fields, String paramType, Object param,
      TypeReference<GraphQlResponse<T>> responseType) {
    final String q = String.format(updateObjectFmt, paramName, paramType, updateQuery, fields);
    return graphlLClient.doGraphQlQuery(user, q, paramName, param, responseType);
  }

  /**
   * @return the number of objects updated
   */
  public <T extends AbstractAnetBean> Integer updateObject(Person user, String updateQuery,
      Map<String, Object> variables) {
    return graphlLClient.doGraphQlQuery(user, updateQuery, variables,
        new TypeReference<GraphQlResponse<Integer>>() {});
  }

  /**
   * @return the updated object
   */
  public <T extends AbstractAnetBean> T updateObject(Person user, String updateQuery,
      Map<String, Object> variables, TypeReference<GraphQlResponse<T>> responseType) {
    return graphlLClient.doGraphQlQuery(user, updateQuery, variables, responseType);
  }

  /**
   * @return the number of objects deleted
   */
  public <T extends AbstractAnetBean> Integer deleteObject(Person user, String deleteQuery,
      String uuid) {
    final String q = String.format(updateFmt, "uuid", "String", deleteQuery);
    return graphlLClient.doGraphQlQuery(user, q, "uuid", uuid,
        new TypeReference<GraphQlResponse<Integer>>() {});
  }

  /**
   * @return the object list matching the search query
   */
  public <T extends AbstractAnetBean> AnetBeanList<T> searchObjects(Person user, String searchQuery,
      String paramName, String paramType, String fields, AbstractSearchQuery param,
      TypeReference<GraphQlResponse<AnetBeanList<T>>> responseType) {
    final String q = String.format(searchFmt, paramName, paramType, searchQuery, fields);
    return graphlLClient.doGraphQlQuery(user, q, paramName, param, responseType);
  }

}
