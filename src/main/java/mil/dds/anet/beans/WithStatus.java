package mil.dds.anet.beans;

import io.leangen.graphql.annotations.types.GraphQLUnion;

@GraphQLUnion(name = "WithStatus", possibleTypeAutoDiscovery = true)
public interface WithStatus {

  public static enum Status {
    ACTIVE, INACTIVE
  }

  public Status getStatus();

  public void setStatus(Status status);
}
