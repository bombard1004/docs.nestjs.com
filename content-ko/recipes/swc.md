### SWC

[SWC](https://swc.rs/) (Speedy Web Compiler)는 컴파일과 번들링 모두에 사용할 수 있는 확장 가능한 Rust 기반 플랫폼입니다.
Nest CLI와 함께 SWC를 사용하면 개발 프로세스의 속도를 크게 높일 수 있는 훌륭하고 간단한 방법입니다.

> info **힌트** SWC는 기본 TypeScript 컴파일러보다 약 **20배 더 빠릅니다**.

#### 설치

시작하려면 먼저 몇 가지 패키지를 설치합니다:

```bash
$ npm i --save-dev @swc/cli @swc/core
```

#### 시작하기

설치 프로세스가 완료되면 다음과 같이 Nest CLI와 함께 `swc` 빌더를 사용할 수 있습니다:

```bash
$ nest start -b swc
# 또는 nest start --builder swc
```

> info **힌트** 리포지토리가 모노레포인 경우, [이 섹션](/recipes/swc#monorepo)을 확인하세요.

`-b` 플래그를 전달하는 대신 `nest-cli.json` 파일에서 `compilerOptions.builder` 속성을 다음과 같이 `"swc"`로 설정할 수도 있습니다:

```json
{
  "compilerOptions": {
    "builder": "swc"
  }
}
```

빌더의 동작을 사용자 정의하려면 다음과 같이 두 가지 속성(`type` (`"swc"`) 및 `options`)을 포함하는 객체를 전달할 수 있습니다:

```json
{
  "compilerOptions": {
    "builder": {
      "type": "swc",
      "options": {
        "swcrcPath": "infrastructure/.swcrc",
      }
    }
  }
}
```

애플리케이션을 Watch 모드로 실행하려면 다음 명령을 사용합니다:

```bash
$ nest start -b swc -w
# 또는 nest start --builder swc --watch
```

#### 타입 검사

SWC 자체는 타입 검사를 수행하지 않으므로 (기본 TypeScript 컴파일러와는 다르게), 이를 켜려면 `--type-check` 플래그를 사용해야 합니다:

```bash
$ nest start -b swc --type-check
```

이 명령은 Nest CLI에게 `tsc`를 `noEmit` 모드로 SWC와 함께 실행하도록 지시하여 비동기적으로 타입 검사를 수행합니다. 다시 말해, `--type-check` 플래그를 전달하는 대신 `nest-cli.json` 파일에서 `compilerOptions.typeCheck` 속성을 다음과 같이 `true`로 설정할 수도 있습니다:

```json
{
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
```

#### CLI 플러그인 (SWC)

`--type-check` 플래그는 자동으로 **NestJS CLI 플러그인**을 실행하고 직렬화된 메타데이터 파일을 생성하며, 이 파일은 런타임에 애플리케이션에서 로드될 수 있습니다.

#### SWC 설정

SWC 빌더는 NestJS 애플리케이션의 요구 사항에 맞게 사전 구성되어 있습니다. 하지만 루트 디렉토리에 `.swcrc` 파일을 생성하고 원하는 대로 옵션을 조정하여 설정을 사용자 정의할 수 있습니다.

```json
{
  "$schema": "https://swc.rs/schema.json",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
```

#### 모노레포

리포지토리가 모노레포인 경우 `swc` 빌더를 사용하는 대신 `webpack`이 `swc-loader`를 사용하도록 구성해야 합니다.

먼저 필요한 패키지를 설치합니다:

```bash
$ npm i --save-dev swc-loader
```

설치가 완료되면 애플리케이션의 루트 디렉토리에 다음 내용을 가진 `webpack.config.js` 파일을 생성합니다:

```js
const swcDefaultConfig = require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory().swcOptions;

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: swcDefaultConfig,
        },
      },
    ],
  },
};
```

#### 모노레포 및 CLI 플러그인

CLI 플러그인을 사용하는 경우 `swc-loader`가 자동으로 로드하지 않습니다. 대신 수동으로 로드하는 별도의 파일을 생성해야 합니다. 이를 위해 `main.ts` 파일 근처에 다음 내용을 가진 `generate-metadata.ts` 파일을 선언합니다:

```ts
import { PluginMetadataGenerator } from '@nestjs/cli/lib/compiler/plugins/plugin-metadata-generator';
import { ReadonlyVisitor } from '@nestjs/swagger/dist/plugin';

const generator = new PluginMetadataGenerator();
generator.generate({
  visitors: [new ReadonlyVisitor({ introspectComments: true, pathToSource: __dirname })],
  outputDir: __dirname,
  watch: true,
  tsconfigPath: 'apps/<name>/tsconfig.app.json',
});
```

> info **힌트** 이 예에서는 `@nestjs/swagger` 플러그인을 사용했지만, 원하는 어떤 플러그인이든 사용할 수 있습니다.

`generate()` 메소드는 다음 옵션을 받습니다:

|                    |                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `watch`            | 프로젝트의 변경 사항을 감시할지 여부.                                                               |
| `tsconfigPath`     | `tsconfig.json` 파일 경로. 현재 작업 디렉토리 (`process.cwd()`)에 대한 상대 경로.                      |
| `outputDir`        | 메타데이터 파일이 저장될 디렉토리 경로.                                                             |
| `visitors`         | 메타데이터를 생성하는 데 사용될 방문자 배열.                                                          |
| `filename`         | 메타데이터 파일 이름. 기본값은 `metadata.ts`.                                                      |
| `printDiagnostics` | 콘솔에 진단 정보를 출력할지 여부. 기본값은 `true`.                                                    |

마지막으로 별도의 터미널 창에서 다음 명령으로 `generate-metadata` 스크립트를 실행할 수 있습니다:

```bash
$ npx ts-node src/generate-metadata.ts
# 또는 npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
```

#### 일반적인 함정

TypeORM/MikroORM 또는 다른 ORM을 애플리케이션에서 사용하는 경우 순환 가져오기 문제에 부딪힐 수 있습니다. SWC는 **순환 가져오기**를 잘 처리하지 못하므로 다음과 같은 해결 방법을 사용해야 합니다:

```typescript
@Entity()
export class User {
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Relation<Profile>; // <--- 여기 "Profile" 대신 "Relation<>" 타입을 보세요
}
```

> info **힌트** `Relation` 타입은 `typeorm` 패키지에서 내보내집니다.

이렇게 하면 속성의 타입이 트랜스파일된 코드의 속성 메타데이터에 저장되는 것을 방지하여 순환 종속성 문제를 예방할 수 있습니다.

ORM이 비슷한 해결 방법을 제공하지 않는 경우 직접 래퍼 타입을 정의할 수 있습니다:

```typescript
/**
 * 속성 타입을 저장하는 리플렉션 메타데이터로 인해 발생하는
 * ESM 모듈 순환 종속성 문제를 해결하기 위한 래퍼 타입.
 */
export type WrapperType<T> = T; // WrapperType === Relation
```

프로젝트의 모든 [순환 종속성 주입](/fundamentals/circular-dependency)에 대해 위에서 설명한 사용자 정의 래퍼 타입을 사용해야 합니다:

```typescript
@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => ProfileService))
    private readonly profileService: WrapperType<ProfileService>,
  ) {};
}
```

### Jest + SWC

Jest와 함께 SWC를 사용하려면 다음 패키지를 설치해야 합니다:

```bash
$ npm i --save-dev jest @swc/core @swc/jest
```

설치가 완료되면 (설정에 따라) `package.json`/`jest.config.js` 파일을 다음 내용으로 업데이트합니다:

```json
{
  "jest": {
    "transform": {
      "^.+\\.(t|j)s?$": ["@swc/jest"]
    }
  }
}
```

추가적으로 `.swcrc` 파일에 다음과 같은 `transform` 속성인 `legacyDecorator`, `decoratorMetadata`를 추가해야 합니다:

```json
{
  "$schema": "https://swc.rs/schema.json",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "legacyDecorator": true,
      "decoratorMetadata": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
```

프로젝트에서 NestJS CLI 플러그인을 사용하는 경우 `PluginMetadataGenerator`를 수동으로 실행해야 합니다. 자세한 내용은 [이 섹션](/recipes/swc#monorepo-and-cli-plugins)을 참조하십시오.

### Vitest

[Vitest](https://vitest.dev/)는 Vite와 함께 작동하도록 설계된 빠르고 가벼운 테스트 러너입니다. NestJS 프로젝트와 통합할 수 있는 현대적이고 빠르며 사용하기 쉬운 테스트 솔루션을 제공합니다.

#### 설치

시작하려면 먼저 필요한 패키지를 설치합니다:

```bash
$ npm i --save-dev vitest unplugin-swc @swc/core @vitest/coverage-v8
```

#### 설정

애플리케이션의 루트 디렉토리에 다음 내용을 가진 `vitest.config.ts` 파일을 생성합니다:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
  },
  plugins: [
    // SWC로 테스트 파일을 빌드하는 데 필요합니다.
    swc.vite({
      // `.swcrc` 구성 파일에서 이 값을 상속받지 않도록 모듈 타입을 명시적으로 설정합니다.
      module: { type: 'es6' },
    }),
  ],
  resolve: {
    alias: {
      // Vitest가 TypeScript 경로 별칭을 올바르게 해석하도록 확인합니다.
      'src': resolve(__dirname, './src'),
    },
  },
});
```

이 구성 파일은 Vitest 환경, 루트 디렉토리 및 SWC 플러그인을 설정합니다. 또한 테스트 경로 정규식을 지정하는 추가 `include` 필드가 있는 e2e 테스트를 위한 별도의 구성 파일을 생성해야 합니다:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
  },
  plugins: [swc.vite()],
});
```

추가적으로 `alias` 옵션을 설정하여 테스트에서 TypeScript 경로를 지원할 수 있습니다:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    alias: {
      '@src': './src',
      '@test': './test',
    },
    root: './',
  },
  resolve: {
    alias: {
      '@src': './src',
      '@test': './test',
    },
  },
  plugins: [swc.vite()],
});
```

### 경로 별칭

Jest와 달리 Vitest는 `src/`와 같은 TypeScript 경로 별칭을 자동으로 해결하지 않습니다. 이로 인해 테스트 중에 종속성 해결 오류가 발생할 수 있습니다. 이 문제를 해결하려면 `vitest.config.ts` 파일에 다음과 같은 `resolve.alias` 구성을 추가합니다:

```ts
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'src': resolve(__dirname, './src'),
    },
  },
});
```
이렇게 하면 Vitest가 모듈 가져오기를 올바르게 해결하여 누락된 종속성 관련 오류를 방지할 수 있습니다.

#### E2E 테스트에서 가져오기 업데이트

E2E 테스트에서 `import * as request from 'supertest'`를 사용하는 모든 가져오기를 `import request from 'supertest'`로 변경합니다. 이는 Vite와 번들링된 Vitest가 supertest에 대한 기본 가져오기를 기대하기 때문에 필요합니다. 네임스페이스 가져오기를 사용하면 이 특정 설정에서 문제가 발생할 수 있습니다.

마지막으로 package.json 파일의 테스트 스크립트를 다음과 같이 업데이트합니다:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:debug": "vitest --inspect-brk --inspect --logHeapUsage --threads=false",
    "test:e2e": "vitest run --config ./vitest.config.e2e.ts"
  }
}
```

이 스크립트는 테스트 실행, 변경 감시, 코드 커버리지 보고서 생성 및 디버깅을 위해 Vitest를 구성합니다. test:e2e 스크립트는 사용자 정의 구성 파일로 E2E 테스트를 실행하는 데 특화되어 있습니다.

이 설정을 통해 이제 NestJS 프로젝트에서 Vitest를 사용하는 이점을 누릴 수 있으며, 여기에는 더 빠른 테스트 실행과 보다 현대적인 테스트 경험이 포함됩니다.

> info **힌트** 이 [리포지토리](https://github.com/TrilonIO/nest-vitest)에서 작동하는 예제를 확인하실 수 있습니다.