# anet-mssql
# Maintainers: NCI Agency (VassilIordanov on GitHub)
# GitRepo: https://github.com/NCI-Agency/anet

FROM ubuntu:16.04

RUN export DEBIAN_FRONTEND=noninteractive ACCEPT_EULA=Y && \
    apt-get update && \
    apt-get install -y apt-transport-https curl  && \
    curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/ubuntu/16.04/mssql-server-2017.list | tee /etc/apt/sources.list.d/mssql-server.list && \
    curl https://packages.microsoft.com/config/ubuntu/16.04/prod.list | tee /etc/apt/sources.list.d/msprod.list && \
    apt-get update && \
    apt-get install -y mssql-server=14.0.3223.3-15 mssql-server-fts=14.0.3223.3-15 mssql-tools unixodbc-dev locales sudo && \
    rm -rf /var/lib/apt/lists/* && \
    locale-gen en_US.UTF-8
    

ADD entrypoint.sh /opt/
ADD waitTillServiceStarted.sh /opt/

EXPOSE 1433

ENTRYPOINT /opt/entrypoint.sh
