package mil.dds.anet.graphql;

import graphql.schema.Coercing;
import graphql.schema.CoercingParseLiteralException;
import graphql.schema.CoercingParseValueException;
import graphql.schema.CoercingSerializeException;
import graphql.schema.GraphQLScalarType;
import java.io.IOException;
import javax.servlet.http.Part;
import mil.dds.anet.beans.FileUpload;

public final class GraphQlFileUploadType {

  private GraphQlFileUploadType() {}

  private static final Coercing<FileUpload, Void> coercing = new Coercing<FileUpload, Void>() {
    @Override
    public Void serialize(Object dataFetcherResult) {
      throw new CoercingSerializeException("Upload is an input-only type");
    }

    @Override
    public FileUpload parseValue(Object input) {
      if (input instanceof Part) {
        Part part = (Part) input;
        try {
          String contentType = part.getContentType();
          String name = part.getName();
          byte[] content = new byte[part.getInputStream().available()];
          part.delete();
          return new FileUpload(contentType, name, content);

        } catch (IOException e) {
          throw new CoercingParseValueException("Couldn't read content of the uploaded file");
        }
      } else if (null == input) {
        return null;
      } else {
        throw new CoercingParseValueException(
            "Expected type " + Part.class.getName() + " but was " + input.getClass().getName());
      }
    }

    @Override
    public FileUpload parseLiteral(Object input) {
      throw new CoercingParseLiteralException("Must use variables to specify Upload values");
    }
  };

  public static GraphQLScalarType getInstance() {
    return GraphQLScalarType.newScalar().name("FileUpload").coercing(coercing).build();
  }
}
