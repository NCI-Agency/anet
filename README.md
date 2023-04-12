[![Build ANET](https://github.com/NCI-Agency/anet/workflows/Build%20ANET/badge.svg)](https://github.com/NCI-Agency/anet/actions)
[![Board Status](https://dev.azure.com/ncia-anet/2aa083a5-af3d-44e1-8c7b-6e9e6b124d91/dea5cef7-9622-4f05-823d-b563717ca3e7/_apis/work/boardbadge/cae09787-9bf7-4800-9bb9-b25c1d2b8c62)](https://dev.azure.com/ncia-anet/2aa083a5-af3d-44e1-8c7b-6e9e6b124d91/_boards/board/t/dea5cef7-9622-4f05-823d-b563717ca3e7/Microsoft.RequirementCategory)

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
1. See [our Storybook on Chromatic](https://www.chromatic.com/build?appId=612fa06864063b003a65dead) for detailed documentation.


## Contributing

As part of the Defense Digital Service's goal of bringing technology industry practices to the U.S. Department of Defense, we welcome contributions to this repository from the open source community. If you are interested in contributing to this project, please review `CONTRIBUTING.md` and `LICENSE.md`. Those files describe how to contribute to this work.

Works created by U.S. Federal employees as part of their jobs typically are not eligible for copyright in the United States. In places where the contributions of U.S. Federal employees are not eligible for copyright, this work is in the public domain. In places where it is eligible for copyright, such as some foreign jurisdictions, this work is licensed as described in `LICENSE.md`.


