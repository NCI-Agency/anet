
[![Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](http://anet-demo.azurewebsites.net)
[![Build Status](https://travis-ci.org/NCI-Agency/anet.svg?branch=candidate)](https://travis-ci.org/NCI-Agency/anet)
[![Build Status](https://dev.azure.com/advisornetwork/anet/_apis/build/status/NCI-Agency.anet)](https://dev.azure.com/advisornetwork/anet/_build/latest?definitionId=1)
[![BrowserStack Status](https://www.browserstack.com/automate/badge.svg?badge_key=SHc2WTI5cFg2Z2h2NFVzMWlYbXVkM2xCYTdZMzVPV2FzRUhEVUpEL3NTUT0tLTdFVy9CWmlRa04yMGlCZldialMxc3c9PQ==--097d5f51f524d9e66cffde76b48cc2116bbe3372)](https://www.browserstack.com/automate/public-build/SHc2WTI5cFg2Z2h2NFVzMWlYbXVkM2xCYTdZMzVPV2FzRUhEVUpEL3NTUT0tLTdFVy9CWmlRa04yMGlCZldialMxc3c9PQ==--097d5f51f524d9e66cffde76b48cc2116bbe3372)
[![Docker Pulls](https://img.shields.io/docker/pulls/ncia/anet-app-server.svg)](https://hub.docker.com/r/ncia/anet-app-server/)

## What is ANET?

The Advisor Network ("ANET") is a tool to track relationships between advisors and advisees. ANET was initially built by the [Defense Digital Service](https://www.dds.mil/) in support of the USFOR-A and Resolute Support mission to train, advise, and assist the Afghan government. ANET is currently further developed by the [NATO Communication and Information Agency](https://www.ncia.nato.int/) and published over [here](https://github.com/NCI-Agency/anet). 

Although this tool was built in a very specific context, ANET has many potential applications. At its core, ANET is a way of tracking  reports and tying them to authors, organizations, and goals. It also simplifies relationships between members of an organization, and members of different organizations -- like NATO and the Afghan government. 

In making this software available to the open source community, it is our hope that other groups are able to use ANET to meet their needs. We would also welcome contributions that help improve functionality, add features, and mature this work. 


## Setting up your development environment
This repository is structured in two main, disparate components: the frontend and the backend. The frontend is a react.js based JavaScript application that communicates with the backend via XMLHttpRequest (ajax). The backend is a Java application based the Dropwizard framework that runs on a JVM and utilizes Microsoft SQL Server for its database.


We recommend reading through the documentation in the following order:

1. [Getting your Development Environment Set Up](./docs/dev-setup.md)
1. [Working on the backend](./docs/backend-overview.md)
1. [Working on the frontend](./docs/frontend-overview.md)
1. See [DOCUMENTATION.md](./docs/DOCUMENTATION.md), [INSTALL.md](./docs/INSTALL.md) and [TROUBLESHOOT.md](./docs/TROUBLESHOOT.md) for additional information.
1. See [User Workflows](./docs/User_Workflows_and_Documentation.md) for details on user workflows. 


## Contributing

As part of the Defense Digital Service's goal of bringing technology industry practices to the U.S. Department of Defense, we welcome contributions to this repository from the open source community. If you are interested in contributing to this project, please review `CONTRIBUTING.md` and `LICENSE.md`. Those files describe how to contribute to this work.

Works created by U.S. Federal employees as part of their jobs typically are not eligible for copyright in the United States. In places where the contributions of U.S. Federal employees are not eligible for copyright, this work is in the public domain. In places where it is eligible for copyright, such as some foreign jurisdictions, this work is licensed as described in `LICENSE.md`.


