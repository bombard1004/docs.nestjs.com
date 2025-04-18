### Redis

[Redis](https://redis.io/) 트랜스포터는 발행/구독 메시징 패러다임을 구현하며 Redis의 [Pub/Sub](https://redis.io/topics/pubsub) 기능을 활용합니다. 발행된 메시지는 어떤 구독자(있는 경우)가 결국 메시지를 받을지 알지 못한 채 채널로 분류됩니다. 각 마이크로서비스는 원하는 수만큼 채널을 구독할 수 있습니다. 또한, 한 번에 둘 이상의 채널을 구독할 수 있습니다. 채널을 통해 교환되는 메시지는 **fire-and-forget** 방식이며, 이는 메시지가 발행되었지만 해당 메시지에 관심 있는 구독자가 없는 경우 메시지가 제거되어 복구할 수 없음을 의미합니다. 따라서 메시지나 이벤트가 최소 하나 이상의 서비스에 의해 처리된다는 보장은 없습니다. 단일 메시지는 여러 구독자에 의해 구독될 수 있으며(그리고 수신될 수 있습니다).

<figure><img class="illustrative-image" src="/assets/Redis_1.png" /></figure>

#### 설치

Redis 기반 마이크로서비스 구축을 시작하려면 먼저 필수 패키지를 설치합니다.

```bash
$ npm i --save ioredis
```

#### 개요

Redis 트랜스포터를 사용하려면 `createMicroservice()` 메서드에 다음 옵션 객체를 전달합니다.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});
```

> info **힌트** `Transport` enum은 `@nestjs/microservices` 패키지에서 임포트됩니다.

#### 옵션

`options` 속성은 선택한 트랜스포터에 따라 다릅니다. **Redis** 트랜스포터는 아래 설명된 속성을 노출합니다.

<table>
  <tr>
    <td><code>host</code></td>
    <td>연결 URL</td>
  </tr>
  <tr>
    <td><code>port</code></td>
    <td>연결 포트</td>
  </tr>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>메시지 재시도 횟수 (기본값: <code>0</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>메시지 재시도 시도 간 지연 (ms) (기본값: <code>0</code>)</td>
  </tr>
   <tr>
    <td><code>wildcards</code></td>
    <td>Redis 와일드카드 구독을 활성화하여 트랜스포터가 내부적으로 <code>psubscribe</code>/<code>pmessage</code>를 사용하도록 지시합니다. (기본값: <code>false</code>)</td>
  </tr>
</table>

공식 [ioredis](https://redis.github.io/ioredis/index.html#RedisOptions) 클라이언트가 지원하는 모든 속성은 이 트랜스포터에서도 지원됩니다.

#### 클라이언트

다른 마이크로서비스 트랜스포터와 마찬가지로 Redis `ClientProxy` 인스턴스를 생성하는 <a href="https://nestjs.dokidocs.dev/microservices/basics#client">몇 가지 옵션</a>이 있습니다.

인스턴스를 생성하는 한 가지 방법은 `ClientsModule`을 사용하는 것입니다. `ClientsModule`을 사용하여 클라이언트 인스턴스를 생성하려면 이를 임포트하고 `register()` 메서드를 사용하여 `createMicroservice()` 메서드에서 위에 표시된 것과 동일한 속성과 인젝션 토큰으로 사용할 `name` 속성을 포함하는 옵션 객체를 전달합니다. `ClientsModule`에 대한 자세한 내용은 <a href="https://nestjs.dokidocs.dev/microservices/basics#client">여기</a>에서 읽을 수 있습니다.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        }
      },
    ]),
  ]
  ...
})
```

클라이언트를 생성하는 다른 옵션( `ClientProxyFactory` 또는 `@Client()` )도 사용할 수 있습니다. 이에 대한 내용은 <a href="https://nestjs.dokidocs.dev/microservices/basics#client">여기</a>에서 읽을 수 있습니다.

#### 컨텍스트

더 복잡한 시나리오에서는 들어오는 요청에 대한 추가 정보에 접근해야 할 수 있습니다. Redis 트랜스포터를 사용하는 경우 `RedisContext` 객체에 접근할 수 있습니다.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RedisContext) {
  console.log(`Channel: ${context.getChannel()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Channel: ${context.getChannel()}`);
}
```

> info **힌트** `@Payload()`, `@Ctx()` 및 `RedisContext`는 `@nestjs/microservices` 패키지에서 임포트됩니다.

#### 와일드카드

와일드카드 지원을 활성화하려면 `wildcards` 옵션을 `true`로 설정합니다. 이렇게 하면 트랜스포터가 내부적으로 `psubscribe` 및 `pmessage`를 사용하도록 지시합니다.

```typescript
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.REDIS,
  options: {
    // 다른 옵션들
    wildcards: true,
  },
});
```

클라이언트 인스턴스를 생성할 때도 `wildcards` 옵션을 전달해야 합니다.

이 옵션을 활성화하면 메시지 및 이벤트 패턴에서 와일드카드를 사용할 수 있습니다. 예를 들어, `notifications`로 시작하는 모든 채널을 구독하려면 다음 패턴을 사용할 수 있습니다.

```typescript
@EventPattern('notifications.*')
```

#### 인스턴스 상태 업데이트

기본 드라이버 인스턴스의 연결 및 상태에 대한 실시간 업데이트를 받으려면 `status` 스트림을 구독할 수 있습니다. 이 스트림은 선택한 드라이버에 특정한 상태 업데이트를 제공합니다. Redis 드라이버의 경우 `status` 스트림은 `connected`, `disconnected`, `reconnecting` 이벤트를 발생시킵니다.

```typescript
this.client.status.subscribe((status: RedisStatus) => {
  console.log(status);
});
```

> info **힌트** `RedisStatus` 타입은 `@nestjs/microservices` 패키지에서 임포트됩니다.

마찬가지로 서버의 상태에 대한 알림을 받으려면 서버의 `status` 스트림을 구독할 수 있습니다.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: RedisStatus) => {
  console.log(status);
});
```

#### Redis 이벤트 리스닝

어떤 경우에는 마이크로서비스에서 발생하는 내부 이벤트를 리스닝해야 할 수 있습니다. 예를 들어, 오류가 발생했을 때 추가 작업을 트리거하기 위해 `error` 이벤트를 리스닝할 수 있습니다. 이렇게 하려면 아래와 같이 `on()` 메서드를 사용합니다.

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

마찬가지로 서버의 내부 이벤트를 리스닝할 수 있습니다.

```typescript
server.on<RedisEvents>('error', (err) => {
  console.error(err);
});
```

> info **힌트** `RedisEvents` 타입은 `@nestjs/microservices` 패키지에서 임포트됩니다.

#### 기본 드라이버 접근

더 고급 사용 사례에서는 기본 드라이버 인스턴스에 접근해야 할 수 있습니다. 이는 연결을 수동으로 닫거나 드라이버 특정 메서드를 사용하는 시나리오에 유용할 수 있습니다. 하지만 대부분의 경우 드라이버에 직접 접근할 **필요가 없다**는 점을 명심하세요.

이렇게 하려면 기본 드라이버 인스턴스를 반환하는 `unwrap()` 메서드를 사용할 수 있습니다. 제네릭 타입 매개변수는 예상하는 드라이버 인스턴스의 타입을 지정해야 합니다.

```typescript
const [pub, sub] =
  this.client.unwrap<[import('ioredis').Redis, import('ioredis').Redis]>();
```

마찬가지로 서버의 기본 드라이버 인스턴스에 접근할 수 있습니다.

```typescript
const [pub, sub] =
  server.unwrap<[import('ioredis').Redis, import('ioredis').Redis]>();
```

다른 트랜스포터와 달리 Redis 트랜스포터는 두 개의 `ioredis` 인스턴스 튜플을 반환합니다. 첫 번째 인스턴스는 메시지 발행에 사용되고 두 번째 인스턴스는 메시지 구독에 사용됩니다.
