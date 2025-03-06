package mil.dds.anet.config;

import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Component
@EnableWebMvc
public class AssetConfig implements WebMvcConfigurer {

  public static final String ASSETS_PATH = "/assets/**";
  public static final String IMAGERY_PATH = "/imagery/**";
  public static final String DATA_PATH = "/data/**";
  public static final String GRAPHQL_WEB_SERVICE = "/graphqlWebService/**";

  @Value("${anet.imagery-path}")
  private String imageryPath;

  @Value("${anet.dashboards-path}")
  private String dashboardsPath;

  // Assets can safely be cached
  private static final CacheControl assetsCacheControl =
      CacheControl.maxAge(72, TimeUnit.HOURS).cachePublic();
  // Map imagery can be cached for a shorter period (tile pyramids might be regenerated, so don't
  // cache too long)
  private static final CacheControl imageryCacheControl =
      CacheControl.maxAge(8, TimeUnit.HOURS).cachePublic();

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Static assets
    registry.addResourceHandler(ASSETS_PATH).addResourceLocations("classpath:/assets/")
        .setCacheControl(assetsCacheControl);
    // Map imagery
    registry.addResourceHandler(IMAGERY_PATH)
        .addResourceLocations(String.format("file:%s/", imageryPath))
        .setCacheControl(imageryCacheControl);
    // Dashboards (don't cache these!)
    registry.addResourceHandler(DATA_PATH)
        .addResourceLocations(String.format("file:%s/", dashboardsPath));
    // Make sure these are tried first, before the catch-all in HomeResource
    registry.setOrder(-1);
  }

}
