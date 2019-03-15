package mil.dds.anet.auth;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.AnetObjectEngine.HandleWrapper;

public class DbHandleFilter implements Filter {

	private final AnetObjectEngine engine;

	public DbHandleFilter(AnetObjectEngine engine) {
		this.engine = engine;
	}

	@Override
	public void init(FilterConfig filterConfig) throws ServletException {
		// nothing to do
	}

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
			throws IOException, ServletException {
		final String path = ((HttpServletRequest) request).getRequestURI();
		if (path.startsWith("/assets/")) {
			// Ignore assets
		    chain.doFilter(request, response);
		} else {
			try (final HandleWrapper h = engine.openDbHandleWrapper()) {
				chain.doFilter(request, response);
			}
		}
	}

	@Override
	public void destroy() {
		// nothing to do
	}

}
