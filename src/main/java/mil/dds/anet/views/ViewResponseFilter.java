package mil.dds.anet.views;

import com.google.common.net.HttpHeaders;
import jakarta.ws.rs.HttpMethod;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.MultivaluedMap;
import java.util.List;
import java.util.Set;

public class ViewResponseFilter implements ContainerResponseFilter {
  private static final Set<MediaType> uncachedMediaTypes =
      Set.of(MediaType.APPLICATION_JSON_TYPE, MediaType.TEXT_HTML_TYPE);

  @Override
  public void filter(ContainerRequestContext requestContext,
      ContainerResponseContext responseContext) {
    // Don't cache requests other than GET, and don't cache selected media types
    final MediaType mediaType = responseContext.getMediaType();
    final MultivaluedMap<String, Object> headers = responseContext.getHeaders();
    final boolean isGet = HttpMethod.GET.equals(requestContext.getMethod());
    if (!isGet || mediaType == null
        || uncachedMediaTypes.stream().anyMatch(mt -> mt.equals(mediaType))) {
      headers.put(HttpHeaders.CACHE_CONTROL,
          List.of("no-store, no-cache, must-revalidate, post-check=0, pre-check=0"));
      headers.put(HttpHeaders.PRAGMA, List.of("no-cache"));
    } else {
      headers.put(HttpHeaders.CACHE_CONTROL, List.of("max-age=259200, public"));
    }
  }
}
