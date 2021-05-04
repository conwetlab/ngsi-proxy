# ngsi-proxy

[![Tests](https://github.com/conwetlab/ngsi-proxy/workflows/Tests/badge.svg)](https://github.com/conwetlab/ngsi-proxy/actions?query=workflow%3A%22Tests%22)
[![Coverage Status](https://coveralls.io/repos/github/conwetlab/ngsi-proxy/badge.svg?branch=develop)](https://coveralls.io/github/conwetlab/ngsi-proxy?branch=develop)

The [Orion Context Broker](https://github.com/telefonicaid/fiware-orion) is a
great piece of software for managing context information. Using the RESTful API
provided from a web browser is easy and can also be simplified by the use of
some library (e.g. [ngsijs](https://github.com/conwetlab/ngsijs)). However,
there is a limitation, Orion uses `POST` request for sending notifications. This
notification mechanism makes imposible to directly receive them on a web page.
This NGSI proxy creates a server that is capable of receiving `POST`
notifications and redirect them to web pages through an
[Event Source](https://developer.mozilla.org/docs/Web/API/EventSource) endpoint.


## Usage

You can install the latest stable version of the `ngsi-proxy` by issuing the
followign command:

```
$ npm install -g ngsi-proxy
```

Once installed, you will be able to run the `ngsi-proxy` server by directly
using the `ngsi-proxy` command. By default, it will be listening on port 3000,
but you can change it by setting the `PORT` environment variable:

```
$ PORT=10000 ngsi-proxy
```

`ngsi-proxy` will ignore `X-Forwarded-*` headers by default. If you need to
deploy `ngsi-proxy` behind a front-end web server, like Apache or Nginx, you can
enable those headers by setting the `TRUST_PROXY_HEADERS` environment variable:

```
$ TRUST_PROXY_HEADERS=1 ngsi-proxy
```

You can use a process manager (e.g. [pm2](http://pm2.keymetrics.io/)) for
running `ngsi-proxy` in a production environment:

```
$ npm install -g pm2
$ pm2 startup
$ pm2 start ngsi-proxy
$ pm2 save
```

Take a look into the [pm2's documentation](http://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/) for a full list of options.


## Running using docker

ngsi-proxy can also be deployed using a docker container. Take a look into the [docker image documentation](https://hub.docker.com/r/fiware/ngsiproxy/).


## Running from source code

If you want to test the latest development version of the `ngsi-proxy` you will
have to download the git repo by issuing the following command:

```
$ git clone https://github.com/conwetlab/ngsi-proxy.git
```

Once downloaded, you have to install some dependencies:

```
$ cd ngsi-proxy
$ npm install
```

Finally, you will be able to manually run the `ngsi-proxy` service:

```
$ node app.js
```
