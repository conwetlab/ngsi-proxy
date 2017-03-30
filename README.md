# ngsi-proxy

You can install the latest stable version of the `ngsi-proxy` by issuing the
followign command:

```
$ npm install -g ngsi-proxy
```

Once installed, you will be able to run the `ngsi-proxy` server by using
the `ngsi-proxy` command. By default, it will be listening on port 3000.

You can use a process manager (e.g. [`pm2`](http://pm2.keymetrics.io/)) for
running `ngsi-proxy` in a production environment:

```
$ npm install -g pm2
$ pm2 startup
$ pm2 start ngsi-proxy
$ pm2 save
```

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
