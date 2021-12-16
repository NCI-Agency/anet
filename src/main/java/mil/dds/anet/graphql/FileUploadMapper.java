package mil.dds.anet.graphql;

import graphql.schema.GraphQLScalarType;
import io.leangen.graphql.generator.BuildContext;
import io.leangen.graphql.generator.mapping.TypeMappingEnvironment;
import io.leangen.graphql.generator.mapping.common.CachingMapper;
import java.lang.reflect.AnnotatedElement;
import java.lang.reflect.AnnotatedType;
import mil.dds.anet.beans.FileUpload;

public class FileUploadMapper extends CachingMapper<GraphQLScalarType, GraphQLScalarType> {

  public static final GraphQLScalarType GraphQLFileUpload = GraphQlFileUploadType.getInstance();

  @Override
  protected GraphQLScalarType toGraphQLType(String typeName, AnnotatedType javaType,
      TypeMappingEnvironment env) {
    return GraphQLFileUpload;
  }

  @Override
  protected GraphQLScalarType toGraphQLInputType(String typeName, AnnotatedType javaType,
      TypeMappingEnvironment env) {
    return GraphQLFileUpload;
  }

  @Override
  public boolean supports(AnnotatedElement element, AnnotatedType type) {
    return type.getType().equals(FileUpload.class);
  }

  @Override
  protected String getTypeName(AnnotatedType type, BuildContext buildContext) {
    return GraphQLFileUpload.getName();
  }

  @Override
  protected String getInputTypeName(AnnotatedType type, BuildContext buildContext) {
    return getTypeName(type, buildContext);
  }
}
