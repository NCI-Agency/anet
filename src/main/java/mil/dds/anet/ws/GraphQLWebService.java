package mil.dds.anet.ws;

import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import java.util.Map;
import mil.dds.anet.graphql.outputtransformers.ResourceTransformers;
import mil.dds.anet.resources.GraphQLResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(GraphQLWebService.GRAPHQL_WEB_SERVICE)
@EnableMethodSecurity
public class GraphQLWebService {
  public static final String GRAPHQL_WEB_SERVICE = "/graphqlWebService";

  private final GraphQLResource graphQLResource;

  public GraphQLWebService(GraphQLResource graphQLResource) {
    this.graphQLResource = graphQLResource;
  }

  @PreAuthorize("hasAuthority('SCOPE_GRAPHQL')")
  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> graphqlPostJson(
      @RequestBody GraphQLRequest graphQLRequest) {
    if (graphQLRequest == null) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    return ResourceTransformers.jsonTransformer
        .apply(graphQLResource.graphql(graphQLRequest, null));
  }
}
