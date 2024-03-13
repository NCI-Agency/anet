package io.dropwizard.bundles.assets;

import com.google.common.base.CharMatcher;
import com.google.common.base.Joiner;
import com.google.common.base.Splitter;
import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheBuilderSpec;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import com.google.common.cache.Weigher;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Maps;
import com.google.common.hash.Hashing;
import com.google.common.io.Files;
import com.google.common.io.Resources;
import com.google.common.net.HttpHeaders;
import com.google.common.net.MediaType;
import io.dropwizard.servlets.assets.ByteRange;
import io.dropwizard.servlets.assets.ResourceURL;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.List;
import java.util.Map;
import org.eclipse.jetty.http.MimeTypes;

/**
 * Servlet responsible for serving assets to the caller. This is basically completely stolen from
 * {@link io.dropwizard.servlets.assets.AssetServlet} with the exception of allowing for override
 * options.
 *
 * @see io.dropwizard.servlets.assets.AssetServlet
 */
public class AssetServlet extends HttpServlet {
  private static final long serialVersionUID = 6393345594784987908L;
  private static final MediaType DEFAULT_MEDIA_TYPE = MediaType.HTML_UTF_8;
  private static final CharMatcher SLASHES = CharMatcher.is('/');

  private final transient CacheBuilderSpec cacheSpec;
  private final transient LoadingCache<String, Asset> cache;
  private final transient MimeTypes mimeTypes;

  private Charset defaultCharset;

  private String cacheControlHeader = null;

  /**
   * Creates a new {@code AssetServlet} that serves static assets loaded from {@code resourceURL}
   * (typically a file: or jar: URL). The assets are served at URIs rooted at {@code uriPath}. For
   * example, given a {@code resourceURL} of {@code "file:/data/assets"} and a {@code uriPath} of
   * {@code "/js"}, an {@code AssetServlet} would serve the contents of {@code
   * /data/assets/example.js} in response to a request for {@code /js/example.js}. If a directory is
   * requested and {@code indexFile} is defined, then {@code AssetServlet} will attempt to serve a
   * file with that name in that directory. If a directory is requested and {@code
   * indexFile} is null, it will serve a 404.
   *
   * @param resourcePathToUriPathMapping A mapping from base URL's from which assets are loaded to
   *        the URI path fragment in which the requests for that asset are rooted
   * @param indexFile the filename to use when directories are requested, or null to serve no
   *        indexes
   * @param defaultCharset the default character set
   * @param spec the CacheBuilderSpec to use
   * @param overrides the path overrides
   * @param mimeTypes the mimeType overrides
   */
  public AssetServlet(Iterable<Map.Entry<String, String>> resourcePathToUriPathMapping,
      String indexFile, Charset defaultCharset, CacheBuilderSpec spec,
      Iterable<Map.Entry<String, String>> overrides,
      Iterable<Map.Entry<String, String>> mimeTypes) {
    this.defaultCharset = defaultCharset;
    AssetLoader loader = new AssetLoader(resourcePathToUriPathMapping, indexFile, overrides);

    CacheBuilder<Object, Object> cacheBuilder = CacheBuilder.from(spec);
    // Don't add the weigher if we are using maximumSize instead of maximumWeight.
    if (spec.toParsableString().contains("maximumWeight=")) {
      cacheBuilder.weigher(new AssetSizeWeigher());
    }
    this.cache = cacheBuilder.build(loader);

    this.cacheSpec = spec;
    this.mimeTypes = new MimeTypes();
    this.setMimeTypes(mimeTypes);
  }

  public void setCacheControlHeader(String cacheControlHeader) {
    this.cacheControlHeader = cacheControlHeader;
  }

  public String getCacheControlHeader() {
    return cacheControlHeader;
  }

  /**
   * Adds mimeType overrides.
   *
   * @param mimeTypes the mimeType override mapping
   */
  public void setMimeTypes(Iterable<Map.Entry<String, String>> mimeTypes) {
    for (Map.Entry<String, String> mime : mimeTypes) {
      this.mimeTypes.addMimeMapping(mime.getKey(), mime.getValue());
    }
  }

  public MimeTypes getMimeTypes() {
    return mimeTypes;
  }

  public void setDefaultCharset(Charset defaultCharset) {
    this.defaultCharset = defaultCharset;
  }

  public Charset getDefaultCharset() {
    return this.defaultCharset;
  }

  public CacheBuilderSpec getCacheSpec() {
    return cacheSpec;
  }

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp)
      throws ServletException, IOException {
    try {
      final StringBuilder builder = new StringBuilder(req.getServletPath());
      if (req.getPathInfo() != null) {
        builder.append(req.getPathInfo());
      }
      final Asset cachedAsset = cache.getUnchecked(builder.toString());
      if (cachedAsset == null) {
        resp.sendError(HttpServletResponse.SC_NOT_FOUND);
        return;
      }

      if (isCachedClientSide(req, cachedAsset)) {
        resp.sendError(HttpServletResponse.SC_NOT_MODIFIED);
        return;
      }

      final String rangeHeader = req.getHeader(HttpHeaders.RANGE);

      final int resourceLength = cachedAsset.getResource().length;
      ImmutableList<ByteRange> ranges = ImmutableList.of();

      boolean usingRanges = false;
      // Support for HTTP Byte Ranges
      // http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html
      if (rangeHeader != null) {

        final String ifRange = req.getHeader(HttpHeaders.IF_RANGE);

        if (ifRange == null || cachedAsset.getETag().equals(ifRange)) {

          try {
            ranges = parseRangeHeader(rangeHeader, resourceLength);
          } catch (NumberFormatException e) {
            resp.sendError(HttpServletResponse.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
            return;
          }

          if (ranges.isEmpty()) {
            resp.sendError(HttpServletResponse.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
            return;
          }

          resp.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
          usingRanges = true;

          resp.addHeader(HttpHeaders.CONTENT_RANGE,
              "bytes " + Joiner.on(",").join(ranges) + "/" + resourceLength);
        }
      }

      resp.setDateHeader(HttpHeaders.LAST_MODIFIED, cachedAsset.getLastModifiedTime());
      resp.setHeader(HttpHeaders.ETAG, cachedAsset.getETag());
      if (cacheControlHeader != null) {
        resp.setHeader(HttpHeaders.CACHE_CONTROL, cacheControlHeader);
      }


      String mimeTypeOfExtension = mimeTypes.getMimeByExtension(req.getRequestURI());
      if (mimeTypeOfExtension == null) {
        mimeTypeOfExtension = req.getServletContext().getMimeType(req.getRequestURI());
      }

      MediaType mediaType = DEFAULT_MEDIA_TYPE;

      if (mimeTypeOfExtension != null) {
        try {
          mediaType = MediaType.parse(mimeTypeOfExtension);
          if (defaultCharset != null && mediaType.is(MediaType.ANY_TEXT_TYPE)) {
            mediaType = mediaType.withCharset(defaultCharset);
          }
        } catch (IllegalArgumentException ignored) {
          // Ignored
        }
      }

      if (mediaType.is(MediaType.ANY_VIDEO_TYPE) || mediaType.is(MediaType.ANY_AUDIO_TYPE)
          || usingRanges) {
        resp.addHeader(HttpHeaders.ACCEPT_RANGES, "bytes");
      }

      resp.setContentType(mediaType.type() + '/' + mediaType.subtype());

      if (mediaType.charset().isPresent()) {
        resp.setCharacterEncoding(mediaType.charset().get().toString());
      }

      try (ServletOutputStream output = resp.getOutputStream()) {
        if (usingRanges) {
          for (final ByteRange range : ranges) {
            output.write(cachedAsset.getResource(), range.getStart(),
                range.getEnd() - range.getStart() + 1);
          }
        } else {
          output.write(cachedAsset.getResource());
        }
      }
    } catch (RuntimeException ignored) {
      resp.sendError(HttpServletResponse.SC_NOT_FOUND);
    }
  }

  private boolean isCachedClientSide(HttpServletRequest req, Asset cachedAsset) {
    return cachedAsset.getETag().equals(req.getHeader(HttpHeaders.IF_NONE_MATCH))
        || (req.getDateHeader(HttpHeaders.IF_MODIFIED_SINCE) >= cachedAsset.getLastModifiedTime());
  }

  /**
   * Parses a given Range header for one or more byte ranges.
   *
   * @param rangeHeader Range header to parse
   * @param resourceLength Length of the resource in bytes
   * @return List of parsed ranges
   */
  private ImmutableList<ByteRange> parseRangeHeader(final String rangeHeader,
      final int resourceLength) {
    final ImmutableList.Builder<ByteRange> builder = ImmutableList.builder();
    if (rangeHeader.contains("=")) {
      final String[] parts = rangeHeader.split("=");
      if (parts.length > 1) {
        final List<String> ranges = Splitter.on(",").trimResults().splitToList(parts[1]);
        for (final String range : ranges) {
          builder.add(ByteRange.parse(range, resourceLength));
        }
      }
    }
    return builder.build();
  }

  private static class AssetLoader extends CacheLoader<String, Asset> {
    private final String indexFilename;
    private final Map<String, String> resourcePathToUriMappings = Maps.newHashMap();
    private final Iterable<Map.Entry<String, String>> overrides;

    private AssetLoader(Iterable<Map.Entry<String, String>> resourcePathToUriMappings,
        String indexFilename, Iterable<Map.Entry<String, String>> overrides) {
      for (Map.Entry<String, String> mapping : resourcePathToUriMappings) {
        final String trimmedPath = SLASHES.trimFrom(mapping.getKey());
        String resourcePath = trimmedPath.isEmpty() ? trimmedPath : trimmedPath + '/';
        final String trimmedUri = SLASHES.trimTrailingFrom(mapping.getValue());
        String uriPath = trimmedUri.isEmpty() ? "/" : trimmedUri;

        if (this.resourcePathToUriMappings.containsKey(resourcePath)) {
          throw new IllegalArgumentException(
              "ResourcePathToUriMappings contains multiple mappings " + "for " + resourcePath);
        }
        this.resourcePathToUriMappings.put(resourcePath, uriPath);
      }

      this.indexFilename = indexFilename;
      this.overrides = overrides;
    }

    @Override
    public Asset load(String key) throws Exception {
      for (Map.Entry<String, String> mapping : resourcePathToUriMappings.entrySet()) {
        if (!key.startsWith(mapping.getValue())) {
          continue;
        }

        Asset asset = loadOverride(key);
        if (asset != null) {
          return asset;
        }

        final String requestedResourcePath =
            SLASHES.trimFrom(key.substring(mapping.getValue().length()));
        final String absolutePath = SLASHES.trimFrom(mapping.getKey() + requestedResourcePath);

        try {
          URL requestedResourceUrl =
              UrlUtil.switchFromZipToJarProtocolIfNeeded(Resources.getResource(absolutePath));
          if (ResourceURL.isDirectory(requestedResourceUrl)) {
            if (indexFilename != null) {
              requestedResourceUrl = Resources.getResource(absolutePath + '/' + indexFilename);
              requestedResourceUrl =
                  UrlUtil.switchFromZipToJarProtocolIfNeeded(requestedResourceUrl);
            } else {
              // resource mapped to directory but no index file defined
              continue;
            }
          }

          long lastModified = ResourceURL.getLastModified(requestedResourceUrl);
          if (lastModified < 1) {
            // Something went wrong trying to get the last modified time: just use the current time
            lastModified = System.currentTimeMillis();
          }

          // zero out the millis; the If-Modified-Since header will not have them
          lastModified = (lastModified / 1000) * 1000;
          return new StaticAsset(Resources.toByteArray(requestedResourceUrl), lastModified);
        } catch (IllegalArgumentException expected) {
          // Try another Mapping.
        }
      }

      return null;
    }

    private Asset loadOverride(String key) throws Exception {
      // TODO: Support prefix matches only for directories
      for (Map.Entry<String, String> override : overrides) {
        File file = null;
        if (override.getKey().equals(key)) {
          // We have an exact match
          file = new File(override.getValue());
        } else if (key.startsWith(override.getKey())) {
          // This resource is in a mapped subdirectory
          file = new File(override.getValue(), key.substring(override.getKey().length()));
        }

        if (file == null || !file.exists()) {
          continue;
        }

        if (file.isDirectory()) {
          file = new File(file, indexFilename);
        }

        if (file.exists()) {
          return new FileSystemAsset(file);
        }
      }

      return null;
    }
  }

  private static interface Asset {
    byte[] getResource();

    String getETag();

    long getLastModifiedTime();
  }

  /**
   * Weigh an asset according to the number of bytes it contains.
   */
  private static final class AssetSizeWeigher implements Weigher<String, Asset> {
    @Override
    public int weigh(String key, Asset asset) {
      return asset.getResource().length;
    }
  }

  /**
   * An asset implementation backed by the file-system. If the backing file changes on disk, then
   * this asset will automatically reload its contents from disk.
   */
  private static class FileSystemAsset implements Asset {
    private final File file;
    private byte[] bytes;
    private String etag;
    private long lastModifiedTime;

    public FileSystemAsset(File file) {
      this.file = file;
      refresh();
    }

    @Override
    public byte[] getResource() {
      maybeRefresh();
      return bytes;
    }

    @Override
    public String getETag() {
      maybeRefresh();
      return etag;
    }

    @Override
    public long getLastModifiedTime() {
      maybeRefresh();
      return (lastModifiedTime / 1000) * 1000;
    }

    private synchronized void maybeRefresh() {
      if (lastModifiedTime != file.lastModified()) {
        refresh();
      }
    }

    private synchronized void refresh() {
      try {
        byte[] newBytes = Files.toByteArray(file);
        String newETag = Hashing.murmur3_128().hashBytes(newBytes).toString();

        bytes = newBytes;
        etag = '"' + newETag + '"';
        lastModifiedTime = file.lastModified();
      } catch (IOException e) {
        // Ignored, don't update anything
      }
    }
  }

  /**
   * A static asset implementation. This implementation just encapsulates the raw bytes of an asset
   * (presumably loaded from the classpath) and will never change.
   */
  private static class StaticAsset implements Asset {
    private final byte[] resource;
    private final String etag;
    private final long lastModifiedTime;

    private StaticAsset(byte[] resource, long lastModifiedTime) {
      this.resource = resource;
      this.etag = '"' + Hashing.murmur3_128().hashBytes(resource).toString() + '"';
      this.lastModifiedTime = lastModifiedTime;
    }

    public byte[] getResource() {
      return resource;
    }

    public String getETag() {
      return etag;
    }

    public long getLastModifiedTime() {
      return lastModifiedTime;
    }
  }


}
