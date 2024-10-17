# Running ANET and Keycloak behind a reverse proxy
For production, you might want to run ANET and Keycloak behind a reverse proxy, e.g. Nginx. Nginx would then handle the SSL handshakes, and forward the requests to ANET or Keycloak as needed.

## Running ANET and Keycloak behind Nginx

### Nginx configuration
Your `nginx.conf` would look something like this:

```
# For more information on configuration, see:
#   * Official English Documentation: http://nginx.org/en/docs/
#   * Official Russian Documentation: http://nginx.org/ru/docs/

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/doc/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;

    # Set these to prevent "upstream sent too big header"
    proxy_buffer_size         128k;
    proxy_buffers           4 256k;
    proxy_busy_buffers_size   256k;

    server {
        listen       443 ssl;
        server_name  tigeranettrainer.com;

        #ssl on;
        ssl_certificate /etc/letsencrypt/live/tigeranettrainer.com/fullchain.pem; # managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/tigeranettrainer.com/privkey.pem; # managed by Certbot

        #ssl_session_timeout  5m;
        #ssl_protocols  SSLv2 SSLv3 TLSv1;
        #ssl_ciphers  HIGH:!aNULL:!MD5;
        #ssl_prefer_server_ciphers   on;

        # Forward to Keycloak
	location /auth/ {
            proxy_bind 127.0.0.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port 443;
            proxy_pass http://127.0.0.1:9080/auth/;
        }

        # Forward to ANET
	location / {
            proxy_bind 127.0.0.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port 443;
            proxy_pass http://127.0.0.1:8080/;
        }
    }
}

```

### Keycloak configuration
When running Keycloak behind a reverse proxy, a small change to `<keycloak-installation>/standalone/configuration/standalone.xml` is necessary. Change the line:

```
                <http-listener name="default" socket-binding="http" redirect-socket="https" enable-http2="true"/>
```

to:

```
                <http-listener name="default" socket-binding="http" proxy-address-forwarding="true" redirect-socket="https" enable-http2="true"/>
```

See [Keycloak documentation](https://www.keycloak.org/docs/latest/server_installation/#_setting-up-a-load-balancer-or-proxy) for background information.

### ANET configuration
When running ANET behind a reverse proxy, some configuration needs to be done in `application.yml`:

```
# Configuration for the web servers HTTP connectors.
# See https://www.dropwizard.io/en/latest/manual/configuration.html#connectors
server:
  applicationConnectors:
    - type: http
      port: 8080
      bindHost: 127.0.0.1 # only bind to loopback
      acceptorThreads: 2
      selectorThreads: 4
      useForwardedHeaders: true # when running behind reverse proxy
  # The AdminConnector is used for administrative functions of Dropwizard and should not be exposed to users.
  adminConnectors:
    - type: http
      port: 8081
      bindHost: 127.0.0.1 # only bind to loopback
```
