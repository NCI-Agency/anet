package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import mil.dds.anet.database.ApprovalStepDao;
import org.springframework.stereotype.Component;

@Component
@GraphQLApi
public class ApprovalStepResource {

  private final ApprovalStepDao dao;

  public ApprovalStepResource(ApprovalStepDao dao) {
    this.dao = dao;
  }

  @GraphQLQuery(name = "approvalStepInUse")
  public boolean isApprovalStepInUse(@GraphQLArgument(name = "uuid") String uuid) {
    return dao.isStepInUse(uuid);
  }

}
