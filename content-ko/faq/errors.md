### 흔한 오류

NestJS를 사용한 개발 과정에서 프레임워크를 배우면서 다양한 오류에 직면할 수 있습니다.

#### "종속성을 확인할 수 없습니다" 오류

> info **힌트** "종속성을 확인할 수 없습니다" 오류를 쉽게 해결하는 데 도움이 될 수 있는 [NestJS Devtools](/devtools/overview#investigating-the-cannot-resolve-dependency-error)를 확인해 보세요.

아마 가장 흔한 오류 메시지는 Nest가 프로바이더의 종속성을 확인할 수 없다는 내용일 것입니다. 오류 메시지는 대개 다음과 같습니다.

```bash
Nest can't resolve dependencies of the <provider> (?). Please make sure that the argument <unknown_token> at index [<index>] is available in the <module> context.

Potential solutions:
- Is <module> a valid NestJS module?
- If <unknown_token> is a provider, is it part of the current <module>?
- If <unknown_token> is exported from a separate @Module, is that module imported within <module>?
  @Module({
    imports: [ /* the Module containing <unknown_token> */ ]
  })
```

이 오류의 가장 흔한 원인은 모듈의 `providers` 배열에 `<provider>`가 없는 것입니다. 해당 프로바이더가 실제로 `providers` 배열에 포함되어 있고 [표준 NestJS 프로바이더 관행](/fundamentals/custom-providers#di-fundamentals)을 따르고 있는지 확인하세요.

몇 가지 흔한 함정이 있습니다. 그 중 하나는 `imports` 배열에 프로바이더를 넣는 것입니다. 이 경우, 오류 메시지에 `<module>` 자리에 프로바이더의 이름이 나타날 것입니다.

개발 중 이 오류가 발생하면 오류 메시지에 언급된 모듈을 확인하고 해당 모듈의 `providers`를 살펴보세요. `providers` 배열의 각 프로바이더에 대해 해당 모듈이 모든 종속성에 접근할 수 있는지 확인하세요. 종종 "기능 모듈(Feature Module)"과 "루트 모듈(Root Module)"에 `providers`가 중복되는 경우가 있는데, 이는 Nest가 프로바이더를 두 번 인스턴스화하려고 시도함을 의미합니다. 중복되는 `<provider>`를 포함하는 모듈은 대신 "루트 모듈(Root Module)"의 `imports` 배열에 추가되어야 할 가능성이 높습니다.

위에서 `<unknown_token>`이 `dependency`라면 순환 파일 임포트가 발생했을 수 있습니다. 이는 프로바이더가 생성자에서 서로에게 의존하는 아래의 [순환 종속성](/faq/common-errors#circular-dependency-error)과는 다릅니다. 단순히 두 파일이 서로를 임포트하게 되는 것을 의미합니다. 흔한 경우는 모듈 파일이 토큰을 선언하고 프로바이더를 임포트하며, 해당 프로바이더가 모듈 파일에서 토큰 상수를 임포트하는 경우입니다. 배럴 파일(barrel files)을 사용하는 경우, 배럴 임포트가 이러한 순환 임포트를 생성하지 않도록 주의하세요.

위에서 `<unknown_token>`이 `Object`인 경우, 적절한 프로바이더의 토큰 없이 타입/인터페이스를 사용하여 주입하고 있음을 의미합니다. 이를 해결하려면 다음을 확인하세요.

1.  클래스 참조를 임포트하거나 `@Inject()` 데코레이터와 함께 사용자 정의 토큰을 사용하고 있는지 확인하세요. [사용자 정의 프로바이더 페이지](/fundamentals/custom-providers)를 읽어보세요.
2.  클래스 기반 프로바이더의 경우, [`import type ...`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export) 구문을 통해 타입만 임포트하는 대신 구체적인 클래스를 임포트하고 있는지 확인하세요.

또한, NestJS에서는 자체 주입(self-injection)이 허용되지 않으므로 프로바이더 자체에 주입하지 않았는지 확인하세요. 이 경우 `<unknown_token>`은 `<provider>`와 동일할 가능성이 높습니다.

<app-banner-devtools></app-banner-devtools>

**모노레포(monorepo) 설정**에 있다면 위와 동일한 오류가 발생할 수 있으며, 이때 `<unknown_token>`은 `ModuleRef`라는 핵심 프로바이더일 수 있습니다.

```bash
Nest can't resolve dependencies of the <provider> (?).
Please make sure that the argument ModuleRef at index [<index>] is available in the <module> context.
...
```

이는 프로젝트가 `@nestjs/core` 패키지의 두 개의 Node 모듈을 로드하게 될 때 발생할 가능성이 높습니다. 구조는 다음과 같습니다.

```text
.
├── package.json
├── apps
│   └── api
│       └── node_modules
│           └── @nestjs/bull
│               └── node_modules
│                   └── @nestjs/core
└── node_modules
    ├── (other packages)
    └── @nestjs/core
```

해결 방법:

-   **Yarn** 워크스페이스의 경우, `@nestjs/core` 패키지의 호이스팅(hoisting)을 방지하기 위해 [nohoist 기능](https://classic.yarnpkg.com/blog/2018/02/15/nohoist)을 사용하세요.
-   **pnpm** 워크스페이스의 경우, 다른 모듈에 `@nestjs/core`를 peerDependencies로 설정하고, 해당 모듈이 임포트되는 앱의 package.json에 `"dependenciesMeta": {{ '{' }}"other-module-name": {{ '{' }}"injected": true &#125;&#125;`를 추가하세요. 자세한 내용은 다음을 참조하세요: [dependenciesmetainjected](https://pnpm.io/package_json#dependenciesmetainjected)

#### "순환 종속성" 오류

때때로 애플리케이션에서 [순환 종속성](https://nestjs.dokidocs.dev/fundamentals/circular-dependency)을 피하기 어려울 수 있습니다. Nest가 이를 해결하도록 돕기 위해 몇 가지 조치를 취해야 합니다. 순환 종속성으로 인해 발생하는 오류는 다음과 같습니다.

```bash
Nest cannot create the <module> instance.
The module at index [<index>] of the <module> "imports" array is undefined.

Potential causes:
- A circular dependency between modules. Use forwardRef() to avoid it. Read more: https://docs.nestjs.com/fundamentals/circular-dependency
- The module at index [<index>] is of type "undefined". Check your import statements and the type of the module.

Scope [<module_import_chain>]
# example chain AppModule -> FooModule
```

순환 종속성은 프로바이더들이 서로에게 의존하거나, 타입스크립트 파일들이 상수를 위해 서로에게 의존하는 경우 발생할 수 있습니다. 예를 들어, 모듈 파일에서 상수를 익스포트하고 서비스 파일에서 이를 임포트하는 경우입니다. 후자의 경우, 상수는 별도의 파일로 분리하는 것이 좋습니다. 전자의 경우, 순환 종속성에 대한 가이드를 따르고 모듈 **및** 프로바이더 모두 `forwardRef`로 표시되었는지 확인하세요.

#### 종속성 오류 디버깅

종속성이 올바른지 수동으로 확인하는 것과 함께, Nest 8.1.0부터는 `NEST_DEBUG` 환경 변수를 truthy로 해석되는 문자열로 설정하여 Nest가 애플리케이션의 모든 종속성을 확인하는 동안 추가 로깅 정보를 얻을 수 있습니다.

<figure><img src="/assets/injector_logs.png" /></figure>

위 이미지에서 노란색 문자열은 주입되는 종속성의 호스트 클래스이고, 파란색 문자열은 주입되는 종속성의 이름 또는 해당 주입 토큰이며, 보라색 문자열은 종속성을 찾고 있는 모듈입니다. 이를 사용하여 일반적으로 종속성 해결 과정을 추적하여 문제가 발생하는 이유를 파악할 수 있습니다.

#### "파일 변경 감지" 무한 루프

TypeScript 버전 4.9 이상을 사용하는 Windows 사용자에게 이 문제가 발생할 수 있습니다.
이는 `npm run start:dev`와 같이 애플리케이션을 watch 모드로 실행하려고 할 때 발생하며, 다음과 같은 로그 메시지가 무한 반복되는 것을 볼 수 있습니다.

```bash
XX:XX:XX AM - File change detected. Starting incremental compilation...
XX:XX:XX AM - Found 0 errors. Watching for file changes.
```

NestJS CLI를 사용하여 애플리케이션을 watch 모드로 시작할 때 `tsc --watch`를 호출하여 수행되며, TypeScript 버전 4.9부터 [새로운 전략](https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/#file-watching-now-uses-file-system-events)이 파일 변경 감지에 사용되는데, 이것이 이 문제의 원인일 가능성이 높습니다.
이 문제를 해결하려면 tsconfig.json 파일의 `"compilerOptions"` 옵션 뒤에 다음과 같이 설정을 추가해야 합니다.

```bash
  "watchOptions": {
    "watchFile": "fixedPollingInterval"
  }
```

이는 파일 시스템 이벤트(새로운 기본 방식) 대신 폴링(polling) 방식을 사용하여 파일 변경을 확인하도록 TypeScript에 지시하는 것으로, 일부 머신에서는 문제를 일으킬 수 있습니다.
`"watchFile"` 옵션에 대해 [TypeScript 문서](https://www.typescriptlang.org/tsconfig#watch-watchDirectory)에서 자세히 읽어볼 수 있습니다.
