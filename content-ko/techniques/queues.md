### 큐 (Queues)

큐는 애플리케이션 스케일링 및 성능과 관련된 일반적인 문제를 해결하는 데 도움이 되는 강력한 디자인 패턴입니다. 큐를 통해 해결할 수 있는 문제의 몇 가지 예시는 다음과 같습니다.

-   처리 피크를 완화합니다. 예를 들어, 사용자가 자원 집약적인 작업을 임의의 시간에 시작할 수 있는 경우, 이 작업을 동기적으로 수행하는 대신 큐에 추가할 수 있습니다. 그런 다음 워커 프로세스가 제어된 방식으로 큐에서 작업을 가져오도록 할 수 있습니다. 애플리케이션 규모가 확장됨에 따라 백엔드 작업 처리를 확장하기 위해 새로운 큐 소비자를 쉽게 추가할 수 있습니다.
-   Node.js 이벤트 루프를 블록할 수 있는 모놀리식 작업을 분해합니다. 예를 들어, 사용자 요청이 오디오 트랜스코딩과 같은 CPU 집약적인 작업을 요구하는 경우, 이 작업을 다른 프로세스에 위임하여 사용자에게 반응성을 제공하는 프로세스를 자유롭게 유지할 수 있습니다.
-   다양한 서비스 간에 안정적인 통신 채널을 제공합니다. 예를 들어, 하나의 프로세스 또는 서비스에서 작업(jobs)을 큐에 넣고, 다른 프로세스나 서비스에서 이를 소비할 수 있습니다. 작업 라이프사이클의 완료, 오류 또는 기타 상태 변경에 대해 (상태 이벤트를 수신하여) 어떤 프로세스나 서비스에서도 알림을 받을 수 있습니다. 큐 생산자 또는 소비자가 실패하더라도 상태는 보존되며, 노드가 재시작될 때 작업 처리가 자동으로 다시 시작될 수 있습니다.

Nest는 BullMQ 통합을 위해 `@nestjs/bullmq` 패키지를, Bull 통합을 위해 `@nestjs/bull` 패키지를 제공합니다. 두 패키지 모두 해당 라이브러리 위에서 작동하는 추상화/래퍼이며, 동일한 팀에 의해 개발되었습니다. Bull은 현재 유지보수 모드에 있으며, 팀은 버그 수정에 집중하고 있습니다. 반면 BullMQ는 활발히 개발되고 있으며, 최신 TypeScript 구현과 다른 기능 세트를 특징으로 합니다. 만약 Bull이 여러분의 요구사항을 충족시킨다면, 여전히 신뢰할 수 있고 검증된 선택입니다. Nest 패키지는 BullMQ 또는 Bull 큐를 Nest 애플리케이션에 친숙한 방식으로 쉽게 통합할 수 있도록 합니다.

BullMQ와 Bull 모두 작업 데이터를 영구적으로 저장하기 위해 [Redis](https://redis.io/)를 사용하므로 시스템에 Redis가 설치되어 있어야 합니다. Redis를 기반으로 하기 때문에 큐 아키텍처는 완전히 분산되고 플랫폼 독립적일 수 있습니다. 예를 들어, Nest에서 실행되는 (또는 여러) 노드에서 일부 큐 <a href="techniques/queues#producers">생산자</a> 및 <a href="techniques/queues#consumers">소비자</a>와 <a href="techniques/queues#event-listeners">리스너</a>를 가질 수 있으며, 다른 생산자, 소비자, 리스너는 다른 네트워크 노드에 있는 다른 Node.js 플랫폼에서 실행될 수 있습니다.

이 장에서는 `@nestjs/bullmq` 및 `@nestjs/bull` 패키지에 대해 다룹니다. 더 자세한 배경 정보와 구체적인 구현 세부 사항은 [BullMQ](https://docs.bullmq.io/) 및 [Bull](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md) 문서를 읽어보시는 것도 권장합니다.

#### BullMQ 설치

BullMQ 사용을 시작하기 위해 필요한 종속성을 먼저 설치합니다.

```bash
$ npm install --save @nestjs/bullmq bullmq
```

설치 프로세스가 완료되면, 루트 `AppModule`에 `BullModule`을 임포트할 수 있습니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

`forRoot()` 메서드는 애플리케이션에 등록된 모든 큐에서 사용될 (별도로 지정되지 않는 한) `bullmq` 패키지 구성 객체를 등록하는 데 사용됩니다. 참고로, 구성 객체의 몇 가지 속성은 다음과 같습니다.

-   `connection: ConnectionOptions` - Redis 연결을 구성하기 위한 옵션입니다. 자세한 내용은 [Connections](https://docs.bullmq.io/guide/connections)를 참조하세요. 선택 사항입니다.
-   `prefix: string` - 모든 큐 키에 대한 접두사입니다. 선택 사항입니다.
-   `defaultJobOptions: JobOpts` - 새로운 작업에 대한 기본 설정을 제어하는 옵션입니다. 자세한 내용은 [JobOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd)를 참조하세요. 선택 사항입니다.
-   `settings: AdvancedSettings` - 고급 큐 구성 설정입니다. 일반적으로 변경하지 않아야 합니다. 자세한 내용은 [AdvancedSettings](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue)를 참조하세요. 선택 사항입니다.
-   `extraOptions` - 모듈 초기화를 위한 추가 옵션입니다. 자세한 내용은 [Manual Registration](https://docs.nestjs.com/techniques/queues#manual-registration)를 참조하세요.

모든 옵션은 선택 사항이며, 큐 동작을 세부적으로 제어할 수 있도록 합니다. 이 옵션들은 BullMQ `Queue` 생성자에 직접 전달됩니다. 이러한 옵션 및 기타 옵션에 대한 자세한 내용은 [여기](https://api.docs.bullmq.io/interfaces/v4.QueueOptions.html)에서 읽어보세요.

큐를 등록하려면 다음과 같이 `BullModule.registerQueue()` 동적 모듈을 임포트합니다.

```typescript
BullModule.registerQueue({
  name: 'audio',
});
```

> info **힌트** `registerQueue()` 메서드에 여러 개의 쉼표로 구분된 구성 객체를 전달하여 여러 큐를 생성할 수 있습니다.

`registerQueue()` 메서드는 큐를 인스턴스화하고/또는 등록하는 데 사용됩니다. 큐는 동일한 자격 증명으로 동일한 기본 Redis 데이터베이스에 연결하는 모듈 및 프로세스에서 공유됩니다. 각 큐는 `name` 속성으로 고유합니다. 큐 이름은 (컨트롤러/프로바이더에 큐를 주입하기 위한) 주입 토큰과 소비자 클래스 및 리스너를 큐와 연결하기 위한 데코레이터 인수로 모두 사용됩니다.

다음과 같이 특정 큐에 대해 미리 구성된 일부 옵션을 재정의할 수도 있습니다.

```typescript
BullModule.registerQueue({
  name: 'audio',
  connection: {
    port: 6380,
  },
});
```

BullMQ는 작업 간의 부모-자식 관계도 지원합니다. 이 기능은 임의 깊이의 트리의 노드인 작업들을 포함하는 플로우 생성(Flow creation)을 가능하게 합니다. 이에 대해 더 자세히 읽으려면 [여기](https://docs.bullmq.io/guide/flows)를 확인하십시오.

플로우를 추가하려면 다음과 같이 할 수 있습니다:

```typescript
BullModule.registerFlowProducer({
  name: 'flowProducerName',
});
```

작업은 Redis에 영구적으로 저장되기 때문에, 특정 이름의 큐가 인스턴스화될 때마다 (예: 앱이 시작/재시작될 때), 이전 세션에서 존재할 수 있는 완료되지 않은 오래된 작업을 처리하려고 시도합니다.

각 큐는 하나 이상의 생산자, 소비자 및 리스너를 가질 수 있습니다. 소비자는 특정 순서(기본값은 FIFO, LIFO 또는 우선순위에 따름)로 큐에서 작업을 가져옵니다. 큐 처리 순서 제어는 <a href="techniques/queues#consumers">여기</a>에서 논의됩니다.

<app-banner-enterprise></app-banner-enterprise>

#### 명명된 설정 (Named configurations)

큐가 여러 개의 서로 다른 Redis 인스턴스에 연결하는 경우, **명명된 설정**이라는 기술을 사용할 수 있습니다. 이 기능을 사용하면 지정된 키 아래에 여러 설정을 등록할 수 있으며, 큐 옵션에서 이를 참조할 수 있습니다.

예를 들어, 애플리케이션에 등록된 몇 개의 큐가 사용하는 추가 Redis 인스턴스(기본 인스턴스 외)가 있다고 가정하면, 다음과 같이 해당 설정을 등록할 수 있습니다.

```typescript
BullModule.forRoot('alternative-config', {
  connection: {
    port: 6381,
  },
});
```

위 예시에서 `'alternative-config'`는 단지 설정 키일 뿐이며 (임의의 문자열일 수 있습니다).

이를 설정한 후에는 `registerQueue()` 옵션 객체에서 이 설정을 가리킬 수 있습니다.

```typescript
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
```

#### 생산자 (Producers)

작업 생산자는 큐에 작업을 추가합니다. 생산자는 일반적으로 애플리케이션 서비스(Nest [프로바이더](/providers))입니다. 큐에 작업을 추가하려면 먼저 다음과 같이 큐를 서비스에 주입합니다.

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
```

> info **힌트** `@InjectQueue()` 데코레이터는 `registerQueue()` 메서드 호출에서 제공된 이름으로 큐를 식별합니다 (예: `'audio'`).

이제 사용자 정의 작업 객체를 전달하여 큐의 `add()` 메서드를 호출하여 작업을 추가합니다. 작업은 직렬화 가능한 JavaScript 객체로 표현됩니다 (Redis 데이터베이스에 저장되는 방식 때문입니다). 전달하는 작업 객체의 형태는 임의적입니다. 이를 사용하여 작업 객체의 의미를 표현하십시오. 또한 이름을 부여해야 합니다. 이를 통해 주어진 이름을 가진 작업만 처리하는 특수 <a href="techniques/queues#consumers">소비자</a>를 생성할 수 있습니다.

```typescript
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
```

#### 작업 옵션 (Job options)

작업에는 추가 옵션이 연결될 수 있습니다. `Queue.add()` 메서드에서 `job` 인자 뒤에 옵션 객체를 전달합니다. 작업 옵션 속성 중 일부는 다음과 같습니다.

-   `priority`: `number` - 선택적 우선순위 값입니다. 1 (가장 높음)부터 MAX_INT (가장 낮음)까지의 범위를 가집니다. 우선순위를 사용하면 성능에 약간의 영향을 미치므로 주의해서 사용하세요.
-   `delay`: `number` - 이 작업을 처리할 때까지 대기하는 시간(밀리초)입니다. 정확한 지연을 위해서는 서버와 클라이언트 모두 시계가 동기화되어야 합니다.
-   `attempts`: `number` - 작업이 완료될 때까지 시도할 총 횟수입니다.
-   `repeat`: `RepeatOpts` - cron 사양에 따라 작업을 반복합니다. 자세한 내용은 [RepeatOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd)를 참조하세요.
-   `backoff`: `number | BackoffOpts` - 작업 실패 시 자동 재시도를 위한 백오프 설정입니다. 자세한 내용은 [BackoffOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd)를 참조하세요.
-   `lifo`: `boolean` - true이면 작업을 왼쪽 끝(기본값 false) 대신 큐의 오른쪽 끝에 추가합니다.
-   `jobId`: `number` | `string` - 작업 ID를 재정의합니다. 기본적으로 작업 ID는 고유한 정수이지만, 이 설정을 사용하여 재정의할 수 있습니다. 이 옵션을 사용하는 경우 jobId가 고유하도록 보장하는 것은 사용자에게 달려 있습니다. 이미 존재하는 ID로 작업을 추가하려고 하면 추가되지 않습니다.
-   `removeOnComplete`: `boolean | number` - true이면 작업이 성공적으로 완료될 때 작업을 제거합니다. 숫자는 유지할 작업의 수를 지정합니다. 기본 동작은 완료된 세트에 작업을 유지하는 것입니다.
-   `removeOnFail`: `boolean | number` - true이면 모든 시도 후 작업이 실패할 때 작업을 제거합니다. 숫자는 유지할 작업의 수를 지정합니다. 기본 동작은 실패한 세트에 작업을 유지하는 것입니다.
-   `stackTraceLimit`: `number` - 스택 트레이스에 기록될 스택 트레이스 라인의 수를 제한합니다.

작업 옵션을 사용하여 작업을 커스터마이징하는 몇 가지 예시는 다음과 같습니다.

작업 시작을 지연시키려면 `delay` 구성 속성을 사용합니다.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { delay: 3000 }, // 3초 지연
);
```

작업을 큐의 오른쪽 끝에 추가하려면 (**LIFO**(Last In First Out)로 작업을 처리) 구성 객체의 `lifo` 속성을 `true`로 설정합니다.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { lifo: true },
);
```

작업 우선순위를 지정하려면 `priority` 속성을 사용합니다.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { priority: 2 },
);
```

전체 옵션 목록은 [여기](https://api.docs.bullmq.io/types/v4.JobsOptions.html)와 [여기](https://api.docs.bullmq.io/interfaces/v4.BaseJobOptions.html)의 API 문서를 확인하십시오.

#### 소비자 (Consumers)

소비자는 큐에 추가된 작업을 처리하거나 큐에 대한 이벤트를 수신하거나 둘 다를 수행하는 메서드를 정의하는 **클래스**입니다. `@Processor()` 데코레이터를 사용하여 다음과 같이 소비자 클래스를 선언합니다.

```typescript
import { Processor } from '@nestjs/bullmq';

@Processor('audio')
export class AudioConsumer {}
```

> info **힌트** 소비자는 `@nestjs/bullmq` 패키지가 이를 인식할 수 있도록 `providers`로 등록해야 합니다.

여기서 데코레이터의 문자열 인자(예: `'audio'`)는 클래스 메서드와 연결될 큐의 이름입니다.

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    let progress = 0;
    for (let i = 0; i < 100; i++) {
      await doSomething(job.data);
      progress += 1;
      await job.updateProgress(progress);
    }
    return {};
  }
}
```

`process` 메서드는 워커가 유휴 상태이고 큐에 처리할 작업이 있을 때마다 호출됩니다. 이 핸들러 메서드는 유일한 인수로 `job` 객체를 받습니다. 핸들러 메서드가 반환하는 값은 작업 객체에 저장되며, 예를 들어 완료 이벤트에 대한 리스너에서 나중에 접근할 수 있습니다.

`Job` 객체에는 상태와 상호작용할 수 있는 여러 메서드가 있습니다. 예를 들어, 위 코드는 `progress()` 메서드를 사용하여 작업의 진행 상황을 업데이트합니다. 전체 `Job` 객체 API 참조는 [여기](https://api.docs.bullmq.io/classes/v4.Job.html)를 참조하십시오.

이전 버전인 Bull에서는 다음과 같이 `@Process()` 데코레이터에 `name`을 전달하여 특정 유형의 작업(특정 `name`을 가진 작업) **만** 처리하도록 작업 핸들러 메서드를 지정할 수 있었습니다.

> warning **경고** 이것은 BullMQ에서는 작동하지 않습니다. 계속 읽으세요.

```typescript
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
```

이 동작은 생성된 혼란으로 인해 BullMQ에서 지원되지 않습니다. 대신 각 작업 이름에 대해 다른 서비스나 로직을 호출하기 위해 switch case를 사용해야 합니다.

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'transcode': {
        let progress = 0;
        for (i = 0; i < 100; i++) {
          await doSomething(job.data);
          progress += 1;
          await job.progress(progress);
        }
        return {};
      }
      case 'concatenate': {
        await doSomeLogic2();
        break;
      }
    }
  }
}
```

이 내용은 BullMQ 문서의 [named processor](https://docs.bullmq.io/patterns/named-processor) 섹션에 설명되어 있습니다.

#### 요청 스코프 소비자 (Request-scoped consumers)

소비자가 요청 스코프로 플래그되면 (인젝션 스코프에 대한 자세한 내용은 [여기](/fundamentals/injection-scopes#provider-scope)에서 확인하세요), 각 작업을 위해서만 클래스의 새로운 인스턴스가 생성됩니다. 인스턴스는 작업이 완료된 후 가비지 수집됩니다.

```typescript
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
```

요청 스코프 소비자 클래스는 동적으로 인스턴스화되고 단일 작업으로 스코프가 지정되므로, 표준 접근 방식을 사용하여 생성자를 통해 `JOB_REF`를 주입할 수 있습니다.

```typescript
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
```

> info **힌트** `JOB_REF` 토큰은 `@nestjs/bullmq` 패키지에서 임포트됩니다.

#### 이벤트 리스너 (Event listeners)

BullMQ는 큐 및/또는 작업 상태 변경이 발생할 때 유용한 이벤트 집합을 생성합니다. 이러한 이벤트는 `@OnWorkerEvent(event)` 데코레이터를 사용하여 워커 수준에서 구독하거나, 전용 리스너 클래스와 `@OnQueueEvent(event)` 데코레이터를 사용하여 큐 수준에서 구독할 수 있습니다.

워커 이벤트는 <a href="techniques/queues#consumers">소비자</a> 클래스 내에서 (즉, `@Processor()` 데코레이터로 장식된 클래스 내에서) 선언되어야 합니다. 이벤트를 수신하려면 처리하려는 이벤트와 함께 `@OnWorkerEvent(event)` 데코레이터를 사용하십시오. 예를 들어, `audio` 큐에서 작업이 활성 상태로 진입할 때 발생하는 이벤트를 수신하려면 다음과 같은 구조를 사용하십시오.

```typescript
import { Processor, Process, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer {
  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  // ...
}
```

이벤트와 해당 인수의 전체 목록은 WorkerListener의 속성으로 [여기](https://api.docs.bullmq.io/interfaces/v4.WorkerListener.html)에서 확인할 수 있습니다.

QueueEvent 리스너는 `@QueueEventsListener(queue)` 데코레이터를 사용하고 `@nestjs/bullmq`가 제공하는 `QueueEventsHost` 클래스를 확장해야 합니다. 이벤트를 수신하려면 처리하려는 이벤트와 함께 `@OnQueueEvent(event)` 데코레이터를 사용하십시오. 예를 들어, `audio` 큐에서 작업이 활성 상태로 진입할 때 발생하는 이벤트를 수신하려면 다음과 같은 구조를 사용하십시오.

```typescript
import {
  QueueEventsHost,
  QueueEventsListener,
  OnQueueEvent,
} from '@nestjs/bullmq';

@QueueEventsListener('audio')
export class AudioEventsListener extends QueueEventsHost {
  @OnQueueEvent('active')
  onActive(job: { jobId: string; prev?: string }) {
    console.log(`Processing job ${job.jobId}...`);
  }

  // ...
}
```

> info **힌트** QueueEvent 리스너는 `@nestjs/bullmq` 패키지가 이를 인식할 수 있도록 `providers`로 등록해야 합니다.

이벤트와 해당 인수의 전체 목록은 QueueEventsListener의 속성으로 [여기](https://api.docs.bullmq.io/interfaces/v4.QueueEventsListener.html)에서 확인할 수 있습니다.

#### 큐 관리 (Queue management)

큐는 일시 중지 및 재개, 다양한 상태의 작업 수 검색 등 관리 기능을 수행할 수 있는 API를 제공합니다. 전체 큐 API는 [여기](https://api.docs.bullmq.io/classes/v4.Queue.html)에서 찾을 수 있습니다. 아래 일시 중지/재개 예시와 같이 이러한 메서드를 `Queue` 객체에서 직접 호출합니다.

`pause()` 메서드 호출로 큐를 일시 중지합니다. 일시 중지된 큐는 재개될 때까지 새 작업을 처리하지 않지만, 현재 처리 중인 작업은 완료될 때까지 계속됩니다.

```typescript
await audioQueue.pause();
```

일시 중지된 큐를 재개하려면 다음과 같이 `resume()` 메서드를 사용합니다.

```typescript
await audioQueue.resume();
```

#### 별도 프로세스 (Separate processes)

작업 핸들러는 별도의 (forked) 프로세스에서 실행될 수도 있습니다 ([출처](https://docs.bullmq.io/guide/workers/sandboxed-processors)). 이는 몇 가지 장점이 있습니다.

-   프로세스가 샌드박스 처리되어 충돌하더라도 워커에 영향을 미치지 않습니다.
-   큐에 영향을 주지 않고 블록킹 코드를 실행할 수 있습니다 (작업이 멈추지 않습니다).
-   멀티 코어 CPU를 훨씬 더 잘 활용할 수 있습니다.
-   Redis 연결이 줄어듭니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(__dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
```

> warning **경고** 함수가 포크된 프로세스에서 실행되므로 Dependency Injection (및 IoC 컨테이너)를 사용할 수 없다는 점에 유의하십시오. 즉, 프로세서 함수는 필요한 모든 외부 종속성의 인스턴스를 포함하거나 생성해야 합니다.

#### 비동기 설정 (Async configuration)

정적으로 전달하는 대신 `bullmq` 옵션을 비동기적으로 전달하고 싶을 수 있습니다. 이 경우 비동기 설정을 처리하는 여러 방법을 제공하는 `forRootAsync()` 메서드를 사용하십시오. 마찬가지로 큐 옵션을 비동기적으로 전달하려면 `registerQueueAsync()` 메서드를 사용하십시오.

한 가지 접근 방식은 팩토리 함수를 사용하는 것입니다.

```typescript
BullModule.forRootAsync({
  useFactory: () => ({
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

우리의 팩토리는 다른 [비동기 프로바이더](https://docs.nestjs.com/fundamentals/async-providers)와 마찬가지로 동작합니다 (예: `async`일 수 있으며 `inject`를 통해 종속성을 주입할 수 있습니다).

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    connection: {
      host: configService.get('QUEUE_HOST'),
      port: configService.get('QUEUE_PORT'),
    },
  }),
  inject: [ConfigService],
});
```

또는 `useClass` 구문을 사용할 수 있습니다.

```typescript
BullModule.forRootAsync({
  useClass: BullConfigService,
});
```

위 구조는 `BullModule` 내에서 `BullConfigService`를 인스턴스화하고 `createSharedConfiguration()`을 호출하여 옵션 객체를 제공하는 데 사용됩니다. 이는 `BullConfigService`가 아래와 같이 `SharedBullConfigurationFactory` 인터페이스를 구현해야 함을 의미합니다.

```typescript
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullModuleOptions {
    return {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
```

`BullModule` 내에서 `BullConfigService`의 생성을 방지하고 다른 모듈에서 임포트된 프로바이더를 사용하려면 `useExisting` 구문을 사용할 수 있습니다.

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

이 구조는 `useClass`와 동일하게 작동하지만 한 가지 중요한 차이점이 있습니다. `BullModule`은 새로운 `ConfigService` 인스턴스를 생성하는 대신 임포트된 모듈을 찾아 기존 `ConfigService`를 재사용합니다.

마찬가지로 큐 옵션을 비동기적으로 전달하려면 `registerQueueAsync()` 메서드를 사용하되, 팩토리 함수 외부에서 `name` 속성을 지정해야 합니다.

```typescript
BullModule.registerQueueAsync({
  name: 'audio',
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

#### 수동 등록 (Manual registration)

기본적으로 `BullModule`은 `onModuleInit` 라이프사이클 함수에서 BullMQ 구성 요소(큐, 프로세서 및 이벤트 리스너 서비스)를 자동으로 등록합니다. 그러나 경우에 따라 이 동작이 이상적이지 않을 수 있습니다. 자동 등록을 방지하려면 다음과 같이 `BullModule`에서 `manualRegistration`을 활성화합니다.

```typescript
BullModule.forRoot({
  extraOptions: {
    manualRegistration: true,
  },
});
```

이러한 구성 요소를 수동으로 등록하려면 `BullRegistrar`를 주입하고 `register` 함수를 호출하십시오. 이상적으로는 `OnModuleInit` 또는 `OnApplicationBootstrap` 내에서 호출하는 것이 좋습니다.

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { BullRegistrar } from '@nestjs/bullmq';

@Injectable()
export class AudioService implements OnModuleInit {
  constructor(private bullRegistrar: BullRegistrar) {}

  onModuleInit() {
    if (yourConditionHere) {
      this.bullRegistrar.register();
    }
  }
}
```

`BullRegistrar#register` 함수를 호출하지 않으면 BullMQ 구성 요소가 작동하지 않습니다. 즉, 작업이 처리되지 않습니다.

#### Bull 설치

> warning **참고** BullMQ를 사용하기로 결정했다면 이 섹션과 다음 장은 건너뛰세요.

Bull 사용을 시작하기 위해 필요한 종속성을 먼저 설치합니다.

```bash
$ npm install --save @nestjs/bull bull
```

설치 프로세스가 완료되면, 루트 `AppModule`에 `BullModule`을 임포트할 수 있습니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

`forRoot()` 메서드는 애플리케이션에 등록된 모든 큐에서 사용될 (별도로 지정되지 않는 한) `bull` 패키지 구성 객체를 등록하는 데 사용됩니다. 구성 객체는 다음 속성으로 구성됩니다.

-   `limiter: RateLimiter` - 큐의 작업 처리 속도를 제어하는 옵션입니다. 자세한 내용은 [RateLimiter](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue)를 참조하세요. 선택 사항입니다.
-   `redis: RedisOpts` - Redis 연결을 구성하는 옵션입니다. 자세한 내용은 [RedisOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue)를 참조하세요. 선택 사항입니다.
-   `prefix: string` - 모든 큐 키에 대한 접두사입니다. 선택 사항입니다.
-   `defaultJobOptions: JobOpts` - 새로운 작업에 대한 기본 설정을 제어하는 옵션입니다. 자세한 내용은 [JobOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd)를 참조하세요. 선택 사항입니다. **참고: FlowProducer를 통해 작업을 예약하는 경우 적용되지 않습니다. 설명은 [bullmq#1034](https://github.com/taskforcesh/bullmq/issues/1034)를 참조하세요.**
-   `settings: AdvancedSettings` - 고급 큐 구성 설정입니다. 일반적으로 변경하지 않아야 합니다. 자세한 내용은 [AdvancedSettings](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue)를 참조하세요. 선택 사항입니다.

모든 옵션은 선택 사항이며, 큐 동작을 세부적으로 제어할 수 있도록 합니다. 이 옵션들은 Bull `Queue` 생성자에 직접 전달됩니다. 이러한 옵션에 대한 자세한 내용은 [여기](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue)에서 읽어보세요.

큐를 등록하려면 다음과 같이 `BullModule.registerQueue()` 동적 모듈을 임포트합니다.

```typescript
BullModule.registerQueue({
  name: 'audio',
});
```

> info **힌트** `registerQueue()` 메서드에 여러 개의 쉼표로 구분된 구성 객체를 전달하여 여러 큐를 생성할 수 있습니다.

`registerQueue()` 메서드는 큐를 인스턴스화하고/또는 등록하는 데 사용됩니다. 큐는 동일한 자격 증명으로 동일한 기본 Redis 데이터베이스에 연결하는 모듈 및 프로세스에서 공유됩니다. 각 큐는 `name` 속성으로 고유합니다. 큐 이름은 (컨트롤러/프로바이더에 큐를 주입하기 위한) 주입 토큰과 소비자 클래스 및 리스너를 큐와 연결하기 위한 데코레이터 인수로 모두 사용됩니다.

다음과 같이 특정 큐에 대해 미리 구성된 일부 옵션을 재정의할 수도 있습니다.

```typescript
BullModule.registerQueue({
  name: 'audio',
  redis: {
    port: 6380,
  },
});
```

작업은 Redis에 영구적으로 저장되기 때문에, 특정 이름의 큐가 인스턴스화될 때마다 (예: 앱이 시작/재시작될 때), 이전 세션에서 존재할 수 있는 완료되지 않은 오래된 작업을 처리하려고 시도합니다.

각 큐는 하나 이상의 생산자, 소비자 및 리스너를 가질 수 있습니다. 소비자는 특정 순서(기본값은 FIFO, LIFO 또는 우선순위에 따름)로 큐에서 작업을 가져옵니다. 큐 처리 순서 제어는 <a href="techniques/queues#consumers">여기</a>에서 논의됩니다.

<app-banner-enterprise></app-banner-enterprise>

#### 명명된 설정 (Named configurations)

큐가 여러 Redis 인스턴스에 연결하는 경우, **명명된 설정**이라는 기술을 사용할 수 있습니다. 이 기능을 사용하면 지정된 키 아래에 여러 설정을 등록할 수 있으며, 큐 옵션에서 이를 참조할 수 있습니다.

예를 들어, 애플리케이션에 등록된 몇 개의 큐가 사용하는 추가 Redis 인스턴스(기본 인스턴스 외)가 있다고 가정하면, 다음과 같이 해당 설정을 등록할 수 있습니다.

```typescript
BullModule.forRoot('alternative-config', {
  redis: {
    port: 6381,
  },
});
```

위 예시에서 `'alternative-config'`는 단지 설정 키일 뿐이며 (임의의 문자열일 수 있습니다).

이를 설정한 후에는 `registerQueue()` 옵션 객체에서 이 설정을 가리킬 수 있습니다.

```typescript
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
```

#### 생산자 (Producers)

작업 생산자는 큐에 작업을 추가합니다. 생산자는 일반적으로 애플리케이션 서비스(Nest [프로바이더](/providers))입니다. 큐에 작업을 추가하려면 먼저 다음과 같이 큐를 서비스에 주입합니다.

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
```

> info **힌트** `@InjectQueue()` 데코레이터는 `registerQueue()` 메서드 호출에서 제공된 이름으로 큐를 식별합니다 (예: `'audio'`).

이제 사용자 정의 작업 객체를 전달하여 큐의 `add()` 메서드를 호출하여 작업을 추가합니다. 작업은 직렬화 가능한 JavaScript 객체로 표현됩니다 (Redis 데이터베이스에 저장되는 방식 때문입니다). 전달하는 작업 객체의 형태는 임의적입니다.

```typescript
const job = await this.audioQueue.add({
  foo: 'bar',
});
```

#### 명명된 작업 (Named jobs)

작업은 고유한 이름을 가질 수 있습니다. 이를 통해 주어진 이름을 가진 작업만 처리하는 특수 <a href="techniques/queues#consumers">소비자</a>를 생성할 수 있습니다.

```typescript
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
```

> Warning **경고** 명명된 작업을 사용하는 경우, 큐에 추가된 각 고유 이름에 대한 프로세서를 생성해야 합니다. 그렇지 않으면 큐가 해당 작업에 대한 프로세서가 누락되었다고 경고합니다. 명명된 작업 소비에 대한 자세한 내용은 <a href="techniques/queues#consumers">여기</a>를 참조하십시오.

#### 작업 옵션 (Job options)

작업에는 추가 옵션이 연결될 수 있습니다. `Queue.add()` 메서드에서 `job` 인자 뒤에 옵션 객체를 전달합니다. 작업 옵션 속성은 다음과 같습니다.

-   `priority`: `number` - 선택적 우선순위 값입니다. 1 (가장 높음)부터 MAX_INT (가장 낮음)까지의 범위를 가집니다. 우선순위를 사용하면 성능에 약간의 영향을 미치므로 주의해서 사용하세요.
-   `delay`: `number` - 이 작업을 처리할 때까지 대기하는 시간(밀리초)입니다. 정확한 지연을 위해서는 서버와 클라이언트 모두 시계가 동기화되어야 합니다.
-   `attempts`: `number` - 작업이 완료될 때까지 시도할 총 횟수입니다.
-   `repeat`: `RepeatOpts` - cron 사양에 따라 작업을 반복합니다. 자세한 내용은 [RepeatOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd)를 참조하세요.
-   `backoff`: `number | BackoffOpts` - 작업 실패 시 자동 재시도를 위한 백오프 설정입니다. 자세한 내용은 [BackoffOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd)를 참조하세요.
-   `lifo`: `boolean` - true이면 작업을 왼쪽 끝(기본값 false) 대신 큐의 오른쪽 끝에 추가합니다.
-   `timeout`: `number` - 작업이 타임아웃 오류로 실패해야 하는 시간(밀리초)입니다.
-   `jobId`: `number` | `string` - 작업 ID를 재정의합니다. 기본적으로 작업 ID는 고유한 정수이지만, 이 설정을 사용하여 재정의할 수 있습니다. 이 옵션을 사용하는 경우 jobId가 고유하도록 보장하는 것은 사용자에게 달려 있습니다. 이미 존재하는 ID로 작업을 추가하려고 하면 추가되지 않습니다.
-   `removeOnComplete`: `boolean | number` - true이면 작업이 성공적으로 완료될 때 작업을 제거합니다. 숫자는 유지할 작업의 수를 지정합니다. 기본 동작은 완료된 세트에 작업을 유지하는 것입니다.
-   `removeOnFail`: `boolean | number` - true이면 모든 시도 후 작업이 실패할 때 작업을 제거합니다. 숫자는 유지할 작업의 수를 지정합니다. 기본 동작은 실패한 세트에 작업을 유지하는 것입니다.
-   `stackTraceLimit`: `number` - 스택 트레이스에 기록될 스택 트레이스 라인의 수를 제한합니다.

작업 옵션을 사용하여 작업을 커스터마이징하는 몇 가지 예시는 다음과 같습니다.

작업 시작을 지연시키려면 `delay` 구성 속성을 사용합니다.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { delay: 3000 }, // 3초 지연
);
```

작업을 큐의 오른쪽 끝에 추가하려면 (**LIFO**(Last In First Out)로 작업을 처리) 구성 객체의 `lifo` 속성을 `true`로 설정합니다.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { lifo: true },
);
```

작업 우선순위를 지정하려면 `priority` 속성을 사용합니다.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { priority: 2 },
);
```

#### 소비자 (Consumers)

소비자는 큐에 추가된 작업을 처리하거나 큐에 대한 이벤트를 수신하거나 둘 다를 수행하는 메서드를 정의하는 **클래스**입니다. `@Processor()` 데코레이터를 사용하여 다음과 같이 소비자 클래스를 선언합니다.

```typescript
import { Processor } from '@nestjs/bull';

@Processor('audio')
export class AudioConsumer {}
```

> info **힌트** 소비자는 `@nestjs/bull` 패키지가 이를 인식할 수 있도록 `providers`로 등록해야 합니다.

여기서 데코레이터의 문자열 인자(예: `'audio'`)는 클래스 메서드와 연결될 큐의 이름입니다.

소비자 클래스 내에서 `@Process()` 데코레이터로 핸들러 메서드를 데코레이트하여 작업 핸들러를 선언합니다.

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {
  @Process()
  async transcode(job: Job<unknown>) {
    let progress = 0;
    for (let i = 0; i < 100; i++) {
      await doSomething(job.data);
      progress += 1;
      await job.progress(progress);
    }
    return {};
  }
}
```

데코레이트된 메서드(예: `transcode()`)는 워커가 유휴 상태이고 큐에 처리할 작업이 있을 때마다 호출됩니다. 이 핸들러 메서드는 유일한 인수로 `job` 객체를 받습니다. 핸들러 메서드가 반환하는 값은 작업 객체에 저장되며, 예를 들어 완료 이벤트에 대한 리스너에서 나중에 접근할 수 있습니다.

`Job` 객체에는 상태와 상호작용할 수 있는 여러 메서드가 있습니다. 예를 들어, 위 코드는 `progress()` 메서드를 사용하여 작업의 진행 상황을 업데이트합니다. 전체 `Job` 객체 API 참조는 [여기](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#job)에서 확인할 수 있습니다.

다음과 같이 `@Process()` 데코레이터에 `name`을 전달하여 작업 핸들러 메서드가 특정 유형의 작업(특정 `name`을 가진 작업) **만** 처리하도록 지정할 수 있습니다. 주어진 소비자 클래스에는 각 작업 유형(`name`)에 해당하는 여러 개의 `@Process()` 핸들러가 있을 수 있습니다. 명명된 작업을 사용하는 경우 각 이름에 해당하는 핸들러가 있는지 확인하십시오.

```typescript
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
```

> warning **경고** 동일한 큐에 대해 여러 소비자를 정의하는 경우, `@Process({{ '{' }} concurrency: 1 {{ '}' }})`의 `concurrency` 옵션은 적용되지 않습니다. 최소 `concurrency`는 정의된 소비자 수와 일치합니다. 이는 `@Process()` 핸들러가 명명된 작업을 처리하기 위해 다른 `name`을 사용하더라도 적용됩니다.

#### 요청 스코프 소비자 (Request-scoped consumers)

소비자가 요청 스코프로 플래그되면 (인젝션 스코프에 대한 자세한 내용은 [여기](/fundamentals/injection-scopes#provider-scope)에서 확인하세요), 각 작업을 위해서만 클래스의 새로운 인스턴스가 생성됩니다. 인스턴스는 작업이 완료된 후 가비지 수집됩니다.

```typescript
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
```

요청 스코프 소비자 클래스는 동적으로 인스턴스화되고 단일 작업으로 스코프가 지정되므로, 표준 접근 방식을 사용하여 생성자를 통해 `JOB_REF`를 주입할 수 있습니다.

```typescript
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
```

> info **힌트** `JOB_REF` 토큰은 `@nestjs/bull` 패키지에서 임포트됩니다.

#### 이벤트 리스너 (Event listeners)

Bull은 큐 및/또는 작업 상태 변경이 발생할 때 유용한 이벤트 집합을 생성합니다. Nest는 표준 이벤트의 핵심 집합에 구독할 수 있는 데코레이터 집합을 제공합니다. 이 데코레이터는 `@nestjs/bull` 패키지에서 내보내집니다.

이벤트 리스너는 <a href="techniques/queues#consumers">소비자</a> 클래스 내에서 (즉, `@Processor()` 데코레이터로 장식된 클래스 내에서) 선언되어야 합니다. 이벤트를 수신하려면 아래 표에 있는 데코레이터 중 하나를 사용하여 이벤트 핸들러를 선언하십시오. 예를 들어, `audio` 큐에서 작업이 활성 상태로 진입할 때 발생하는 이벤트를 수신하려면 다음과 같은 구조를 사용하십시오.

```typescript
import { Processor, Process, OnQueueActive } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }
  ...
```

Bull은 분산(다중 노드) 환경에서 작동하므로 이벤트 로컬리티(event locality) 개념을 정의합니다. 이 개념은 이벤트가 단일 프로세스 내에서 완전히 트리거되거나 다른 프로세스의 공유 큐에서 트리거될 수 있음을 인식합니다. **로컬** 이벤트는 로컬 프로세스의 큐에서 작업 또는 상태 변경이 트리거될 때 생성되는 이벤트입니다. 즉, 이벤트 생산자 및 소비자가 단일 프로세스에 로컬이면 큐에서 발생하는 모든 이벤트는 로컬입니다.

큐가 여러 프로세스에서 공유될 때 **글로벌** 이벤트 가능성이 발생합니다. 한 프로세스의 리스너가 다른 프로세스에 의해 트리거된 이벤트 알림을 수신하려면 글로벌 이벤트에 등록해야 합니다.

이벤트 핸들러는 해당 이벤트가 발생할 때마다 호출됩니다. 핸들러는 아래 표에 표시된 시그니처로 호출되며, 이벤트와 관련된 정보에 액세스할 수 있습니다. 로컬 및 글로벌 이벤트 핸들러 시그니처의 한 가지 주요 차이점에 대해 아래에서 설명합니다.

<table>
  <tr>
    <th>로컬 이벤트 리스너</th>
    <th>글로벌 이벤트 리스너</th>
    <th>핸들러 메서드 시그니처 / 발생 시점</th>
  </tr>
  <tr>
    <td><code>@OnQueueError()</code></td><td><code>@OnGlobalQueueError()</code></td><td><code>handler(error: Error)</code> - 오류가 발생했습니다. <code>error</code>에는 트리거링 오류가 포함됩니다.</td>
  </tr>
  <tr>
    <td><code>@OnQueueWaiting()</code></td><td><code>@OnGlobalQueueWaiting()</code></td><td><code>handler(jobId: number | string)</code> - 워커가 유휴 상태가 되는 즉시 처리 대기 중인 작업입니다. <code>jobId</code>에는 이 상태로 진입한 작업의 ID가 포함됩니다.</td>
  </tr>
  <tr>
    <td><code>@OnQueueActive()</code></td><td><code>@OnGlobalQueueActive()</code></td><td><code>handler(job: Job)</code> - 작업 <code>job</code>이 시작되었습니다. </td>
  </tr>
  <tr>
    <td><code>@OnQueueStalled()</code></td><td><code>@OnGlobalQueueStalled()</code></td><td><code>handler(job: Job)</code> - 작업 <code>job</code>이 stalled 상태로 표시되었습니다. 이는 작업 워커의 충돌 또는 이벤트 루프 일시 중지 디버깅에 유용합니다.</td>
  </tr>
  <tr>
    <td><code>@OnQueueProgress()</code></td><td><code>@OnGlobalQueueProgress()</code></td><td><code>handler(job: Job, progress: number)</code> - 작업 <code>job</code>의 진행 상황이 <code>progress</code> 값으로 업데이트되었습니다.</td>
  </tr>
  <tr>
    <td><code>@OnQueueCompleted()</code></td><td><code>@OnGlobalQueueCompleted()</code></td><td><code>handler(job: Job, result: any)</code> 작업 <code>job</code>이 결과 <code>result</code>와 함께 성공적으로 완료되었습니다.</td>
  </tr>
  <tr>
    <td><code>@OnQueueFailed()</code></td><td><code>@OnGlobalQueueFailed()</code></td><td><code>handler(job: Job, err: Error)</code> 작업 <code>job</code>이 이유 <code>err</code>로 실패했습니다.</td>
  </tr>
  <tr>
    <td><code>@OnQueuePaused()</code></td><td><code>@OnGlobalQueuePaused()</code></td><td><code>handler()</code> 큐가 일시 중지되었습니다.</td>
  </tr>
  <tr>
    <td><code>@OnQueueResumed()</code></td><td><code>@OnGlobalQueueResumed()</code></td><td><code>handler(job: Job)</code> 큐가 재개되었습니다.</td>
  </tr>
  <tr>
    <td><code>@OnQueueCleaned()</code></td><td><code>@OnGlobalQueueCleaned()</code></td><td><code>handler(jobs: Job[], type: string)</code> 오래된 작업이 큐에서 정리되었습니다. <code>jobs</code>는 정리된 작업의 배열이고, <code>type</code>은 정리된 작업의 유형입니다.</td>
  </tr>
  <tr>
    <td><code>@OnQueueDrained()</code></td><td><code>@OnGlobalQueueDrained()</code></td><td><code>handler()</code> 큐가 대기 중인 모든 작업을 처리했을 때 발생합니다 (아직 처리되지 않은 지연된 작업이 일부 있을 수 있더라도).</td>
  </tr>
  <tr>
    <td><code>@OnQueueRemoved()</code></td><td><code>@OnGlobalQueueRemoved()</code></td><td><code>handler(job: Job)</code> 작업 <code>job</code>이 성공적으로 제거되었습니다.</td>
  </tr>
</table>

글로벌 이벤트를 수신할 때 메서드 시그니처는 로컬 시그니처와 약간 다를 수 있습니다. 특히, 로컬 버전에서 `job` 객체를 수신하는 모든 메서드 시그니처는 대신 `jobId` (`number`)를 수신합니다. 이러한 경우 실제 `job` 객체에 대한 참조를 얻으려면 `Queue#getJob` 메서드를 사용하십시오. 이 호출은 `await`되어야 하므로 핸들러는 `async`로 선언되어야 합니다. 예를 들어:

```typescript
@OnGlobalQueueCompleted()
async onGlobalCompleted(jobId: number, result: any) {
  const job = await this.immediateQueue.getJob(jobId);
  console.log('(Global) on completed: job ', job.id, ' -> result: ', result);
}
```

> info **힌트** `Queue` 객체에 액세스하려면 (`getJob()` 호출을 수행하기 위해), 물론 이를 주입해야 합니다. 또한 큐는 주입하는 모듈에 등록되어 있어야 합니다.

특정 이벤트 리스너 데코레이터 외에도 `BullQueueEvents` 또는 `BullQueueGlobalEvents` Enum과 함께 일반적인 `@OnQueueEvent()` 데코레이터를 사용할 수도 있습니다. 이벤트에 대한 자세한 내용은 [여기](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#events)에서 읽어보십시오.

#### 큐 관리 (Queue management)

큐는 일시 중지 및 재개, 다양한 상태의 작업 수 검색 등 관리 기능을 수행할 수 있는 API를 제공합니다. 전체 큐 API는 [여기](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue)에서 찾을 수 있습니다. 아래 일시 중지/재개 예시와 같이 이러한 메서드를 `Queue` 객체에서 직접 호출합니다.

`pause()` 메서드 호출로 큐를 일시 중지합니다. 일시 중지된 큐는 재개될 때까지 새 작업을 처리하지 않지만, 현재 처리 중인 작업은 완료될 때까지 계속됩니다.

```typescript
await audioQueue.pause();
```

일시 중지된 큐를 재개하려면 다음과 같이 `resume()` 메서드를 사용합니다.

```typescript
await audioQueue.resume();
```

#### 별도 프로세스 (Separate processes)

작업 핸들러는 별도의 (forked) 프로세스에서 실행될 수도 있습니다 ([출처](https://github.com/OptimalBits/bull#separate-processes)). 이는 몇 가지 장점이 있습니다.

-   프로세스가 샌드박스 처리되어 충돌하더라도 워커에 영향을 미치지 않습니다.
-   큐에 영향을 주지 않고 블록킹 코드를 실행할 수 있습니다 (작업이 멈추지 않습니다).
-   멀티 코어 CPU를 훨씬 더 잘 활용할 수 있습니다.
-   Redis 연결이 줄어듭니다.

```ts
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(__dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
```

함수가 포크된 프로세스에서 실행되므로 Dependency Injection (및 IoC 컨테이너)를 사용할 수 없다는 점에 유의하십시오. 즉, 프로세서 함수는 필요한 모든 외부 종속성의 인스턴스를 포함하거나 생성해야 합니다.

```ts
@@filename(processor)
import { Job, DoneCallback } from 'bull';

export default function (job: Job, cb: DoneCallback) {
  console.log(`[${process.pid}] ${JSON.stringify(job.data)}`);
  cb(null, 'It works');
}
```

#### 비동기 설정 (Async configuration)

정적으로 전달하는 대신 `bull` 옵션을 비동기적으로 전달하고 싶을 수 있습니다. 이 경우 비동기 설정을 처리하는 여러 방법을 제공하는 `forRootAsync()` 메서드를 사용하십시오.

한 가지 접근 방식은 팩토리 함수를 사용하는 것입니다.

```typescript
BullModule.forRootAsync({
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

우리의 팩토리는 다른 [비동기 프로바이더](https://docs.nestjs.com/fundamentals/async-providers)와 마찬가지로 동작합니다 (예: `async`일 수 있으며 `inject`를 통해 종속성을 주입할 수 있습니다).

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    redis: {
      host: configService.get('QUEUE_HOST'),
      port: configService.get('QUEUE_PORT'),
    },
  }),
  inject: [ConfigService],
});
```

또는 `useClass` 구문을 사용할 수 있습니다.

```typescript
BullModule.forRootAsync({
  useClass: BullConfigService,
});
```

위 구조는 `BullModule` 내에서 `BullConfigService`를 인스턴스화하고 `createSharedConfiguration()`을 호출하여 옵션 객체를 제공하는 데 사용됩니다. 이는 `BullConfigService`가 아래와 같이 `SharedBullConfigurationFactory` 인터페이스를 구현해야 함을 의미합니다.

```typescript
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullModuleOptions {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
```

`BullModule` 내에서 `BullConfigService`의 생성을 방지하고 다른 모듈에서 임포트된 프로바이더를 사용하려면 `useExisting` 구문을 사용할 수 있습니다.

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

이 구조는 `useClass`와 동일하게 작동하지만 한 가지 중요한 차이점이 있습니다. `BullModule`은 새로운 `ConfigService` 인스턴스를 생성하는 대신 임포트된 모듈을 찾아 기존 `ConfigService`를 재사용합니다.

마찬가지로 큐 옵션을 비동기적으로 전달하려면 `registerQueueAsync()` 메서드를 사용하되, 팩토리 함수 외부에서 `name` 속성을 지정해야 합니다.

```typescript
BullModule.registerQueueAsync({
  name: 'audio',
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

#### 예제 (Example)

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/26-queues)에서 확인할 수 있습니다.