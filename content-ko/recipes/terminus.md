### 헬스 체크 (Terminus)

Terminus 통합은 **준비성(readiness)/활성(liveness)** 헬스 체크를 제공합니다. 헬스 체크는 복잡한 백엔드 설정에서 매우 중요합니다. 간단히 말해, 웹 개발 영역에서 헬스 체크는 일반적으로 `https://my-website.com/health/readiness`와 같은 특별한 주소로 구성됩니다. 인프라의 서비스 또는 구성 요소(예: [Kubernetes](https://kubernetes.io/))는 이 주소를 지속적으로 확인합니다. 이 주소로의 `GET` 요청으로부터 반환된 HTTP 상태 코드에 따라 서비스는 "비정상" 응답을 받을 때 조치를 취합니다.
"정상" 또는 "비정상"의 정의는 제공하는 서비스 유형에 따라 달라지므로, **Terminus** 통합은 일련의 **헬스 지표**를 통해 이를 지원합니다.

예를 들어, 웹 서버가 데이터를 저장하기 위해 MongoDB를 사용한다면 MongoDB가 여전히 실행 중인지 여부는 매우 중요한 정보가 될 것입니다. 이 경우 `MongooseHealthIndicator`를 활용할 수 있습니다. 올바르게 구성되면 (이에 대한 자세한 내용은 나중에 설명합니다) MongoDB가 실행 중인지 여부에 따라 헬스 체크 주소는 정상 또는 비정상 HTTP 상태 코드를 반환할 것입니다.

#### 시작하기

`@nestjs/terminus`를 시작하려면 필요한 의존성을 설치해야 합니다.

```bash
$ npm install --save @nestjs/terminus
```

#### 헬스 체크 설정하기

헬스 체크는 **헬스 지표**의 요약을 나타냅니다. 헬스 지표는 서비스가 정상 상태인지 비정상 상태인지 확인하는 체크를 실행합니다. 헬스 체크는 할당된 모든 헬스 지표가 정상적으로 실행 중이면 긍정적입니다. 많은 애플리케이션이 유사한 헬스 지표를 필요로 하기 때문에, [`@nestjs/terminus`](https://github.com/nestjs/terminus)는 다음과 같은 사전 정의된 지표 세트를 제공합니다.

- `HttpHealthIndicator`
- `TypeOrmHealthIndicator`
- `MongooseHealthIndicator`
- `SequelizeHealthIndicator`
- `MikroOrmHealthIndicator`
- `PrismaHealthIndicator`
- `MicroserviceHealthIndicator`
- `GRPCHealthIndicator`
- `MemoryHealthIndicator`
- `DiskHealthIndicator`

첫 번째 헬스 체크를 시작하려면 `HealthModule`을 생성하고 `TerminusModule`을 임포트 배열에 임포트해 보겠습니다.

> info **팁** [Nest CLI](cli/overview)를 사용하여 모듈을 생성하려면 `$ nest g module health` 명령을 실행하세요.

```typescript
@@filename(health.module.ts)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule]
})
export class HealthModule {}
```

헬스 체크는 [컨트롤러](/controllers)를 사용하여 실행할 수 있으며, 이는 [Nest CLI](cli/overview)를 사용하여 쉽게 설정할 수 있습니다.

```bash
$ nest g controller health
```

> info **정보** 애플리케이션에 종료 훅(shutdown hooks)을 활성화하는 것이 강력히 권장됩니다. Terminus 통합은 활성화된 경우 이 라이프사이클 이벤트를 활용합니다. [여기](fundamentals/lifecycle-events#application-shutdown)에서 종료 훅에 대해 자세히 알아보세요.

#### HTTP 헬스 체크

`@nestjs/terminus`를 설치하고, `TerminusModule`을 임포트하고, 새 컨트롤러를 생성했다면 헬스 체크를 생성할 준비가 된 것입니다.

`HTTPHealthIndicator`는 `@nestjs/axios` 패키지가 필요하므로 설치되어 있는지 확인하세요.

```bash
$ npm i --save @nestjs/axios axios
```

이제 `HealthController`를 설정할 수 있습니다.

```typescript
@@filename(health.controller.ts)
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }
}
@@switch
import { Controller, Dependencies, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('health')
@Dependencies(HealthCheckService, HttpHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private http,
  ) { }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ])
  }
}
```

```typescript
@@filename(health.module.ts)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
@@switch
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

이제 헬스 체크는 `https://docs.nestjs.com` 주소로 _GET_ 요청을 보낼 것입니다. 해당 주소로부터 정상적인 응답을 받으면, `http://localhost:3000/health`의 경로는 200 상태 코드와 함께 다음 객체를 반환할 것입니다.

```json
{
  "status": "ok",
  "info": {
    "nestjs-docs": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "nestjs-docs": {
      "status": "up"
    }
  }
}
```

이 응답 객체의 인터페이스는 `@nestjs/terminus` 패키지에서 `HealthCheckResult` 인터페이스를 통해 접근할 수 있습니다.

|           | 설명                                                                                                                                                                                             | 타입                                      |
|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------|
| `status`  | 어떤 헬스 지표라도 실패하면 상태는 `'error'`가 됩니다. NestJS 앱이 종료 중이지만 여전히 HTTP 요청을 수락하는 경우, 헬스 체크의 상태는 `'shutting_down'`이 됩니다. | `'error' \| 'ok' \| 'shutting_down'` |
| `info`    | 상태가 `'up'`인 각 헬스 지표의 정보를 포함하는 객체, 즉 "정상"인 지표들.                                                                              | `객체`                             |
| `error`   | 상태가 `'down'`인 각 헬스 지표의 정보를 포함하는 객체, 즉 "비정상"인 지표들.                                                                          | `객체`                             |
| `details` | 각 헬스 지표의 모든 정보를 포함하는 객체                                                                                                                                  | `객체`                             |

##### 특정 HTTP 응답 코드 확인

특정 경우에 특정 기준을 확인하고 응답을 검증하고 싶을 수 있습니다. 예를 들어, `https://my-external-service.com`이 `204` 응답 코드를 반환한다고 가정해 봅시다. `HttpHealthIndicator.responseCheck`를 사용하면 해당 응답 코드를 특정하여 확인할 수 있고, 다른 모든 코드를 비정상으로 판단할 수 있습니다.

204 외의 다른 응답 코드가 반환되는 경우 다음 예시는 비정상이 될 것입니다. 세 번째 매개변수는 응답이 정상(`true`)으로 간주되는지 비정상(`false`)으로 간주되는지를 나타내는 boolean 값을 반환하는 (동기 또는 비동기) 함수를 제공하도록 요구합니다.

```typescript
@@filename(health.controller.ts)
// `HealthController` 클래스 내에서

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () =>
      this.http.responseCheck(
        'my-external-service',
        'https://my-external-service.com',
        (res) => res.status === 204,
      ),
  ]);
}
```

#### TypeOrm 헬스 지표

Terminus는 데이터베이스 체크를 헬스 체크에 추가하는 기능을 제공합니다. 이 헬스 지표를 시작하려면 [데이터베이스 챕터](/techniques/sql)를 확인하고 애플리케이션 내에서 데이터베이스 연결이 설정되었는지 확인하세요.

> info **팁** 내부적으로 `TypeOrmHealthIndicator`는 데이터베이스가 여전히 활성 상태인지 확인하는 데 자주 사용되는 `SELECT 1` SQL 명령을 실행합니다. Oracle 데이터베이스를 사용하는 경우 `SELECT 1 FROM DUAL`을 사용합니다.

```typescript
@@filename(health.controller.ts)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
@@switch
@Controller('health')
@Dependencies(HealthCheckService, TypeOrmHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private db,
  ) { }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ])
  }
}
```

데이터베이스에 연결할 수 있다면 이제 `GET` 요청으로 `http://localhost:3000/health`를 요청할 때 다음 JSON 결과를 볼 수 있어야 합니다.

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

앱이 [여러 데이터베이스](techniques/database#multiple-databases)를 사용하는 경우 각 연결을 `HealthController`에 주입해야 합니다. 그런 다음 TypeOrmHealthIndicator에 연결 참조를 간단히 전달하면 됩니다.

```typescript
@@filename(health.controller.ts)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @InjectConnection('albumsConnection')
    private albumsConnection: Connection,
    @InjectConnection()
    private defaultConnection: Connection,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('albums-database', { connection: this.albumsConnection }),
      () => this.db.pingCheck('database', { connection: this.defaultConnection }),
    ]);
  }
}
```

#### 디스크 헬스 지표

`DiskHealthIndicator`를 사용하면 얼마나 많은 저장 공간이 사용 중인지 확인할 수 있습니다. 시작하려면 `DiskHealthIndicator`를 `HealthController`에 주입해야 합니다. 다음 예시는 `/` 경로(또는 Windows에서는 `C:\\`)의 사용된 저장 공간을 확인합니다. 전체 저장 공간의 50%를 초과하면 비정상 헬스 체크로 응답할 것입니다.

```typescript
@@filename(health.controller.ts)
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ]);
  }
}
@@switch
@Controller('health')
@Dependencies(HealthCheckService, DiskHealthIndicator)
export class HealthController {
  constructor(health, disk) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ])
  }
}
```

`DiskHealthIndicator.checkStorage` 함수를 사용하면 고정된 공간 양을 확인하는 것도 가능합니다. 다음 예시는 `/my-app/` 경로가 250GB를 초과하면 비정상이 될 것입니다.

```typescript
@@filename(health.controller.ts)
// `HealthController` 클래스 내에서

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.disk.checkStorage('storage', {  path: '/', threshold: 250 * 1024 * 1024 * 1024, })
  ]);
}
```

#### 메모리 헬스 지표

프로세스가 특정 메모리 제한을 초과하지 않도록 하려면 `MemoryHealthIndicator`를 사용할 수 있습니다. 다음 예시는 프로세스의 힙(heap)을 확인하는 데 사용할 수 있습니다.

> info **팁** 힙은 동적으로 할당된 메모리(즉, malloc을 통해 할당된 메모리)가 존재하는 메모리 영역입니다. 힙에서 할당된 메모리는 다음 중 하나가 발생할 때까지 할당된 상태로 유지됩니다:
> - 메모리가 해제될 때(_free_)
> - 프로그램이 종료될 때

```typescript
@@filename(health.controller.ts)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
@@switch
@Controller('health')
@Dependencies(HealthCheckService, MemoryHealthIndicator)
export class HealthController {
  constructor(health, memory) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ])
  }
}
```

`MemoryHealthIndicator.checkRSS`를 사용하여 프로세스의 RSS(Resident Set Size) 메모리를 확인하는 것도 가능합니다. 다음 예시는 프로세스에 150MB 이상의 메모리가 할당된 경우 비정상 응답 코드를 반환할 것입니다.

> info **팁** RSS는 Resident Set Size의 약자이며 해당 프로세스에 할당되어 RAM에 있는 메모리 양을 보여주는 데 사용됩니다.
> 스왑 아웃된 메모리는 포함하지 않습니다. 해당 라이브러리의 페이지가 실제로 메모리에 있는 한 공유 라이브러리의 메모리는 포함합니다.
> 모든 스택 및 힙 메모리를 포함합니다.

```typescript
@@filename(health.controller.ts)
// `HealthController` 클래스 내에서

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
  ]);
}
```

#### 사용자 정의 헬스 지표

경우에 따라 `@nestjs/terminus`에서 제공하는 사전 정의된 헬스 지표가 모든 헬스 체크 요구사항을 충족하지 못할 수 있습니다. 이 경우 필요에 따라 사용자 정의 헬스 지표를 설정할 수 있습니다.

사용자 정의 지표를 나타낼 서비스를 생성하여 시작해 보겠습니다. 지표가 어떻게 구성되는지에 대한 기본적인 이해를 위해 예제 `DogHealthIndicator`를 생성해 보겠습니다. 이 서비스는 모든 `Dog` 객체의 타입이 `'goodboy'`인 경우 `'up'` 상태를 가져야 합니다. 이 조건이 충족되지 않으면 오류를 발생시켜야 합니다.

```typescript
@@filename(dog.health.ts)
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

export interface Dog {
  name: string;
  type: string;
}

@Injectable()
export class DogHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService
  ) {}

  private dogs: Dog[] = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key: string){
    const indicator = this.healthIndicatorService.check(key);
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const isHealthy = badboys.length === 0;

    if (!isHealthy) {
      return indicator.down({ badboys: badboys.length });
    }

    return indicator.up();
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

@Injectable()
@Dependencies(HealthIndicatorService)
export class DogHealthIndicator {
  constructor(healthIndicatorService) {
    this.healthIndicatorService = healthIndicatorService;
  }

  private dogs = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key){
    const indicator = this.healthIndicatorService.check(key);
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const isHealthy = badboys.length === 0;

    if (!isHealthy) {
      return indicator.down({ badboys: badboys.length });
    }

    return indicator.up();
  }
}
```

다음으로 해야 할 일은 헬스 지표를 프로바이더로 등록하는 것입니다.

```typescript
@@filename(health.module.ts)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DogHealthIndicator } from './dog.health';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
  providers: [DogHealthIndicator]
})
export class HealthModule { }
```

> info **팁** 실제 애플리케이션에서는 `DogHealthIndicator`가 예를 들어 `DogModule`과 같은 별도의 모듈에서 제공되어야 하며, 그 후에 `HealthModule`에 의해 임포트됩니다.

마지막 필수 단계는 이제 사용 가능한 헬스 지표를 필요한 헬스 체크 엔드포인트에 추가하는 것입니다. 이를 위해 `HealthController`로 돌아가서 `check` 함수에 추가합니다.

```typescript
@@filename(health.controller.ts)
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Injectable, Dependencies, Get } from '@nestjs/common';
import { DogHealthIndicator } from './dog.health';

@Injectable()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private dogHealthIndicator: DogHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.dogHealthIndicator.isHealthy('dog'),
    ])
  }
}
@@switch
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Injectable, Get } from '@nestjs/common';
import { DogHealthIndicator } from './dog.health';

@Injectable()
@Dependencies(HealthCheckService, DogHealthIndicator)
export class HealthController {
  constructor(
    health,
    dogHealthIndicator
  ) {
    this.health = health;
    this.dogHealthIndicator = dogHealthIndicator;
  }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.dogHealthIndicator.isHealthy('dog'),
    ])
  }
}
```

#### 로깅

Terminus는 헬스 체크가 실패했을 때와 같은 오류 메시지만 로깅합니다. `TerminusModule.forRoot()` 메소드를 사용하면 오류가 로깅되는 방식에 대해 더 많은 제어 권한을 가질 수 있으며, 로깅 자체를 완전히 제어할 수도 있습니다.

이 섹션에서는 사용자 정의 로거 `TerminusLogger`를 생성하는 방법을 안내해 드립니다. 이 로거는 내장 로거를 확장합니다. 따라서 로거의 어떤 부분을 재정의할지 선택할 수 있습니다.

> info **정보** NestJS에서 사용자 정의 로거에 대해 더 자세히 알고 싶다면, [여기서 더 읽어보세요](/techniques/logger#injecting-a-custom-logger).

```typescript
@@filename(terminus-logger.service.ts)
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class TerminusLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: any[]): void;
  error(
    message: unknown,
    stack?: unknown,
    context?: unknown,
    ...rest: unknown[]
  ): void {
    // 여기에서 오류 메시지가 로깅되는 방식을 재정의하세요
  }
}
```

사용자 정의 로거를 생성했다면 `TerminusModule.forRoot()`에 다음과 같이 전달하면 됩니다.

```typescript
@@filename(health.module.ts)
@Module({
imports: [
  TerminusModule.forRoot({
    logger: TerminusLogger,
  }),
],
})
export class HealthModule {}
```

오류 메시지를 포함하여 Terminus에서 발생하는 모든 로그 메시지를 완전히 억제하려면 다음과 같이 Terminus를 구성하세요.

```typescript
@@filename(health.module.ts)
@Module({
imports: [
  TerminusModule.forRoot({
    logger: false,
  }),
],
})
export class HealthModule {}
```

Terminus를 사용하면 헬스 체크 오류가 로그에 어떻게 표시되어야 하는지 구성할 수 있습니다.

| 오류 로그 스타일        | 설명                                                                                                                        | 예시                                                              |
|:-----------------|:-----------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------|
| `json` (기본값) | 오류 발생 시 헬스 체크 결과 요약을 JSON 객체로 출력합니다                                                     | <figure><img src="/assets/Terminus_Error_Log_Json.png" /></figure>   |
| `pretty`         | 오류 발생 시 형식화된 상자 안에 헬스 체크 결과 요약을 출력하고 성공/실패 결과를 강조 표시합니다 | <figure><img src="/assets/Terminus_Error_Log_Pretty.png" /></figure> |

다음 스니펫과 같이 `errorLogStyle` 구성 옵션을 사용하여 로그 스타일을 변경할 수 있습니다.

```typescript
@@filename(health.module.ts)
@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
    }),
  ]
})
export class HealthModule {}
```

#### 정상 종료 타임아웃

애플리케이션이 종료 프로세스를 연기해야 하는 경우 Terminus가 이를 처리해 줄 수 있습니다. 이 설정은 Kubernetes와 같은 오케스트레이터와 함께 작업할 때 특히 유용할 수 있습니다. 준비성(readiness) 체크 간격보다 약간 더 긴 지연 시간을 설정함으로써 컨테이너 종료 시 제로 다운타임을 달성할 수 있습니다.

```typescript
@@filename(health.module.ts)
@Module({
  imports: [
    TerminusModule.forRoot({
      gracefulShutdownTimeoutMs: 1000,
    }),
  ]
})
export class HealthModule {}
```

#### 더 많은 예제

더 많은 작동 예제는 [여기](https://github.com/nestjs/terminus/tree/master/sample)에서 확인할 수 있습니다.