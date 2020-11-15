import { Application } from './class/Application';
import { Context, Next } from 'koa';

const app = new Application({
    banner: 'ExampleApplication/1.0.0',
    useConsole: true,
    onStartup: async() => {
        return await demoCountdown('Starting');
    },
    onShutdown: async() => {
        return await demoCountdown('Shutting Down');
    }
});

app.use(async(ctx:Context, next: Next) => {
    ctx.body = "Hello World";
});

app.addHTTPListener(8080);
app.start().catch((err)=> {
    console.error(err);
});

async function demoCountdown(label: string, limit: number = 5): Promise<boolean> {
    return await new Promise((resolve, reject) =>{
        let count:number = 0;
        function step() {
            count++;
            if (count >= limit)
                resolve(true);
            else
                setTimeout(step, 1000);
        }
        console.info(label + ' in ' + (limit - count + 1));
        setTimeout(step, 1000);
    });
}
