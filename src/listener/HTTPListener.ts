import { createServer, Server } from 'http';

import { ListenerState, ListenerType } from '../enum';
import { BaseListener } from './BaseListener';
import { Application } from '../class/Application';

export class HTTPListener extends BaseListener {
    server: Server;
    app: Application;
    type: ListenerType = ListenerType.HTTP;

    host: string;
    port: number;
    domain?: string;
    url?: string;

    constructor(app: Application, host: string, port: number, domain?: string) {
        super(app);
        this.app = app;
        this.server = createServer(app.callback());
        this.host = host;
        this.port = port;
        this.domain = domain;
    }

    async close(): Promise<any> {
        const listener = this;
        return await new Promise((resolve, reject) => {
            listener.server.close((err) => {
                if (err) reject(err);
                else {
                    resolve();
                }
            });
        });
    }

    getListeningAddress(): string {
        if (this.url) return this.url;

        let url = 'http://';
        url = url + (this.domain || this.host);
        if (this.port !== 80) url = url + ':' + this.port;

        return url + '/';
    }

    async _listen(): Promise<boolean> {
        const { app, server } = this;
        return new Promise((resolve, reject) => {
            try {
                server.listen(this.port, this.host, () => {
                    resolve(true);
                });
            } catch (err) {
                app.error(err);
                reject(false);
            }
        });
    }
}
