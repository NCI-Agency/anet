package mil.dds.anet.config;

import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_COUNTRY;
import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_EMAIL_ADDRESSES;
import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_EMAIL_NETWORK;
import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_ENTITY_AVATAR;
import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_GENDER;
import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_PHONE_NUMBER;
import static mil.dds.anet.beans.ldap.LdapPersonRecord.LDAP_PHONE_TYPE;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.List;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PhoneNumber;
import mil.dds.anet.beans.ldap.LdapPersonRecord;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.EntityAvatarDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.utils.Utils;
import org.apache.tika.Tika;
import org.apache.tika.io.TikaInputStream;
import org.apache.tika.mime.MimeType;
import org.apache.tika.mime.MimeTypeException;
import org.apache.tika.mime.MimeTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.ldap.core.ContextMapper;
import org.springframework.ldap.core.DirContextAdapter;
import org.springframework.stereotype.Component;

@Component
public class LdapImportConfig {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String PERSON_LDAP_IMPORT_SETTINGS_KEY = "fields.person.ldapImport";
  private static final String ENABLED_KEY = "enabled";
  private static final String SEARCH_BASE_KEY = "searchBase";
  private static final String ATTRIBUTE_MAPPINGS_KEY = "attributeMappings";

  // Formatter covering LDAP GeneralizedTime variations (e.g., 20260811164400Z, 20260811164400.123Z)
  private static final DateTimeFormatter LDAP_DATE_FORMATTER = new DateTimeFormatterBuilder()
      .appendPattern("yyyyMMddHHmmss").optionalStart()
      .appendFraction(java.time.temporal.ChronoField.MILLI_OF_SECOND, 1, 3, true).optionalEnd()
      .appendLiteral('Z').toFormatter(java.util.Locale.ENGLISH).withZone(java.time.ZoneOffset.UTC);

  private final AnetDictionary dict;
  private final AttachmentDao attachmentDao;
  private final EntityAvatarDao entityAvatarDao;

  @FunctionalInterface
  public interface Function3Arity<A, B, C, R> {
    R apply(A a, B b, C c);
  }

  private final Map<String, Function3Arity<Person, String, Map<String, Location>, Void>> attributeSetters =
      Map.of( // -
          LDAP_EMAIL_ADDRESSES, this::setEmailAddresses, // -
          LDAP_PHONE_NUMBER, this::setPhoneNumber, // -
          LDAP_COUNTRY, this::setCountry, // -
          LDAP_GENDER, this::setGender // -
      );

  private final Map<String, Function3Arity<Person, Object, Map<String, Location>, Void>> attributeSettersAfterSave =
      Map.of( // -
          LDAP_ENTITY_AVATAR, this::setEntityAvatar // -
      );

  public LdapImportConfig(AnetDictionary dict, AttachmentDao attachmentDao,
      EntityAvatarDao entityAvatarDao) {
    this.dict = dict;
    this.attachmentDao = attachmentDao;
    this.entityAvatarDao = entityAvatarDao;
  }

  public boolean isLdapImportEnabled() {
    return Boolean.TRUE.equals(dict.getDictionaryEntry("enableLdapImport"));
  }

  public boolean isLdapImportPeopleEnabled() {
    return isLdapImportEnabled() && Boolean.TRUE.equals(
        dict.getDictionaryEntry("%s.%s".formatted(PERSON_LDAP_IMPORT_SETTINGS_KEY, ENABLED_KEY)));
  }

  public String getPersonSearchBase() {
    return (String) dict
        .getDictionaryEntry("%s.%s".formatted(PERSON_LDAP_IMPORT_SETTINGS_KEY, SEARCH_BASE_KEY));
  }

  public Map<String, String> getPersonAttributeMappings() {
    @SuppressWarnings("unchecked")
    final Map<String, String> attributeMappings = (Map<String, String>) dict.getDictionaryEntry(
        "%s.%s".formatted(PERSON_LDAP_IMPORT_SETTINGS_KEY, ATTRIBUTE_MAPPINGS_KEY));
    return attributeMappings;
  }

  public ContextMapper<LdapPersonRecord> getLdapPersonRecordMapper() {
    final Map<String, String> attributeMappings = getPersonAttributeMappings();
    return ctx -> {
      final DirContextAdapter adapter = (DirContextAdapter) ctx;
      final LdapPersonRecord person = new LdapPersonRecord();
      attributeMappings.forEach((internalField, ldapAttribute) -> {
        final Object rawValue = adapter.getObjectAttribute(ldapAttribute);
        person.set(internalField, rawValue);
      });
      return person;
    };
  }

  public void mapInto(LdapPersonRecord ldapPersonRecord, Person person,
      Map<String, Location> countries) {
    final Map<String, String> attributeMappings = getPersonAttributeMappings();
    final BeanWrapper beanWrapper = new BeanWrapperImpl(person);

    attributeMappings.forEach((internalField, ldapAttribute) -> {
      final Object rawValue = ldapPersonRecord.get(internalField);

      if (rawValue instanceof String value
          && !Utils.isEmptyOrNull(Utils.trimStringReturnNull(value))) {
        if (attributeSetters.containsKey(internalField)) {
          final Function3Arity<Person, String, Map<String, Location>, Void> attributeSetter =
              attributeSetters.get(internalField);
          attributeSetter.apply(person, value, countries);
        } else if (beanWrapper.isWritableProperty(internalField)) {
          final Class<?> propertyType = beanWrapper.getPropertyType(internalField);

          try {
            if (Instant.class.isAssignableFrom(propertyType)) {
              // Parse LDAP generalized text format to Instant
              final Instant instantValue = Instant.from(LDAP_DATE_FORMATTER.parse(value));
              beanWrapper.setPropertyValue(internalField, instantValue);
            } else {
              // Fallback to default raw String mapping
              beanWrapper.setPropertyValue(internalField, value);
            }
          } catch (Exception e) {
            logger.warn("Failed to map field {} with value: {}", internalField, value, e);
          }
        }
      }
    });
  }

  public void mapAfterSave(LdapPersonRecord ldapPersonRecord, Person person,
      Map<String, Location> countries) {
    final Map<String, String> attributeMappings = getPersonAttributeMappings();
    attributeMappings.forEach((internalField, ldapAttribute) -> {
      final Function3Arity<Person, Object, Map<String, Location>, Void> attributeSetter =
          attributeSettersAfterSave.get(internalField);
      if (attributeSetter != null) {
        final Object rawValue = ldapPersonRecord.get(internalField);
        try {
          attributeSetter.apply(person, rawValue, countries);
        } catch (Exception e) {
          logger.warn("Failed to map field {} after save", internalField, e);
        }
      }
    });
  }

  private Void setEmailAddresses(Person person, String value, Map<String, Location> countries) {
    person.setEmailAddresses(List.of(new EmailAddress(LDAP_EMAIL_NETWORK, value)));
    return null;
  }

  private Void setPhoneNumber(Person person, String value, Map<String, Location> countries) {
    person.setPhoneNumber(List.of(new PhoneNumber(LDAP_PHONE_TYPE, value)));
    return null;
  }

  private Void setCountry(Person person, String value, Map<String, Location> countries) {
    person.setCountry(countries.get(value));
    return null;
  }

  private Void setGender(Person person, String value, Map<String, Location> countries) {
    person.setGender(switch (value.substring(0, 1).toUpperCase()) {
      case "M" -> "MALE";
      case "F", "W" -> "FEMALE";
      default -> "NOT SPECIFIED";
    });
    return null;
  }

  private Void setEntityAvatar(Person person, Object value, Map<String, Location> countries) {
    final byte[] content = (byte[]) value;
    if (content == null || content.length == 0) {
      return null;
    }
    final String detectedMimeType = detectMimeType(content);
    if (!AttachmentResource.getAllowedMimeTypes().contains(detectedMimeType)) {
      logger.info("Detected mime type {} is not allowed", detectedMimeType);
      return null;
    }
    final MimeType mimeType;
    try {
      mimeType = MimeTypes.getDefaultMimeTypes().getRegisteredMimeType(detectedMimeType);
    } catch (MimeTypeException e) {
      logger.info("Detected mime type {} is unknown", detectedMimeType);
      return null;
    }

    if (!Utils.isEmptyOrNull(person.getUuid())) {
      // Existing person, check for any existing attachment with the same ldapUuid
      final List<Attachment> existingAttachments =
          attachmentDao.getAttachmentsByLdapUuid(person.getLdapUuid());
      if (!existingAttachments.isEmpty()) {
        final AnetObjectEngine engine = ApplicationContextProvider.getEngine();
        existingAttachments.forEach(existingAttachment -> {
          final List<GenericRelatedObject> relatedObjects =
              existingAttachment.loadAttachmentRelatedObjects(engine.getContext()).join();
          final List<GenericRelatedObject> personRelatedObjects = relatedObjects.stream()
              .filter(ro -> person.getUuid().equals(ro.getRelatedObjectUuid())).toList();
          if (relatedObjects.size() == personRelatedObjects.size()) {
            // Only linked to this person, delete the attachment
            attachmentDao.delete(existingAttachment.getUuid());
          } else {
            // Linked to other objects, just unlink this person from the attachment
            attachmentDao.deleteAttachmentRelatedObjects(existingAttachment.getUuid(),
                personRelatedObjects);
            // Clear ldapUuid
            existingAttachment.setLdapUuid(null);
            attachmentDao.updateLdapFields(existingAttachment);
          }
        });
      }
    }

    // Create attachment
    final Attachment attachment = new Attachment();
    attachment.setAuthor(person);
    attachment.setMimeType(detectedMimeType);
    attachment.setCaption("Photo");
    attachment.setFileName("photo%s".formatted(mimeType.getExtension()));
    attachment.setContentLength((long) content.length);
    attachment.setClassification((String) dict.getDictionaryEntry("siteClassification"));

    // Wire related object
    final GenericRelatedObject relatedObject = new GenericRelatedObject();
    relatedObject.setRelatedObjectType(PersonDao.TABLE_NAME);
    relatedObject.setRelatedObjectUuid(person.getUuid());
    attachment.setAttachmentRelatedObjects(List.of(relatedObject));

    // Save it
    attachmentDao.insert(attachment);
    // Set ldapUuid
    attachment.setLdapUuid(person.getLdapUuid());
    attachmentDao.updateLdapFields(attachment);

    // Save attachment content
    try (final ByteArrayInputStream attachmentContent = new ByteArrayInputStream(content)) {
      attachmentDao.saveContentBlob(attachment.getUuid(), attachmentContent);
    } catch (IOException e) {
      logger.error("Saving attachment content for attachment {} failed", attachment, e);
    }

    // Set as entity avatar
    final EntityAvatar entityAvatar = new EntityAvatar();
    entityAvatar.setAttachmentUuid(attachment.getUuid());
    entityAvatar.setApplyCrop(false);
    entityAvatar.setRelatedObjectType(PersonDao.TABLE_NAME);
    entityAvatar.setRelatedObjectUuid(person.getUuid());
    person.setEntityAvatar(entityAvatar);
    entityAvatarDao.upsert(entityAvatar);

    return null;
  }

  private String detectMimeType(byte[] content) {
    try (final TikaInputStream tikaInputStream = TikaInputStream.get(content)) {
      return new Tika().detect(tikaInputStream);
    } catch (IOException e) {
      return null;
    }
  }
}
