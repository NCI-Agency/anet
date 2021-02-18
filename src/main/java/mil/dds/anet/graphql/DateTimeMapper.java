package mil.dds.anet.graphql;

import graphql.schema.GraphQLScalarType;
import io.leangen.graphql.generator.BuildContext;
import io.leangen.graphql.generator.mapping.TypeMappingEnvironment;
import io.leangen.graphql.generator.mapping.common.CachingMapper;
import java.lang.reflect.AnnotatedElement;
import java.lang.reflect.AnnotatedType;
import java.time.Instant;

public class DateTimeMapper extends CachingMapper<GraphQLScalarType, GraphQLScalarType> {

  public static final GraphQLScalarType GraphQLInstant = GraphQlDateTimeType.getInstance();

  @Override
  protected GraphQLScalarType toGraphQLType(String typeName, AnnotatedType javaType,
      TypeMappingEnvironment env) {
    return GraphQLInstant;
  }

  @Override
  protected GraphQLScalarType toGraphQLInputType(String typeName, AnnotatedType javaType,
      TypeMappingEnvironment env) {
    return toGraphQLType(typeName, javaType, env);
  }

  @Override
  public boolean supports(AnnotatedElement element, AnnotatedType type) {
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
