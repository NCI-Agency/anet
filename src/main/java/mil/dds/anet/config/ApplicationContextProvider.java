package mil.dds.anet.config;

import mil.dds.anet.AnetObjectEngine;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

@Component
public class ApplicationContextProvider implements ApplicationContextAware {
  private static ApplicationContext applicationContext;

  @Override
  public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
    ApplicationContextProvider.applicationContext = applicationContext;
  }

  public static ApplicationContext getApplicationContext() {
    return applicationContext;
  }

  public static <T> T getBean(Class<T> requiredType) throws BeansException {
    return applicationContext.getBean(requiredType);
  }

  public static AnetObjectEngine getEngine() {
    return getBean(AnetObjectEngine.class);
  }

  public static AnetDictionary getDictionary() {
    return getBean(AnetDictionary.class);
  }
}
