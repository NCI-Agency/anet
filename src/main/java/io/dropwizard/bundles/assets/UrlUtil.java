package io.dropwizard.bundles.assets;

import java.net.MalformedURLException;
import java.net.URL;

public class UrlUtil {
  /*
   * Separator between JAR URL and file path within the JAR
   */
  private static final String JAR_URL_SEPARATOR = "!/";

  /**
   * Switch zip protocol (used by Weblogic) to jar protocol (supported by DropWizard).
   *
   * @param resourceUrl the URL to switch protocol eventually
   * @return the URL with eventually switched protocol
   */
  public static URL switchFromZipToJarProtocolIfNeeded(URL resourceUrl)
      throws MalformedURLException {
    final String protocol = resourceUrl.getProtocol();
    // If zip protocol switch to jar protocol
    if ("zip".equals(protocol)
        && resourceUrl.getPath().contains(".jar" + JAR_URL_SEPARATOR)) {
      String filePath = resourceUrl.getFile();
      if (!filePath.startsWith("/")) {
        filePath = "/" + filePath;
      }
      return new URL("jar:file:" + filePath);
    }
    return resourceUrl;
  }
}