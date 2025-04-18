### RabbitMQ

[RabbitMQ](https://www.rabbitmq.com/)는 여러 메시징 프로토콜을 지원하는 오픈 소스 경량 메시지 브로커입니다. 확장성 및 고가용성 요구 사항을 충족하기 위해 분산 및 연합 구성으로 배포할 수 있습니다. 또한 가장 널리 배포된 메시지 브로커로, 전 세계 소규모 스타트업 및 대기업에서 사용되고 있습니다.

#### 설치

RabbitMQ 기반 마이크로서비스 구축을 시작하려면 먼저 필수 패키지를 설치해야 합니다.

```bash
$ npm i --save amqplib amqp-connection-manager
```

#### 개요

RabbitMQ 트랜스포터를 사용하려면 다음 옵션 객체를 `createMicroservice()` 메서드에 전달합니다.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'cats_queue',
    queueOptions: {
      durable: false
    },
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'cats_queue',
    queueOptions: {
      durable: false
    },
  },
});
```

> info **팁** `Transport` enum은 `@nestjs/microservices` 패키지에서 임포트됩니다.

#### 옵션

`options` 속성은 선택한 트랜스포터에 따라 다릅니다. **RabbitMQ** 트랜스포터는 아래 설명된 속성들을 노출합니다.

<table>
  <tr>
    <td><code>urls</code></td>
    <td>연결 URL</td>
  </tr>
  <tr>
    <td><code>queue</code></td>
    <td>서버가 수신할 큐 이름</td>
  </tr>
  <tr>
    <td><code>prefetchCount</code></td>
    <td>채널에 대한 미리 가져오기 개수를 설정합니다</td>
  </tr>
  <tr>
    <td><code>isGlobalPrefetchCount</code></td>
    <td>채널별 미리 가져오기 기능을 활성화합니다</td>
  </tr>
  <tr>
    <td><code>noAck</code></td>
    <td><code>false</code>인 경우, 수동 확인 모드 활성화</td>
  </tr>
  <tr>
    <td><code>consumerTag</code></td>
    <td>소비자 태그 식별자 (자세한 내용은 <a href="https://amqp-node.github.io/amqplib/channel_api.html#channel_consume" rel="nofollow" target="_blank">여기</a>를 참조하세요)</td>
  </tr>
  <tr>
    <td><code>queueOptions</code></td>
    <td>추가 큐 옵션 (자세한 내용은 <a href="https://amqp-node.github.io/amqplib/channel_api.html#channel_assertQueue" rel="nofollow" target="_blank">여기</a>를 참조하세요)</td>
  </tr>
  <tr>
    <td><code>socketOptions</code></td>
    <td>추가 소켓 옵션 (자세한 내용은 <a href="https://amqp-node.github.io/amqplib/channel_api.html#connect" rel="nofollow" target="_blank">여기</a>를 참조하세요)</td>
  </tr>
  <tr>
    <td><code>headers</code></td>
    <td>모든 메시지와 함께 전송될 헤더</td>
  </tr>
</table>

#### 클라이언트

다른 마이크로서비스 트랜스포터와 마찬가지로, RabbitMQ `ClientProxy` 인스턴스를 생성하는 데는 <a href="https://nestjs.dokidocs.dev/microservices/basics#client">여러 옵션</a>이 있습니다.

인스턴스를 생성하는 한 가지 방법은 `ClientsModule`을 사용하는 것입니다. `ClientsModule`을 사용하여 클라이언트 인스턴스를 생성하려면, 이를 임포트하고 `register()` 메서드를 사용하여 위에서 `createMicroservice()` 메서드에 표시된 것과 동일한 속성을 가진 옵션 객체를 전달합니다. 또한 주입 토큰으로 사용될 `name` 속성도 포함해야 합니다. `ClientsModule`에 대한 자세한 내용은 <a href="https://nestjs.dokidocs.dev/microservices/basics#client">여기</a>를 참조하세요.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'cats_queue',
          queueOptions: {
            durable: false
          },
        },
      },
    ]),
  ]
  ...
})
```

클라이언트를 생성하는 다른 옵션(`ClientProxyFactory` 또는 `@Client()`)도 사용할 수 있습니다. 이에 대한 자세한 내용은 <a href="https://nestjs.dokidocs.dev/microservices/basics#client">여기</a>에서 읽을 수 있습니다.

#### 컨텍스트

더 복잡한 시나리오에서는 들어오는 요청에 대한 추가 정보에 액세스해야 할 수 있습니다. RabbitMQ 트랜스포터를 사용하는 경우 `RmqContext` 객체에 액세스할 수 있습니다.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(`Pattern: ${context.getPattern()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Pattern: ${context.getPattern()}`);
}
```

> info **팁** `@Payload()`, `@Ctx()`, `RmqContext`는 `@nestjs/microservices` 패키지에서 임포트됩니다.

원본 RabbitMQ 메시지(`properties`, `fields`, `content` 포함)에 액세스하려면 다음과 같이 `RmqContext` 객체의 `getMessage()` 메서드를 사용합니다.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(context.getMessage());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getMessage());
}
```

RabbitMQ [채널](https://www.rabbitmq.com/channels.html)에 대한 참조를 검색하려면 다음과 같이 `RmqContext` 객체의 `getChannelRef` 메서드를 사용합니다.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(context.getChannelRef());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getChannelRef());
}
```

#### 메시지 확인 (acknowledgement)

메시지가 절대 손실되지 않도록 하기 위해 RabbitMQ는 [메시지 확인](https://www.rabbitmq.com/confirms.html)을 지원합니다. 확인은 소비자가 RabbitMQ에 특정 메시지가 수신, 처리되었으며 RabbitMQ가 이를 자유롭게 삭제할 수 있음을 알리기 위해 다시 전송됩니다. 소비자가 확인을 보내지 않고 죽으면 (채널이 닫히거나, 연결이 닫히거나, TCP 연결이 끊어진 경우) RabbitMQ는 메시지가 완전히 처리되지 않았음을 이해하고 다시 큐에 넣을 것입니다.

수동 확인 모드를 활성화하려면 `noAck` 속성을 `false`로 설정합니다.

```typescript
options: {
  urls: ['amqp://localhost:5672'],
  queue: 'cats_queue',
  noAck: false,
  queueOptions: {
    durable: false
  },
},
```

수동 소비자 확인이 켜져 있을 때, 우리는 작업이 완료되었음을 알리기 위해 워커에서 적절한 확인을 보내야 합니다.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();

  channel.ack(originalMsg);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();

  channel.ack(originalMsg);
}
```

#### 레코드 빌더 (Record builders)

메시지 옵션을 구성하려면 `RmqRecordBuilder` 클래스를 사용할 수 있습니다 (참고: 이벤트 기반 플로우에서도 가능합니다). 예를 들어, `headers`와 `priority` 속성을 설정하려면 다음과 같이 `setOptions` 메서드를 사용합니다.

```typescript
const message = ':cat:';
const record = new RmqRecordBuilder(message)
  .setOptions({
    headers: {
      ['x-version']: '1.0.0',
    },
    priority: 3,
  })
  .build();

this.client.send('replace-emoji', record).subscribe(...);
```

> info **팁** `RmqRecordBuilder` 클래스는 `@nestjs/microservices` 패키지에서 내보내집니다.

그리고 서버 측에서도 `RmqContext`에 액세스하여 다음과 같이 이 값들을 읽을 수 있습니다.

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: RmqContext): string {
  const { properties: { headers } } = context.getMessage();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const { properties: { headers } } = context.getMessage();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

#### 인스턴스 상태 업데이트

기저 드라이버 인스턴스의 연결 및 상태에 대한 실시간 업데이트를 받으려면 `status` 스트림을 구독할 수 있습니다. 이 스트림은 선택한 드라이버에 특화된 상태 업데이트를 제공합니다. RMQ 드라이버의 경우 `status` 스트림은 `connected` 및 `disconnected` 이벤트를 방출합니다.

```typescript
this.client.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

> info **팁** `RmqStatus` 타입은 `@nestjs/microservices` 패키지에서 임포트됩니다.

마찬가지로, 서버의 `status` 스트림을 구독하여 서버 상태에 대한 알림을 받을 수 있습니다.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

#### RabbitMQ 이벤트 수신

어떤 경우에는 마이크로서비스에서 방출하는 내부 이벤트를 수신하고 싶을 수 있습니다. 예를 들어, `error` 이벤트를 수신하여 오류 발생 시 추가 작업을 트리거할 수 있습니다. 이를 위해 다음과 같이 `on()` 메서드를 사용합니다.

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

마찬가지로 서버의 내부 이벤트를 수신할 수 있습니다.

```typescript
server.on<RmqEvents>('error', (err) => {
  console.error(err);
});
```

> info **팁** `RmqEvents` 타입은 `@nestjs/microservices` 패키지에서 임포트됩니다.

#### 기저 드라이버 접근

보다 고급 사용 사례의 경우 기저 드라이버 인스턴스에 액세스해야 할 수 있습니다. 이는 수동으로 연결을 닫거나 드라이버 특정 메서드를 사용하는 시나리오에 유용할 수 있습니다. 그러나 대부분의 경우 드라이버에 직접 액세스할 **필요가 없습니다**.

액세스하려면 `unwrap()` 메서드를 사용할 수 있으며, 이는 기저 드라이버 인스턴스를 반환합니다. 제네릭 타입 매개변수는 예상하는 드라이버 인스턴스의 타입을 지정해야 합니다.

```typescript
const managerRef =
  this.client.unwrap<import('amqp-connection-manager').AmqpConnectionManager>();
```

마찬가지로 서버의 기저 드라이버 인스턴스에 액세스할 수 있습니다.

```typescript
const managerRef =
  server.unwrap<import('amqp-connection-manager').AmqpConnectionManager>();
```