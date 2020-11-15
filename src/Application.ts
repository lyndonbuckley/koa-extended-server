import Koa = require('koa');
import Timer = NodeJS.Timer;
import { Server } from 'http';
import { ApplicationRunningState, EventType, ListenerState } from './enum';
import {
    ApplicationEvent,
    ApplicationEventCallback,
    ApplicationListener,
    ApplicationOptions,
    CallbackArguments,
    HealthCheckOptions,
} from './types';
import { EventHandler } from './EventHandler';
import { HTTPListener } from './HTTPListener';
import { Context, Next } from 'koa';

export class Application extends Koa {
    constructor(opts?: ApplicationOptions) {
        super();

        // events
        this._onStartup = new EventHandler(this, EventType.Startup, opts?.startupCallbackMode, opts?.onStartup);
        this._onShutdown = new EventHandler(this, EventType.Shutdown, opts?.shutdownCallbackMode, opts?.onShutdown);
        this._onListening = new EventHandler(this, EventType.Listening, opts?.listeningCallbackMode, opts?.onListening);
        this._onRequest = new EventHandler(this, EventType.Request);

        this._onLog = new EventHandler(this, EventType.Log);
        this._onInfo = new EventHandler(this, EventType.Info);
        this._onWarn = new EventHandler(this, EventType.Warn);
        this._onError = new EventHandler(this, EventType.Error);

        // options
        if (opts?.banner) this.banner = opts.banner;

        if (opts?.useConsole) this.useConsole();

        if (opts?.healthCheck?.userAgent && Array.isArray(opts.healthCheck.userAgent))
            this.healthCheck.userAgent = opts.healthCheck.userAgent;
        else if (opts?.healthCheck?.userAgent && typeof opts.healthCheck.userAgent === 'string')
            this.healthCheck.userAgent = [opts.healthCheck.userAgent];

        if (opts?.healthCheck?.endpoint && Array.isArray(opts.healthCheck.endpoint))
            this.healthCheck.endpoint = opts.healthCheck.endpoint;
        else if (opts?.healthCheck?.endpoint && typeof opts.healthCheck.endpoint === 'string')
            this.healthCheck.endpoint = [opts.healthCheck.endpoint];

        if (opts?.shutdownTimeout) this._shutdownTimeout = opts.shutdownTimeout;

        // initialising state
        this._runningState = this.setRunningState(ApplicationRunningState.Initialising);

        // listen to process events
        process.on('SIGTERM', this._handleSIGTERM.bind(this));
        process.on('SIGINT', this._handleSIGINT.bind(this));

        this.use(this._healthCheckMiddleware.bind(this));
        this.use(this._requestMiddleware.bind(this));
    }

    // PROXY - by default use proxy headers
    proxy: boolean = true;

    // HEALTH CHECK
    healthCheck: HealthCheckOptions = {
        endpoint: [],
        userAgent: ['GoogleHC/1.0', 'Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)'],
    };

    private async _healthCheckMiddleware(ctx: Context, next: Next) {
        const userAgent = ctx.request.headers['user-agent'] || '';
        if (this.healthCheck.userAgent.indexOf(userAgent) >= 0) return this._handleHealthCheck(ctx);
        if (this.healthCheck.endpoint.indexOf(ctx.path) >= 0) return this._handleHealthCheck(ctx);
        return await next();
    }

    private _handleHealthCheck(ctx: Context) {
        ctx.status = this.runningState === ApplicationRunningState.Listening ? 200 : 503;
        ctx.body = {
            state: this.runningState,
            uptime: process.uptime(),
        };
    }

    private _runningState: ApplicationRunningState;

    get runningState(): ApplicationRunningState {
        return this._runningState;
    }

    private setRunningState(state: ApplicationRunningState) {
        this._runningState = state;
        switch (state) {
            case ApplicationRunningState.ShuttingDown:
                this.warn(this.getBanner(state));
                break;
            default:
                this.info(this.getBanner(state));
        }
        return state;
    }

    banner?: string;

    getBanner(suffix?: string) {
        const banner: string = this.banner || 'KoaExtendedServer';
        if (suffix) return `${banner} ${suffix}`;
        return banner;
    }

    private _onStartup: EventHandler;

    onStartup(func: ApplicationEventCallback) {
        this._onStartup.addSubscriber(func);
    }

    private _onShutdown: EventHandler;

    onShutdown(func: ApplicationEventCallback) {
        this._onShutdown.addSubscriber(func);
    }

    private _onListening: EventHandler;
    onListening(func: ApplicationEventCallback) {
        this._onListening.addSubscriber(func);
    }

    private _onLog: EventHandler;
    onLog(func: ApplicationEventCallback) {
        this._onLog.addSubscriber(func);
    }
    log(...args: CallbackArguments) {
        this._onLog
            .process(args)
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
            });
    }

    private _onInfo: EventHandler;
    onInfo(func: ApplicationEventCallback) {
        this._onInfo.addSubscriber(func);
    }
    info(...args: CallbackArguments) {
        this._onInfo
            .process(args)
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
            });
    }

    private _onWarn: EventHandler;
    onWarn(func: ApplicationEventCallback) {
        this._onWarn.addSubscriber(func);
    }
    warn(...args: CallbackArguments) {
        this._onWarn
            .process(args)
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
            });
    }

    private _onError: EventHandler;
    onError(func: ApplicationEventCallback<CallbackArguments>) {
        this._onError.addSubscriber(func);
    }
    error(...args: CallbackArguments) {
        this._onError
            .process(args)
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
            });
    }

    private _onRequest: EventHandler;
    onRequest(func: ApplicationEventCallback<CallbackArguments>) {
        this._onRequest.addSubscriber(func);
    }
    private processRequest(ctx: Context) {
        const context = JSON.parse(JSON.stringify(ctx));
        this._onRequest.process([context]).catch((err) => {
            this.error(err);
        });
    }

    private _useConsole: boolean = false;
    useConsole() {
        this._useConsole = true;
        this.onLog((event: ApplicationEvent) => {
            console.log.apply(event, event.args || []);
        });
        this.onInfo((event: ApplicationEvent) => {
            console.info.apply(event, event.args || []);
        });
        this.onWarn((event: ApplicationEvent) => {
            console.warn.apply(event, event.args || []);
        });
        this.onError((event: ApplicationEvent) => {
            console.error.apply(event, event.args || []);
        });
    }

    private async processStartup(): Promise<boolean> {
        return this._onStartup.process();
    }
    async start() {
        switch (this._runningState) {
            case ApplicationRunningState.Initialising:
                this.setRunningState(ApplicationRunningState.Starting);

                if (await this.processStartup())
                    this.setRunningState(ApplicationRunningState.Ready);
                else
                    this.error('Startup Callbacks did not all return true');

                if (this.runningState === ApplicationRunningState.Ready)
                    await this.startListeners();

                if (this.getActiveListeners().length > 0) {
                    this.setRunningState(ApplicationRunningState.Listening);
                    await this._onListening.process();
                }
                break;
            case ApplicationRunningState.Starting:
                throw new Error('Called Start function when already starting');
                return;
            case ApplicationRunningState.Ready:
            case ApplicationRunningState.Listening:
                throw new Error('Called Start function when already starting');
                return;
            case ApplicationRunningState.ShuttingDown:
                throw new Error('Called Start function when shutting down');
                return;
        }
    }

    get isReady(): boolean {
        if (this.runningState === ApplicationRunningState.Listening) return true;

        if (this.runningState === ApplicationRunningState.Ready) return true;

        return false;
    }

    private async shutdown() {
        if (this._runningState === ApplicationRunningState.ShuttingDown) return;
        this.setRunningState(ApplicationRunningState.ShuttingDown);
    }

    private _listeners: ApplicationListener[] = [];
    addHTTPListener(port?: number, host?: string, domain?: string): HTTPListener {
        if (!port) port = Number(process.env.PORT) || 8080;
        if (!host) host = '0.0.0.0';
        const listener = new HTTPListener(this, host, port, domain);
        this._listeners.push(listener);
        return listener;
    }

    getActiveListeners() {
        const active: ApplicationListener[] = [];
        let listener: ApplicationListener;
        for (listener of this._listeners) if (listener.state === ListenerState.Listening) active.push(listener);

        return active;
    }

    private async startListeners() {
        let listener: ApplicationListener;
        for (listener of this._listeners) await listener.listen();
    }

    private async _requestMiddleware(ctx: Context, next: Next) {
        ctx._started = new Date();

        // set server banner
        if (this.banner) ctx.set('Server', this.banner);

        // close connection if shutting down
        if (this.runningState === ApplicationRunningState.ShuttingDown) ctx.set('Connection', 'close');

        // 503 if not ready
        if (!this.isReady) return (ctx.status = 503);

        // handle request
        await next();
    }

    private _shutdownTimeout: number = 5000;
    private _shutdownTimer: Timer | null = null;
    private _handleSIGTERM() {
        this.warn('Received SIGTERM');
        this._initShutdown().catch((err) => {
            console.error(err);
            process.exit(-1);
        });
    }
    private _handleSIGINT() {
        this.warn('Received SIGINT');
        this._initShutdown().catch((err) => {
            console.error(err);
            process.exit(-1);
        });
    }
    private async _initShutdown() {
        // exit if already shutting down
        if (this.runningState === ApplicationRunningState.ShuttingDown) return;

        // change state to shutting down
        this.setRunningState(ApplicationRunningState.ShuttingDown);

        // create shutdown timeout
        const timeout = setTimeout(() => {
            this.error('Shutdown timeout reached');
            process.exit(-1);
        }, this._shutdownTimeout);

        // attempt shutdown
        const result = await this._onShutdown.process();
        if (result) process.exit(0);
        else if (result) process.exit(-1);
    }

    usePM2() {
        this.onListening(() => {
            if (process && process.send)
                process.send('ready');
        });
    }
}
