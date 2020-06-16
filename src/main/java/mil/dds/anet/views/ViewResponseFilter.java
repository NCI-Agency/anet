package mil.dds.anet.views;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import com.google.common.net.HttpHeaders;
import java.io.IOException;
import java.util.Set;
import javax.ws.rs.HttpMethod;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.core.MediaType;
import mil.dds.anet.config.AnetConfiguration;

public class ViewResponseFilter implements ContainerResponseFilter {

  AnetConfiguration config;
  private static final Set<MediaType> uncachedMediaTypes =
      ImmutableSet.of(MediaType.APPLICATION_JSON_TYPE, MediaType.TEXT_HTML_TYPE);

  public ViewResponseFilter(AnetConfiguration config) {
    this.config = config;
  }

  @Override
  public void filter(ContainerRequestContext requestContext,
      ContainerResponseContext responseContext) throws IOException {
    // Don't cache requests other than GET, and don't cache selected media types
    final MediaType mediaType = responseContext.getMediaType();
    if (!HttpMethod.GET.equals(requestContext.getMethod()) || mediaType == null
        || uncachedMediaTypes.stream().anyMatch(mt -> mt.equals(mediaType))) {
      responseContext.getHeaders().put(HttpHeaders.CACHE_CONTROL,
          ImmutableList.of("no-store, no-cache, must-revalidate, post-check=0, pre-check=0"));
      responseContext.getHeaders().put(HttpHeaders.PRAGMA, ImmutableList.of("no-cache"));
    } else {
      responseContext.getHeaders().put(HttpHeaders.CACHE_CONTROL,
          ImmutableList.of("max-age=259200, public"));
    }
  }

}
