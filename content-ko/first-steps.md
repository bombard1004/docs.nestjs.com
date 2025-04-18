### 첫 단계

이 글들을 통해 Nest의 **핵심 기본 사항**을 배우게 됩니다. Nest 애플리케이션의 필수 구성 요소에 익숙해지기 위해, 입문 수준에서 많은 부분을 다루는 기능을 갖춘 기본적인 CRUD 애플리케이션을 구축할 것입니다.

#### 언어

우리는 [TypeScript](https://www.typescriptlang.org/)를 좋아하지만, 무엇보다 - 우리는 [Node.js](https://nodejs.org/en/)를 사랑합니다. 그렇기 때문에 Nest는 TypeScript와 순수 JavaScript 모두와 호환됩니다. Nest는 최신 언어 기능을 활용하므로, 바닐라 JavaScript와 함께 사용하려면 [Babel](https://babeljs.io/) 컴파일러가 필요합니다.

우리가 제공하는 예제에서는 대부분 TypeScript를 사용하지만, 언제든지 **코드 스니펫을** 바닐라 JavaScript 구문으로 **전환**할 수 있습니다 (각 스니펫의 오른쪽 상단에 있는 언어 버튼을 클릭하여 토글하면 됩니다).

#### 사전 요구 사항

[Node.js](https://nodejs.org)(버전 >= 20)가 운영 체제에 설치되어 있는지 확인하십시오.

#### 설정

새 프로젝트 설정은 [Nest CLI](/cli/overview)를 사용하면 매우 간단합니다. [npm](https://www.npmjs.com/)이 설치되어 있다면, OS 터미널에서 다음 명령어를 사용하여 새 Nest 프로젝트를 생성할 수 있습니다:

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

> info **힌트** TypeScript의 [더 엄격한](https://www.typescriptlang.org/tsconfig#strict) 기능 세트로 새 프로젝트를 생성하려면, `nest new` 명령어에 `--strict` 플래그를 전달하십시오.

`project-name` 디렉터리가 생성되고, node 모듈 및 몇 가지 다른 기본 파일이 설치되며, `src/` 디렉터리가 생성되고 몇 가지 핵심 파일로 채워집니다.

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">app.controller.spec.ts</div>
    <div class="item">app.controller.ts</div>
    <div class="item">app.module.ts</div>
    <div class="item">app.service.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

다음은 이 핵심 파일들에 대한 간략한 개요입니다:

|                          |                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `app.controller.ts`      | 단일 라우트를 가진 기본적인 컨트롤러입니다.                                                                             |
| `app.controller.spec.ts` | 컨트롤러에 대한 단위 테스트입니다.                                                                                  |
| `app.module.ts`          | 애플리케이션의 루트 모듈입니다.                                                                               |
| `app.service.ts`         | 단일 메서드를 가진 기본적인 서비스입니다.                                                                               |
| `main.ts`                | 코어 함수 `NestFactory`를 사용하여 Nest 애플리케이션 인스턴스를 생성하는 애플리케이션의 진입 파일입니다. |

`main.ts`는 애플리케이션을 **부트스트랩**할 비동기 함수를 포함합니다:

```typescript
@@filename(main)

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

Nest 애플리케이션 인스턴스를 생성하기 위해 코어 `NestFactory` 클래스를 사용합니다. `NestFactory`는 애플리케이션 인스턴스를 생성할 수 있는 몇 가지 정적 메서드를 노출합니다. `create()` 메서드는 `INestApplication` 인터페이스를 만족하는 애플리케이션 객체를 반환합니다. 이 객체는 다음 장에서 설명할 메서드 집합을 제공합니다. 위의 `main.ts` 예제에서는 애플리케이션이 들어오는 HTTP 요청을 기다릴 수 있도록 HTTP 리스너를 간단히 시작합니다.

Nest CLI로 스캐폴딩된 프로젝트는 각 모듈을 자체 전용 디렉터리에 유지하는 규칙을 따르도록 권장하는 초기 프로젝트 구조를 생성한다는 점에 유의하십시오.

> info **힌트** 기본적으로 애플리케이션 생성 중 오류가 발생하면 앱은 코드 `1`로 종료됩니다. 대신 오류를 발생시키려면 옵션 `abortOnError`를 비활성화하십시오 (예: `NestFactory.create(AppModule, {{ '{' }} abortOnError: false {{ '}' }})`).

<app-banner-courses></app-banner-courses>

#### 플랫폼

Nest는 플랫폼 독립적인 프레임워크가 되려고 합니다. 플랫폼 독립성을 통해 개발자들이 여러 다른 유형의 애플리케이션에서 활용할 수 있는 재사용 가능한 논리적 부분을 생성할 수 있습니다. 기술적으로 Nest는 어댑터가 생성되면 모든 Node HTTP 프레임워크와 함께 작동할 수 있습니다. 두 가지 HTTP 플랫폼이 기본적으로 지원됩니다: [express](https://expressjs.com/) 및 [fastify](https://www.fastify.io/). 필요에 가장 잘 맞는 플랫폼을 선택할 수 있습니다.

|                    |                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform-express` | [Express](https://expressjs.com/)는 잘 알려진 Node용 최소주의 웹 프레임워크입니다. 이는 커뮤니티에 의해 구현된 많은 리소스를 가진, 검증된 프로덕션 레디 라이브러리입니다. `@nestjs/platform-express` 패키지가 기본적으로 사용됩니다. 많은 사용자들이 Express에 만족하며, 이를 활성화하기 위해 별다른 조치를 취할 필요가 없습니다. |
| `platform-fastify` | [Fastify](https://www.fastify.io/)는 최대 효율성과 속도를 제공하는 데 집중한 고성능 및 저오버헤드 프레임워크입니다. 사용 방법은 [여기](/techniques/performance)에서 읽을 수 있습니다.                                                                                                                                  |

어떤 플랫폼이 사용되든, 자체 애플리케이션 인터페이스를 노출합니다. 이들은 각각 `NestExpressApplication` 및 `NestFastifyApplication`으로 보입니다.

아래 예제와 같이 `NestFactory.create()` 메서드에 타입을 전달하면, `app` 객체는 해당 특정 플랫폼에 대해서만 사용할 수 있는 메서드를 갖게 됩니다. 하지만, 실제 기본 플랫폼 API에 액세스하려는 경우가 아니라면 타입을 지정할 **필요는 없습니다**.

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);
```

#### 애플리케이션 실행

설치 프로세스가 완료되면, OS 명령 프롬프트에서 다음 명령어를 실행하여 들어오는 HTTP 요청을 수신하도록 애플리케이션을 시작할 수 있습니다:

```bash
$ npm run start
```

> info **힌트** 개발 프로세스를 가속화하려면 (빌드 속도 20배 향상), `start` 스크립트에 `-b swc` 플래그를 전달하여 [SWC 빌더](/recipes/swc)를 사용할 수 있습니다. 예를 들어 `npm run start -- -b swc`와 같이 사용합니다.

이 명령어는 `src/main.ts` 파일에 정의된 포트에서 HTTP 서버를 수신 대기 상태로 애플리케이션을 시작합니다. 애플리케이션이 실행되면 브라우저를 열고 `http://localhost:3000/`으로 이동하십시오. `Hello World!` 메시지가 표시되어야 합니다.

파일 변경 사항을 감시하려면, 다음 명령어를 실행하여 애플리케이션을 시작할 수 있습니다:

```bash
$ npm run start:dev
```

이 명령어는 파일을 감시하고, 자동으로 다시 컴파일하며 서버를 다시 로드합니다.

#### Linting 및 Formatting

[CLI](/cli/overview)는 대규모로 신뢰할 수 있는 개발 워크플로우를 스캐폴딩하기 위해 최선을 다합니다. 따라서 생성된 Nest 프로젝트에는 코드 **린터** 및 **포맷터**가 미리 설치되어 있습니다 (각각 [eslint](https://eslint.org/) 및 [prettier](https://prettier.io/)).

> info **힌트** 포맷터와 린터의 역할이 확실하지 않으신가요? [여기](https://prettier.io/docs/en/comparison.html)에서 차이점을 알아보세요.

최대 안정성과 확장성을 보장하기 위해 기본 [`eslint`](https://www.npmjs.com/package/eslint) 및 [`prettier`](https://www.npmjs.com/package/prettier) cli 패키지를 사용합니다. 이 설정은 공식 확장 프로그램을 통한 깔끔한 IDE 통합을 기본적으로 지원합니다.

IDE가 관련 없는 무인 환경(지속적 통합, Git Hooks 등)의 경우, Nest 프로젝트는 바로 사용할 수 있는 `npm` 스크립트를 제공합니다.

```bash
# eslint로 Lint 및 자동 수정
$ npm run lint

# prettier로 포맷팅
$ npm run format
```
