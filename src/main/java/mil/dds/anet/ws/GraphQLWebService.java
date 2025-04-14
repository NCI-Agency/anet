package mil.dds.anet.ws;

import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import java.util.Map;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.beans.AccessToken.TokenScope;
import mil.dds.anet.database.AccessTokenDao;
import mil.dds.anet.graphql.outputtransformers.ResourceTransformers;
import mil.dds.anet.resources.GraphQLResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping(GraphQLWebService.GRAPHQL_WEB_SERVICE)
public class GraphQLWebService {
  public static final String GRAPHQL_WEB_SERVICE = "/graphqlWebService";

  private static final String BEARER_PREFIX = "Bearer ";
  private static final int ACCESS_TOKEN_LENGTH = 32;

  private final GraphQLResource graphQLResource;
  private final AccessTokenDao accessTokenDao;

  public GraphQLWebService(GraphQLResource graphQLResource, AccessTokenDao accessTokenDao) {
    this.accessTokenDao = accessTokenDao;
    this.graphQLResource = graphQLResource;
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> graphqlPostJson(
      @RequestBody GraphQLRequest graphQLRequest,
      @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
    if (graphQLRequest == null) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }
    if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
      final String accessToken = authHeader.substring(BEARER_PREFIX.length());
      if (accessToken.length() == ACCESS_TOKEN_LENGTH) {
        final AccessToken at =
            accessTokenDao.getByTokenValueAndScope(accessToken, TokenScope.GRAPHQL);
        if (at != null && at.isValid()) {
          return ResourceTransformers.jsonTransformer
              .apply(graphQLResource.graphql(new AccessTokenPrincipal(at), graphQLRequest, null));
        }
      }
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
        "Must provide a valid Web Service Access Token");
  }
}
