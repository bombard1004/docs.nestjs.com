### 카프카

[카프카](https://kafka.apache.org/)는 세 가지 핵심 기능을 가진 오픈 소스 분산 스트리밍 플랫폼입니다.

- 메시지 큐 또는 엔터프라이즈 메시징 시스템과 유사하게 레코드 스트림을 발행하고 구독합니다.
- 레코드 스트림을 내결함성이 있는 내구성 있는 방식으로 저장합니다.
- 레코드 스트림이 발생함에 따라 처리합니다.

카프카 프로젝트는 실시간 데이터 피드를 처리하기 위한 통합된 고처리량, 저지연 플랫폼을 제공하는 것을 목표로 합니다. 실시간 스트리밍 데이터 분석을 위해 Apache Storm 및 Spark와 잘 통합됩니다.

#### 설치

카프카 기반 마이크로서비스 빌드를 시작하려면 먼저 필요한 패키지를 설치합니다.

```bash
$ npm i --save kafkajs
```

#### 개요

다른 Nest 마이크로서비스 트랜스포트 계층 구현과 마찬가지로, 아래와 같이 `createMicroservice()` 메서드에 전달되는 옵션 객체의 `transport` 속성을 사용하여 카프카 트랜스포터 메커니즘을 선택할 수 있으며, 선택 사항인 `options` 속성도 함께 지정할 수 있습니다.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    }
  }
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    }
  }
});
```

> info **힌트** `Transport` enum은 `@nestjs/microservices` 패키지에서 임포트됩니다.

#### 옵션

`options` 속성은 선택한 트랜스포터에 따라 다릅니다. **카프카** 트랜스포터는 아래 설명된 속성들을 노출합니다.

<table>
  <tr>
    <td><code>client</code></td>
    <td>클라이언트 설정 옵션 (<a
        href="https://kafka.js.org/docs/configuration"
        rel="nofollow"
        target="blank"
        >여기</a
      >에서 더 읽어보세요)</td>
  </tr>
  <tr>
    <td><code>consumer</code></td>
    <td>컨슈머 설정 옵션 (<a
        href="https://kafka.js.org/docs/consuming#a-name-options-a-options"
        rel="nofollow"
        target="blank"
        >여기</a
      >에서 더 읽어보세요)</td>
  </tr>
  <tr>
    <td><code>run</code></td>
    <td>실행 설정 옵션 (<a
        href="https://kafka.js.org/docs/consuming"
        rel="nofollow"
        target="blank"
        >여기</a
      >에서 더 읽어보세요)</td>
  </tr>
  <tr>
    <td><code>subscribe</code></td>
    <td>구독 설정 옵션 (<a
        href="https://kafka.js.org/docs/consuming#frombeginning"
        rel="nofollow"
        target="blank"
        >여기</a
      >에서 더 읽어보세요)</td>
  </tr>
  <tr>
    <td><code>producer</code></td>
    <td>프로듀서 설정 옵션 (<a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="blank"
        >여기</a
      >에서 더 읽어보세요)</td>
  </tr>
  <tr>
    <td><code>send</code></td>
    <td>전송 설정 옵션 (<a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="blank"
        >여기</a
      >에서 더 읽어보세요)</td>
  </tr>
  <tr>
    <td><code>producerOnlyMode</code></td>
    <td>컨슈머 그룹 등록을 건너뛰고 프로듀서로만 작동하는 기능 플래그 (<code>boolean</code>)</td>
  </tr>
  <tr>
    <td><code>postfixId</code></td>
    <td>clientId 값의 접미사를 변경합니다 (<code>string</code>)</td>
  </tr>
</table>

#### 클라이언트

다른 마이크로서비스 트랜스포터와 비교하여 카프카에는 약간의 차이가 있습니다. `ClientProxy` 클래스 대신 `ClientKafkaProxy` 클래스를 사용합니다.

다른 마이크로서비스 트랜스포터와 마찬가지로 `ClientKafkaProxy` 인스턴스를 생성하는 [여러 가지 옵션](https://docs.nestjs.com/microservices/basics#client)이 있습니다.

인스턴스를 생성하는 한 가지 방법은 `ClientsModule`을 사용하는 것입니다. `ClientsModule`로 클라이언트 인스턴스를 생성하려면, 이를 임포트하고 `register()` 메서드를 사용하여 위에서 `createMicroservice()` 메서드에서 보여준 동일한 속성과 주입 토큰으로 사용할 `name` 속성을 가진 옵션 객체를 전달하면 됩니다. `ClientsModule`에 대해 더 자세히 알아보려면 [여기](https://docs.nestjs.com/microservices/basics#client)를 참조하세요.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'HERO_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'hero',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'hero-consumer'
          }
        }
      },
    ]),
  ]
  ...
})
```

클라이언트를 생성하는 다른 옵션(either `ClientProxyFactory` or `@Client()`)도 사용할 수 있습니다. [여기](https://docs.nestjs.com/microservices/basics#client)에서 해당 옵션에 대해 읽어볼 수 있습니다.

`@Client()` 데코레이터를 다음과 같이 사용합니다.

```typescript
@Client({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero',
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer'
    }
  }
})
client: ClientKafkaProxy;
```

#### 메시지 패턴

카프카 마이크로서비스 메시지 패턴은 요청 및 응답 채널에 대해 두 개의 토픽을 활용합니다. `ClientKafkaProxy#send()` 메서드는 [상관 ID](https://www.enterpriseintegrationpatterns.com/patterns/messaging/CorrelationIdentifier.html), 응답 토픽 및 응답 파티션을 요청 메시지와 연결하여 [반환 주소](https://www.enterpriseintegrationpatterns.com/patterns/messaging/ReturnAddress.html)와 함께 메시지를 보냅니다. 이를 위해서는 `ClientKafkaProxy` 인스턴스가 메시지를 보내기 전에 응답 토픽을 구독하고 하나 이상의 파티션에 할당되어야 합니다.

따라서 실행 중인 모든 Nest 애플리케이션에 대해 최소한 하나 이상의 응답 토픽 파티션을 가져야 합니다. 예를 들어, Nest 애플리케이션 4개를 실행 중인데 응답 토픽이 3개의 파티션만 가지고 있다면, Nest 애플리케이션 중 1개는 메시지를 보내려고 할 때 오류가 발생합니다.

새로운 `ClientKafkaProxy` 인스턴스가 시작되면 컨슈머 그룹에 가입하고 해당 토픽을 구독합니다. 이 과정은 컨슈머 그룹의 컨슈머에게 할당된 토픽 파티션의 리밸런싱을 유발합니다.

일반적으로 토픽 파티션은 라운드 로빈 파티셔너를 사용하여 할당됩니다. 이 파티셔너는 애플리케이션 시작 시 무작위로 설정되는 컨슈머 이름에 따라 정렬된 컨슈머 컬렉션에 토픽 파티션을 할당합니다. 그러나 새 컨슈머가 컨슈머 그룹에 가입하면 새 컨슈머는 컨슈머 컬렉션 내 어디든 위치할 수 있습니다. 이로 인해 기존 컨슈머가 새 컨슈머 뒤에 위치할 경우 다른 파티션이 할당될 수 있는 조건이 생성됩니다. 결과적으로 다른 파티션을 할당받은 컨슈머는 리밸런싱 전에 보낸 요청의 응답 메시지를 잃게 됩니다.

`ClientKafkaProxy` 컨슈머가 응답 메시지를 잃는 것을 방지하기 위해 Nest 고유의 내장 커스텀 파티셔너가 활용됩니다. 이 커스텀 파티셔너는 애플리케이션 시작 시 설정된 고해상도 타임스탬프(`process.hrtime()`)에 따라 정렬된 컨슈머 컬렉션에 파티션을 할당합니다.

#### 메시지 응답 구독

> warning **참고** 이 섹션은 [요청-응답](/microservices/basics#request-response) 메시지 스타일(와 `@MessagePattern` 데코레이터 및 `ClientKafkaProxy#send` 메서드)을 사용하는 경우에만 해당됩니다. [이벤트 기반](/microservices/basics#event-based) 통신(`@EventPattern` 데코레이터 및 `ClientKafkaProxy#emit` 메서드)에는 응답 토픽 구독이 필요하지 않습니다.

`ClientKafkaProxy` 클래스는 `subscribeToResponseOf()` 메서드를 제공합니다. `subscribeToResponseOf()` 메서드는 요청 토픽 이름을 인수로 받아 파생된 응답 토픽 이름을 응답 토픽 컬렉션에 추가합니다. 이 메서드는 메시지 패턴을 구현할 때 필요합니다.

```typescript
@@filename(heroes.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
}
```

`ClientKafkaProxy` 인스턴스가 비동기적으로 생성되는 경우, `subscribeToResponseOf()` 메서드는 `connect()` 메서드를 호출하기 전에 호출되어야 합니다.

```typescript
@@filename(heroes.controller)
async onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
  await this.client.connect();
}
```

#### 수신 메시지

Nest는 수신되는 카프카 메시지를 `key`, `value`, `headers` 속성이 `Buffer` 타입의 값을 가진 객체로 받습니다. Nest는 버퍼를 문자열로 변환하여 이 값들을 파싱합니다. 문자열이 "객체처럼 보이는" 경우, Nest는 문자열을 `JSON`으로 파싱하려고 시도합니다. `value`는 해당 핸들러로 전달됩니다.

#### 발신 메시지

Nest는 이벤트를 발행하거나 메시지를 보낼 때 직렬화 프로세스를 거친 후 발신 카프카 메시지를 보냅니다. 이는 `ClientKafkaProxy`의 `emit()` 및 `send()` 메서드에 전달되는 인수 또는 `@MessagePattern` 메서드에서 반환되는 값에 대해 발생합니다. 이 직렬화는 문자열이나 버퍼가 아닌 객체를 `JSON.stringify()` 또는 `toString()` 프로토타입 메서드를 사용하여 "문자열화"합니다.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const dragonId = message.dragonId;
    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];
    return items;
  }
}
```

> info **힌트** `@Payload()`는 `@nestjs/microservices` 패키지에서 임포트됩니다.

발신 메시지는 `key` 및 `value` 속성을 가진 객체를 전달하여 키를 지정할 수도 있습니다. 메시지에 키를 지정하는 것은 [코파티셔닝 요구사항](https://docs.confluent.io/current/ksql/docs/developer-guide/partition-data.html#co-partitioning-requirements)을 충족하는 데 중요합니다.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const realm = 'Nest';
    const heroId = message.heroId;
    const dragonId = message.dragonId;

    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];

    return {
      headers: {
        realm
      },
      key: heroId,
      value: items
    }
  }
}
```

또한 이 형식으로 전달되는 메시지에는 `headers` 해시 속성에 설정된 사용자 정의 헤더를 포함할 수 있습니다. 헤더 해시 속성 값은 `string` 타입 또는 `Buffer` 타입이어야 합니다.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const realm = 'Nest';
    const heroId = message.heroId;
    const dragonId = message.dragonId;

    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];

    return {
      headers: {
        kafka_nestRealm: realm
      },
      key: heroId,
      value: items
    }
  }
}
```

#### 이벤트 기반

요청-응답 메서드는 서비스 간 메시지 교환에 이상적이지만, 메시지 스타일이 이벤트 기반(카프카에 이상적)일 때는 덜 적합합니다. 즉, **응답을 기다리지 않고** 이벤트를 발행하고 싶을 때입니다. 이 경우 요청-응답에 필요한 두 토픽 유지 관리 오버헤드를 원하지 않을 것입니다.

이에 대해 더 자세히 알아보려면 다음 두 섹션을 확인하세요: [개요: 이벤트 기반](/microservices/basics#event-based) 및 [개요: 이벤트 발행](/microservices/basics#publishing-events).

#### 컨텍스트

더 복잡한 시나리오에서는 수신 요청에 대한 추가 정보에 접근해야 할 수 있습니다. 카프카 트랜스포터를 사용할 때 `KafkaContext` 객체에 접근할 수 있습니다.

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('hero.kill.dragon')
killDragon(message, context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

> info **힌트** `@Payload()`, `@Ctx()`, `KafkaContext`는 `@nestjs/microservices` 패키지에서 임포트됩니다.

원래 카프카 `IncomingMessage` 객체에 접근하려면 `KafkaContext` 객체의 `getMessage()` 메서드를 다음과 같이 사용합니다.

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  const originalMessage = context.getMessage();
  const partition = context.getPartition();
  const { headers, timestamp } = originalMessage;
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('hero.kill.dragon')
killDragon(message, context) {
  const originalMessage = context.getMessage();
  const partition = context.getPartition();
  const { headers, timestamp } = originalMessage;
}
```

여기서 `IncomingMessage`는 다음 인터페이스를 만족합니다.

```typescript
interface IncomingMessage {
  topic: string;
  partition: number;
  timestamp: string;
  size: number;
  attributes: number;
  offset: string;
  key: any;
  value: any;
  headers: Record<string, any>;
}
```

핸들러가 각 수신 메시지에 대해 느린 처리 시간을 포함하는 경우, `heartbeat` 콜백 사용을 고려해야 합니다. `heartbeat` 함수를 검색하려면 `KafkaContext`의 `getHeartbeat()` 메서드를 다음과 같이 사용합니다.

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
async killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  const heartbeat = context.getHeartbeat();

  // 일부 느린 처리 작업 수행
  await doWorkPart1();

  // sessionTimeout 초과하지 않도록 하트비트 전송
  await heartbeat();

  // 다시 일부 느린 처리 작업 수행
  await doWorkPart2();
}
```

#### 명명 규칙

카프카 마이크로서비스 컴포넌트는 Nest 마이크로서비스 클라이언트 및 서버 컴포넌트 간의 충돌을 방지하기 위해 `client.clientId` 및 `consumer.groupId` 옵션에 해당 역할 설명을 추가합니다. 기본적으로 `ClientKafkaProxy` 컴포넌트는 `-client`를 추가하고 `ServerKafka` 컴포넌트는 두 옵션 모두에 `-server`를 추가합니다. 아래 제공된 값이 어떻게 변환되는지 (주석에 표시됨) 확인하십시오.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero', // hero-server
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer' // hero-consumer-server
    },
  }
});
```

클라이언트의 경우:

```typescript
@@filename(heroes.controller)
@Client({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero', // hero-client
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer' // hero-consumer-client
    }
  }
})
client: ClientKafkaProxy;
```

> info **힌트** 카프카 클라이언트 및 컨슈머 명명 규칙은 사용자 정의 프로바이더에서 `ClientKafkaProxy` 및 `KafkaServer`를 확장하고 생성자를 오버라이드하여 사용자 정의할 수 있습니다.

카프카 마이크로서비스 메시지 패턴은 요청 및 응답 채널에 대해 두 개의 토픽을 활용하므로, 응답 패턴은 요청 토픽에서 파생되어야 합니다. 기본적으로 응답 토픽의 이름은 요청 토픽 이름에 `.reply`가 추가된 복합체입니다.

```typescript
@@filename(heroes.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.get'); // hero.get.reply
}
```

> info **힌트** 카프카 응답 토픽 명명 규칙은 사용자 정의 프로바이더에서 `ClientKafkaProxy`를 확장하고 `getResponsePatternName` 메서드를 오버라이드하여 사용자 정의할 수 있습니다.

#### 재시도 가능한 예외

다른 트랜스포터와 유사하게, 처리되지 않은 모든 예외는 자동으로 `RpcException`으로 래핑되어 "사용자 친화적인" 형식으로 변환됩니다. 하지만 이 메커니즘을 우회하고 예외가 `kafkajs` 드라이버에 의해 소비되도록 하고 싶을 때의 엣지 케이스가 있습니다. 메시지를 처리할 때 예외를 던지면 `kafkajs`에게 이를 **재시도** (재전달)하도록 지시합니다. 이는 메시지 (또는 이벤트) 핸들러가 트리거되었더라도 오프셋이 카프카에 커밋되지 않음을 의미합니다.

> warning **경고** 이벤트 핸들러(이벤트 기반 통신)의 경우, 처리되지 않은 모든 예외는 기본적으로 **재시도 가능한 예외**로 간주됩니다.

이를 위해 다음과 같이 `KafkaRetriableException`이라는 전용 클래스를 사용할 수 있습니다.

```typescript
throw new KafkaRetriableException('...');
```

> info **힌트** `KafkaRetriableException` 클래스는 `@nestjs/microservices` 패키지에서 내보내집니다.

### 사용자 정의 예외 처리

기본 오류 처리 메커니즘 외에도 카프카 이벤트를 위한 사용자 정의 예외 필터를 생성하여 재시도 로직을 관리할 수 있습니다. 예를 들어, 아래 예시는 설정 가능한 횟수만큼 재시도한 후 문제가 있는 이벤트를 건너뛰는 방법을 보여줍니다.

```typescript
import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { KafkaContext } from '../ctx-host';

@Catch()
export class KafkaMaxRetryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(KafkaMaxRetryExceptionFilter.name);

  constructor(
    private readonly maxRetries: number,
    // 선택 사항: 최대 재시도 횟수를 초과했을 때 실행될 사용자 정의 함수
    private readonly skipHandler?: (message: any) => Promise<void>,
  ) {
    super();
  }

  async catch(exception: unknown, host: ArgumentsHost) {
    const kafkaContext = host.switchToRpc().getContext<KafkaContext>();
    const message = kafkaContext.getMessage();
    const currentRetryCount = this.getRetryCountFromContext(kafkaContext);

    if (currentRetryCount >= this.maxRetries) {
      this.logger.warn(
        `Max retries (${
          this.maxRetries
        }) exceeded for message: ${JSON.stringify(message)}`,
      );

      if (this.skipHandler) {
        try {
          await this.skipHandler(message);
        } catch (err) {
          this.logger.error('Error in skipHandler:', err);
        }
      }

      try {
        await this.commitOffset(kafkaContext);
      } catch (commitError) {
        this.logger.error('Failed to commit offset:', commitError);
      }
      return; // 예외 전파 중지
    }

    // 재시도 횟수가 최대값보다 작으면 기본 예외 필터 로직을 진행
    super.catch(exception, host);
  }

  private getRetryCountFromContext(context: KafkaContext): number {
    const headers = context.getMessage().headers || {};
    const retryHeader = headers['retryCount'] || headers['retry-count'];
    return retryHeader ? Number(retryHeader) : 0;
  }

  private async commitOffset(context: KafkaContext): Promise<void> {
    const consumer = context.getConsumer && context.getConsumer();
    if (!consumer) {
      throw new Error('Consumer instance is not available from KafkaContext.');
    }

    const topic = context.getTopic && context.getTopic();
    const partition = context.getPartition && context.getPartition();
    const message = context.getMessage();
    const offset = message.offset;

    if (!topic || partition === undefined || offset === undefined) {
      throw new Error(
        'Incomplete Kafka message context for committing offset.',
      );
    }

    await consumer.commitOffsets([
      {
        topic,
        partition,
        // 오프셋을 커밋할 때, 다음 번호 (즉, 현재 오프셋 + 1)를 커밋합니다.
        offset: (Number(offset) + 1).toString(),
      },
    ]);
  }
}
```

이 필터는 카프카 이벤트를 설정 가능한 횟수만큼 재처리하는 방법을 제공합니다. 최대 재시도 횟수에 도달하면 (제공된 경우) 사용자 정의 `skipHandler`를 트리거하고 오프셋을 커밋하여 문제가 있는 이벤트를 효과적으로 건너뜁니다. 이를 통해 후속 이벤트가 중단 없이 처리될 수 있습니다.

이 필터를 이벤트 핸들러에 추가하여 통합할 수 있습니다.

```typescript
@UseFilters(new KafkaMaxRetryExceptionFilter(5))
export class MyEventHandler {
  @EventPattern('your-topic')
  async handleEvent(@Payload() data: any, @Ctx() context: KafkaContext) {
    // 이벤트 처리 로직 ...
  }
}
```

#### 오프셋 커밋

오프셋 커밋은 카프카 작업 시 필수적입니다. 기본적으로 메시지는 특정 시간 후에 자동으로 커밋됩니다. 자세한 내용은 [KafkaJS 문서](https://kafka.js.org/docs/consuming#autocommit)를 참조하세요. `KafkaContext`는 수동으로 오프셋을 커밋하기 위해 활성 컨슈머에 접근하는 방법을 제공합니다. 이 컨슈머는 KafkaJS 컨슈머이며 [네이티브 KafkaJS 구현](https://kafka.js.org/docs/consuming#manual-committing)과 동일하게 작동합니다.

```typescript
@@filename()
@EventPattern('user.created')
async handleUserCreated(@Payload() data: IncomingMessage, @Ctx() context: KafkaContext) {
  // 비즈니스 로직

  const { offset } = context.getMessage();
  const partition = context.getPartition();
  const topic = context.getTopic();
  const consumer = context.getConsumer();
  await consumer.commitOffsets([{ topic, partition, offset }])
}
@@switch
@Bind(Payload(), Ctx())
@EventPattern('user.created')
async handleUserCreated(data, context) {
  // 비즈니스 로직

  const { offset } = context.getMessage();
  const partition = context.getPartition();
  const topic = context.getTopic();
  const consumer = context.getConsumer();
  await consumer.commitOffsets([{ topic, partition, offset }])
}
```

메시지의 자동 커밋을 비활성화하려면 `run` 설정에서 `autoCommit: false`로 설정합니다.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    },
    run: {
      autoCommit: false
    }
  }
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    },
    run: {
      autoCommit: false
    }
  }
});
```

#### 인스턴스 상태 업데이트

연결 상태 및 기본 드라이버 인스턴스의 상태에 대한 실시간 업데이트를 받으려면 `status` 스트림을 구독할 수 있습니다. 이 스트림은 선택한 드라이버에 특화된 상태 업데이트를 제공합니다. 카프카 드라이버의 경우 `status` 스트림은 `connected`, `disconnected`, `rebalancing`, `crashed`, `stopped` 이벤트를 내보냅니다.

```typescript
this.client.status.subscribe((status: KafkaStatus) => {
  console.log(status);
});
```

> info **힌트** `KafkaStatus` 타입은 `@nestjs/microservices` 패키지에서 임포트됩니다.

유사하게 서버의 `status` 스트림을 구독하여 서버 상태에 대한 알림을 받을 수 있습니다.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: KafkaStatus) => {
  console.log(status);
});
```

#### 기본 프로듀서 및 컨슈머

더 고급 사용 사례의 경우 기본 프로듀서 및 컨슈머 인스턴스에 접근해야 할 수 있습니다. 이는 연결을 수동으로 닫거나 드라이버별 메서드를 사용하는 시나리오에 유용할 수 있습니다. 하지만 대부분의 경우 드라이버에 직접 접근할 필요는 **없습니다**.

이렇게 하려면 `ClientKafkaProxy` 인스턴스에 노출된 `producer` 및 `consumer` getter를 사용할 수 있습니다.

```typescript
const producer = this.client.producer;
const consumer = this.client.consumer;
```