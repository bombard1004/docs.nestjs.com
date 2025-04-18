### 게이트웨이 (Gateways)

이 문서의 다른 곳에서 논의된 대부분의 개념(예: 의존성 주입, 데코레이터, 예외 필터, 파이프, 가드, 인터셉터)은 게이트웨이에도 동일하게 적용됩니다. 가능한 한 Nest는 구현 세부 사항을 추상화하여 동일한 구성 요소가 HTTP 기반 플랫폼, 웹소켓 및 마이크로서비스 전반에 걸쳐 실행될 수 있도록 합니다. 이 섹션에서는 웹소켓에 특정한 Nest의 측면을 다룹니다.

Nest에서 게이트웨이는 단순히 `@WebSocketGateway()` 데코레이터로 어노테이션된 클래스입니다. 기술적으로 게이트웨이는 플랫폼에 구애받지 않아 어댑터가 생성되면 모든 웹소켓 라이브러리와 호환됩니다. 즉시 사용할 수 있는 두 가지 WS 플랫폼은 [socket.io](https://github.com/socketio/socket.io)와 [ws](https://github.com/websockets/ws)입니다. 필요에 가장 적합한 것을 선택할 수 있습니다. 또한 이 [가이드](/websockets/adapter)를 따라 자체 어댑터를 구축할 수도 있습니다.

<figure><img class="illustrative-image" src="/assets/Gateways_1.png" /></figure>

> info **힌트** 게이트웨이는 [프로바이더](/providers)로 취급될 수 있습니다. 즉, 클래스 생성자를 통해 의존성을 주입할 수 있습니다. 또한 게이트웨이는 다른 클래스(프로바이더 및 컨트롤러)에서도 주입될 수 있습니다.

#### 설치

웹소켓 기반 애플리케이션 구축을 시작하려면 먼저 필요한 패키지를 설치합니다.

```bash
@@filename()
$ npm i --save @nestjs/websockets @nestjs/platform-socket.io
@@switch
$ npm i --save @nestjs/websockets @nestjs/platform-socket.io
```

#### 개요

일반적으로 각 게이트웨이는 앱이 웹 애플리케이션이 아니거나 포트를 수동으로 변경하지 않는 한 **HTTP 서버**와 동일한 포트에서 수신 대기합니다. 이 기본 동작은 `@WebSocketGateway(80)` 데코레이터에 인자를 전달하여 수정할 수 있으며, 여기서 `80`은 선택된 포트 번호입니다. 다음 구문을 사용하여 게이트웨이에서 사용하는 [네임스페이스](https://socket.io/docs/v4/namespaces/)를 설정할 수도 있습니다.

```typescript
@WebSocketGateway(80, { namespace: 'events' })
```

> warning **경고** 게이트웨이는 기존 모듈의 프로바이더 배열에서 참조되기 전까지는 인스턴스화되지 않습니다.

아래와 같이 `@WebSocketGateway()` 데코레이터의 두 번째 인자로 지원되는 [옵션](https://socket.io/docs/v4/server-options/)을 소켓 생성자에 전달할 수 있습니다.

```typescript
@WebSocketGateway(81, { transports: ['websocket'] })
```

게이트웨이는 이제 수신 대기 중이지만, 아직 수신 메시지를 구독하지 않았습니다. `events` 메시지를 구독하고 사용자에게 정확히 동일한 데이터를 응답하는 핸들러를 만들어 보겠습니다.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(@MessageBody() data: string): string {
  return data;
}
@@switch
@Bind(MessageBody())
@SubscribeMessage('events')
handleEvent(data) {
  return data;
}
```

> info **힌트** `@SubscribeMessage()` 및 `@MessageBody()` 데코레이터는 `@nestjs/websockets` 패키지에서 임포트됩니다.

게이트웨이가 생성되면 모듈에 등록할 수 있습니다.

```typescript
import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@@filename(events.module)
@Module({
  providers: [EventsGateway]
})
export class EventsModule {}
```

데코레이터에 속성 키를 전달하여 수신 메시지 본문에서 해당 키를 추출할 수도 있습니다.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(@MessageBody('id') id: number): number {
  // id === messageBody.id
  return id;
}
@@switch
@Bind(MessageBody('id'))
@SubscribeMessage('events')
handleEvent(id) {
  // id === messageBody.id
  return id;
}
```

데코레이터를 사용하지 않는 것을 선호한다면 다음 코드가 기능적으로 동일합니다.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(client: Socket, data: string): string {
  return data;
}
@@switch
@SubscribeMessage('events')
handleEvent(client, data) {
  return data;
}
```

위 예시에서 `handleEvent()` 함수는 두 개의 인자를 받습니다. 첫 번째는 플랫폼별 [소켓 인스턴스](https://socket.io/docs/v4/server-api/#socket)이고, 두 번째는 클라이언트로부터 수신된 데이터입니다. 하지만 이 접근 방식은 각 단위 테스트에서 `socket` 인스턴스를 모킹해야 하므로 권장되지 않습니다.

`events` 메시지가 수신되면 핸들러는 네트워크를 통해 전송된 것과 동일한 데이터로 확인 응답을 보냅니다. 또한, `client.emit()` 메서드를 사용하는 등 라이브러리별 접근 방식을 사용하여 메시지를 방출하는 것도 가능합니다. 연결된 소켓 인스턴스에 액세스하려면 `@ConnectedSocket()` 데코레이터를 사용합니다.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(
  @MessageBody() data: string,
  @ConnectedSocket() client: Socket,
): string {
  return data;
}
@@switch
@Bind(MessageBody(), ConnectedSocket())
@SubscribeMessage('events')
handleEvent(data, client) {
  return data;
}
```

> info **힌트** `@ConnectedSocket()` 데코레이터는 `@nestjs/websockets` 패키지에서 임포트됩니다.

그러나 이 경우 인터셉터를 활용할 수 없습니다. 사용자에게 응답하고 싶지 않다면 `return` 문을 건너뛰거나 명시적으로 "거짓" 값(예: `undefined`)을 반환하면 됩니다.

이제 클라이언트가 다음과 같이 메시지를 방출할 때:

```typescript
socket.emit('events', { name: 'Nest' });
```

`handleEvent()` 메서드가 실행됩니다. 위 핸들러 내에서 방출된 메시지를 수신하려면 클라이언트는 해당 확인 응답 리스너를 연결해야 합니다.

```typescript
socket.emit('events', { name: 'Nest' }, (data) => console.log(data));
```

#### 다중 응답 (Multiple responses)

확인 응답은 한 번만 디스패치됩니다. 또한 네이티브 웹소켓 구현에서는 지원되지 않습니다. 이 제한 사항을 해결하기 위해 두 가지 속성으로 구성된 객체를 반환할 수 있습니다. 방출된 이벤트의 이름인 `event`와 클라이언트로 전달되어야 하는 `data`입니다.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(@MessageBody() data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@Bind(MessageBody())
@SubscribeMessage('events')
handleEvent(data) {
  const event = 'events';
  return { event, data };
}
```

> info **힌트** `WsResponse` 인터페이스는 `@nestjs/websockets` 패키지에서 임포트됩니다.

> warning **경고** `data` 필드가 `ClassSerializerInterceptor`에 의존하는 경우, 일반 JavaScript 객체 응답은 무시하므로 `WsResponse`를 구현하는 클래스 인스턴스를 반환해야 합니다.

수신 응답을 수신 대기하려면 클라이언트는 다른 이벤트 리스너를 적용해야 합니다.

```typescript
socket.on('events', (data) => console.log(data));
```

#### 비동기 응답 (Asynchronous responses)

메시지 핸들러는 동기적으로 또는 **비동기적으로** 응답할 수 있습니다. 따라서 `async` 메서드가 지원됩니다. 메시지 핸들러는 또한 `Observable`을 반환할 수 있으며, 이 경우 스트림이 완료될 때까지 결과 값이 방출됩니다.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
onEvent(@MessageBody() data: unknown): Observable<WsResponse<number>> {
  const event = 'events';
  const response = [1, 2, 3];

  return from(response).pipe(
    map(data => ({ event, data })),
  );
}
@@switch
@Bind(MessageBody())
@SubscribeMessage('events')
onEvent(data) {
  const event = 'events';
  const response = [1, 2, 3];

  return from(response).pipe(
    map(data => ({ event, data })),
  );
}
```

위 예시에서 메시지 핸들러는 **3번** (배열의 각 항목에 대해) 응답할 것입니다.

#### 라이프사이클 훅 (Lifecycle hooks)

유용한 라이프사이클 훅이 3가지 있습니다. 모두 해당 인터페이스를 가지고 있으며 다음 표에 설명되어 있습니다.

<table>
  <tr>
    <td>
      <code>OnGatewayInit</code>
    </td>
    <td>
      <code>afterInit()</code> 메서드 구현을 강제합니다. 라이브러리별 서버 인스턴스를 인자로 받습니다 (필요한 경우 나머지는 확산).
    </td>
  </tr>
  <tr>
    <td>
      <code>OnGatewayConnection</code>
    </td>
    <td>
      <code>handleConnection()</code> 메서드 구현을 강제합니다. 라이브러리별 클라이언트 소켓 인스턴스를 인자로 받습니다.
    </td>
  </tr>
  <tr>
    <td>
      <code>OnGatewayDisconnect</code>
    </td>
    <td>
      <code>handleDisconnect()</code> 메서드 구현을 강제합니다. 라이브러리별 클라이언트 소켓 인스턴스를 인자로 받습니다.
    </td>
  </tr>
</table>

> info **힌트** 각 라이프사이클 인터페이스는 `@nestjs/websockets` 패키지에서 노출됩니다.

#### 서버 및 네임스페이스 (Server and Namespace)

때때로 네이티브, **플랫폼별** 서버 인스턴스에 직접 액세스하고 싶을 수 있습니다. 이 객체에 대한 참조는 `afterInit()` 메서드(`OnGatewayInit` 인터페이스)에 인자로 전달됩니다. 다른 옵션은 `@WebSocketServer()` 데코레이터를 사용하는 것입니다.

```typescript
@WebSocketServer()
server: Server;
```

또한 다음과 같이 `namespace` 속성을 사용하여 해당 네임스페이스를 검색할 수 있습니다.

```typescript
@WebSocketServer({ namespace: 'my-namespace' })
namespace: Namespace;
```

> warning **참고** `@WebSocketServer()` 데코레이터는 `@nestjs/websockets` 패키지에서 임포트됩니다.

Nest는 서버 인스턴스가 사용할 준비가 되면 이 속성에 자동으로 할당합니다.

<app-banner-enterprise></app-banner-enterprise>

#### 예시 (Example)

작동하는 예시는 [여기](https://github.com/nestjs/nest/tree/master/sample/02-gateways)에서 사용할 수 있습니다.