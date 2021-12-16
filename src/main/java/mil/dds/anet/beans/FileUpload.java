package mil.dds.anet.beans;

public class FileUpload {
  private final String contentType;
  private final String name;
  private final byte[] content;

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
