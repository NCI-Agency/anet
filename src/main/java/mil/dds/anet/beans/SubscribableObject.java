package mil.dds.anet.beans;

import io.leangen.graphql.annotations.types.GraphQLUnion;

@GraphQLUnion(name = "SubscribableObject", possibleTypeAutoDiscovery = true)
public interface SubscribableObject {}
