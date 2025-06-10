### RabbitMQ

[RabbitMQ](https://www.rabbitmq.com/)는 다양한 메시징 프로토콜을 지원하는 오픈소스 경량 메시지 브로커입니다. 확장성 및 고가용성 요구사항을 충족하기 위해 분산 및 연합 구성으로 배포할 수 있습니다. 또한, 소규모 스타트업부터 대기업에 이르기까지 전 세계적으로 사용되는 가장 널리 배포된 메시지 브로커입니다.

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

`options` 속성은 선택한 트랜스포터에 따라 다릅니다. **RabbitMQ** 트랜스포터는 아래에 설명된 속성들을 제공합니다.

<table>
  <tr>
    <td><code>urls</code></td>
    <td>순서대로 시도할 연결 URL 배열</td>
  </tr>
  <tr>
    <td><code>queue</code></td>
    <td>서버가 수신 대기할 큐 이름</td>
  </tr>
  <tr>
    <td><code>prefetchCount</code></td>
    <td>채널의 프리페치(prefetch) 개수를 설정합니다</td>
  </tr>
  <tr>
    <td><code>isGlobalPrefetchCount</code></td>
    <td>채널별 프리페치를 활성화합니다</td>
  </tr>
  <tr>
    <td><code>noAck</code></td>
    <td><code>false</code>일 경우, 수동 수신 확인(manual acknowledgment) 모드가 활성화됩니다</td>
  </tr>
  <tr>
    <td><code>consumerTag</code></td>
    <td>소비자(consumer)에 대한 메시지 전달을 구별하기 위해 서버가 사용할 이름입니다. 채널에서 이미 사용 중이어서는 안 됩니다. 보통 이 값을 생략하는 것이 더 쉬운데, 이 경우 서버가 임의의 이름을 생성하여 응답으로 제공합니다. 소비자 태그 식별자 (자세한 내용은 <a href="https://amqp-node.github.io/amqplib/channel_api.html#channel_consume" rel="nofollow" target="_blank">여기</a>를 참조하세요)</td>
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
  <tr>
    <td><code>replyQueue</code></td>
    <td>생산자(producer)를 위한 응답 큐. 기본값은 <code>amq.rabbitmq.reply-to</code>입니다</td>
  </tr>
  <tr>
    <td><code>persistent</code></td>
    <td>참(truthy) 값일 경우, 메시지가 재시작을 견디는 큐에 있다면 브로커 재시작 후에도 메시지가 유지됩니다</td>
  </tr>
  <tr>
    <td><code>noAssert</code></td>
    <td>거짓(false) 값일 경우, 소비(consuming) 전에 큐가 확인(assert)되지 않습니다</td>
  </tr>
  <tr>
    <td><code>wildcards</code></td>
    <td>라우팅 메시지를 큐로 보내기 위해 Topic Exchange를 사용하려는 경우에만 true로 설정합니다. 이 옵션을 활성화하면 메시지 및 이벤트 패턴으로 와일드카드(*, #)를 사용할 수 있습니다</td>
  </tr>
  <tr>
    <td><code>exchange</code></td>
    <td>익스체인지(exchange)의 이름. "wildcards"가 true로 설정되면 기본값은 큐 이름입니다</td>
  </tr>
  <tr>
    <td><code>exchangeType</code></td>
    <td>익스체인지의 유형. 기본값은 <code>topic</code>입니다. 유효한 값은 <code>direct</code>, <code>fanout</code>, <code>topic</code>, <code>headers</code>입니다</td>
  </tr>
  <tr>
    <td><code>routingKey</code></td>
    <td>토픽 익스체인지를 위한 추가 라우팅 키</td>
  </tr>
  <tr>
    <td><code>maxConnectionAttempts</code></td>
    <td>최대 연결 시도 횟수. 소비자 구성에만 적용됩니다. -1은 무한을 의미합니다</td>
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

> info **힌트** `@Payload()`, `@Ctx()` 그리고 `RmqContext`는 `@nestjs/microservices` 패키지에서 임포트됩니다.

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

연결 및 기본 드라이버 인스턴스의 상태에 대한 실시간 업데이트를 받으려면 `status` 스트림을 구독할 수 있습니다. 이 스트림은 선택한 드라이버에 특화된 상태 업데이트를 제공합니다. RMQ 드라이버의 경우, `status` 스트림은 `connected`와 `disconnected` 이벤트를 발생시킵니다.

```typescript
this.client.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

> info **힌트** `RmqStatus` 타입은 `@nestjs/microservices` 패키지에서 임포트됩니다.

마찬가지로, 서버의 `status` 스트림을 구독하여 서버 상태에 대한 알림을 받을 수 있습니다.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

#### RabbitMQ 이벤트 수신

경우에 따라 마이크로서비스에서 발생하는 내부 이벤트를 수신하고 싶을 수 있습니다. 예를 들어, 오류가 발생했을 때 추가 작업을 트리거하기 위해 `error` 이벤트를 수신할 수 있습니다. 이를 위해 아래와 같이 `on()` 메서드를 사용합니다.

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

> info **힌트** `RmqEvents` 타입은 `@nestjs/microservices` 패키지에서 임포트됩니다.

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

#### 와일드카드

RabbitMQ는 유연한 메시지 라우팅을 위해 라우팅 키에 와일드카드를 사용하는 것을 지원합니다. `#` 와일드카드는 0개 이상의 단어와 일치하고, `*` 와일드카드는 정확히 하나의 단어와 일치합니다.

예를 들어, 라우팅 키 `cats.#`는 `cats`, `cats.meow`, `cats.meow.purr`와 일치합니다. 라우팅 키 `cats.*`는 `cats.meow`와 일치하지만 `cats.meow.purr`와는 일치하지 않습니다.

RabbitMQ 마이크로서비스에서 와일드카드 지원을 활성화하려면, 옵션 객체에서 `wildcards` 구성 옵션을 `true`로 설정하십시오.

```typescript
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'cats_queue',
      wildcards: true,
    },
  },
);
```

이 구성을 사용하면 이벤트/메시지를 구독할 때 라우팅 키에 와일드카드를 사용할 수 있습니다. 예를 들어, 라우팅 키가 `cats.#`인 메시지를 수신하려면 다음 코드를 사용할 수 있습니다.

```typescript
@MessagePattern('cats.#')
getCats(@Payload() data: { message: string }, @Ctx() context: RmqContext) {
  console.log(`Received message with routing key: ${context.getPattern()}`);

  return {
    message: 'Hello from the cats service!',
  }
}
```

특정 라우팅 키로 메시지를 보내려면 `ClientProxy` 인스턴스의 `send()` 메서드를 사용할 수 있습니다.

```typescript
this.client.send('cats.meow', { message: 'Meow!' }).subscribe((response) => {
  console.log(response);
});
```