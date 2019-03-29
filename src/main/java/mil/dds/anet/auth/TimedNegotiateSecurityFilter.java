package mil.dds.anet.auth;

import com.codahale.metrics.MetricRegistry;
import com.codahale.metrics.Timer;
import com.codahale.metrics.annotation.Timed;
import java.io.IOException;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import waffle.servlet.NegotiateSecurityFilter;
import waffle.servlet.spi.SecurityFilterProviderCollection;
import waffle.windows.auth.IWindowsAuthProvider;
import waffle.windows.auth.PrincipalFormat;

public class TimedNegotiateSecurityFilter extends NegotiateSecurityFilter {

  private final Timer timerDoFilter;
  private final Timer timerInit;
  private final Timer timerSetPrincipalFormat;
  private final Timer timerGetPrincipalFormat;
  private final Timer timerSetRoleFormat;
  private final Timer timerGetRoleFormat;
  private final Timer timerGetAuth;
  private final Timer timerSetAuth;
  private final Timer timerIsAllowGuestLogin;
  private final Timer timerSetImpersonate;
  private final Timer timerIsImpersonate;
  private final Timer timerGetProviders;

  public TimedNegotiateSecurityFilter(MetricRegistry metricRegistry) {
    this.timerDoFilter = metricRegistry.timer(MetricRegistry.name(this.getClass(), "doFilter"));
    this.timerInit = metricRegistry.timer(MetricRegistry.name(this.getClass(), "init"));
    this.timerSetPrincipalFormat =
        metricRegistry.timer(MetricRegistry.name(this.getClass(), "setPrincipalFormat"));
    this.timerGetPrincipalFormat =
        metricRegistry.timer(MetricRegistry.name(this.getClass(), "getPrincipalFormat"));
    this.timerSetRoleFormat =
        metricRegistry.timer(MetricRegistry.name(this.getClass(), "setRoleFormat"));
    this.timerGetRoleFormat =
        metricRegistry.timer(MetricRegistry.name(this.getClass(), "getRoleFormat"));
    this.timerGetAuth = metricRegistry.timer(MetricRegistry.name(this.getClass(), "setAuth"));
    this.timerSetAuth = metricRegistry.timer(MetricRegistry.name(this.getClass(), "getAuth"));
    this.timerIsAllowGuestLogin =
        metricRegistry.timer(MetricRegistry.name(this.getClass(), "isAllowGuestLogin"));
    this.timerSetImpersonate =
        metricRegistry.timer(MetricRegistry.name(this.getClass(), "setImpersonate"));
    this.timerIsImpersonate =
        metricRegistry.timer(MetricRegistry.name(this.getClass(), "isImpersonate"));
    this.timerGetProviders =
        metricRegistry.timer(MetricRegistry.name(this.getClass(), "getProviders"));
  }

  @Timed
  @Override
  public void doFilter(ServletRequest sreq, ServletResponse sres, FilterChain chain)
      throws IOException, ServletException {
    final Timer.Context context = timerDoFilter.time();
    try {
      super.doFilter(sreq, sres, chain);
    } finally {
      context.stop();
    }
  }

  @Timed
  @Override
  public void init(FilterConfig filterConfig) throws ServletException {
    final Timer.Context context = timerInit.time();
    try {
      super.init(filterConfig);
    } finally {
      context.stop();
    }
  }

  @Timed
  @Override
  public void setPrincipalFormat(String format) {
    final Timer.Context context = timerSetPrincipalFormat.time();
    try {
      super.setPrincipalFormat(format);
    } finally {
      context.stop();
    }
  }

  @Timed
  @Override
  public PrincipalFormat getPrincipalFormat() {
    final Timer.Context context = timerGetPrincipalFormat.time();
    try {
      return super.getPrincipalFormat();
    } finally {
      context.stop();
    }
  }

  @Timed
  @Override
  public void setRoleFormat(String format) {
    final Timer.Context context = timerSetRoleFormat.time();
    try {
      super.setRoleFormat(format);
    } finally {
      context.stop();
    }
  }

  @Timed
  @Override
  public PrincipalFormat getRoleFormat() {
    final Timer.Context context = timerGetRoleFormat.time();
    try {
      return super.getRoleFormat();
    } finally {
      context.stop();
    }
  }

  @Timed
  @Override
  public void setAuth(IWindowsAuthProvider provider) {
    final Timer.Context context = timerGetAuth.time();
    try {
      super.setAuth(provider);
    } finally {
      context.stop();
    }
  }

  @Timed
  @Override
  public IWindowsAuthProvider getAuth() {
    final Timer.Context context = timerSetAuth.time();
    try {
      return super.getAuth();
    } finally {
      context.stop();
    }
  }

  @Timed
  @Override
  public boolean isAllowGuestLogin() {
    final Timer.Context context = timerIsAllowGuestLogin.time();
    try {
      return super.isAllowGuestLogin();
    } finally {
      context.stop();
    }
  }

  @Timed
  @Override
  public void setImpersonate(boolean value) {
    final Timer.Context context = timerSetImpersonate.time();
    try {
      super.setImpersonate(value);
    } finally {
      context.stop();
    }
  }

  @Timed
  @Override
  public boolean isImpersonate() {
    final Timer.Context context = timerIsImpersonate.time();
    try {
      return super.isImpersonate();
    } finally {
      context.stop();
    }
  }

  @Timed
  @Override
  public SecurityFilterProviderCollection getProviders() {
    final Timer.Context context = timerGetProviders.time();
    try {
      return super.getProviders();
    } finally {
      context.stop();
    }
  }

}
