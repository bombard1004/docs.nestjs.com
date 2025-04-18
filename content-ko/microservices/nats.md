### NATS

[NATS](https://nats.io)는 클라우드 네이티브 애플리케이션, IoT 메시징 및 마이크로서비스 아키텍처를 위한 간단하고 안전하며 고성능의 오픈 소스 메시징 시스템입니다. NATS 서버는 Go 프로그래밍 언어로 작성되었지만, 서버와 상호 작용하는 클라이언트 라이브러리는 수십 개의 주요 프로그래밍 언어에서 사용할 수 있습니다. NATS는 **At Most Once** 및 **At Least Once** 전달 방식을 모두 지원합니다. 대규모 서버와 클라우드 인스턴스부터 엣지 게이트웨이, 심지어 IoT 장치까지 어디에서나 실행될 수 있습니다.

#### 설치

NATS 기반 마이크로서비스 구축을 시작하려면 먼저 필요한 패키지를 설치합니다.

```bash
$ npm i --save nats
```

#### 개요

NATS 트랜스포터(transporter)를 사용하려면 `createMicroservice()` 메서드에 다음 옵션 객체를 전달합니다.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
});
```

> info **힌트** `Transport` enum은 `@nestjs/microservices` 패키지에서 임포트됩니다.

#### 옵션

`options` 객체는 선택한 트랜스포터에 따라 다릅니다. **NATS** 트랜스포터는 [여기](https://github.com/nats-io/node-nats#connection-options)에 설명된 속성과 다음 속성을 노출합니다.

<table>
  <tr>
    <td><code>queue</code></td>
    <td>서버가 구독해야 하는 큐 (이 설정을 무시하려면 <code>undefined</code>로 둡니다). NATS 큐 그룹에 대한 자세한 내용은 <a href="https://docs.nestjs.com/microservices/nats#queue-groups">아래</a>에서 읽어보세요.
    </td>
  </tr>
  <tr>
    <td><code>gracefulShutdown</code></td>
    <td>정상적인 종료를 활성화합니다. 활성화되면 서버는 연결을 닫기 전에 모든 채널에서 먼저 구독을 해제합니다. 기본값은 <code>false</code>입니다.
  </tr>
  <tr>
    <td><code>gracePeriod</code></td>
    <td>모든 채널에서 구독을 해제한 후 서버가 대기하는 시간(밀리초)입니다. 기본값은 <code>10000</code>ms입니다.
  </tr>
</table>

#### 클라이언트

다른 마이크로서비스 트랜스포터와 마찬가지로, NATS `ClientProxy` 인스턴스를 생성하는 [몇 가지 옵션](https://docs.nestjs.com/microservices/basics#client)이 있습니다.

인스턴스를 생성하는 한 가지 방법은 `ClientsModule`을 사용하는 것입니다. `ClientsModule`로 클라이언트 인스턴스를 생성하려면, 이를 임포트하고 `register()` 메서드를 사용하여 위에서 `createMicroservice()` 메서드에 표시된 것과 동일한 속성을 가진 옵션 객체와 주입 토큰으로 사용될 `name` 속성을 전달합니다. `ClientsModule`에 대한 자세한 내용은 [여기](https://docs.nestjs.com/microservices/basics#client)에서 읽어보세요.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
        }
      },
    ]),
  ]
  ...
})
```

`ClientProxyFactory` 또는 `@Client()`와 같은 클라이언트를 생성하는 다른 옵션도 사용할 수 있습니다. 이에 대한 내용은 [여기](https://docs.nestjs.com/microservices/basics#client)에서 읽어볼 수 있습니다.

#### 요청-응답 (Request-response)

**요청-응답** 메시지 스타일([자세히 읽어보기](https://docs.nestjs.com/microservices/basics#request-response))의 경우, NATS 트랜스포터는 NATS 내장 [요청-응답(Request-Reply)](https://docs.nats.io/nats-concepts/reqreply) 메커니즘을 사용하지 않습니다. 대신, 고유한 응답 주제 이름과 함께 `publish()` 메서드를 사용하여 특정 주제에 "요청"이 발행되고, 응답자들은 해당 주제를 수신하고 응답 주제로 응답을 보냅니다. 응답 주제는 요청자에게 동적으로 다시 전달되며, 양측의 위치와는 상관없습니다.

#### 이벤트 기반 (Event-based)

**이벤트 기반** 메시지 스타일([자세히 읽어보기](https://docs.nestjs.com/microservices/basics#event-based))의 경우, NATS 트랜스포터는 NATS 내장 [발행-구독(Publish-Subscribe)](https://docs.nats.io/nats-concepts/pubsub) 메커니즘을 사용합니다. 발행자는 주제에 메시지를 보내고 해당 주제를 수신하는 활성 구독자는 모두 메시지를 받습니다. 구독자는 정규 표현식처럼 작동하는 와일드카드 주제에 대한 관심을 등록할 수도 있습니다. 이 일대다 패턴을 팬아웃(fan-out)이라고도 합니다.

#### 큐 그룹 (Queue groups)

NATS는 [분산 큐(distributed queues)](https://docs.nats.io/nats-concepts/queue)라고 하는 내장 로드 밸런싱 기능을 제공합니다. 큐 구독을 생성하려면 다음과 같이 `queue` 속성을 사용합니다.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
    queue: 'cats_queue',
  },
});
```

#### 컨텍스트 (Context)

더 복잡한 시나리오에서는 들어오는 요청에 대한 추가 정보에 접근해야 할 수 있습니다. NATS 트랜스포터를 사용할 때 `NatsContext` 객체에 접근할 수 있습니다.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Subject: ${context.getSubject()}`);
}
```

> info **힌트** `@Payload()`, `@Ctx()`, `NatsContext`는 `@nestjs/microservices` 패키지에서 임포트됩니다.

#### 와일드카드 (Wildcards)

구독은 명시적인 주제일 수도 있고, 와일드카드를 포함할 수도 있습니다.

```typescript
@@filename()
@MessagePattern('time.us.*')
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // 예: "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*')
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // 예: "time.us.east"
  return new Date().toLocaleTimeString(...);
}
```

#### 레코드 빌더 (Record builders)

메시지 옵션을 구성하기 위해 `NatsRecordBuilder` 클래스를 사용할 수 있습니다 (참고: 이는 이벤트 기반 흐름에서도 가능합니다). 예를 들어, `x-version` 헤더를 추가하려면 다음과 같이 `setHeaders` 메서드를 사용합니다.

```typescript
import * as nats from 'nats';

// 코드의 어딘가에서
const headers = nats.headers();
headers.set('x-version', '1.0.0');

const record = new NatsRecordBuilder(':cat:').setHeaders(headers).build();
this.client.send('replace-emoji', record).subscribe(...);
```

> info **힌트** `NatsRecordBuilder` 클래스는 `@nestjs/microservices` 패키지에서 내보내집니다.

그리고 다음과 같이 `NatsContext`에 접근하여 서버 측에서도 이러한 헤더를 읽을 수 있습니다.

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: NatsContext): string {
  const headers = context.getHeaders();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const headers = context.getHeaders();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

경우에 따라 여러 요청에 대한 헤더를 구성하고 싶을 수 있습니다. 이러한 헤더는 `ClientProxyFactory`의 옵션으로 전달할 수 있습니다.

```typescript
import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'API_v1',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.NATS,
          options: {
            servers: ['nats://localhost:4222'],
            headers: { 'x-version': '1.0.0' },
          },
        }),
    },
  ],
})
export class ApiModule {}
```

#### 인스턴스 상태 업데이트 (Instance status updates)

연결 및 기본 드라이버 인스턴스의 상태에 대한 실시간 업데이트를 받으려면 `status` 스트림을 구독할 수 있습니다. 이 스트림은 선택한 드라이버에 특정한 상태 업데이트를 제공합니다. NATS 드라이버의 경우, `status` 스트림은 `connected`, `disconnected`, `reconnecting` 이벤트를 방출합니다.

```typescript
this.client.status.subscribe((status: NatsStatus) => {
  console.log(status);
});
```

> info **힌트** `NatsStatus` 타입은 `@nestjs/microservices` 패키지에서 임포트됩니다.

마찬가지로, 서버의 상태에 대한 알림을 받기 위해 서버의 `status` 스트림을 구독할 수 있습니다.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: NatsStatus) => {
  console.log(status);
});
```

#### NATS 이벤트 수신하기 (Listening to Nats events)

경우에 따라 마이크로서비스에서 발생하는 내부 이벤트를 수신하고 싶을 수 있습니다. 예를 들어, `error` 이벤트를 수신하여 오류 발생 시 추가 작업을 트리거할 수 있습니다. 이렇게 하려면 아래와 같이 `on()` 메서드를 사용합니다.

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

마찬가지로 서버의 내부 이벤트를 수신할 수 있습니다.

```typescript
server.on<NatsEvents>('error', (err) => {
  console.error(err);
});
```

> info **힌트** `NatsEvents` 타입은 `@nestjs/microservices` 패키지에서 임포트됩니다.

#### 기본 드라이버 접근 (Underlying driver access)

더 고급 사용 사례의 경우, 기본 드라이버 인스턴스에 접근해야 할 수 있습니다. 이는 연결을 수동으로 닫거나 드라이버 특정 메서드를 사용하는 등의 시나리오에 유용할 수 있습니다. 그러나 대부분의 경우에는 드라이버에 직접 접근할 **필요가 없다**는 점을 기억하십시오.

접근하려면 `unwrap()` 메서드를 사용하면 기본 드라이버 인스턴스를 반환합니다. 제네릭 타입 매개변수는 예상되는 드라이버 인스턴스의 타입을 지정해야 합니다.

```typescript
const natsConnection = this.client.unwrap<import('nats').NatsConnection>();
```

마찬가지로 서버의 기본 드라이버 인스턴스에 접근할 수 있습니다.

```typescript
const natsConnection = server.unwrap<import('nats').NatsConnection>();
```