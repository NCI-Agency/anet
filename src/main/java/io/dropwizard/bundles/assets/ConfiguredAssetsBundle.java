package io.dropwizard.bundles.assets;

import com.google.common.cache.CacheBuilderSpec;
import com.google.common.collect.Iterables;
import io.dropwizard.core.ConfiguredBundle;
import io.dropwizard.core.setup.Environment;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * An assets bundle (like io.dropwizard.assets.AssetsBundle) that utilizes configuration to provide
 * the ability to override how assets are loaded and cached. Specifying an override is useful during
 * the development phase to allow assets to be loaded directly out of source directories instead of
 * the classpath and to force them to not be cached by the browser or the server. This allows
 * developers to edit an asset, save and then immediately refresh the web browser and see the
 * updated assets. No compilation or copy steps are necessary.
 */
public class ConfiguredAssetsBundle implements ConfiguredBundle<AssetsBundleConfiguration> {
  private static final Logger LOGGER = LoggerFactory.getLogger(ConfiguredAssetsBundle.class);

  private static final String DEFAULT_PATH = "/assets";
  public static final CacheBuilderSpec DEFAULT_CACHE_SPEC =
      CacheBuilderSpec.parse("maximumSize=100");
  private static final String DEFAULT_INDEX_FILE = "index.htm";
  private static final String DEFAULT_SERVLET_MAPPING_NAME = "assets";

  private final Iterable<Map.Entry<String, String>> resourcePathToUriMappings;
  private final CacheBuilderSpec cacheBuilderSpec;
  private final String indexFile;
  private final String assetsName;

  /**
   * Creates a new {@link ConfiguredAssetsBundle} which serves up static assets from
   * {@code src/main/resources/assets/*} as {@code /assets/*}.
   *
   * @see ConfiguredAssetsBundle#ConfiguredAssetsBundle(String, String, String, String,
   *      CacheBuilderSpec)
   */
  public ConfiguredAssetsBundle() {
    this(DEFAULT_PATH);
  }

  /**
   * Creates a new {@link ConfiguredAssetsBundle} which will configure the service to serve the
   * static files located in {@code src/main/resources/${path}} as {@code /${path}}. For example,
   * given a {@code path} of {@code "/assets"}, {@code src/main/resources/assets/example.js} would
   * be served up from {@code /assets/example.js}.
   *
   * @param path the classpath and URI root of the static asset files
   * @see ConfiguredAssetsBundle#ConfiguredAssetsBundle(String, String, String, String,
   *      CacheBuilderSpec)
   */
  public ConfiguredAssetsBundle(String path) {
    this(path, path, DEFAULT_INDEX_FILE, DEFAULT_SERVLET_MAPPING_NAME, DEFAULT_CACHE_SPEC);
  }

  /**
   * Creates a new {@link ConfiguredAssetsBundle} which will configure the service to serve the
   * static files located in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. For
   * example, given a {@code resourcePath} of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePath the resource path (in the classpath) of the static asset files
   * @param uriPath the uri path for the static asset files
   * @see ConfiguredAssetsBundle#ConfiguredAssetsBundle(String, String, String, String,
   *      CacheBuilderSpec)
   */
  public ConfiguredAssetsBundle(String resourcePath, String uriPath) {
    this(resourcePath, uriPath, DEFAULT_INDEX_FILE, DEFAULT_SERVLET_MAPPING_NAME,
        DEFAULT_CACHE_SPEC);
  }

  /**
   * Creates a new AssetsBundle which will configure the service to serve the static files located
   * in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. If no file name is in
   * ${uriPath}, ${indexFile} is appended before serving. For example, given a {@code resourcePath}
   * of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePath the resource path (in the classpath) of the static asset files
   * @param uriPath the uri path for the static asset files
   * @param indexFile the name of the index file to use
   */
  public ConfiguredAssetsBundle(String resourcePath, String uriPath, String indexFile) {
    this(resourcePath, uriPath, indexFile, DEFAULT_SERVLET_MAPPING_NAME, DEFAULT_CACHE_SPEC);
  }

  /**
   * Creates a new AssetsBundle which will configure the service to serve the static files located
   * in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. If no file name is in
   * ${uriPath}, ${indexFile} is appended before serving. For example, given a {@code resourcePath}
   * of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePath the resource path (in the classpath) of the static asset files
   * @param uriPath the uri path for the static asset files
   * @param indexFile the name of the index file to use
   * @param assetsName the name of servlet mapping used for this assets bundle
   */
  public ConfiguredAssetsBundle(String resourcePath, String uriPath, String indexFile,
      String assetsName) {
    this(resourcePath, uriPath, indexFile, assetsName, DEFAULT_CACHE_SPEC);
  }

  /**
   * Creates a new {@link ConfiguredAssetsBundle} which serves up static assets from
   * {@code src/main/resources/assets/*} as {@code /assets/*}.
   *
   * @param cacheBuilderSpec the spec for the cache builder
   * @see ConfiguredAssetsBundle#ConfiguredAssetsBundle(Map, String, String, CacheBuilderSpec)
   */
  public ConfiguredAssetsBundle(CacheBuilderSpec cacheBuilderSpec) {
    this(DEFAULT_PATH, DEFAULT_PATH, DEFAULT_INDEX_FILE, DEFAULT_SERVLET_MAPPING_NAME,
        cacheBuilderSpec);
  }

  /**
   * Creates a new {@link ConfiguredAssetsBundle} which will configure the service to serve the
   * static files located in {@code src/main/resources/${path}} as {@code /${path}}. For example,
   * given a {@code path} of {@code "/assets"}, {@code src/main/resources/assets/example.js} would
   * be served up from {@code /assets/example.js}.
   *
   * @param resourcePath the resource path (in the classpath) of the static asset files
   * @param cacheBuilderSpec the spec for the cache builder
   */
  public ConfiguredAssetsBundle(String resourcePath, CacheBuilderSpec cacheBuilderSpec) {
    this(resourcePath, resourcePath, DEFAULT_INDEX_FILE, DEFAULT_SERVLET_MAPPING_NAME,
        cacheBuilderSpec);
  }

  /**
   * Creates a new {@link ConfiguredAssetsBundle} which will configure the service to serve the
   * static files located in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. For
   * example, given a {@code resourcePath} of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePath the resource path (in the classpath) of the static asset files
   * @param uriPath the uri path for the static asset files
   * @param cacheBuilderSpec the spec for the cache builder
   * @see ConfiguredAssetsBundle#ConfiguredAssetsBundle(Map, String, String, CacheBuilderSpec)
   */
  public ConfiguredAssetsBundle(String resourcePath, String uriPath,
      CacheBuilderSpec cacheBuilderSpec) {
    this(resourcePath, uriPath, DEFAULT_INDEX_FILE, DEFAULT_SERVLET_MAPPING_NAME, cacheBuilderSpec);
  }

  /**
   * Creates a new AssetsBundle which will configure the service to serve the static files located
   * in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. If no file name is in
   * ${uriPath}, ${indexFile} is appended before serving. For example, given a {@code resourcePath}
   * of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePath the resource path (in the classpath) of the static asset files
   * @param uriPath the uri path for the static asset files
   * @param indexFile the name of the index file to use
   * @param cacheBuilderSpec the spec for the cache builder
   * @see ConfiguredAssetsBundle#ConfiguredAssetsBundle(Map, String, String, CacheBuilderSpec)
   */
  public ConfiguredAssetsBundle(String resourcePath, String uriPath, String indexFile,
      CacheBuilderSpec cacheBuilderSpec) {
    this(resourcePath, uriPath, indexFile, DEFAULT_SERVLET_MAPPING_NAME, cacheBuilderSpec);
  }

  /**
   * Creates a new {@link ConfiguredAssetsBundle} which will configure the service to serve the
   * static files located in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. For
   * example, given a {@code resourcePath} of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePath the resource path (in the classpath) of the static asset files
   * @param cacheBuilderSpec the spec for the cache builder
   * @param uriPath the uri path for the static asset files
   * @param indexFile the name of the index file to use
   * @param assetsName the name of servlet mapping used for this assets bundle
   */
  public ConfiguredAssetsBundle(String resourcePath, String uriPath, String indexFile,
      String assetsName, CacheBuilderSpec cacheBuilderSpec) {
    this(Map.of(resourcePath, uriPath), indexFile, assetsName, cacheBuilderSpec);
  }

  /**
   * Creates a new {@link ConfiguredAssetsBundle} which will configure the service to serve the
   * static files located in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. For
   * example, given a {@code resourcePath} of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePathToUriMappings a series of mappings from resource paths (in the classpath) to
   *        the uri path that hosts the resource
   * @see ConfiguredAssetsBundle#ConfiguredAssetsBundle(String, String, String, String,
   *      CacheBuilderSpec)
   */
  public ConfiguredAssetsBundle(Map<String, String> resourcePathToUriMappings) {
    this(resourcePathToUriMappings, DEFAULT_INDEX_FILE, DEFAULT_SERVLET_MAPPING_NAME,
        DEFAULT_CACHE_SPEC);
  }

  /**
   * Creates a new AssetsBundle which will configure the service to serve the static files located
   * in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. If no file name is in
   * ${uriPath}, ${indexFile} is appended before serving. For example, given a {@code resourcePath}
   * of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePathToUriMappings a series of mappings from resource paths (in the classpath) to
   *        the uri path that hosts the resource
   * @param indexFile the name of the index file to use
   */
  public ConfiguredAssetsBundle(Map<String, String> resourcePathToUriMappings, String indexFile) {
    this(resourcePathToUriMappings, indexFile, DEFAULT_SERVLET_MAPPING_NAME, DEFAULT_CACHE_SPEC);
  }

  /**
   * Creates a new AssetsBundle which will configure the service to serve the static files located
   * in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. If no file name is in
   * ${uriPath}, ${indexFile} is appended before serving. For example, given a {@code resourcePath}
   * of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePathToUriMappings a series of mappings from resource paths (in the classpath) to
   *        the uri path that hosts the resource
   * @param indexFile the name of the index file to use
   * @param assetsName the name of servlet mapping used for this assets bundle
   */
  public ConfiguredAssetsBundle(Map<String, String> resourcePathToUriMappings, String indexFile,
      String assetsName) {
    this(resourcePathToUriMappings, indexFile, assetsName, DEFAULT_CACHE_SPEC);
  }

  /**
   * Creates a new {@link ConfiguredAssetsBundle} which will configure the service to serve the
   * static files located in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. For
   * example, given a {@code resourcePath} of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePathToUriMappings a series of mappings from resource paths (in the classpath) to
   *        the uri path that hosts the resource
   * @param cacheBuilderSpec the spec for the cache builder
   * @see ConfiguredAssetsBundle#ConfiguredAssetsBundle(Map, String, String, CacheBuilderSpec)
   */
  public ConfiguredAssetsBundle(Map<String, String> resourcePathToUriMappings,
      CacheBuilderSpec cacheBuilderSpec) {
    this(resourcePathToUriMappings, DEFAULT_INDEX_FILE, DEFAULT_SERVLET_MAPPING_NAME,
        cacheBuilderSpec);
  }

  /**
   * Creates a new AssetsBundle which will configure the service to serve the static files located
   * in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. If no file name is in
   * ${uriPath}, ${indexFile} is appended before serving. For example, given a {@code resourcePath}
   * of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePathToUriMappings a series of mappings from resource paths (in the classpath) to
   *        the uri path that hosts the resource
   * @param indexFile the name of the index file to use
   * @param cacheBuilderSpec the spec for the cache builder
   * @see ConfiguredAssetsBundle#ConfiguredAssetsBundle(Map, String, String, CacheBuilderSpec)
   */
  public ConfiguredAssetsBundle(Map<String, String> resourcePathToUriMappings, String indexFile,
      CacheBuilderSpec cacheBuilderSpec) {
    this(resourcePathToUriMappings, indexFile, DEFAULT_SERVLET_MAPPING_NAME, cacheBuilderSpec);
  }

  /**
   * Creates a new {@link ConfiguredAssetsBundle} which will configure the service to serve the
   * static files located in {@code src/main/resources/${resourcePath}} as {@code /${uriPath}}. For
   * example, given a {@code resourcePath} of {@code "/assets"} and a uriPath of {@code "/js"},
   * {@code src/main/resources/assets/example.js} would be served up from {@code /js/example.js}.
   *
   * @param resourcePathToUriMappings a series of mappings from resource paths (in the classpath) to
   *        the uri path that hosts the resource
   * @param cacheBuilderSpec the spec for the cache builder
   * @param indexFile the name of the index file to use
   * @param assetsName the name of servlet mapping used for this assets bundle
   */
  public ConfiguredAssetsBundle(Map<String, String> resourcePathToUriMappings, String indexFile,
      String assetsName, CacheBuilderSpec cacheBuilderSpec) {
    for (Map.Entry<String, String> mapping : resourcePathToUriMappings.entrySet()) {
      String resourcePath = mapping.getKey();
      if (!resourcePath.startsWith("/")) {
        throw new IllegalArgumentException(resourcePath + " is not an absolute path");
      }
      if ("/".equals(resourcePath)) {
        throw new IllegalArgumentException(resourcePath + " is the classpath root");
      }
    }
    this.resourcePathToUriMappings =
        Iterables.unmodifiableIterable(resourcePathToUriMappings.entrySet());
    this.cacheBuilderSpec = cacheBuilderSpec;
    this.indexFile = indexFile;
    this.assetsName = assetsName;
  }

  @Override
  public void run(AssetsBundleConfiguration bundleConfig, Environment env) throws Exception {
    AssetsConfiguration config = bundleConfig.getAssetsConfiguration();

    // Let the cache spec from the configuration override the one specified in the code
    CacheBuilderSpec spec =
        (config.getCacheSpec() != null) ? CacheBuilderSpec.parse(config.getCacheSpec())
            : cacheBuilderSpec;

    Iterable<Map.Entry<String, String>> overrides = config.getOverrides().entrySet();
    Iterable<Map.Entry<String, String>> mimeTypes = config.getMimeTypes().entrySet();

    Iterable<Map.Entry<String, String>> servletResourcePathToUriMappings;

    if (!config.getResourcePathToUriMappings().isEmpty()) {
      servletResourcePathToUriMappings = config.getResourcePathToUriMappings().entrySet();
    } else {
      servletResourcePathToUriMappings = resourcePathToUriMappings;
    }
    AssetServlet servlet = new AssetServlet(servletResourcePathToUriMappings, indexFile,
        StandardCharsets.UTF_8, spec, overrides, mimeTypes);

    for (Map.Entry<String, String> mapping : servletResourcePathToUriMappings) {
      String mappingPath = mapping.getValue();
      if (!mappingPath.endsWith("/")) {
        mappingPath += '/';
      }
      mappingPath += "*";
      servlet.setCacheControlHeader(config.getCacheControlHeader());
      LOGGER.info("Registering ConfiguredAssetBundle with name: {} for path {}", mapping.getKey(),
          mappingPath);
      env.servlets().addServlet(mapping.getKey(), servlet).addMapping(mappingPath);
    }
  }
}
