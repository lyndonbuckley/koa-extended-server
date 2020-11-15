import { Application } from './Application';
import { EventCallbackMode, EventType } from '../enum';
import { ApplicationEvent, ApplicationEventCallback, CallbackArguments } from '../types';

export class EventHandler<T = CallbackArguments> {
    app: Application;
    type: EventType;
    callbacks: ApplicationEventCallback<T>[] = [];
    mode: EventCallbackMode;

    constructor(app: Application, type: EventType, mode?:EventCallbackMode, callbacks?: ApplicationEventCallback<T>[] | ApplicationEventCallback<T>) {
        this.app = app;
        this.type = type;

        if (!mode && [EventType.Startup, EventType.Shutdown].indexOf(type) >= 0)
            mode = EventCallbackMode.Series;
        else if (!mode)
            mode = EventCallbackMode.Parallel;
        this.mode = mode;

        if (callbacks && Array.isArray(callbacks))
            this.callbacks = callbacks;
        else if (callbacks) {
            this.callbacks = [callbacks];
        }
    }

    addSubscriber(callback: ApplicationEventCallback<T>) {
        this.callbacks.push(callback);
    }

    async process(args?: T): Promise<boolean> {
        console.info('process', this.type, args);

        const event: ApplicationEvent<T> = {
            type: this.type,
            time: new Date(),
            app: this.app,
            args
        }

        const promises = [];
        let callback: ApplicationEventCallback<T>;
        for (callback of this.callbacks) {
            const process = this.processCallback(event, callback);
            promises.push(process);
            if (this.mode === EventCallbackMode.Series)
                await process;
        }

        const results = await Promise.all(promises);
        let result: boolean = true;
        if (results.indexOf(false) >= 0)
            result = false;
        return result;
    }

    private async processCallback(event: ApplicationEvent<T>, callback: ApplicationEventCallback<T>): Promise<boolean> {
        try {
            // trigger callback
            const cb = callback.bind(event);
            const result = cb.apply(this.app, [event]);
            if (result instanceof Promise)
                await result;

            return true;
        } catch(err) {
            console.error(err);
            return false;
        }
    }
}





