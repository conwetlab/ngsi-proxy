# Supported tags and respective `Dockerfile` links #

- [`1.1`, `latest`](https://github.com/conwetlab/ngsi-proxy/blob/1.1.x/docker/Dockerfile)
- [`1.0`](https://github.com/conwetlab/ngsi-proxy/blob/1.0.x/docker/Dockerfile)
- [`dev`](https://github.com/conwetlab/ngsi-proxy/blob/develop/docker/Dockerfile)


## What is ngsi-proxy?

The [Orion Context Broker](https://github.com/telefonicaid/fiware-orion) is a great piece of software for managing context information. Using the RESTful API provided from a web browser is easy and can also be simplified by the use of some library (e.g. [ngsijs](https://github.com/conwetlab/ngsijs)). However, there is a limitation, Orion uses `POST` request for sending notifications. This notification mechanism makes imposible to directly receive them on a web page.

This NGSI proxy creates a server that is capable of receiving `POST` notifications and redirect them to web pages through an [Event Source](https://developer.mozilla.org/docs/Web/API/EventSource) endpoint.


## How to use this image

### start a ngsi-proxy instance

    $ docker run --name some-ngsiproxy -p 3000:3000 -d fiware/ngsiproxy

This image includes `EXPOSE 3000` (default ngsi-proxy port), so standard container linking will make it automatically available to the linked containers. In that sense, if the ngsi-proxy service is going to be accessed from other containers, you will not need to publish port `3000` using the `-p 3000:3000` option.


## License

ngsi-proxy is licensed under the GNU Affero General Public License v3+ (with linking exception).
