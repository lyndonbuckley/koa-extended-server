import { EventCallbackMode, EventType } from './enum';
import { Application } from './Application';
import { HTTPListener } from './HTTPListener';
import { Context } from 'koa';

export interface ApplicationOptions {
    banner?: string;
    useConsole?: boolean;
    onStartup?: ApplicationEventCallback[] | ApplicationEventCallback;
    onShutdown?: ApplicationEventCallback[] | ApplicationEventCallback;
    onListening?: ApplicationEventCallback[] | ApplicationEventCallback;
    startupCallbackMode?: EventCallbackMode;
    shutdownCallbackMode?: EventCallbackMode;
    listeningCallbackMode?: EventCallbackMode;
    shutdownTimeout?: number;
    sendReadyOnceListening?: boolean;
    healthCheckEndpoint?: string | string[];
    healthCheckUserAgent?: string | string[];
}

export type HealthCheckCallback = (ctx: Context) => Promise<boolean> | boolean;
export type CallbackArguments = [any?, ...any[]];
export type ApplicationEventCallback<T = CallbackArguments> = (event: ApplicationEvent<T>) => Promise<any> | any;
export type ApplicationListener = HTTPListener;

export interface ApplicationEvent<T = CallbackArguments> {
    type: EventType;
    time: Date;
    app: Application;
    args?: T;
}
