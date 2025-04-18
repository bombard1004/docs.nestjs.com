### 어댑터

WebSockets 모듈은 플랫폼에 독립적이므로, `WebSocketAdapter` 인터페이스를 사용하여 고유한 라이브러리(또는 네이티브 구현)를 가져올 수 있습니다. 이 인터페이스는 다음 표에 설명된 몇 가지 메서드를 구현하도록 강제합니다.

<table>
  <tr>
    <td><code>create</code></td>
    <td>전달된 인수를 기반으로 소켓 인스턴스를 생성합니다.</td>
  </tr>
  <tr>
    <td><code>bindClientConnect</code></td>
    <td>클라이언트 연결 이벤트를 바인딩합니다.</td>
  </tr>
  <tr>
    <td><code>bindClientDisconnect</code></td>
    <td>클라이언트 연결 해제 이벤트를 바인딩합니다(선택 사항*).</td>
  </tr>
  <tr>
    <td><code>bindMessageHandlers</code></td>
    <td>들어오는 메시지를 해당 메시지 핸들러에 바인딩합니다.</td>
  </tr>
  <tr>
    <td><code>close</code></td>
    <td>서버 인스턴스를 종료합니다.</td>
  </tr>
</table>

#### socket.io 확장하기

[socket.io](https://github.com/socketio/socket.io) 패키지는 `IoAdapter` 클래스로 래핑됩니다. 어댑터의 기본 기능을 향상시키고 싶다면 어떻게 해야 할까요? 예를 들어, 기술 요구 사항에 따라 웹 서비스의 여러 로드 밸런싱된 인스턴스 간에 이벤트를 브로드캐스트하는 기능이 필요할 수 있습니다. 이를 위해 `IoAdapter`를 확장하고 새로운 socket.io 서버를 인스턴스화하는 단일 메서드를 오버라이드할 수 있습니다. 하지만 우선, 필요한 패키지를 설치해봅시다.

> warning **경고** 여러 로드 밸런싱된 인스턴스에서 socket.io를 사용하려면 클라이언트 socket.io 설정에서 `transports: ['websocket']`을 설정하여 폴링을 비활성화하거나, 로드 밸런서에서 쿠키 기반 라우팅을 활성화해야 합니다. Redis만으로는 충분하지 않습니다. 자세한 내용은 [여기](https://socket.io/docs/v4/using-multiple-nodes/#enabling-sticky-session)를 참조하세요.

```bash
$ npm i --save redis socket.io @socket.io/redis-adapter
```

패키지가 설치되면 `RedisIoAdapter` 클래스를 생성할 수 있습니다.

```typescript
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: `redis://localhost:6379` });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

그 후, 새로 생성한 Redis 어댑터로 간단히 전환합니다.

```typescript
const app = await NestFactory.create(AppModule);
const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis();

app.useWebSocketAdapter(redisIoAdapter);
```

#### Ws 라이브러리

사용 가능한 또 다른 어댑터는 `WsAdapter`이며, 이는 프레임워크와 매우 빠르고 철저하게 테스트된 [ws](https://github.com/websockets/ws) 라이브러리 사이의 프록시 역할을 합니다. 이 어댑터는 네이티브 브라우저 WebSockets와 완벽하게 호환되며 socket.io 패키지보다 훨씬 빠릅니다. 아쉽게도 기본적으로 사용할 수 있는 기능이 훨씬 적습니다. 그러나 어떤 경우에는 이러한 기능이 꼭 필요하지 않을 수도 있습니다.

> info **팁** `ws` 라이브러리는 네임스페이스(`socket.io`에 의해 보급된 통신 채널)를 지원하지 않습니다. 그러나 이 기능을 어느 정도 모방하기 위해 서로 다른 경로에 여러 `ws` 서버를 마운트할 수 있습니다(예: `@WebSocketGateway({{ '{' }} path: '/users' {{ '}' }})`).

`ws`를 사용하기 위해서는 먼저 필요한 패키지를 설치해야 합니다:

```bash
$ npm i --save @nestjs/platform-ws
```

패키지가 설치되면 어댑터를 전환할 수 있습니다.

```typescript
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new WsAdapter(app));
```

> info **팁** `WsAdapter`는 `@nestjs/platform-ws`에서 임포트됩니다.

`wsAdapter`는 `{{ '{' }} event: string, data: any {{ '}' }}` 형식의 메시지를 처리하도록 설계되었습니다. 다른 형식으로 메시지를 수신 및 처리해야 하는 경우, 메시지 파서를 구성하여 필요한 형식으로 변환해야 합니다.

```typescript
const wsAdapter = new WsAdapter(app, {
  // [event, data] 형식의 메시지를 처리하기 위해
  messageParser: (data) => {
    const [event, payload] = JSON.parse(data.toString());
    return { event, data: payload };
  },
});
```

또는 어댑터 생성 후 `setMessageParser` 메서드를 사용하여 메시지 파서를 구성할 수 있습니다.

#### 고급 (커스텀 어댑터)

시연 목적으로 [ws](https://github.com/websockets/ws) 라이브러리를 수동으로 통합할 것입니다. 앞서 언급했듯이, 이 라이브러리용 어댑터는 이미 생성되어 `@nestjs/platform-ws` 패키지에서 `WsAdapter` 클래스로 노출됩니다. 다음은 간소화된 구현이 잠재적으로 어떻게 보일 수 있는지 보여줍니다.

```typescript
@@filename(ws-adapter)
import * as WebSocket from 'ws';
import { WebSocketAdapter, INestApplicationContext } from '@nestjs/common';
import { MessageMappingProperties } from '@nestjs/websockets';
import { Observable, fromEvent, EMPTY } from 'rxjs';
import { mergeMap, filter } from 'rxjs/operators';

export class WsAdapter implements WebSocketAdapter {
  constructor(private app: INestApplicationContext) {}

  create(port: number, options: any = {}): any {
    return new WebSocket.Server({ port, ...options });
  }

  bindClientConnect(server, callback: Function) {
    server.on('connection', callback);
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ) {
    fromEvent(client, 'message')
      .pipe(
        mergeMap(data => this.bindMessageHandler(data, handlers, process)),
        filter(result => result),
      )
      .subscribe(response => client.send(JSON.stringify(response)));
  }

  bindMessageHandler(
    buffer,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ): Observable<any> {
    const message = JSON.parse(buffer.data);
    const messageHandler = handlers.find(
      handler => handler.message === message.event,
    );
    if (!messageHandler) {
      return EMPTY;
    }
    return process(messageHandler.callback(message.data));
  }

  close(server) {
    server.close();
  }
}
```

> info **팁** [ws](https://github.com/websockets/ws) 라이브러리의 장점을 활용하려면 자체 어댑터를 생성하는 대신 내장된 `WsAdapter`를 사용하세요.

그런 다음, `useWebSocketAdapter()` 메서드를 사용하여 커스텀 어댑터를 설정할 수 있습니다.

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new WsAdapter(app));
```

#### 예시

`WsAdapter`를 사용하는 작동하는 예시는 [여기](https://github.com/nestjs/nest/tree/master/sample/16-gateways-ws)에서 확인할 수 있습니다.