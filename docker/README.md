# Supported tags and respective `Dockerfile` links

-   [`1.2`, `1.2.0`, `FIWARE_7.7.1`, `latest`](https://github.com/conwetlab/ngsi-proxy/blob/1.2.x/docker/Dockerfile)
-   [`1.1`](https://github.com/conwetlab/ngsi-proxy/blob/1.1.x/docker/Dockerfile)
-   [`1.0`](https://github.com/conwetlab/ngsi-proxy/blob/1.0.x/docker/Dockerfile)
-   [`dev`](https://github.com/conwetlab/ngsi-proxy/blob/develop/docker/Dockerfile)

## What is NGSI Proxy?

The [Orion Context Broker](https://github.com/telefonicaid/fiware-orion) is a great piece of software for managing
context information. Using the RESTful API provided from a web browser is easy and can also be simplified by the use of
some library (e.g. [ngsijs](https://github.com/conwetlab/ngsijs)). However, there is a limitation, Orion uses `POST`
request for sending notifications. This notification mechanism makes imposible to directly receive them on a web page.

This NGSI proxy creates a server that is capable of receiving `POST` notifications and redirect them to web pages
through an [Event Source](https://developer.mozilla.org/docs/Web/API/EventSource) endpoint.

## How to use this image

Using [Wirecloud](https://wirecloud.rtfd.io) with an
[Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) requires the presence of an NGSI proxy, a snippet
of a sample `docker-compose` file can be found below.

```yml
version: "3.5"

services:
    ngsi-proxy:
        image: fiware/ngsi-proxy
        hostname: ngsi-proxy
        container_name: ngsi-proxy
        expose:
            - "3000"
        ports:
            - "3000:3000"
        environment:
            - PORT=3000
            - TRUST_PROXY_HEADERS=0
```

## Configuration with environment variables

The Docker container is driven by the environment variables shown below:

-   `PORT` - Port that NGSI Proxy listens on (default `3000`)
-   `TRUST_PROXY_HEADERS` - NGSI Proxy will ignore `X-Forwarded-*` headers by default. If you need to deploy NGSI Proxy
    behind a front-end web server, like Apache or Nginx, you can enable those headers by setting this value to `1`

## How to build an image

The [Dockerfile](https://github.com/conwetlab/ngsi-proxy/blob/develop/docker/Dockerfile) associated with this image can
be used to build an image in several ways:

-   By default, the `Dockerfile` retrieves the **latest** version of the codebase direct from GitHub (the `build-arg` is
    optional):

```console
docker build -t ngsi-proxy . --build-arg DOWNLOAD=latest
```

-   You can alter this to obtain the last **stable** release run this `Dockerfile` with the build argument
    `DOWNLOAD=stable`

```console
docker build -t ngsi-proxy . --build-arg DOWNLOAD=stable
```

-   You can also download a specific release by running this `Dockerfile` with the build argument `DOWNLOAD=<version>`

```console
docker build -t ngsi-proxy . --build-arg DOWNLOAD=1.7.0
```

## Building from your own fork

To download code from your own fork of the GitHub repository add the `GITHUB_ACCOUNT`, `GITHUB_REPOSITORY` and
`SOURCE_BRANCH` arguments (default `master`) to the `docker build` command.

```console
docker build -t ngsi-proxy . \
    --build-arg GITHUB_ACCOUNT=<your account> \
    --build-arg GITHUB_REPOSITORY=<your repo> \
    --build-arg SOURCE_BRANCH=<your branch>
```

## Building from your own source files

Alternatively, if you want to build directly from your own sources, please copy the existing `Dockerfile` into file the
root of the repository and amend it to copy over your local source using :

```Dockerfile
COPY . /opt/ngsi-proxy/
```

Full instructions can be found within the `Dockerfile` itself.

## How to use this image

### start a ngsi-proxy instance

    $ docker run --name ngsi-proxy -p 3000:3000 -d fiware/ngsiproxy

This image includes `EXPOSE ${PORT:-3000}` (default ngsi-proxy port or `PORT` env), so standard container linking will
make it automatically available to the linked containers. In that sense, if the ngsi-proxy service is going to be
accessed from other containers, you will not need to publish port `3000` using the `-p 3000:3000` option.

## License

NGSI Proxy is licensed under the GNU Affero General Public License v3+ (with linking exception).
