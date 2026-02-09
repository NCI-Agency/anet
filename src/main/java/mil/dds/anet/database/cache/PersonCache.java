package mil.dds.anet.database.cache;

import java.lang.invoke.MethodHandles;
import java.lang.reflect.InvocationTargetException;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Objects;
import javax.cache.Cache;
import javax.cache.CacheManager;
import javax.cache.Caching;
import javax.cache.spi.CachingProvider;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.User;
import mil.dds.anet.beans.recentActivity.Activity;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.UserDao;
import mil.dds.anet.utils.AnetConstants;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.apache.commons.beanutils.PropertyUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Cache of persons (users) in ANET, used for performance reasons during authentication. Just to be
 * on the safe side, we only cache objects retrieved inside
 * {@link PersonDao#findByDomainUsername(String, boolean)}.
 */
@Component
public class PersonCache {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String EHCACHE_CONFIG = "/ehcache-config.xml";
  private static final String DOMAIN_USERS_CACHE = "domainUsersCache";
  private static final int ACTIVITY_LOG_LIMIT = 10;

  private Cache<String, Person> domainUsersCache;

  public PersonCache() {
    try {
      final CachingProvider cachingProvider = Caching.getCachingProvider();
      final CacheManager manager = cachingProvider.getCacheManager(
          this.getClass().getResource(EHCACHE_CONFIG).toURI(), this.getClass().getClassLoader());
      domainUsersCache = manager.getCache(DOMAIN_USERS_CACHE, String.class, Person.class);
      if (domainUsersCache == null) {
        logger.warn("Caching config for {} not found in {}, proceeding without caching",
            DOMAIN_USERS_CACHE, EHCACHE_CONFIG);
      }
    } catch (URISyntaxException | NullPointerException e) {
      logger.warn("Caching config {} not found, proceeding without caching", EHCACHE_CONFIG);
    }
  }

  public Cache<String, Person> getDomainUsersCache() {
    return domainUsersCache;
  }

  public String clearCache() {
    if (domainUsersCache != null) {
      domainUsersCache.removeAll();
      if (!domainUsersCache.iterator().hasNext()) {
        logger.info(AnetConstants.USERCACHE_MESSAGE);
        return AnetConstants.USERCACHE_MESSAGE;
      }
    }
    logger.warn(AnetConstants.USERCACHE_EMPTY_MESSAGE);
    return AnetConstants.USERCACHE_EMPTY_MESSAGE;
  }

  public void logActivitiesByPersonUuid(String personUuid, Activity activity) {
    final Person person = findInCacheByPersonUuid(personUuid);
    if (person != null) {
      final Deque<Activity> activities = person.getRecentActivities();
      activities.addFirst(activity);
      while (activities.size() > ACTIVITY_LOG_LIMIT) {
        activities.removeLast();
      }
      person.setRecentActivities(activities);
      if (domainUsersCache != null) {
        person.getUsers().forEach(u -> {
          if (u.getDomainUsername() != null) {
            domainUsersCache.replace(u.getDomainUsername(), person);
          }
        });
      }
    }
  }

  /**
   * Evict the person from the cache.
   *
   * @param personUuid the uuid of the person to be evicted from the cache
   */
  public void evictFromCacheByPersonUuid(String personUuid) {
    evictFromCache(findInCacheByPersonUuid(personUuid));
  }

  /**
   * Evict the person holding the position from the cache.
   *
   * @param positionUuid the uuid of the position for the person to be evicted from the cache
   */
  public void evictFromCacheByPositionUuid(String positionUuid) {
    evictFromCache(findInCacheByPositionUuid(positionUuid));
  }

  public Person getFromCache(String domainUsername) {
    if (domainUsersCache == null || domainUsername == null) {
      return null;
    }
    final Person person = domainUsersCache.get(domainUsername);
    // defensively copy the person we return from the cache
    return copyPerson(person);
  }

  public void putInCache(Person person) {
    if (domainUsersCache != null && person != null && !Utils.isEmptyOrNull(person.getUsers())) {
      // defensively copy the person we will be caching
      final Person copy = copyPerson(person);
      if (copy != null) {
        person.getUsers().forEach(u -> domainUsersCache.put(u.getDomainUsername(), copy));
      }
    }
  }

  /**
   * Evict the person from the cache.
   *
   * @param person the person to be evicted from the domain users cache
   */
  public void evictFromCache(Person person) {
    if (domainUsersCache != null && person != null && !Utils.isEmptyOrNull(person.getUsers())) {
      person.getUsers().forEach(u -> domainUsersCache.remove(u.getDomainUsername()));
    }
  }

  public Person findInCache(Person person) {
    return findInCacheByPersonUuid(DaoUtils.getUuid(person));
  }

  private Person findInCacheByPersonUuid(String personUuid) {
    if (domainUsersCache != null && personUuid != null) {
      for (final Cache.Entry<String, Person> entry : domainUsersCache) {
        if (entry != null && Objects.equals(DaoUtils.getUuid(entry.getValue()), personUuid)) {
          return entry.getValue();
        }
      }
    }
    return null;
  }

  private Person findInCacheByPositionUuid(String positionUuid) {
    if (domainUsersCache != null && positionUuid != null) {
      for (final Cache.Entry<String, Person> entry : domainUsersCache) {
        if (entry != null
            && Objects.equals(DaoUtils.getUuid(entry.getValue().getPosition()), positionUuid)) {
          return entry.getValue();
        }
      }
    }
    return null;
  }

  // Make a defensive copy of a person and their position
  private Person copyPerson(Person person) {
    if (person != null) {
      try {
        // Copy person
        final Person personCopy = new Person();
        for (final String prop : PersonDao.allFields) {
          PropertyUtils.setSimpleProperty(personCopy, prop,
              PropertyUtils.getSimpleProperty(person, prop));
        }
        personCopy.setFamilyName(person.getFamilyName());
        personCopy.setGivenName(person.getGivenName());
        // Copy users
        if (!Utils.isEmptyOrNull(person.getUsers())) {
          final List<User> usersCopy = new ArrayList<>();
          for (final User user : person.getUsers()) {
            final User userCopy = new User();
            for (final String prop : UserDao.fields) {
              PropertyUtils.setSimpleProperty(userCopy, prop,
                  PropertyUtils.getSimpleProperty(user, prop));
            }
            usersCopy.add(userCopy);
          }
          personCopy.setUsers(usersCopy);
        }
        // Copy position
        final Position position = person.getPosition();
        if (position != null) {
          final Position positionCopy = new Position();
          for (final String prop : PositionDao.fields) {
            PropertyUtils.setSimpleProperty(positionCopy, prop,
                PropertyUtils.getSimpleProperty(position, prop));
          }
          personCopy.setPosition(positionCopy);
        }
        return personCopy;
      } catch (IllegalAccessException | InvocationTargetException | NoSuchMethodException e) {
        logger.warn("Could not copy person", e);
      }
    }
    return null;
  }
}
