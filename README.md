# koa-extended-server
Extended Microservice Server for Koa

```typescript
import {Application} from "koa-extended-server"
import {createConnection, Conection} from "typeorm";

const dbConnection: Connection;
const app = new Application();

// open database connection
app.onStartup(async()=>{
    dbConnection = await createConnection();
    return dbConnection.isConnected;
});

// close database connection
app.onShutdown(async() => {
    if (dbConnection.isConnected)
        await dbConnection.close();
    
    return (dbConnection.isConnected ? false : true)
});

// health check
app.addHealthCheck(() => {
    return dbConnection.isConnected;
});

// HTTP listener
app.addHTTPListener(8080);

// start
app.start();

```
## Intro

This package is a starting point for
common functionality used when creating services and APIs using Koa Framework (https://github.com/koajs)

## Features

- Multiple Listeners
- Graceful Startup/Shutdown (with support for process messages)
- Built-in Health Check Endpoints/Middleware

### Graceful Startup/Shutdown

#### onStartup

Perform operations or checks before starting server - Example use cases:

- Connect to Database ORM
```typescript
const dbConnection: Connection;
async function connectToDatabase(): Promise<boolean> {
 dbConnection = await createConnection();
    return dbConnection.isConnected;
}

const app = new Application();
app.onStartup(connectToDatabase);
```

- Subscribe to PubSub Topic

```typescript
import {PubSub} from '@google-cloud/pubsub';
const pubSubClient = new PubSub();
async function subscribe() {
    const sub = await pubSubClient.topic('TOPIC_NAME').createSubscription('UNIQUE_NAME');
    return sub ? true : false;
}

const app = new Application({
    onStartup: subscribe
})
```


### Health Checks

Specifying userAgent in options
```typescript 
const app = new Application({
    healthCheckEndpoint: '/health-check'
});
```
Specifying userAgent in options
```typescript 
const app = new Application({
    healthCheckUserAgent: 'GoogleHC/1.0'
});
```
Setting via parameter
```typescript 
const app = new Application();
app.healthCheckEndpoint = '/health-check';
app.healthCheckUserAgent = ['GoogleHC/1.0','NS1 HTTP Monitoring Job'];
```
