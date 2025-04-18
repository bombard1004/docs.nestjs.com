### Read-Eval-Print-Loop (REPL)

REPL은 단일 사용자 입력을 받아 실행하고 그 결과를 사용자에게 반환하는 간단한 인터랙티브 환경입니다.
REPL 기능은 터미널에서 직접 의존성 그래프를 검사하고 프로바이더(및 컨트롤러)의 메소드를 호출할 수 있도록 해줍니다.

#### 사용법

NestJS 애플리케이션을 REPL 모드로 실행하려면, 새 `repl.ts` 파일을 생성하고 (기존 `main.ts` 파일과 같은 위치에) 안에 다음 코드를 추가합니다.

```typescript
@@filename(repl)
import { repl } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
@@switch
import { repl } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
```

이제 터미널에서 다음 명령어로 REPL을 시작합니다.

```bash
$ npm run start -- --entryFile repl
```

> info **힌트** `repl`은 [Node.js REPL 서버](https://nodejs.org/api/repl.html) 객체를 반환합니다.

실행되면 콘솔에 다음 메시지가 표시되어야 합니다.

```bash
LOG [NestFactory] Starting Nest application...
LOG [InstanceLoader] AppModule dependencies initialized
LOG REPL initialized
```

이제 의존성 그래프와 상호 작용을 시작할 수 있습니다. 예를 들어, `AppService`를 가져와서 (여기서는 스타터 프로젝트를 예시로 사용합니다) `getHello()` 메소드를 호출할 수 있습니다.

```typescript
> get(AppService).getHello()
'Hello World!'
```

터미널 내에서 어떤 JavaScript 코드든 실행할 수 있습니다. 예를 들어, `AppController` 인스턴스를 지역 변수에 할당하고, `await`를 사용하여 비동기 메소드를 호출할 수 있습니다.

```typescript
> appController = get(AppController)
AppController { appService: AppService {} }
> await appController.getHello()
'Hello World!'
```

주어진 프로바이더나 컨트롤러에서 사용 가능한 모든 공개 메소드를 표시하려면 다음과 같이 `methods()` 함수를 사용하세요.

```typescript
> methods(AppController)

Methods:
 ◻ getHello
```

등록된 모든 모듈과 해당 컨트롤러, 프로바이더를 목록으로 출력하려면 `debug()`를 사용하세요.

```typescript
> debug()

AppModule:
 - controllers:
  ◻ AppController
 - providers:
  ◻ AppService
```

간단한 데모:

<figure><img src="/assets/repl.gif" alt="REPL example" /></figure>

아래 섹션에서 기존의 미리 정의된 네이티브 메소드에 대한 자세한 정보를 찾을 수 있습니다.

#### 네이티브 함수

내장 NestJS REPL은 REPL을 시작할 때 전역적으로 사용할 수 있는 몇 가지 네이티브 함수와 함께 제공됩니다. `help()`를 호출하여 목록을 확인할 수 있습니다.

함수의 시그니처(예: 예상 파라미터와 반환 타입)가 기억나지 않는다면, `<function_name>.help`를 호출하면 됩니다.
예를 들어:

```text
> $.help
주입 가능한 대상 또는 컨트롤러의 인스턴스를 검색하고, 그렇지 않으면 예외를 던집니다.
Interface: $(token: InjectionToken) => any
```

> info **힌트** 이 함수 인터페이스는 [TypeScript 함수 타입 표현식 구문](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions)으로 작성되었습니다.

| 함수       | 설명                                                                                              | 시그니처                                                             |
| ---------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `debug`    | 등록된 모든 모듈과 해당 컨트롤러 및 프로바이더를 목록으로 출력합니다.                                               | `debug(moduleCls?: ClassRef \| string) => void`                      |
| `get` 또는 `$` | 주입 가능한 대상 또는 컨트롤러의 인스턴스를 검색하고, 그렇지 않으면 예외를 던집니다.                                        | `get(token: InjectionToken) => any`                                  |
| `methods`  | 주어진 프로바이더 또는 컨트롤러에서 사용 가능한 모든 공개 메소드를 표시합니다.                                             | `methods(token: ClassRef \| string) => void`                         |
| `resolve`  | 트랜지언트 또는 리퀘스트 스코프 대상인 주입 가능한 대상 또는 컨트롤러의 인스턴스를 검색하고, 그렇지 않으면 예외를 던집니다.                    | `resolve(token: InjectionToken, contextId: any) => Promise<any>`     |
| `select`   | 모듈 트리를 탐색할 수 있도록 하여, 예를 들어 선택된 모듈에서 특정 인스턴스를 가져올 수 있습니다.                               | `select(token: DynamicModule \| ClassRef) => INestApplicationContext` |

#### 와치 모드

개발 중에는 모든 코드 변경 사항을 자동으로 반영하기 위해 와치 모드에서 REPL을 실행하는 것이 유용합니다.

```bash
$ npm run start -- --watch --entryFile repl
```

이것에는 한 가지 단점이 있는데, 각 리로드 후에 REPL의 명령 히스토리가 버려져 불편할 수 있습니다.
다행히도 매우 간단한 해결책이 있습니다. `bootstrap` 함수를 다음과 같이 수정합니다.

```typescript
async function bootstrap() {
  const replServer = await repl(AppModule);
  replServer.setupHistory(".nestjs_repl_history", (err) => {
    if (err) {
      console.error(err);
    }
  });
}
```

이제 실행/리로드를 해도 히스토리가 보존됩니다.