import { BaseListener } from './listener/BaseListener';
import { HTTPListener } from './listener/HTTPListener';

export enum ApplicationRunningState {
    Initialising = 'init',
    Starting = 'starting',
    Ready = 'ready',
    Listening = 'listening',
    ShuttingDown = 'shuttingDown',
}

export enum EventType {
    Startup = 'startup',
    Shutdown = 'shutdown',
    Log = 'log',
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
    Listening = 'listening',
    Request = 'request',
}

export enum ListenerType {
    HTTP = 'http',
}

export enum ListenerState {
    Initialising = 'initialising',
    Listening = 'listening',
    Error = 'error',
}

export enum EventCallbackMode {
    Series = 'series',
    Parallel = 'parallel',
}
