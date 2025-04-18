### 개요

전통적인 (때로는 모놀리식이라고도 불리는) 애플리케이션 아키텍처 외에도, Nest는 마이크로서비스 아키텍처 스타일의 개발을 네이티브로 지원합니다. 의존성 주입, 데코레이터, 예외 필터, 파이프, 가드 및 인터셉터와 같이 이 문서의 다른 곳에서 논의된 대부분의 개념은 마이크로서비스에도 동일하게 적용됩니다. 가능한 모든 곳에서 Nest는 구현 세부 정보를 추상화하여 동일한 컴포넌트가 HTTP 기반 플랫폼, 웹 소켓 및 마이크로서비스에서 실행될 수 있도록 합니다. 이 섹션은 마이크로서비스에 특정한 Nest의 측면을 다룹니다.

Nest에서 마이크로서비스는 근본적으로 HTTP와 다른 **전송(transport)** 계층을 사용하는 애플리케이션입니다.

<figure><img class="illustrative-image" src="/assets/Microservices_1.png" /></figure>

Nest는 서로 다른 마이크로서비스 인스턴스 간에 메시지를 전송하는 역할을 하는 **트랜스포터(transporter)**라고 불리는 여러 내장 전송 계층 구현을 지원합니다. 대부분의 트랜스포터는 **요청-응답(request-response)** 및 **이벤트 기반(event-based)** 메시지 스타일을 모두 네이티브로 지원합니다. Nest는 요청-응답 및 이벤트 기반 메시징을 위한 표준 인터페이스 뒤에 각 트랜스포터의 구현 세부 정보를 추상화합니다. 이는 애플리케이션 코드에 영향을 주지 않고 하나의 전송 계층에서 다른 전송 계층으로 쉽게 전환할 수 있도록 합니다. 예를 들어 특정 전송 계층의 특정 신뢰성 또는 성능 기능을 활용하기 위해.

#### 설치

마이크로서비스 구축을 시작하려면 먼저 필요한 패키지를 설치하세요:

```bash
$ npm i --save @nestjs/microservices
```

#### 시작하기

마이크로서비스 인스턴스를 생성하려면 `NestFactory` 클래스의 `createMicroservice()` 메서드를 사용하세요:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
  });
  await app.listen();
}
bootstrap();
```

> info **힌트** 마이크로서비스는 기본적으로 **TCP** 전송 계층을 사용합니다.

`createMicroservice()` 메서드의 두 번째 인수는 `options` 객체입니다. 이 객체는 두 가지 멤버로 구성될 수 있습니다:

<table>
  <tr>
    <td><code>transport</code></td>
    <td>트랜스포터를 지정합니다 (예: <code>Transport.NATS</code>)</td>
  </tr>
  <tr>
    <td><code>options</code></td>
    <td>트랜스포터 동작을 결정하는 트랜스포터별 옵션 객체입니다.</td>
  </tr>
</table>
<p>
  <code>options</code> 객체는 선택한 트랜스포터에 따라 다릅니다. <strong>TCP</strong> 트랜스포터는 아래에 설명된 속성을 노출합니다. 다른 트랜스포터(예: Redis, MQTT 등)의 경우, 사용 가능한 옵션에 대한 설명은 해당 장을 참조하십시오.
</p>
<table>
  <tr>
    <td><code>host</code></td>
    <td>연결 호스트 이름</td>
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
    <td><code>serializer</code></td>
    <td>나가는 메시지를 위한 사용자 지정 <a href="https://github.com/nestjs/nest/blob/master/packages/microservices/interfaces/serializer.interface.ts" target="_blank">직렬 변환기 (serializer)</a></td>
  </tr>
  <tr>
    <td><code>deserializer</code></td>
    <td>들어오는 메시지를 위한 사용자 지정 <a href="https://github.com/nestjs/nest/blob/master/packages/microservices/interfaces/deserializer.interface.ts" target="_blank">역직렬 변환기 (deserializer)</a></td>
  </tr>
  <tr>
    <td><code>socketClass</code></td>
    <td><code>TcpSocket</code>을 확장하는 사용자 지정 소켓 (기본값: <code>JsonSocket</code>)</td>
  </tr>
  <tr>
    <td><code>tlsOptions</code></td>
    <td>TLS 프로토콜 구성을 위한 옵션</td>
  </tr>
</table>

> info **힌트** 위 속성들은 TCP 트랜스포터에 특화되어 있습니다. 다른 트랜스포터에 사용 가능한 옵션에 대한 정보는 해당 장을 참조하십시오.

#### 메시지 및 이벤트 패턴

마이크로서비스는 **패턴(pattern)**으로 메시지와 이벤트를 모두 인식합니다. 패턴은 리터럴 객체 또는 문자열과 같은 일반 값입니다. 패턴은 메시지의 데이터 부분과 함께 네트워크를 통해 자동으로 직렬화되어 전송됩니다. 이런 방식으로 메시지 송신자와 소비자는 어떤 요청이 어떤 핸들러에 의해 소비되는지 조정할 수 있습니다.

#### 요청-응답 (Request-response)

요청-응답 메시지 스타일은 다양한 외부 서비스 간에 메시지를 **교환**해야 할 때 유용합니다. 이 패러다임은 서비스가 실제로 메시지를 수신했음을 보장합니다 (승인 프로토콜을 수동으로 구현할 필요 없이). 하지만 요청-응답 방식이 항상 최적의 선택은 아닐 수 있습니다. 예를 들어, 로그 기반 영속성을 사용하는 [Kafka](https://docs.confluent.io/3.0.0/streams/) 또는 [NATS 스트리밍](https://github.com/nats-io/node-nats-streaming)과 같은 스트리밍 트랜스포터는 이벤트 메시징 패러다임에 더 부합하는 다른 종류의 문제를 해결하는 데 최적화되어 있습니다 ([이벤트 기반 메시징](https://docs.nestjs.com/microservices/basics#event-based)에서 더 자세한 내용을 확인하세요).

요청-응답 메시지 유형을 사용하려면 Nest는 두 개의 논리 채널을 생성합니다: 하나는 데이터 전송용이고 다른 하나는 들어오는 응답 대기용입니다. [NATS](https://nats.io/)와 같은 일부 기본 전송에서는 이러한 듀얼 채널 지원이 기본으로 제공됩니다. 다른 경우에는 Nest가 별도의 채널을 수동으로 생성하여 이를 보완합니다. 이는 효과적이지만 일부 오버헤드를 유발할 수 있습니다. 따라서 요청-응답 메시지 스타일이 필요하지 않은 경우, 이벤트 기반 방식을 사용하는 것을 고려해 볼 수 있습니다.

요청-응답 패러다임을 기반으로 메시지 핸들러를 생성하려면 `@nestjs/microservices` 패키지에서 가져온 `@MessagePattern()` 데코레이터를 사용합니다. 이 데코레이터는 애플리케이션의 진입점 역할을 하는 [컨트롤러](https://docs.nestjs.com/controllers) 클래스 내에서만 사용해야 합니다. 프로바이더에서 사용하면 Nest 런타임에 의해 무시되므로 효과가 없습니다.

```typescript
@@filename(math.controller)
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  accumulate(data: number[]): number {
    return (data || []).reduce((a, b) => a + b);
  }
}
@@switch
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  accumulate(data) {
    return (data || []).reduce((a, b) => a + b);
  }
}
```

위 코드에서 `accumulate()` **메시지 핸들러**는 `{{ '{' }} cmd: 'sum' {{ '}' }}` 메시지 패턴과 일치하는 메시지를 수신 대기합니다. 메시지 핸들러는 클라이언트에서 전달된 단일 인수, 즉 `data`를 받습니다. 이 경우 데이터는 누적되어야 하는 숫자의 배열입니다.

#### 비동기 응답

메시지 핸들러는 동기적으로 또는 **비동기적으로** 응답할 수 있습니다. 즉, `async` 메서드가 지원됩니다.

```typescript
@@filename()
@MessagePattern({ cmd: 'sum' })
async accumulate(data: number[]): Promise<number> {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@MessagePattern({ cmd: 'sum' })
async accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```

메시지 핸들러는 `Observable`을 반환할 수도 있으며, 이 경우 스트림이 완료될 때까지 결과 값이 방출됩니다.

```typescript
@@filename()
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
@@switch
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
```

위 예제에서 메시지 핸들러는 배열의 각 항목에 대해 한 번씩, 총 **세 번** 응답합니다.

#### 이벤트 기반 (Event-based)

요청-응답 방식은 서비스 간 메시지 교환에 완벽하지만, 응답을 기다리지 않고 단순히 **이벤트**를 발행하려는 경우와 같은 이벤트 기반 메시징에는 덜 적합합니다. 이러한 경우, 요청-응답을 위해 두 개의 채널을 유지하는 오버헤드는 불필요합니다.

예를 들어, 시스템의 이 부분에서 특정 조건이 발생했음을 다른 서비스에 알리고 싶은 경우 이벤트 기반 메시지 스타일이 이상적입니다.

이벤트 핸들러를 생성하려면 `@nestjs/microservices` 패키지에서 가져온 `@EventPattern()` 데코레이터를 사용할 수 있습니다.

```typescript
@@filename()
@EventPattern('user_created')
async handleUserCreated(data: Record<string, unknown>) {
  // business logic
}
@@switch
@EventPattern('user_created')
async handleUserCreated(data) {
  // business logic
}
```

> info **힌트** **단일** 이벤트 패턴에 대해 여러 이벤트 핸들러를 등록할 수 있으며, 이들은 모두 자동으로 병렬로 트리거됩니다.

`handleUserCreated()` **이벤트 핸들러**는 `'user_created'` 이벤트를 수신 대기합니다. 이벤트 핸들러는 클라이언트에서 전달된 단일 인수, 즉 `data`(이 경우 네트워크를 통해 전송된 이벤트 페이로드)를 받습니다.

<app-banner-enterprise></app-banner-enterprise>

#### 추가 요청 세부 정보

더 고급 시나리오에서는 들어오는 요청에 대한 추가 세부 정보에 접근해야 할 수 있습니다. 예를 들어, 와일드카드 구독과 함께 NATS를 사용하는 경우, 생산자가 메시지를 보낸 원래 주제를 검색하고 싶을 수 있습니다. 마찬가지로 Kafka에서는 메시지 헤더에 접근해야 할 수 있습니다. 이를 위해 아래와 같이 내장 데코레이터를 활용할 수 있습니다:

```typescript
@@filename()
@MessagePattern('time.us.*')
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*')
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
```

> info **힌트** `@Payload()`, `@Ctx()`, `NatsContext`는 `@nestjs/microservices`에서 가져옵니다.

> info **힌트** 들어오는 페이로드 객체에서 특정 속성을 추출하기 위해 `@Payload()` 데코레이터에 속성 키를 전달할 수도 있습니다. 예를 들어 `@Payload('id')`와 같이 사용합니다.

#### 클라이언트 (생산자 클래스)

클라이언트 Nest 애플리케이션은 `ClientProxy` 클래스를 사용하여 Nest 마이크로서비스에 메시지를 교환하거나 이벤트를 발행할 수 있습니다. 이 클래스는 `send()` (요청-응답 메시징용) 및 `emit()` (이벤트 기반 메시징용)과 같은 여러 메서드를 제공하여 원격 마이크로서비스와의 통신을 가능하게 합니다. 다음 방법으로 이 클래스의 인스턴스를 얻을 수 있습니다:

한 가지 접근 방식은 정적 `register()` 메서드를 노출하는 `ClientsModule`을 가져오는 것입니다. 이 메서드는 마이크로서비스 트랜스포터를 나타내는 객체 배열을 받습니다. 각 객체에는 필수적으로 `name` 속성이 포함되어야 하며, 선택적으로 `transport` 속성(`Transport.TCP`가 기본값)과 선택적 `options` 속성도 포함될 수 있습니다.

`name` 속성은 필요한 곳에 `ClientProxy` 인스턴스를 주입하는 데 사용할 수 있는 **주입 토큰(injection token)** 역할을 합니다. 이 `name` 속성의 값은 [여기](https://docs.nestjs.com/fundamentals/custom-providers#non-class-based-provider-tokens)에 설명된 대로 임의의 문자열 또는 JavaScript 심볼이 될 수 있습니다.

`options` 속성은 이전에 `createMicroservice()` 메서드에서 본 것과 동일한 속성을 포함하는 객체입니다.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      { name: 'MATH_SERVICE', transport: Transport.TCP },
    ]),
  ],
})
```

또는 설정 중에 구성을 제공하거나 다른 비동기 프로세스를 수행해야 하는 경우 `registerAsync()` 메서드를 사용할 수 있습니다.

```typescript
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: 'MATH_SERVICE',
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            url: configService.get('URL'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
})
```

모듈을 가져온 후, `@Inject()` 데코레이터를 사용하여 `'MATH_SERVICE'` 트랜스포터에 대해 지정된 옵션으로 구성된 `ClientProxy` 인스턴스를 주입할 수 있습니다.

```typescript
constructor(
  @Inject('MATH_SERVICE') private client: ClientProxy,
) {}
```

> info **힌트** `ClientsModule` 및 `ClientProxy` 클래스는 `@nestjs/microservices` 패키지에서 가져옵니다.

때로는 클라이언트 애플리케이션에 트랜스포터 구성을 하드코딩하는 대신 다른 서비스(`ConfigService`와 같은)에서 가져와야 할 수 있습니다. 이를 위해 `ClientProxyFactory` 클래스를 사용하여 [사용자 지정 프로바이더](/fundamentals/custom-providers)를 등록할 수 있습니다. 이 클래스는 트랜스포터 옵션 객체를 받아 사용자 지정된 `ClientProxy` 인스턴스를 반환하는 정적 `create()` 메서드를 제공합니다.

```typescript
@Module({
  providers: [
    {
      provide: 'MATH_SERVICE',
      useFactory: (configService: ConfigService) => {
        const mathSvcOptions = configService.getMathSvcOptions();
        return ClientProxyFactory.create(mathSvcOptions);
      },
      inject: [ConfigService],
    }
  ]
  ...
})
```

> info **힌트** `ClientProxyFactory`는 `@nestjs/microservices` 패키지에서 가져옵니다.

또 다른 옵션은 `@Client()` 속성 데코레이터를 사용하는 것입니다.

```typescript
@Client({ transport: Transport.TCP })
client: ClientProxy;
```

> info **힌트** `@Client()` 데코레이터는 `@nestjs/microservices` 패키지에서 가져옵니다.

`@Client()` 데코레이터를 사용하는 것은 테스트하기 더 어렵고 클라이언트 인스턴스를 공유하기 더 어렵기 때문에 선호되는 기술은 아닙니다.

`ClientProxy`는 **지연(lazy)** 방식입니다. 즉시 연결을 시작하지 않습니다. 대신 첫 번째 마이크로서비스 호출 전에 설정되며, 이후 각 호출에서 재사용됩니다. 하지만 연결이 설정될 때까지 애플리케이션 부트스트래핑 프로세스를 지연하고 싶다면, `OnApplicationBootstrap` 라이프사이클 훅 내에서 `ClientProxy` 객체의 `connect()` 메서드를 사용하여 연결을 수동으로 시작할 수 있습니다.

```typescript
@@filename()
async onApplicationBootstrap() {
  await this.client.connect();
}
```

연결을 생성할 수 없는 경우 `connect()` 메서드는 해당하는 오류 객체와 함께 거부됩니다.

#### 메시지 전송

`ClientProxy`는 `send()` 메서드를 노출합니다. 이 메서드는 마이크로서비스를 호출하기 위한 것이며, 해당 응답과 함께 `Observable`을 반환합니다. 따라서 방출된 값들을 쉽게 구독할 수 있습니다.

```typescript
@@filename()
accumulate(): Observable<number> {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send<number>(pattern, payload);
}
@@switch
accumulate() {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send(pattern, payload);
}
```

`send()` 메서드는 `pattern`과 `payload` 두 개의 인수를 받습니다. `pattern`은 `@MessagePattern()` 데코레이터에 정의된 것과 일치해야 합니다. `payload`는 원격 마이크로서비스로 전송하려는 메시지입니다. 이 메서드는 **콜드 `Observable`**을 반환합니다. 즉, 메시지가 전송되기 전에 명시적으로 구독해야 합니다.

#### 이벤트 발행

이벤트를 보내려면 `ClientProxy` 객체의 `emit()` 메서드를 사용합니다. 이 메서드는 메시지 브로커에 이벤트를 발행합니다.

```typescript
@@filename()
async publish() {
  this.client.emit<number>('user_created', new UserCreatedEvent());
}
@@switch
async publish() {
  this.client.emit('user_created', new UserCreatedEvent());
}
```

`emit()` 메서드는 `pattern`과 `payload` 두 개의 인수를 받습니다. `pattern`은 `@EventPattern()` 데코레이터에 정의된 것과 일치해야 하며, `payload`는 원격 마이크로서비스로 전송하려는 이벤트 데이터를 나타냅니다. 이 메서드는 **핫 `Observable`**을 반환합니다 (`send()`가 반환하는 콜드 `Observable`과 대조적으로). 이는 Observable을 명시적으로 구독하는지 여부와 관계없이 프록시가 즉시 이벤트를 전달하려고 시도한다는 의미입니다.

<app-banner-devtools></app-banner-devtools>

#### 요청 범위 지정 (Request-scoping)

다른 프로그래밍 언어 배경을 가진 사람들에게는 Nest에서 대부분의 것이 들어오는 요청 간에 공유된다는 사실이 놀라울 수 있습니다. 여기에는 데이터베이스 연결 풀, 전역 상태를 가진 싱글톤 서비스 등이 포함됩니다. Node.js는 각 요청이 별도의 스레드에 의해 처리되는 요청/응답 다중 스레드 무상태 모델을 따르지 않음을 명심하십시오. 결과적으로 싱글톤 인스턴스를 사용하는 것은 우리 애플리케이션에 **안전**합니다.

하지만 핸들러에 대한 요청 기반 수명이 바람직할 수 있는 예외적인 경우가 있습니다. 여기에는 GraphQL 애플리케이션의 요청별 캐싱, 요청 추적 또는 멀티 테넌시와 같은 시나리오가 포함될 수 있습니다. 범위 제어 방법에 대해 [여기](/fundamentals/injection-scopes)에서 자세히 알아볼 수 있습니다.

요청 범위 핸들러 및 프로바이더는 `CONTEXT` 토큰과 결합된 `@Inject()` 데코레이터를 사용하여 `RequestContext`를 주입할 수 있습니다:

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT, RequestContext } from '@nestjs/microservices';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private ctx: RequestContext) {}
}
```

이는 `RequestContext` 객체에 대한 접근을 제공하며, 이 객체는 두 가지 속성을 가집니다:

```typescript
export interface RequestContext<T = any> {
  pattern: string | Record<string, any>;
  data: T;
}
```

`data` 속성은 메시지 생산자가 보낸 메시지 페이로드입니다. `pattern` 속성은 들어오는 메시지를 처리하기 위한 적절한 핸들러를 식별하는 데 사용되는 패턴입니다.

#### 인스턴스 상태 업데이트

연결 및 기본 드라이버 인스턴스의 상태에 대한 실시간 업데이트를 받으려면 `status` 스트림을 구독할 수 있습니다. 이 스트림은 선택한 드라이버에 특정한 상태 업데이트를 제공합니다. 예를 들어, TCP 트랜스포터(기본값)를 사용하는 경우 `status` 스트림은 `connected` 및 `disconnected` 이벤트를 방출합니다.

```typescript
this.client.status.subscribe((status: TcpStatus) => {
  console.log(status);
});
```

> info **힌트** `TcpStatus` 타입은 `@nestjs/microservices` 패키지에서 가져옵니다.

마찬가지로 서버의 `status` 스트림을 구독하여 서버 상태에 대한 알림을 받을 수 있습니다.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: TcpStatus) => {
  console.log(status);
});
```

#### 내부 이벤트 수신

어떤 경우에는 마이크로서비스가 방출하는 내부 이벤트를 수신 대기하고 싶을 수 있습니다. 예를 들어, 오류가 발생했을 때 추가 작업을 트리거하기 위해 `error` 이벤트를 수신 대기할 수 있습니다. 이를 위해 아래와 같이 `on()` 메서드를 사용합니다:

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

마찬가지로 서버의 내부 이벤트를 수신 대기할 수 있습니다:

```typescript
server.on<TcpEvents>('error', (err) => {
  console.error(err);
});
```

> info **힌트** `TcpEvents` 타입은 `@nestjs/microservices` 패키지에서 가져옵니다.

#### 기본 드라이버 접근

더 고급 사용 사례의 경우 기본 드라이버 인스턴스에 접근해야 할 수 있습니다. 이는 연결을 수동으로 닫거나 드라이버별 메서드를 사용하는 시나리오에 유용할 수 있습니다. 하지만 대부분의 경우 드라이버에 직접 접근할 필요가 **없어야 함**을 명심하십시오.

그렇게 하려면 기본 드라이버 인스턴스를 반환하는 `unwrap()` 메서드를 사용할 수 있습니다. 제네릭 타입 파라미터는 예상하는 드라이버 인스턴스의 타입을 지정해야 합니다.

```typescript
const netServer = this.client.unwrap<Server>();
```

여기서 `Server`는 `net` 모듈에서 가져온 타입입니다.

마찬가지로 서버의 기본 드라이버 인스턴스에 접근할 수 있습니다:

```typescript
const netServer = server.unwrap<Server>();
```

#### 타임아웃 처리

분산 시스템에서 마이크로서비스는 때때로 중단되거나 사용할 수 없을 수 있습니다. 무한정 오래 기다리는 것을 방지하려면 타임아웃을 사용할 수 있습니다. 타임아웃은 다른 서비스와 통신할 때 매우 유용한 패턴입니다. 마이크로서비스 호출에 타임아웃을 적용하려면 [RxJS](https://rxjs.dev)의 `timeout` 연산자를 사용할 수 있습니다. 마이크로서비스가 지정된 시간 내에 응답하지 않으면 예외가 발생하며, 이를 적절히 잡아 처리할 수 있습니다.

이를 구현하려면 [`rxjs`](https://github.com/ReactiveX/rxjs) 패키지를 사용해야 합니다. `pipe` 내에서 `timeout` 연산자를 사용하기만 하면 됩니다:

```typescript
@@filename()
this.client
  .send<TResult, TInput>(pattern, data)
  .pipe(timeout(5000));
@@switch
this.client
  .send(pattern, data)
  .pipe(timeout(5000));
```

> info **힌트** `timeout` 연산자는 `rxjs/operators` 패키지에서 가져옵니다.

5초 후, 마이크로서비스가 응답하지 않으면 오류가 발생합니다.

#### TLS 지원

사설 네트워크 외부에서 통신할 때는 보안을 위해 트래픽을 암호화하는 것이 중요합니다. NestJS에서는 Node의 내장 [TLS](https://nodejs.org/api/tls.html) 모듈을 사용하여 TCP를 통해 TLS로 이를 달성할 수 있습니다. Nest는 TCP 전송에 TLS에 대한 내장 지원을 제공하여 마이크로서비스 또는 클라이언트 간의 통신을 암호화할 수 있습니다.

TCP 서버에 대해 TLS를 활성화하려면 PEM 형식의 개인 키와 인증서가 모두 필요합니다. 이들은 아래와 같이 `tlsOptions`를 설정하고 `key` 및 `cert` 파일을 지정하여 서버 옵션에 추가됩니다:

```typescript
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const key = fs.readFileSync('<pathToKeyFile>', 'utf8').toString();
  const cert = fs.readFileSync('<pathToCertFile>', 'utf8').toString();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        tlsOptions: {
          key,
          cert,
        },
      },
    },
  );

  await app.listen();
}
bootstrap();
```

클라이언트가 TLS를 통해 안전하게 통신하려면 `tlsOptions` 객체를 정의해야 하지만 이번에는 CA 인증서를 함께 사용합니다. 이는 서버 인증서에 서명한 인증 기관의 인증서입니다. 이는 클라이언트가 서버 인증서를 신뢰하고 보안 연결을 설정할 수 있도록 보장합니다.

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.TCP,
        options: {
          tlsOptions: {
            ca: [fs.readFileSync('<pathToCaFile>', 'utf-8').toString()],
          },
        },
      },
    ]),
  ],
})
export class AppModule {}
```

설정에 여러 신뢰할 수 있는 기관이 포함된 경우 CA 배열을 전달할 수도 있습니다.

모든 설정이 완료되면 `@Inject()` 데코레이터를 사용하여 평소와 같이 `ClientProxy`를 주입하여 서비스에서 클라이언트를 사용할 수 있습니다. 이는 Node의 `TLS` 모듈이 암호화 세부 정보를 처리하면서 NestJS 마이크로서비스 전체에서 암호화된 통신을 보장합니다.

자세한 내용은 Node의 [TLS 문서](https://nodejs.org/api/tls.html)를 참조하십시오.

#### 동적 구성

마이크로서비스가 `ConfigService`(`@nestjs/config` 패키지에서)를 사용하여 구성되어야 하지만, 주입 컨텍스트가 마이크로서비스 인스턴스가 생성된 후에만 사용 가능한 경우 `AsyncMicroserviceOptions`가 해결책을 제공합니다. 이 접근 방식을 통해 동적 구성이 가능하며, `ConfigService`와의 원활한 통합을 보장합니다.

```typescript
import { ConfigService } from '@nestjs/config';
import { AsyncMicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    AppModule,
    {
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get<string>('HOST'),
          port: configService.get<number>('PORT'),
        },
      }),
      inject: [ConfigService],
    },
  );

  await app.listen();
}
bootstrap();
```
