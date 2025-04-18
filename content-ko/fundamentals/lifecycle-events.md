### 라이프사이클 이벤트

Nest 애플리케이션과 모든 애플리케이션 요소는 Nest에 의해 관리되는 라이프사이클을 가집니다. Nest는 주요 라이프사이클 이벤트에 대한 가시성과 해당 이벤트 발생 시 작동(모듈, 프로바이더 또는 컨트롤러에 등록된 코드를 실행)할 수 있는 기능인 **라이프사이클 훅**을 제공합니다.

#### 라이프사이클 순서

다음 다이어그램은 애플리케이션이 부트스트랩되는 시점부터 Node 프로세스가 종료될 때까지의 주요 애플리프레이션 라이프사이클 이벤트 순서를 보여줍니다. 전체 라이프사이클은 세 단계로 나눌 수 있습니다: **초기화**, **실행**, **종료**. 이 라이프사이클을 사용하여 모듈 및 서비스의 적절한 초기화를 계획하고, 활성 연결을 관리하며, 종료 신호를 받을 때 애플리케이션을 정상적으로 종료할 수 있습니다.

<figure><img class="illustrative-image" src="/assets/lifecycle-events.png" /></figure>

#### 라이프사이클 이벤트

라이프사이클 이벤트는 애플리케이션 부트스트랩 및 종료 중에 발생합니다. Nest는 다음 각 라이프사이클 이벤트 발생 시 모듈, 프로바이더 및 컨트롤러에 등록된 라이프사이클 훅 메서드를 호출합니다 (**종료 훅**은 [아래](https://nestjs.dokidocs.dev/fundamentals/lifecycle-events#application-shutdown) 설명된 대로 먼저 활성화해야 합니다). 위 다이어그램에 표시된 것처럼 Nest는 연결 수신을 시작하고 연결 수신을 중지하기 위해 적절한 내부 메서드도 호출합니다.

다음 표에서 `onModuleInit` 및 `onApplicationBootstrap`는 `app.init()` 또는 `app.listen()`을 명시적으로 호출한 경우에만 트리거됩니다.

다음 표에서 `onModuleDestroy`, `beforeApplicationShutdown` 및 `onApplicationShutdown`는 `app.close()`를 명시적으로 호출하거나 프로세스가 특수 시스템 신호(예: SIGTERM)를 수신하고 애플리케이션 부트스트랩 시 `enableShutdownHooks`를 올바르게 호출한 경우에만 트리거됩니다(아래 **애플리케이션 종료** 부분 참고).

| 라이프사이클 훅 메서드           | 라이프사이클 이벤트 트리거                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onModuleInit()`                | 호스트 모듈의 종속성이 해결된 후 한 번 호출됩니다.                                                                                                                                                    |
| `onApplicationBootstrap()`      | 모든 모듈이 초기화되었지만 연결 수신을 시작하기 전에 한 번 호출됩니다.                                                                                                                              |
| `onModuleDestroy()`\*           | 종료 신호(예: `SIGTERM`)가 수신된 후 호출됩니다.                                                                                                                                            |
| `beforeApplicationShutdown()`\* | 모든 `onModuleDestroy()` 핸들러가 완료된 후(Promises가 해결 또는 거부됨) 호출됩니다.<br />완료되면(Promises가 해결 또는 거부됨) 모든 기존 연결이 닫힙니다(`app.close()` 호출). |
| `onApplicationShutdown()`\*     | 연결이 닫힌 후(`app.close()`가 해결됨) 호출됩니다.                                                                                                                                                          |

\* 이 이벤트들의 경우, `app.close()`를 명시적으로 호출하지 않는다면 `SIGTERM`과 같은 시스템 신호와 함께 작동하도록 옵트인(opt-in)해야 합니다. 아래 [애플리케이션 종료](fundamentals/lifecycle-events#application-shutdown)를 참조하십시오.

> warning **경고** 위에 나열된 라이프사이클 훅은 **요청 스코프** 클래스에 대해서는 트리거되지 않습니다. 요청 스코프 클래스는 애플리케이션 라이프사이클에 묶여 있지 않으며 수명이 예측 불가능합니다. 이들은 각 요청마다 독점적으로 생성되며 응답이 전송된 후 자동으로 가비지 수집됩니다.

> info **팁** `onModuleInit()` 및 `onApplicationBootstrap()`의 실행 순서는 이전 훅을 기다리는 모듈 import 순서에 직접적으로 의존합니다.

#### 사용법

각 라이프사이클 훅은 인터페이스로 표현됩니다. 인터페이스는 TypeScript 컴파일 후에는 존재하지 않기 때문에 기술적으로는 선택 사항입니다. 그럼에도 불구하고 강력한 타입 지정 및 에디터 도구의 이점을 얻기 위해 사용하는 것이 좋습니다. 라이프사이클 훅을 등록하려면 적절한 인터페이스를 구현하십시오. 예를 들어, 특정 클래스(예: Controller, Provider 또는 Module)에서 모듈 초기화 중에 호출될 메서드를 등록하려면 아래에 표시된 것처럼 `onModuleInit()` 메서드를 제공하여 `OnModuleInit` 인터페이스를 구현하십시오.

```typescript
@@filename()
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit {
  onModuleInit() {
    console.log(`모듈이 초기화되었습니다.`);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  onModuleInit() {
    console.log(`모듈이 초기화되었습니다.`);
  }
}
```

#### 비동기 초기화

`OnModuleInit` 및 `OnApplicationBootstrap` 훅 모두 애플리케이션 초기화 프로세스를 지연시킬 수 있습니다(`Promise`를 반환하거나 메서드를 `async`로 표시하고 메서드 본문에서 비동기 메서드 완료를 `await`함).

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

#### 애플리케이션 종료

`onModuleDestroy()`, `beforeApplicationShutdown()`, `onApplicationShutdown()` 훅은 종료 단계에서 호출됩니다(`app.close()`에 대한 명시적 호출에 응답하거나 옵트인된 경우 SIGTERM과 같은 시스템 신호를 수신하면). 이 기능은 컨테이너 라이프사이클 관리를 위해 [Kubernetes](https://kubernetes.io/)에서, dyno 관리를 위해 [Heroku](https://www.heroku.com/)에서 또는 유사한 서비스에서 자주 사용됩니다.

종료 훅 리스너는 시스템 리소스를 소비하므로 기본적으로 비활성화되어 있습니다. 종료 훅을 사용하려면 `enableShutdownHooks()`를 호출하여 **리스너를 활성화해야 합니다** :

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 종료 훅 수신 시작
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> warning **경고** 플랫폼의 내재된 제한으로 인해 NestJS는 Windows에서 애플리케이션 종료 훅에 대한 지원이 제한적입니다. `SIGINT`와 `SIGBREAK`는 작동할 것으로 예상되며, 어느 정도 `SIGHUP`도 작동할 수 있습니다 - [더 읽어보기](https://nodejs.org/api/process.html#process_signal_events). 그러나 작업 관리자에서 프로세스를 종료하는 것은 무조건적이기 때문에("즉, 애플리케이션이 이를 감지하거나 방지할 방법이 없음") Windows에서는 `SIGTERM`이 절대로 작동하지 않습니다. `SIGINT`, `SIGBREAK` 등이 Windows에서 어떻게 처리되는지에 대해 더 알아보려면 libuv의 [관련 문서](https://docs.libuv.org/en/v1.x/signal.html)를 참조하십시오. 또한 Node.js의 [Process Signal Events](https://nodejs.org/api/process.html#process_signal_events) 문서도 참조하십시오.

> info **정보** `enableShutdownHooks`는 리스너를 시작하여 메모리를 소비합니다. 단일 Node 프로세스에서 여러 Nest 앱을 실행하는 경우(예: Jest로 병렬 테스트 실행 시) Node가 과도한 리스너 프로세스에 대해 불평할 수 있습니다. 이러한 이유로 `enableShutdownHooks`는 기본적으로 활성화되어 있지 않습니다. 단일 Node 프로세스에서 여러 인스턴스를 실행하는 경우 이 조건을 유의하십시오.

애플리케이션이 종료 신호를 수신하면 등록된 `onModuleDestroy()`, `beforeApplicationShutdown()`, 그 다음 `onApplicationShutdown()` 메서드(위에 설명된 순서대로)를 해당 신호를 첫 번째 매개변수로 사용하여 호출합니다. 등록된 함수가 비동기 호출(Promise 반환)을 기다리는 경우, Nest는 해당 Promise가 해결 또는 거부될 때까지 순서를 계속 진행하지 않습니다.

```typescript
@@filename()
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal: string) {
    console.log(signal); // 예: "SIGINT"
  }
}
@@switch
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal) {
    console.log(signal); // 예: "SIGINT"
  }
}
```

> info **정보** `app.close()`를 호출하는 것은 Node 프로세스를 종료시키지 않고 `onModuleDestroy()` 및 `onApplicationShutdown()` 훅만 트리거합니다. 따라서 일부 인터벌, 장시간 실행되는 백그라운드 작업 등이 있는 경우 프로세스는 자동으로 종료되지 않습니다.
