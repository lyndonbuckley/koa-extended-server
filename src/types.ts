import { EventCallbackMode, EventType, ListenerType } from './enum';
import { Application } from './class/Application';
import { Context } from 'koa';
import { HTTPListener } from './listener/HTTPListener';
import { BaseListener } from './listener/BaseListener';

export interface ApplicationOptions {
    banner?: string;
    useConsole?: boolean;
    onStartup?: ApplicationEventCallback[] | ApplicationEventCallback;
    onShutdown?: ApplicationEventCallback[] | ApplicationEventCallback;
    startupCallbackMode?: EventCallbackMode;
    shutdownCallbackMode?: EventCallbackMode;
}

export type CallbackArguments = [any?, ...any[]];
export type ApplicationEventCallback<T = CallbackArguments> = (event: ApplicationEvent<T>) => Promise<any> | any;
export type ApplicationListener = HTTPListener;

export interface ApplicationEvent<T = CallbackArguments> {
    type: EventType;
    time: Date;
    app: Application;
    args?: T;
}
