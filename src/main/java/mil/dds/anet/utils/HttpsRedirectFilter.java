package mil.dds.anet.utils;

import java.io.IOException;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.core.HttpHeaders;
import org.eclipse.jetty.http.HttpScheme;
import org.eclipse.jetty.util.URIUtil;

public class HttpsRedirectFilter implements Filter {


  @Override
  public void init(FilterConfig filterConfig) throws ServletException {}

  @Override
  public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
      throws IOException, ServletException {
    if (req instanceof HttpServletRequest) {
      final HttpServletRequest request = (HttpServletRequest) req;
      if (HttpScheme.HTTP.asString().equals(request.getScheme())) {
        final String redirectUrl = URIUtil.newURI(HttpScheme.HTTPS.asString(),
            request.getServerName(), 443, request.getRequestURI(), request.getQueryString());
        final HttpServletResponse response = (HttpServletResponse) res;
        response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
        // scan:ignore — false positive, we only redirect from http to https
        response.setHeader(HttpHeaders.LOCATION, redirectUrl);
        return;
      }
    }
    chain.doFilter(req, res);
  }

  @Override
  public void destroy() {}


}
