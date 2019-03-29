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

public class HttpsRedirectFilter implements Filter {


  @Override
  public void init(FilterConfig filterConfig) throws ServletException {}

  @Override
  public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
      throws IOException, ServletException {
    if (req instanceof HttpServletRequest) {
      HttpServletRequest request = (HttpServletRequest) req;
      if ("http".equals(request.getScheme())) {
        StringBuffer url = request.getRequestURL();
        if (request.getQueryString() != null) {
          url.append("?");
          url.append(request.getQueryString());
        }
        String redirectUrl = url.toString().replaceFirst("http", "https");
        HttpServletResponse response = (HttpServletResponse) res;
        response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
        response.setHeader(HttpHeaders.LOCATION, redirectUrl);
        return;
      }
    }
    chain.doFilter(req, res);
  }

  @Override
  public void destroy() {}


}
