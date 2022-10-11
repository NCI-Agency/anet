package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonCreator;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;

import java.io.File;

public class FileUpload {
  @GraphQLQuery
  @GraphQLInputField
  private String contentType;
  @GraphQLQuery
  @GraphQLInputField
  private String name;
  @GraphQLQuery
  @GraphQLInputField
  private byte[] content;

  public FileUpload(){}

  public FileUpload(String contentType, String name, byte[] content) {
    this.contentType = contentType;
    this.name = name;
    this.content = content;
  }

  public String getContentType() {
    return contentType;
  }

  public byte[] getContent() {
    return content;
  }

  public String getName() {
    return name;
  }

}
