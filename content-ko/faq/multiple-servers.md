### HTTPS

HTTPS 프로토콜을 사용하는 애플리케이션을 생성하려면 `NestFactory` 클래스의 `create()` 메소드에 전달되는 옵션 객체에 `httpsOptions` 속성을 설정하세요:

```typescript
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};
const app = await NestFactory.create(AppModule, {
  httpsOptions,
});
await app.listen(process.env.PORT ?? 3000);
```

만약 `FastifyAdapter`를 사용한다면 다음과 같이 애플리케이션을 생성하세요:

```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({ https: httpsOptions }),
);
```

#### 여러 개의 동시 서버

다음 레시피는 여러 포트(예: 비-HTTPS 포트 및 HTTPS 포트)에서 동시에 수신하는 Nest 애플리케이션을 인스턴스화하는 방법을 보여줍니다.

```typescript
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};

const server = express();
const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
await app.init();

const httpServer = http.createServer(server).listen(3000);
const httpsServer = https.createServer(httpsOptions, server).listen(443);
```

우리가 직접 `http.createServer` / `https.createServer`를 호출했기 때문에, NestJS는 `app.close`를 호출하거나 종료 신호를 받을 때 이 서버들을 닫지 않습니다. 우리가 직접 닫아야 합니다:

```typescript
@Injectable()
export class ShutdownObserver implements OnApplicationShutdown {
  private httpServers: http.Server[] = [];

  public addHttpServer(server: http.Server): void {
    this.httpServers.push(server);
  }

  public async onApplicationShutdown(): Promise<void> {
    await Promise.all(
      this.httpServers.map(
        (server) =>
          new Promise((resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
              } else {
                resolve(null);
              }
            });
          }),
      ),
    );
  }
}

const shutdownObserver = app.get(ShutdownObserver);
shutdownObserver.addHttpServer(httpServer);
shutdownObserver.addHttpServer(httpsServer);
```

> info **힌트** `ExpressAdapter`는 `@nestjs/platform-express` 패키지에서 가져옵니다. `http` 및 `https` 패키지는 네이티브 Node.js 패키지입니다.

> **경고** 이 레시피는 [GraphQL Subscriptions](/graphql/subscriptions)에서는 작동하지 않습니다.