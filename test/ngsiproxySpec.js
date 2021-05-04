/*
 *     Copyright (c) 2018-2021 Future Internet Consulting and Development Solutions S.L.
 *
 *     This file is part of ngsi-proxy.
 *
 *     Ngsi-proxy is free software: you can redistribute it and/or modify it
 *     under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     Ngsi-proxy is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with ngsi-proxy. If not, see <http://www.gnu.org/licenses/>.
 *
 *     Linking this library statically or dynamically with other modules is
 *     making a combined work based on this library.  Thus, the terms and
 *     conditions of the GNU Affero General Public License cover the whole
 *     combination.
 *
 *     As a special exception, the copyright holders of this library give you
 *     permission to link this library with independent modules to produce an
 *     executable, regardless of the license terms of these independent
 *     modules, and to copy and distribute the resulting executable under
 *     terms of your choice, provided that you also meet, for each linked
 *     independent module, the terms and conditions of the license of that
 *     module.  An independent module is a module which is not derived from
 *     or based on this library.  If you modify this library, you may extend
 *     this exception to your version of the library, but you are not
 *     obligated to do so.  If you do not wish to do so, delete this
 *     exception statement from your version.
 *
 */

const request = require("request");
const app = require('../app');
const EventSource = require("eventsource");

describe('ngsi-proxy server', () => {
    var server;

    beforeEach((done) => {
        server = app.listen(4321, done);
    });

    afterEach(() => {
        server.close();
    });

    it('responds to /', (done) => {
        request.get("http://localhost:4321", (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(404);
            done();
        });
    });

    it('404 everything else', (done) => {
        request.get('http://localhost:4321/foo/bar', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(404);
            done();
        });
    });

    describe('support CORS pre-fights', () => {

        const origin = "https://origin.example.com";

        it('eventsource collection endpoint', (done) => {
            request.options({url: 'http://localhost:4321/eventsource', headers: {Origin: origin}}, (error, response, body) => {
                expect(response.headers['access-control-allow-origin']).toBe(origin);
                expect(response.headers['access-control-allow-methods']).toBe('POST, OPTIONS');
                expect(response.headers['access-control-allow-headers']).toBe('X-Requested-With');
                done();
            });
        });

        it('eventsource entry endpoint', (done) => {
            request.options({url: 'http://localhost:4321/eventsource/6d3ab640-345c-11e8-aee8-4fe128ae5aa3', headers: {Origin: origin}}, (error, response, body) => {
                expect(response.headers['access-control-allow-origin']).toBe(origin);
                expect(response.headers['access-control-allow-methods']).toBe('GET, DELETE');
                expect(response.headers['access-control-allow-headers']).toBe('X-Requested-With');
                done();
            });
        });

        it('callbacks collection endpoint', (done) => {
            request.options({url: 'http://localhost:4321/callbacks', headers: {Origin: origin}}, (error, response, body) => {
                expect(response.headers['access-control-allow-origin']).toBe(origin);
                expect(response.headers['access-control-allow-methods']).toBe('OPTIONS, POST');
                expect(response.headers['access-control-allow-headers']).toBe('Content-Type, X-Requested-With');
                done();
            });
        });

        it('callbacks entry endpoint', (done) => {
            request.options({url: 'http://localhost:4321/callbacks/6d3ab640-345c-11e8-aee8-4fe128ae5aa3', headers: {Origin: origin}}, (error, response, body) => {
                expect(response.headers['access-control-allow-origin']).toBe(origin);
                expect(response.headers['access-control-allow-methods']).toBe('DELETE, OPTIONS, POST');
                expect(response.headers['access-control-allow-headers']).toBe('X-Requested-With');
                done();
            });
        });

    });

    it('allow eventsource creation', (done) => {
        request.post('http://localhost:4321/eventsource', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.headers['access-control-allow-origin']).toBe(undefined);
            expect(response.headers['access-control-allow-headers']).toBe(undefined);
            expect(response.headers['access-control-expose-headers']).toBe(undefined);
            expect(response.statusCode).toBe(201);
            done();
        });
    });

    it('allow eventsource creation (CORS)', (done) => {
        const origin = "https://origin.example.com";
        request.post({url: 'http://localhost:4321/eventsource', headers: {Origin: origin}}, (error, response, body) => {
            expect(error).toBe(null);
            expect(response.headers['access-control-allow-origin']).toBe(origin);
            expect(response.headers['access-control-allow-headers']).toBe('X-Requested-With');
            expect(response.headers['access-control-expose-headers']).toBe('Location');
            expect(response.statusCode).toBe(201);
            done();
        });
    });

    it('204 when trying to connect to an inexistent eventsource', (done) => {
        request.get('http://localhost:4321/eventsource/6d3ab640-345c-11e8-aee8-4fe128ae5aa3', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.headers['access-control-allow-origin']).toBe(undefined);
            expect(response.headers['access-control-allow-headers']).toBe(undefined);
            expect(response.headers['access-control-expose-headers']).toBe(undefined);
            expect(response.statusCode).toBe(204);
            done();
        });
    });

    it('allow connect to an eventsource (CORS)', (done) => {
        const payload = "content";
        const origin = "https://origin.example.com";

        request.post('http://localhost:4321/eventsource', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(201);
            let data = JSON.parse(body);

            // TODO use a simple get request to check response headers
            let es = new EventSource(data.url, {headers: {Origin: origin}});
            es.addEventListener("init", (event) => {
                let json = JSON.parse(event.data);
                expect(json.id).toEqual(data.connection_id);
                expect(json.url).toEqual(data.url);
                done();
            });
        });
    });

    it('allow callback creation', (done) => {
        request.post('http://localhost:4321/eventsource', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(201);
            let data = JSON.parse(body);

            request.post({
                    url: 'http://localhost:4321/callbacks',
                    json: true,
                    body: {"connection_id": data.connection_id}
                }, (error, response, body) => {
                    expect(body.url).toBe(response.headers['location']);
                    expect(error).toBe(null);
                    expect(response.headers['access-control-allow-origin']).toBe(undefined);
                    expect(response.headers['access-control-allow-headers']).toBe(undefined);
                    expect(response.headers['access-control-expose-headers']).toBe(undefined);
                    expect(response.statusCode).toBe(201);
                    done();
                }
            );
        });
    });

    it('allow callback creation (CORS)', (done) => {
        const origin = "https://origin.example.com";
        request.post('http://localhost:4321/eventsource', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(201);
            let data = JSON.parse(body);

            request.post({
                    url: 'http://localhost:4321/callbacks',
                    json: true,
                    body: {"connection_id": data.connection_id},
                    headers: {Origin: origin}
                }, (error, response, body) => {
                    expect(body.url).toBe(response.headers['location']);
                    expect(error).toBe(null);
                    expect(response.headers['access-control-allow-origin']).toBe(origin);
                    expect(response.headers['access-control-allow-headers']).toBe('Content-Type, X-Requested-With');
                    expect(response.headers['access-control-expose-headers']).toBe('Location');
                    expect(response.statusCode).toBe(201);
                    done();
                }
            );
        });
    });

    it('callback creation requires a payload', (done) => {
        request.post({
            url: 'http://localhost:4321/callbacks',
            body: ''
        }, (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(400);
            done();
        });
    });

    it('callback creation requires a valid json payload', (done) => {
        request.post({
            url: 'http://localhost:4321/callbacks',
            body: '{invalid]'
        }, (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(400);
            done();
        });
    });

    it('callback creation requires a valid connection_id', (done) => {
        request.post({
            url: 'http://localhost:4321/callbacks',
            json: true,
            body: {"connection_id": "invalid"}
        }, (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(404);
            done();
        });
    });

    it('allow callback deletion', (done) => {
        request.post('http://localhost:4321/eventsource', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(201);
            let data = JSON.parse(body);

            request.post({
                    url: 'http://localhost:4321/callbacks',
                    json: true,
                    body: {"connection_id": data.connection_id}
                }, (error, response, body) => {
                    expect(body.url).toBe(response.headers['location']);
                    expect(response.statusCode).toBe(201);
                    request.delete({
                            url: body.url
                        }, (error, response, body) => {
                            expect(error).toBe(null);
                            expect(response.headers['access-control-allow-origin']).toBe(undefined);
                            expect(response.headers['access-control-allow-headers']).toBe(undefined);
                            expect(response.headers['access-control-expose-headers']).toBe(undefined);
                            expect(response.statusCode).toBe(204);
                            done();
                        }
                    );
                }
            );
        });
    });

    it('allow callback deletion (CORS)', (done) => {
        const origin = "https://origin.example.com";
        request.post('http://localhost:4321/eventsource', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(201);
            let data = JSON.parse(body);

            request.post({
                    url: 'http://localhost:4321/callbacks',
                    json: true,
                    body: {"connection_id": data.connection_id}
                }, (error, response, body) => {
                    expect(body.url).toBe(response.headers['location']);
                    expect(response.statusCode).toBe(201);
                    request.delete({
                            url: body.url,
                            headers: {Origin: origin}
                        }, (error, response, body) => {
                            expect(error).toBe(null);
                            expect(response.headers['access-control-allow-origin']).toBe(origin);
                            expect(response.headers['access-control-allow-headers']).toBe('X-Requested-With');
                            expect(response.headers['access-control-expose-headers']).toBe(undefined);
                            expect(response.statusCode).toBe(204);
                            done();
                        }
                    );
                }
            );
        });
    });

    it('404 deleting an inexistent callback', (done) => {
        request.delete('http://localhost:4321/callbacks/inexistent', (error, response, body) => {
            expect(response.statusCode).toBe(404);
            done();
        });
    });

    it('allow posting into a callback', (done) => {
        const payload = "content";

        request.post('http://localhost:4321/eventsource', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(201);
            let data = JSON.parse(body);
            let callback_id;

            let es = new EventSource(data.url);
            es.addEventListener("notification", (event) => {
                let json = JSON.parse(event.data);
                expect(json.callback_id).toEqual(callback_id);
                expect(JSON.parse(json.payload)).toBe(payload);
                done();
            });

            request.post({
                    url: 'http://localhost:4321/callbacks',
                    json: true,
                    body: {"connection_id": data.connection_id}
                }, (error, response, body) => {
                    expect(response.statusCode).toBe(201);
                    callback_id = body.callback_id;
                    request.post({
                            url: body.url,
                            json: true,
                            body: payload
                        }, (error, response, body) => {
                            expect(response.statusCode).toBe(204);
                        }
                    );
                }
            );
        });
    });

    it('404 posting into an inexistent callback', (done) => {
        request.post('http://localhost:4321/callbacks/inexistent', (error, response, body) => {
            expect(response.statusCode).toBe(404);
            done();
        });
    });

    it('allow eventsource deletion', (done) => {
        request.post('http://localhost:4321/eventsource', (error, response, body) => {
            let data = JSON.parse(body);
            expect(error).toBe(null);
            expect(response.statusCode).toBe(201);
            expect(data.url).toBe(response.headers['location']);
            request.delete(data.url, (error, response, body) => {
                expect(error).toBe(null);
                expect(response.headers['access-control-allow-origin']).toBe(undefined);
                expect(response.headers['access-control-allow-headers']).toBe(undefined);
                expect(response.statusCode).toBe(204);
                done();
            });
        });
    });

    it('allow eventsource deletion (CORS)', (done) => {
        const origin = "https://origin.example.com";
        request.post('http://localhost:4321/eventsource', (error, response, body) => {
            let data = JSON.parse(body);
            expect(error).toBe(null);
            expect(response.statusCode).toBe(201);
            expect(data.url).toBe(response.headers['location']);
            request.delete({url: data.url, headers: {Origin: origin}}, (error, response, body) => {
                expect(error).toBe(null);
                expect(response.headers['access-control-allow-origin']).toBe(origin);
                expect(response.headers['access-control-allow-headers']).toBe('X-Requested-With');
                expect(response.statusCode).toBe(204);
                done();
            });
        });
    });

    it('allow eventsource deletion (with callbacks)', (done) => {
        request.post('http://localhost:4321/eventsource', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(201);
            let data = JSON.parse(body);

            request.post({
                    url: 'http://localhost:4321/callbacks',
                    json: true,
                    body: {"connection_id": data.connection_id}
                }, (error, response, body) => {
                    request.delete(data.url, (error, response, body) => {
                        expect(error).toBe(null);
                        expect(response.headers['access-control-allow-origin']).toBe(undefined);
                        expect(response.headers['access-control-allow-headers']).toBe(undefined);
                        expect(response.statusCode).toBe(204);
                        done();
                    });
                }
            );
        });
    });

    it('404 deleting a inexistent eventsource', (done) => {
        request.delete('http://localhost:4321/eventsource/6d3ab640-345c-11e8-aee8-4fe128ae5aa3', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.statusCode).toBe(404);
            done();
        });
    });

    it('support listing current eventsources', (done) => {
        request.get('http://localhost:4321/eventsources', (error, response, body) => {
            expect(error).toBe(null);
            expect(response.headers['content-type']).toBe('application/xhtml+xml; charset=UTF-8');
            expect(response.statusCode).toBe(200);
            done();
        });
    });

});
