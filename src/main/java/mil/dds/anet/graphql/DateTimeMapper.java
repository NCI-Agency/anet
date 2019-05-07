package mil.dds.anet.graphql;

import graphql.schema.GraphQLScalarType;
import io.leangen.graphql.generator.BuildContext;
import io.leangen.graphql.generator.OperationMapper;
import io.leangen.graphql.generator.mapping.common.CachingMapper;
import java.lang.reflect.AnnotatedType;
import java.time.Instant;

public class DateTimeMapper extends CachingMapper<GraphQLScalarType, GraphQLScalarType> {

  public static final GraphQLScalarType GraphQLInstant = new GraphQlDateTimeType();

  @Override
  public GraphQLScalarType toGraphQLType(String typeName, AnnotatedType javaType,
      OperationMapper operationMapper, BuildContext buildContext) {
    return GraphQLInstant;
  }

  @Override
  public GraphQLScalarType toGraphQLInputType(String typeName, AnnotatedType javaType,
      OperationMapper operationMapper, BuildContext buildContext) {
    return toGraphQLType(typeName, javaType, operationMapper, buildContext);
  }

  @Override
  public boolean supports(AnnotatedType type) {
    return type.getType() == Instant.class;
  }

  @Override
  protected String getTypeName(AnnotatedType type, BuildContext buildContext) {
    return GraphQLInstant.getName();
  }

  @Override
  protected String getInputTypeName(AnnotatedType type, BuildContext buildContext) {
    return getTypeName(type, buildContext);
  }

}
