import { EventCallbackMode, EventType } from './enum';
import { Application } from './Application';
import { HTTPListener } from './HTTPListener';

export interface ApplicationOptions {
    banner?: string;
    useConsole?: boolean;
    onStartup?: ApplicationEventCallback[] | ApplicationEventCallback;
    onShutdown?: ApplicationEventCallback[] | ApplicationEventCallback;
    startupCallbackMode?: EventCallbackMode;
    shutdownCallbackMode?: EventCallbackMode;
    shutdownTimeout?: number;
    healthCheck?: {
        endpoint?: string | string[];
        userAgent?: string | string[];
    };
}

export interface HealthCheckOptions {
    endpoint: string[];
    userAgent: string[];
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
