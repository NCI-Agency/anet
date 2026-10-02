ARG JAVA_IMAGE=cgr.dev/chainguard/jre:latest
FROM ${JAVA_IMAGE}

WORKDIR /app

COPY lib/ /app/lib/
COPY logback-spring.xml /app/logback-spring.xml

ENV SPRING_PROFILES_ACTIVE=prod \
    SPRING_CONFIG_ADDITIONAL_LOCATION=file:/config/application.yml \
    ANET_DICTIONARY_NAME=/config/anet-dictionary.yml

USER 65532:65532
EXPOSE 8080

ENTRYPOINT ["/usr/bin/java", "-Duser.timezone=UTC", "-cp", "/app/lib/*", "mil.dds.anet.AnetApplication"]
