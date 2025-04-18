### 로거

Nest는 애플리케이션 부트스트래핑 및 포착된 예외 표시(예: 시스템 로깅)와 같은 여러 상황에서 사용되는 내장 텍스트 기반 로거와 함께 제공됩니다. 이 기능은 `@nestjs/common` 패키지의 `Logger` 클래스를 통해 제공됩니다. 다음을 포함한 로깅 시스템의 동작을 완벽하게 제어할 수 있습니다.

- 로깅 전체 비활성화
- 로그 상세 수준 지정 (예: 오류, 경고, 디버그 정보 등 표시)
- 로그 메시지 포맷 구성 (raw, json, 색상화 등)
- 기본 로거의 타임스탬프 재정의 (예: ISO8601 표준 날짜 형식 사용)
- 기본 로거 완전히 재정의
- 기본 로거 확장하여 사용자 정의
- 종속성 주입을 활용하여 애플리케이션 구성 및 테스트 단순화

또한 내장 로거를 사용하거나 자체 사용자 정의 구현을 생성하여 자체 애플리케이션 레벨 이벤트 및 메시지를 로깅할 수 있습니다.

애플리케이션이 외부 로깅 시스템과의 통합, 자동 파일 기반 로깅 또는 중앙 집중식 로깅 서비스로 로그 전달이 필요한 경우, Node.js 로깅 라이브러리를 사용하여 완전히 사용자 정의된 로깅 솔루션을 구현할 수 있습니다. 인기 있는 선택 중 하나는 고성능과 유연성으로 알려진 [Pino](https://github.com/pinojs/pino)입니다.

#### 기본 사용자 정의

로깅을 비활성화하려면 `NestFactory.create()` 메소드의 두 번째 인수로 전달되는 (선택적) Nest 애플리케이션 옵션 객체에서 `logger` 속성을 `false`로 설정합니다.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: false,
});
await app.listen(process.env.PORT ?? 3000);
```

특정 로깅 레벨을 활성화하려면, 다음과 같이 표시할 로그 레벨을 지정하는 문자열 배열로 `logger` 속성을 설정합니다.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn'],
});
await app.listen(process.env.PORT ?? 3000);
```

배열의 값은 `'log'`, `'fatal'`, `'error'`, `'warn'`, `'debug'`, `'verbose'`의 어떤 조합도 가능합니다.

색상화된 출력을 비활성화하려면, `colors` 속성이 `false`로 설정된 `ConsoleLogger` 객체를 `logger` 속성의 값으로 전달합니다.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    colors: false,
  }),
});
```

각 로그 메시지에 대한 접두사를 구성하려면, `prefix` 속성이 설정된 `ConsoleLogger` 객체를 전달합니다.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    prefix: 'MyApp', // 기본값은 "Nest"
  }),
});
```

아래 표에 사용 가능한 모든 옵션이 나열되어 있습니다.

| 옵션              | 설명                                                                                                                                                                                                                                                                                                                                     | 기본값                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `logLevels`       | 활성화된 로그 레벨.                                                                                                                                                                                                                                                                                                                      | `['log', 'error', 'warn', 'debug', 'verbose']`  |
| `timestamp`       | 활성화된 경우, 현재 로그 메시지와 이전 로그 메시지 간의 타임스탬프(시간 차이)를 출력합니다. 참고: 이 옵션은 `json`이 활성화된 경우에는 사용되지 않습니다.                                                                                                                                                                                      | `false`                                         |
| `prefix`          | 각 로그 메시지에 사용될 접두사입니다. 참고: 이 옵션은 `json`이 활성화된 경우에는 사용되지 않습니다.                                                                                                                                                                                                                                              | `Nest`                                          |
| `json`            | 활성화된 경우, 로그 메시지를 JSON 형식으로 출력합니다.                                                                                                                                                                                                                                                                                     | `false`                                         |
| `colors`          | 활성화된 경우, 로그 메시지를 색상으로 출력합니다. 기본값은 json이 비활성화된 경우 true, 그렇지 않은 경우 false입니다.                                                                                                                                                                                                                        | `true`                                          |
| `context`         | 로거의 컨텍스트입니다.                                                                                                                                                                                                                                                                                                                   | `undefined`                                     |
| `compact`         | 활성화된 경우, 여러 속성을 가진 객체라도 로그 메시지를 한 줄로 출력합니다. 숫자로 설정된 경우, 모든 속성이 breakLength에 맞는 한, 가장 안쪽의 n개 요소가 한 줄로 합쳐집니다. 짧은 배열 요소도 함께 그룹화됩니다.                                                                                                                                     | `true`                                          |
| `maxArrayLength`  | 포맷팅 시 포함할 Array, TypedArray, Map, Set, WeakMap, WeakSet 요소의 최대 개수를 지정합니다. 모든 요소를 표시하려면 null 또는 Infinity로 설정합니다. 요소를 표시하지 않으려면 0 또는 음수로 설정합니다. `json`이 활성화되고, 색상이 비활성화되고, `compact`가 true로 설정된 경우에는 무시됩니다. 이때는 파싱 가능한 JSON 출력이 생성됩니다.             | `100`                                           |
| `maxStringLength` | 포맷팅 시 포함할 문자열의 최대 길이를 지정합니다. 모든 요소를 표시하려면 null 또는 Infinity로 설정합니다. 문자를 표시하지 않으려면 0 또는 음수로 설정합니다. `json`이 활성화되고, 색상이 비활성화되고, `compact`가 true로 설정된 경우에는 무시됩니다. 이때는 파싱 가능한 JSON 출력이 생성됩니다.                                                        | `10000`                                         |
| `sorted`          | 활성화된 경우, 객체를 포맷팅하는 동안 키를 정렬합니다. 사용자 정의 정렬 함수일 수도 있습니다. `json`이 활성화되고, 색상이 비활성화되고, `compact`가 true로 설정된 경우에는 무시됩니다. 이때는 파싱 가능한 JSON 출력이 생성됩니다.                                                                                                                   | `false`                                         |
| `depth`           | 객체를 포맷팅하는 동안 재귀할 횟수를 지정합니다. 이는 큰 객체를 검사하는 데 유용합니다. 최대 호출 스택 크기까지 재귀하려면 Infinity 또는 null을 전달합니다. `json`이 활성화되고, 색상이 비활성화되고, `compact`가 true로 설정된 경우에는 무시됩니다. 이때는 파싱 가능한 JSON 출력이 생성됩니다.                                                          | `5`                                             |
| `showHidden`      | true인 경우, 객체의 열거 불가능한 기호 및 속성이 포맷팅된 결과에 포함됩니다. WeakMap 및 WeakSet 항목과 사용자 정의 프로토타입 속성도 포함됩니다.                                                                                                                                                                                                   | `false`                                         |
| `breakLength`     | 입력 값이 여러 줄로 분할되는 길이입니다. (compact를 true로 설정하여) 입력을 한 줄로 포맷팅하려면 Infinity로 설정합니다. "compact"가 true일 때 기본값은 Infinity이고, 그렇지 않으면 80입니다. `json`이 활성화되고, 색상이 비활성화되고, `compact`가 true로 설정된 경우에는 무시됩니다. 이때는 파싱 가능한 JSON 출력이 생성됩니다.              | `Infinity`                                      |

#### JSON 로깅

JSON 로깅은 최신 애플리케이션 관찰 가능성 및 로그 관리 시스템과의 통합에 필수적입니다. NestJS 애플리케이션에서 JSON 로깅을 활성화하려면 `ConsoleLogger` 객체의 `json` 속성을 `true`로 설정하여 구성합니다. 그런 다음, 애플리케이션 인스턴스를 생성할 때 이 로거 구성을 `logger` 속성의 값으로 제공합니다.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    json: true,
  }),
});
```

이 구성은 로그를 구조화된 JSON 형식으로 출력하여 로그 애그리게이터 및 클라우드 플랫폼과 같은 외부 시스템과의 통합을 용이하게 합니다. 예를 들어, **AWS ECS** (Elastic Container Service)와 같은 플랫폼은 JSON 로그를 기본적으로 지원하여 다음과 같은 고급 기능을 활성화합니다.

- **로그 필터링**: 로그 레벨, 타임스탬프 또는 사용자 정의 메타데이터와 같은 필드를 기반으로 로그를 쉽게 좁힐 수 있습니다.
- **검색 및 분석**: 쿼리 도구를 사용하여 애플리케이션 동작의 추세를 분석하고 추적할 수 있습니다.

또한, [NestJS Mau](https://mau.nestjs.com)를 사용하는 경우, JSON 로깅은 잘 정리된 구조화된 형식으로 로그를 보는 프로세스를 단순화하며, 이는 디버깅 및 성능 모니터링에 특히 유용합니다.

> info **참고** `json`이 `true`로 설정되면, `ConsoleLogger`는 `colors` 속성을 `false`로 설정하여 자동으로 텍스트 색상화를 비활성화합니다. 이는 출력이 유효한 JSON으로 유지되고 포맷팅 아티팩트가 없도록 보장합니다. 그러나 개발 목적으로는 `colors`를 명시적으로 `true`로 설정하여 이 동작을 재정의할 수 있습니다. 이렇게 하면 색상화된 JSON 로그가 추가되어 로컬 디버깅 중 로그 항목을 더 읽기 쉽게 만들 수 있습니다.

JSON 로깅이 활성화되면 로그 출력은 다음과 같이 (한 줄로) 표시됩니다.

```json
{
  "level": "log",
  "pid": 19096,
  "timestamp": 1607370779834,
  "message": "Starting Nest application...",
  "context": "NestFactory"
}
```

이 [풀 리퀘스트](https://github.com/nestjs/nest/pull/14121)에서 다양한 변형을 볼 수 있습니다.

#### 애플리케이션 로깅에 로거 사용하기

위의 여러 기술을 결합하여 Nest 시스템 로깅과 자체 애플리케이션 이벤트/메시지 로깅 모두에서 일관된 동작과 포맷팅을 제공할 수 있습니다.

좋은 관행은 각 서비스에서 `@nestjs/common`의 `Logger` 클래스를 인스턴스화하는 것입니다. 다음과 같이 `Logger` 생성자에 서비스 이름을 `context` 인수로 제공할 수 있습니다.

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('Doing something...');
  }
}
```

기본 로거 구현에서 `context`는 아래 예제의 `NestFactory`처럼 대괄호 안에 인쇄됩니다.

```bash
[Nest] 19096   - 12/08/2019, 7:12:59 AM   [NestFactory] Starting Nest application...
```

`app.useLogger()`를 통해 사용자 정의 로거를 제공하면 Nest는 내부적으로 실제로 이를 사용합니다. 즉, 코드는 구현에 agnostic하게 유지되는 반면, `app.useLogger()`를 호출하여 기본 로거를 사용자 정의 로거로 쉽게 대체할 수 있습니다.

이러한 방식으로 이전 섹션의 단계를 따르고 `app.useLogger(app.get(MyLogger))`를 호출하면, `MyService`에서 `this.logger.log()`를 호출하는 것은 `MyLogger` 인스턴스의 `log` 메서드를 호출하게 됩니다.

이는 대부분의 경우에 적합합니다. 그러나 더 많은 사용자 정의가 필요한 경우(예: 사용자 정의 메소드 추가 및 호출) 다음 섹션으로 이동하십시오.

#### 타임스탬프가 있는 로그

로그되는 모든 메시지에 대해 타임스탬프 로깅을 활성화하려면 로거 인스턴스를 생성할 때 선택적 `timestamp: true` 설정을 사용할 수 있습니다.

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name, { timestamp: true });

  doSomething() {
    this.logger.log('Doing something with timestamp here ->');
  }
}
```

이렇게 하면 다음과 같은 형식으로 출력이 생성됩니다.

```bash
[Nest] 19096   - 04/19/2024, 7:12:59 AM   [MyService] Doing something with timestamp here +5ms
```

줄 끝에 있는 `+5ms`에 주목하십시오. 각 로그 문에 대해 이전 메시지와의 시간 차이가 계산되어 줄 끝에 표시됩니다.

#### 사용자 정의 구현

Nest가 시스템 로깅에 사용할 사용자 정의 로거 구현을 제공할 수 있습니다. `logger` 속성의 값을 `LoggerService` 인터페이스를 만족하는 객체로 설정하면 됩니다. 예를 들어, Nest에게 내장 전역 JavaScript `console` 객체(이는 `LoggerService` 인터페이스를 구현합니다)를 사용하도록 지시할 수 있습니다.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: console,
});
await app.listen(process.env.PORT ?? 3000);
```

자체 사용자 정의 로거를 구현하는 것은 간단합니다. 아래에 표시된 대로 `LoggerService` 인터페이스의 각 메소드를 구현하기만 하면 됩니다.

```typescript
import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class MyLogger implements LoggerService {
  /**
   * 'log' 레벨 로그를 작성합니다.
   */
  log(message: any, ...optionalParams: any[]) {}

  /**
   * 'fatal' 레벨 로그를 작성합니다.
   */
  fatal(message: any, ...optionalParams: any[]) {}

  /**
   * 'error' 레벨 로그를 작성합니다.
   */
  error(message: any, ...optionalParams: any[]) {}

  /**
   * 'warn' 레벨 로그를 작성합니다.
   */
  warn(message: any, ...optionalParams: any[]) {}

  /**
   * 'debug' 레벨 로그를 작성합니다.
   */
  debug?(message: any, ...optionalParams: any[]) {}

  /**
   * 'verbose' 레벨 로그를 작성합니다.
   */
  verbose?(message: any, ...optionalParams: any[]) {}
}
```

그런 다음 Nest 애플리케이션 옵션 객체의 `logger` 속성을 통해 `MyLogger`의 인스턴스를 제공할 수 있습니다.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new MyLogger(),
});
await app.listen(process.env.PORT ?? 3000);
```

이 기술은 간단하지만 `MyLogger` 클래스에 종속성 주입을 사용하지 않습니다. 이는 특히 테스트에 일부 문제를 야기하고 `MyLogger`의 재사용성을 제한할 수 있습니다. 더 나은 해결책은 아래 <a href="techniques/logger#dependency-injection">종속성 주입</a> 섹션을 참조하십시오.

#### 내장 로거 확장

로거를 처음부터 작성하는 대신 내장 `ConsoleLogger` 클래스를 확장하고 기본 구현의 선택된 동작을 재정의하여 요구 사항을 충족할 수 있습니다.

```typescript
import { ConsoleLogger } from '@nestjs/common';

export class MyLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    // 여기에 맞춤형 로직을 추가하세요
    super.error(...arguments);
  }
}
```

아래 <a href="techniques/logger#using-the-logger-for-application-logging">애플리케이션 로깅에 로거 사용하기</a> 섹션에 설명된 대로 기능 모듈에서 이러한 확장된 로거를 사용할 수 있습니다.

애플리케이션 옵션 객체의 `logger` 속성을 통해 해당 인스턴스를 전달하거나(위 <a href="techniques/logger#custom-logger-implementation">사용자 정의 구현</a> 섹션 참조) 아래 <a href="techniques/logger#dependency-injection">종속성 주입</a> 섹션에 표시된 기술을 사용하여 Nest에게 시스템 로깅에 확장된 로거를 사용하도록 지시할 수 있습니다. 그렇게 하는 경우, Nest가 예상하는 내장 기능에 의존할 수 있도록 특정 로그 메소드 호출을 부모(내장) 클래스로 위임하기 위해 위 샘플 코드에 표시된 것처럼 `super`를 호출해야 합니다.

<app-banner-courses></app-banner-courses>

#### 종속성 주입

더 고급 로깅 기능을 위해 종속성 주입의 이점을 활용할 수 있습니다. 예를 들어, 로거에 `ConfigService`를 주입하여 사용자 정의하고, 차례로 사용자 정의 로거를 다른 컨트롤러 및/또는 제공자에 주입할 수 있습니다. 사용자 정의 로거에 대해 종속성 주입을 활성화하려면 `LoggerService`를 구현하는 클래스를 만들고 해당 클래스를 일부 모듈에 제공자로 등록합니다. 예를 들어 다음과 같이 할 수 있습니다.

1. 이전 섹션에 표시된 것처럼 내장 `ConsoleLogger`를 확장하거나 완전히 재정의하는 `MyLogger` 클래스를 정의합니다. `LoggerService` 인터페이스를 구현해야 합니다.
2. 아래에 표시된 대로 `LoggerModule`을 만들고 해당 모듈에서 `MyLogger`를 제공합니다.

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

이 구조를 사용하면 이제 다른 모듈에서 사용할 수 있도록 사용자 정의 로거를 제공하고 있습니다. `MyLogger` 클래스는 모듈의 일부이므로 종속성 주입(예: `ConfigService` 주입)을 사용할 수 있습니다. Nest가 시스템 로깅(예: 부트스트래핑 및 오류 처리)에 사용할 수 있도록 이 사용자 정의 로거를 제공하는 데 필요한 한 가지 기술이 더 있습니다.

애플리케이션 인스턴스화(`NestFactory.create()`)는 어떤 모듈의 컨텍스트 외부에서 발생하므로 일반적인 종속성 주입 초기화 단계에 참여하지 않습니다. 따라서 Nest가 `MyLogger` 클래스의 싱글턴 인스턴스를 인스턴스화하도록 트리거하려면 하나 이상의 애플리케이션 모듈이 `LoggerModule`을 임포트해야 합니다.

그런 다음 다음과 같은 구조로 Nest에게 `MyLogger`의 동일한 싱글턴 인스턴스를 사용하도록 지시할 수 있습니다.

```typescript
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(app.get(MyLogger));
await app.listen(process.env.PORT ?? 3000);
```

> info **참고** 위 예제에서 `bufferLogs`를 `true`로 설정하여 사용자 정의 로거(`이 경우 MyLogger`)가 연결될 때까지 모든 로그가 버퍼링되고 애플리케이션 초기화 프로세스가 완료되거나 실패하도록 합니다. 초기화 프로세스가 실패하면 Nest는 보고된 오류 메시지를 출력하기 위해 원래 `ConsoleLogger`로 대체됩니다. 또한, `autoFlushLogs`를 `false`(기본값은 `true`)로 설정하여 로그를 수동으로 플러시할 수 있습니다(`Logger.flush()` 메소드 사용).

여기서는 `NestApplication` 인스턴스의 `get()` 메소드를 사용하여 `MyLogger` 객체의 싱글턴 인스턴스를 검색합니다. 이 기술은 본질적으로 Nest가 사용할 로거 인스턴스를 "주입"하는 방법입니다. `app.get()` 호출은 `MyLogger`의 싱글턴 인스턴스를 검색하며, 위에서 설명한 대로 다른 모듈에 해당 인스턴스가 먼저 주입되는 것에 의존합니다.

이 `MyLogger` 제공자를 기능 클래스에 주입하여 Nest 시스템 로깅과 애플리케이션 로깅 모두에서 일관된 로깅 동작을 보장할 수도 있습니다. 자세한 내용은 아래 <a href="techniques/logger#using-the-logger-for-application-logging">애플리케이션 로깅에 로거 사용하기</a> 및 <a href="techniques/logger#injecting-a-custom-logger">사용자 정의 로거 주입하기</a>를 참조하십시오.

#### 사용자 정의 로거 주입하기

시작하려면 다음 코드와 같이 내장 로거를 확장합니다. `ConsoleLogger` 클래스의 구성 메타데이터로 `scope` 옵션을 제공하여 [transient](/fundamentals/injection-scopes) 스코프를 지정합니다. 이렇게 하면 각 기능 모듈에서 `MyLogger`의 고유한 인스턴스를 갖게 됩니다. 이 예에서는 개별 `ConsoleLogger` 메소드(`log()`, `warn()` 등)를 확장하지 않지만, 필요에 따라 확장할 수 있습니다.

```typescript
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends ConsoleLogger {
  customLog() {
    this.log('Please feed the cat!');
  }
}
```

다음으로, 다음과 같은 구조로 `LoggerModule`을 생성합니다.

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

다음으로, 기능 모듈에 `LoggerModule`을 임포트합니다. 기본 `Logger`를 확장했기 때문에 `setContext` 메소드를 사용하는 편리함을 누릴 수 있습니다. 따라서 컨텍스트 인식 사용자 정의 로거를 다음과 같이 사용할 수 있습니다.

```typescript
import { Injectable } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  constructor(private myLogger: MyLogger) {
    // transient scope 때문에 CatsService는 MyLogger의 고유한 인스턴스를 가집니다.
    // 따라서 여기서 컨텍스트를 설정하는 것은 다른 서비스의 다른 인스턴스에 영향을 미치지 않습니다.
    this.myLogger.setContext('CatsService');
  }

  findAll(): Cat[] {
    // 모든 기본 메소드를 호출할 수 있습니다.
    this.myLogger.warn('About to return cats!');
    // 그리고 사용자 정의 메소드도 호출할 수 있습니다.
    this.myLogger.customLog();
    return this.cats;
  }
}
```

마지막으로, 아래에 표시된 것처럼 `main.ts` 파일에서 사용자 정의 로거 인스턴스를 사용하도록 Nest에게 지시합니다. 물론 이 예에서는 로거 동작을 실제로 사용자 정의하지 않았으므로(`log()`, `warn()` 등과 같은 `Logger` 메소드를 확장하여) 이 단계는 실제로 필요하지 않습니다. 하지만 해당 메소드에 사용자 정의 로직을 추가하고 Nest가 동일한 구현을 사용하도록 하려면 **필요**할 것입니다.

```typescript
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(new MyLogger());
await app.listen(process.env.PORT ?? 3000);
```

> info **힌트** 또는 `bufferLogs`를 `true`로 설정하는 대신 `logger: false` 지시로 로거를 일시적으로 비활성화할 수 있습니다. `NestFactory.create`에 `logger: false`를 제공하면 `useLogger`를 호출할 때까지 아무것도 로깅되지 않으므로 중요한 초기화 오류를 놓칠 수 있습니다. 초기 메시지 중 일부가 기본 로거로 로깅되어도 상관없다면 `logger: false` 옵션을 생략하면 됩니다.

#### 외부 로거 사용하기

프로덕션 애플리케이션은 종종 고급 필터링, 포맷팅 및 중앙 집중식 로깅을 포함한 특정 로깅 요구 사항을 갖습니다. Nest의 내장 로거는 Nest 시스템 동작을 모니터링하는 데 사용되며, 개발 중 기능 모듈에서 기본적인 포맷팅된 텍스트 로깅에도 유용할 수 있지만, 프로덕션 애플리케이션은 종종 [Winston](https://github.com/winstonjs/winston)과 같은 전용 로깅 모듈을 활용합니다. 모든 표준 Node.js 애플리케이션과 마찬가지로 Nest에서도 이러한 모듈의 이점을 최대한 활용할 수 있습니다.
