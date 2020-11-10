import Koa = require('koa');
import { Server, createServer } from 'http';

export class KoaExtendedServer extends Koa {
    httpServer: Server;
    banner: string = 'koa';
    shutdownFunctions: (() => void)[] = [];
    isShuttingDown: boolean = false;
    isReady: boolean = false;
    sendReady: boolean = true;
    readyOnceListening: boolean = true;
    shutdownTimeout = 30000;

    listeningAddress: string | null = null;
    listeningPort: number | null = null;

    constructor() {
        super();
        this.httpServer = createServer(this.callback());
        this.use(this.firstMiddleware.bind(this));

        const callback = this.listeningCallback.bind(this);
        this.httpServer.on('listening', function (this: Server) {
            callback(this);
        });
        process.on('SIGTERM', this.processShutdown.bind(this));
        process.on('SIGINT', this.processShutdown.bind(this));
    }

    onShutdown(func: () => void) {
        this.shutdownFunctions.push(func);
    }

    private async firstMiddleware(ctx: Koa.Context, next: Koa.Next) {
        if (this.banner) ctx.set('Server', this.banner);

        if (!this.isShuttingDown) return await next();

        // shutting down
        ctx.status = 503;
        ctx.set('Connection', 'close');
    }

    private processShutdown() {
        if (this.isShuttingDown) return;

        this.isShuttingDown = true;
        this.isReady = false;
        console.warn(this.banner + ' shutting down ...');

        const app = this;
        (async() => {
            let f: () => void;
            for (f of app.shutdownFunctions) {
                f.bind(app);
                await f();
            }
            app.httpServer.close(() => {
                console.info(app.banner + ' connections closed');
                process.exit(0);
            });

            setTimeout(() => {
                console.error('Forcing exit - unable to close connections in time');
                process.exit(1);
            }, app.shutdownTimeout);
        })();

    }

    private listeningCallback(listener: Server) {
        const listeningAt = listener.address();
        if (listeningAt && typeof listeningAt === 'object') {
            this.listeningAddress = listeningAt.address;
            this.listeningPort = listeningAt.port;
            console.info(`${this.banner} listening on ${this.listeningAddress}:${this.listeningPort}`);
        }
        if (this.readyOnceListening) this.ready();
    }

    http(port?: number, host?: string) {
        if (!port) port = Number(process.env.PORT) || 8080;

        if (!host) host = '0.0.0.0';

        const callback = this.listeningCallback.bind(this);
        this.listen(port, host, function (this: Server) {
            callback(this);
        });
    }

    ready() {
        this.isReady = true;
        console.info(this.banner + ' is ready.');
        if (this.sendReady && process.send) process.send('ready');
    }
}
