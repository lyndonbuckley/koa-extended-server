
import { ListenerState, ListenerType } from '../enum';
import { Application } from '../class/Application';

export class BaseListener {
    app: Application;
    type?: ListenerType;
    shutdownTimeout: number = 30000;
    state: ListenerState = ListenerState.Initialising;

    constructor(app: Application) {
        this.app = app;
    }

    private _shutdownTimer: any;
    private shutdownTimedOut() {
        const error = 'Unable to shutdown ' + this.app.getBanner() + ' listener at ' + this.getListeningAddress();
        this.app.error(error);
        process.exit(1);
    }



    async shutdown() {
        if (this._shutdownTimer)
            return;

        this._shutdownTimer = setTimeout(
            this.shutdownTimedOut.bind(this),
            this.shutdownTimeout
        );

        try {
            await this.close();
            if (this._shutdownTimer)
                clearTimeout(this._shutdownTimer);
        } catch (err) {
            this.shutdownTimedOut();
        }
    }

    async listen(): Promise<boolean> {
        return false;
    }

    async close(): Promise<boolean> {
        return false;
    }

    getListeningAddress(): string {
        return '';
    }
}
