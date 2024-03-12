### Lifecycle Events

Nest 애플리케이션과 모든 애플리케이션 요소는 Nest에 의해 라이프사이클이 관리됩니다. Nest는 핵심 라이프사이클 이벤트를 확인할 수 있는 **라이프사이클 훅(lifecycle hooks)** 을 제공하며, 이를 통해 모듈, 프로바이더 또는 컨트롤러에 등록된 코드를 실행할 수 있습니다.

#### Lifecycle sequence

다음 다이어그램은 애플리케이션이 부트스트랩되고 노드 프로세스가 종료될 때까지의 핵심 애플리케이션 라이프사이클 이벤트의 순서를 보여줍니다. 전체 라이프사이클을 **초기화**, **실행** 및 **종료** 의 세 단계로 나눌 수 있습니다. 이 라이프사이클을 사용하면 모듈과 서비스의 적절한 초기화를 계획하고 활성 연결을 관리하며 종료 신호를 받을 때 애플리케이션을 적절하게 종료할 수 있습니다.

<figure><img src="/assets/lifecycle-events.png" /></figure>

#### Lifecycle events

라이프사이클 이벤트는 애플리케이션 부트스트래핑 및 종료 중에 발생합니다. Nest는 각 라이프사이클 이벤트에서 모듈, 프로바이더 및 컨트롤러에 등록된 라이프사이클 훅 메서드를 호출합니다(**종료 훅**은 [아래](fundamentals/lifecycle-events#application-shutdown)에서 설명한 대로 먼저 활성화해야 합니다). 위 다이어그램에서 볼 수 있듯이 Nest는 또한 연결 수신을 시작하고 연결 수신을 중지하기 위한 적절한 기본 메서드를 호출합니다.

다음 표에서 `onModuleDestroy`, `beforeApplicationShutdown` 및 `onApplicationShutdown`은 `app.close()`를 명시적으로 호출하거나 프로세스가 특수 시스템 시그널(예: SIGTERM)을 받고 애플리케이션 부트스트랩 시 `enableShutdownHooks`를 올바르게 호출한 경우에만 트리거됩니다(아래 **Application shutdown** 부분 참조).

| Lifecycle hook method           | Lifecycle event triggering the hook method call                                                                                                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onModuleInit()`                | Called once the host module's dependencies have been resolved.                                                                                                                                                    |
| `onApplicationBootstrap()`      | Called once all modules have been initialized, but before listening for connections.                                                                                                                              |
| `onModuleDestroy()`\*           | Called after a termination signal (e.g., `SIGTERM`) has been received.                                                                                                                                            |
| `beforeApplicationShutdown()`\* | Called after all `onModuleDestroy()` handlers have completed (Promises resolved or rejected);<br />once complete (Promises resolved or rejected), all existing connections will be closed (`app.close()` called). |
| `onApplicationShutdown()`\*     | Called after connections close (`app.close()` resolves).                                                                                                                                                          |

\* 이 이벤트들의 경우, `app.close()`를 명시적으로 호출하지 않으면 `SIGTERM`과 같은 시스템 신호를 작동하도록 옵트인해야 합니다. 아래 [Application shutdown](fundamentals/lifecycle-events#application-shutdown) 참조.

> warning **경고** 위에 나열된 라이프사이클 훅은 **요청 범위(request-scoped)** 클래스에서는 트리거되지 않습니다. 요청 범위 클래스는 애플리케이션 라이프사이클과 연결되어 있지 않으며 수명이 예측 불가능합니다. 각 요청마다 전용으로 생성되어 응답이 전송된 후 자동으로 가비지 수집됩니다.

> info **힌트** `onModuleInit()`과 `onApplicationBootstrap()`의 실행 순서는 모듈 가져오기 순서에 직접적으로 의존하며, 이전 훅을 기다립니다.

#### Usage

각 라이프사이클 훅은 인터페이스로 표현됩니다. 기술적으로 인터페이스는 TypeScript 컴파일 후에는 사라지게 되지만, 강력한 타이핑과 편집기 툴링의 이점을 얻기 위해 인터페이스를 사용하는 것이 좋습니다. 라이프사이클 훅을 등록하려면 적절한 인터페이스를 구현하세요. 예를 들어, 특정 클래스(예: 컨트롤러, 프로바이더 또는 모듈)에서 모듈 초기화 시 호출할 메서드를 등록하려면 `onModuleInit()` 메서드를 제공하여 `OnModuleInit` 인터페이스를 구현하세요.

```typescript
@@filename()
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit {
  onModuleInit() {
    console.log(`The module has been initialized.`);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  onModuleInit() {
    console.log(`The module has been initialized.`);
  }
}
```

#### Asynchronous initialization

`OnModuleInit`와 `OnApplicationBootstrap` 훅 모두 애플리케이션 초기화 프로세스를 지연시킬 수 있습니다(`Promise`를 반환하거나 메서드를 `async`로 표시하고 메서드 바디에서 비동기 메서드 완료를 `await`할 수 있습니다).

```typescript
@@filename()
async onModuleInit(): Promise<void> {
  await this.fetch();
}
@@switch
async onModuleInit() {
  await this.fetch();
}
```

#### Application shutdown

`onModuleDestroy()`, `beforeApplicationShutdown()` 및 `onApplicationShutdown()` 훅은 종료 단계(`app.close()`가 명시적으로 호출되거나 SIGTERM과 같은 시스템 신호를 받을 때)에 호출됩니다. 이 기능은 종종 [Kubernetes](https://kubernetes.io/)에서 컨테이너의 라이프사이클을 관리하거나 [Heroku](https://www.heroku.com/)의 dynos 또는 유사 서비스에서 사용됩니다.

종료 훅 리스너는 시스템 리소스를 소비하므로 기본적으로 비활성화되어 있습니다. 종료 훅을 사용하려면 `enableShutdownHooks()`를 호출하여 **리스너를 활성화해야 합니다**.

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  await app.listen(3000);
}
bootstrap();
```

> warning **warning** Due to inherent platform limitations, NestJS has limited support for application shutdown hooks on Windows. You can expect `SIGINT` to work, as well as `SIGBREAK` and to some extent `SIGHUP` - [read more](https://nodejs.org/api/process.html#process_signal_events). However `SIGTERM` will never work on Windows because killing a process in the task manager is unconditional, "i.e., there's no way for an application to detect or prevent it". Here's some [relevant documentation](https://docs.libuv.org/en/v1.x/signal.html) from libuv to learn more about how `SIGINT`, `SIGBREAK` and others are handled on Windows. Also, see Node.js documentation of [Process Signal Events](https://nodejs.org/api/process.html#process_signal_events)

> info **정보** `enableShutdownHooks`는 리스너를 시작하여 메모리를 소비합니다. 단일 Node 프로세스에서 여러 Nest 앱(예: Jest로 병렬 테스트 실행 시)을 실행하는 경우 Node에서 과도한 리스너 프로세스로 인해 오류가 발생할 수 있습니다. 이 때문에 `enableShutdownHooks`는 기본적으로 활성화되지 않습니다. 단일 Node 프로세스에서 여러 인스턴스를 실행할 때는 이 상황을 인지하고 있어야 합니다.

애플리케이션이 종료 시그널을 받으면 등록된 `onModuleDestroy()`, `beforeApplicationShutdown()`, 그 다음 `onApplicationShutdown()` 메서드(순서대로)를 해당 신호를 첫 번째 매개변수로 전달하여 호출합니다. 등록된 함수가 비동기 호출(`Promise`를 반환)을 기다리는 경우 Nest는 Promise가 해결되거나 거부될 때까지 순서를 진행하지 않습니다.

```typescript
@@filename()
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal: string) {
    console.log(signal); // e.g. "SIGINT"
  }
}
@@switch
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal) {
    console.log(signal); // e.g. "SIGINT"
  }
}
```

> info **정보** `app.close()`를 호출하면 Node 프로세스를 종료하는 것이 아니라 `onModuleDestroy()`와 `onApplicationShutdown()` 훅만 트리거됩니다. 따라서 인터벌, 장기 실행 백그라운드 작업 등이 있는 경우 프로세스는 자동으로 종료되지 않습니다.
