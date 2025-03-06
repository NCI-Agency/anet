package mil.dds.anet.resources;

import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import java.util.Map;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.database.AccessTokenDao;
import mil.dds.anet.graphql.outputtransformers.ResourceTransformers;
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
@RequestMapping("/graphqlWebService")
public class GraphQLWebServiceResource {

  private static final int ACCESS_TOKEN_LENGTH = 32;

  private final AccessTokenDao accessTokenDao;
  private final GraphQLResource graphQLResource;

  public GraphQLWebServiceResource(AccessTokenDao accessTokenDao,
      final GraphQLResource graphQLResource) {
    this.accessTokenDao = accessTokenDao;
    this.graphQLResource = graphQLResource;
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> graphqlPostJson(
      @RequestBody GraphQLRequest graphQLRequest,
      @RequestHeader("Authorization") String authHeader) {
    if (graphQLRequest == null) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      String accessToken = authHeader.substring(7);
      if (accessToken.length() == ACCESS_TOKEN_LENGTH) {
        final AccessToken at = accessTokenDao.getByTokenValueAndScope(accessToken, AccessToken.TokenScope.GRAPHQL.name());
        if (at != null && at.isValid()) {
          return ResourceTransformers.jsonTransformer
              .apply(graphQLResource.graphql(null, graphQLRequest, null));
        }
      }
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
        "Must provide a valid Web Service Access Token");
  }
}
