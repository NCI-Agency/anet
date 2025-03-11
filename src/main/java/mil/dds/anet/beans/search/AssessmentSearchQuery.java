package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Map;

public record AssessmentSearchQuery(@GraphQLQuery @GraphQLInputField String key,
    @GraphQLQuery @GraphQLInputField Map<String, Object> filters) {
}
