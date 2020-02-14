package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.database.ApprovalStepDao;

public class ApprovalStepResource {

  private final ApprovalStepDao dao;

  public ApprovalStepResource(AnetObjectEngine engine) {
    this.dao = engine.getApprovalStepDao();
  }

  @GraphQLQuery(name = "approvalStepInUse")
  public boolean isApprovalStepInUse(@GraphQLArgument(name = "uuid") String uuid) {
    return dao.isStepInUse(uuid);
  }

}
