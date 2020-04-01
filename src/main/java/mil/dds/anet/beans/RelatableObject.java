package mil.dds.anet.beans;

import io.leangen.graphql.annotations.types.GraphQLUnion;

@GraphQLUnion(name = "RelatableObject", possibleTypeAutoDiscovery = true)
public interface RelatableObject {
}
