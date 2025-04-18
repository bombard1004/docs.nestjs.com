### 구성 (Configuration)

애플리케이션은 종종 다양한 **환경**에서 실행됩니다. 환경에 따라 다른 구성 설정이 사용되어야 합니다. 예를 들어, 일반적으로 로컬 환경은 로컬 DB 인스턴스에서만 유효한 특정 데이터베이스 자격 증명에 의존합니다. 운영 환경에서는 별도의 DB 자격 증명 세트를 사용할 것입니다. 구성 변수는 변경되므로, 구성 변수를 [환경에 저장](https://12factor.net/config)하는 것이 가장 좋은 방법입니다.

외부에서 정의된 환경 변수는 Node.js 내부에서 `process.env` 전역을 통해 볼 수 있습니다. 각 환경에서 환경 변수를 별도로 설정하여 여러 환경 문제를 해결하려고 시도할 수 있습니다. 이는 특히 개발 및 테스트 환경에서 이러한 값을 쉽게 모의하거나 변경해야 할 때 빠르게 다루기 어려워질 수 있습니다.

Node.js 애플리케이션에서는 `.env` 파일을 사용하여 각 환경을 나타내는 데, 각 키가 특정 값을 나타내는 키-값 쌍을 저장하는 것이 일반적입니다. 다른 환경에서 앱을 실행하는 것은 올바른 `.env` 파일로 바꾸기만 하면 됩니다.

Nest에서 이 기술을 사용하는 좋은 접근 방식은 적절한 `.env` 파일을 로드하는 `ConfigService`를 노출하는 `ConfigModule`을 만드는 것입니다. 이러한 모듈을 직접 작성할 수도 있지만, 편의를 위해 Nest는 즉시 사용할 수 있는 `@nestjs/config` 패키지를 제공합니다. 이번 장에서는 이 패키지에 대해 다룰 것입니다.

#### 설치 (Installation)

사용을 시작하려면 먼저 필요한 종속성을 설치해야 합니다.

```bash
$ npm i --save @nestjs/config
```

> info **힌트** `@nestjs/config` 패키지는 내부적으로 [dotenv](https://github.com/motdotla/dotenv)를 사용합니다.

> warning **참고** `@nestjs/config`는 TypeScript 4.1 이상이 필요합니다.

#### 시작하기 (Getting started)

설치 프로세스가 완료되면 `ConfigModule`을 가져올 수 있습니다. 일반적으로 루트 `AppModule`로 가져와서 `.forRoot()` 정적 메서드를 사용하여 동작을 제어합니다. 이 단계에서 환경 변수 키/값 쌍이 구문 분석되고 해결됩니다. 나중에 다른 기능 모듈에서 `ConfigModule`의 `ConfigService` 클래스에 접근하는 여러 옵션을 살펴보겠습니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

위 코드는 기본 위치(프로젝트 루트 디렉토리)에서 `.env` 파일을 로드하고 구문 분석하며, `.env` 파일의 키/값 쌍을 `process.env`에 할당된 환경 변수와 병합하고, 구문 분석/병합된 구성 변수를 읽기 위한 `get()` 메서드를 제공하는 `ConfigService` 공급자를 등록하는 비공개 구조에 결과를 저장합니다. `@nestjs/config`는 [dotenv](https://github.com/motdotla/dotenv)에 의존하므로, 환경 변수 이름 충돌을 해결하는 데 해당 패키지의 규칙을 사용합니다. 런타임 환경에서 환경 변수로 (예: `export DATABASE_USER=test`와 같은 OS 쉘 내보내기를 통해) 그리고 `.env` 파일 모두에 키가 존재하면 런타임 환경 변수가 우선합니다.

샘플 `.env` 파일은 다음과 같습니다.

```json
DATABASE_USER=test
DATABASE_PASSWORD=test
```

일부 환경 변수를 `ConfigModule`이 로드되고 Nest 애플리케이션이 부트스트랩되기 전에도 사용할 수 있도록 해야 하는 경우(예: 마이크로서비스 구성을 `NestFactory#createMicroservice` 메서드에 전달하기 위해), Nest CLI의 `--env-file` 옵션을 사용할 수 있습니다. 이 옵션을 사용하면 애플리케이션이 시작되기 전에 로드해야 하는 `.env` 파일의 경로를 지정할 수 있습니다. `--env-file` 플래그 지원은 Node v20에 도입되었습니다. 자세한 내용은 [문서](https://nodejs.org/dist/v20.18.1/docs/api/cli.html#--env-fileconfig)를 참조하십시오.

```bash
$ nest start --env-file .env
```

#### 사용자 지정 env 파일 경로 (Custom env file path)

기본적으로 패키지는 애플리케이션의 루트 디렉토리에서 `.env` 파일을 찾습니다. `.env` 파일의 다른 경로를 지정하려면 `forRoot()`에 전달하는 (선택 사항) 옵션 객체의 `envFilePath` 속성을 다음과 같이 설정하십시오.

```typescript
ConfigModule.forRoot({
  envFilePath: '.development.env',
});
```

다음과 같이 `.env` 파일에 대한 여러 경로를 지정할 수도 있습니다.

```typescript
ConfigModule.forRoot({
  envFilePath: ['.env.development.local', '.env.development'],
});
```

여러 파일에서 변수가 발견되면 첫 번째 파일이 우선합니다.

#### env 변수 로딩 비활성화 (Disable env variables loading)

`.env` 파일을 로드하고 싶지 않고, 대신 런타임 환경에서 환경 변수에 단순히 접근하고 싶다면 (예: `export DATABASE_USER=test`와 같은 OS 쉘 내보내기를 통해), 옵션 객체의 `ignoreEnvFile` 속성을 다음과 같이 `true`로 설정하십시오.

```typescript
ConfigModule.forRoot({
  ignoreEnvFile: true,
});
```

#### 모듈 전역 사용 (Use module globally)

다른 모듈에서 `ConfigModule`을 사용하려면 (다른 Nest 모듈과 마찬가지로) 가져와야 합니다. 또는 아래와 같이 옵션 객체의 `isGlobal` 속성을 `true`로 설정하여 [글로벌 모듈](https://nestjs.dokidocs.dev/modules#global-modules)로 선언하십시오. 이 경우 루트 모듈(예: `AppModule`)에서 로드된 후에는 다른 모듈에서 `ConfigModule`을 가져올 필요가 없습니다.

```typescript
ConfigModule.forRoot({
  isGlobal: true,
});
```

#### 사용자 지정 구성 파일 (Custom configuration files)

더 복잡한 프로젝트의 경우, 사용자 지정 구성 파일을 활용하여 중첩된 구성 객체를 반환할 수 있습니다. 이를 통해 기능별로 관련된 구성 설정(예: 데이터베이스 관련 설정)을 그룹화하고, 관련 설정을 개별 파일에 저장하여 독립적으로 관리하는 데 도움이 될 수 있습니다.

사용자 지정 구성 파일은 구성 객체를 반환하는 팩토리 함수를 내보냅니다. 구성 객체는 임의로 중첩된 일반 JavaScript 객체일 수 있습니다. `process.env` 객체는 완전히 해결된 환경 변수 키/값 쌍을 포함합니다 (위에서 설명한 것처럼 `.env` 파일 및 외부 정의 변수가 해결되고 병합됨). 반환된 구성 객체를 제어하기 때문에, 값을 적절한 유형으로 캐스팅하거나 기본 값을 설정하는 등 필요한 논리를 추가할 수 있습니다. 예를 들어:

```typescript
@@filename(config/configuration)
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432
  }
});
```

이 파일을 `ConfigModule.forRoot()` 메서드에 전달하는 옵션 객체의 `load` 속성을 사용하여 로드합니다.

```typescript
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
})
export class AppModule {}
```

> info **알림** `load` 속성에 할당된 값은 배열이므로 여러 구성 파일을 로드할 수 있습니다 (예: `load: [databaseConfig, authConfig]`)

사용자 지정 구성 파일을 사용하면 YAML 파일과 같은 사용자 지정 파일도 관리할 수 있습니다. YAML 형식의 구성 예시는 다음과 같습니다.

```yaml
http:
  host: 'localhost'
  port: 8080

db:
  postgres:
    url: 'localhost'
    port: 5432
    database: 'yaml-db'

  sqlite:
    database: 'sqlite.db'
```

YAML 파일을 읽고 구문 분석하려면 `js-yaml` 패키지를 활용할 수 있습니다.

```bash
$ npm i js-yaml
$ npm i -D @types/js-yaml
```

패키지가 설치되면 `yaml#load` 함수를 사용하여 방금 위에서 만든 YAML 파일을 로드합니다.

```typescript
@@filename(config/configuration)
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const YAML_CONFIG_FILENAME = 'config.yaml';

export default () => {
  return yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;
};
```

> warning **참고** Nest CLI는 빌드 프로세스 중에 "자산"(TypeScript가 아닌 파일)을 `dist` 폴더로 자동으로 이동하지 않습니다. YAML 파일이 복사되도록 하려면 `nest-cli.json` 파일의 `compilerOptions#assets` 객체에 이를 지정해야 합니다. 예를 들어, `config` 폴더가 `src` 폴더와 같은 레벨에 있다면, `"assets": [{{ '{' }}"include": "../config/*.yaml", "outDir": "./dist/config"{{ '}' }}]` 값을 갖는 `compilerOptions#assets`를 추가하십시오. 자세한 내용은 [여기](/cli/monorepo#assets)에서 읽어보십시오.

빠른 참고로, 구성 파일은 NestJS의 `ConfigModule`에서 `validationSchema` 옵션을 사용하더라도 자동으로 유효성 검사가 되지 않습니다. 유효성 검사가 필요하거나 변환을 적용하고 싶다면, 구성 객체를 완전히 제어할 수 있는 팩토리 함수 내에서 직접 처리해야 합니다. 이를 통해 필요한 모든 사용자 지정 유효성 검사 로직을 구현할 수 있습니다.

예를 들어, 포트가 특정 범위 내에 있는지 확인하려면 팩토리 함수에 유효성 검사 단계를 추가할 수 있습니다.

```typescript
@@filename(config/configuration)
export default () => {
  const config = yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;

  if (config.http.port < 1024 || config.http.port > 49151) {
    throw new Error('HTTP port must be between 1024 and 49151');
  }

  return config;
};
```

이제 포트가 지정된 범위를 벗어나면 애플리케이션 시작 시 오류가 발생합니다.

<app-banner-devtools></app-banner-devtools>

#### `ConfigService` 사용하기 (Using the `ConfigService`)

`ConfigService`에서 구성 값에 접근하려면 먼저 `ConfigService`를 주입해야 합니다. 다른 공급자와 마찬가지로, 이를 사용할 모듈로 포함하는 모듈인 `ConfigModule`을 가져와야 합니다 (단, `ConfigModule.forRoot()` 메서드에 전달되는 옵션 객체에서 `isGlobal` 속성을 `true`로 설정한 경우는 제외). 아래와 같이 기능 모듈로 가져옵니다.

```typescript
@@filename(feature.module)
@Module({
  imports: [ConfigModule],
  // ...
})
```

그런 다음 표준 생성자 주입을 사용하여 주입할 수 있습니다.

```typescript
constructor(private configService: ConfigService) {}
```

> info **힌트** `ConfigService`는 `@nestjs/config` 패키지에서 가져옵니다.

그리고 클래스에서 사용할 수 있습니다.

```typescript
// 환경 변수 가져오기
const dbUser = this.configService.get<string>('DATABASE_USER');

// 사용자 지정 구성 값 가져오기
const dbHost = this.configService.get<string>('database.host');
```

위에서 보여준 것처럼, `configService.get()` 메서드를 사용하여 변수 이름을 전달하여 간단한 환경 변수를 가져옵니다. 위에서 보여준 것처럼 타입을 전달하여 TypeScript 타입 힌트를 할 수 있습니다 (예: `get<string>(...)`). `get()` 메서드는 두 번째 예제에서 보여준 것처럼 <a href="techniques/configuration#custom-configuration-files">사용자 지정 구성 파일</a>을 통해 생성된 중첩된 사용자 지정 구성 객체를 탐색할 수도 있습니다.

인터페이스를 타입 힌트로 사용하여 전체 중첩된 사용자 지정 구성 객체를 가져올 수도 있습니다.

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
}

const dbConfig = this.configService.get<DatabaseConfig>('database');

// 이제 `dbConfig.port` 및 `dbConfig.host`를 사용할 수 있습니다.
const port = dbConfig.port;
```

`get()` 메서드는 선택 사항으로 두 번째 인수를 받는데, 이는 키가 존재하지 않을 때 반환될 기본 값을 정의합니다. 아래와 같습니다.

```typescript
// "database.host"가 정의되지 않았을 때 "localhost" 사용
const dbHost = this.configService.get<string>('database.host', 'localhost');
```

`ConfigService`에는 두 개의 선택 사항 제네릭(타입 인수)이 있습니다. 첫 번째 제네릭은 존재하지 않는 구성 속성에 접근하는 것을 방지하는 데 도움이 됩니다. 아래와 같이 사용하십시오.

```typescript
interface EnvironmentVariables {
  PORT: number;
  TIMEOUT: string;
}

// 코드의 어딘가
constructor(private configService: ConfigService<EnvironmentVariables>) {
  const port = this.configService.get('PORT', { infer: true });

  // TypeScript 오류: URL 속성은 EnvironmentVariables에 정의되어 있지 않으므로 유효하지 않습니다.
  const url = this.configService.get('URL', { infer: true });
}
```

`infer` 속성을 `true`로 설정하면, `ConfigService#get` 메서드는 인터페이스를 기반으로 속성 타입을 자동으로 추론하므로, 예를 들어 `typeof port === "number"`가 됩니다 (`strictNullChecks` 플래그를 사용하지 않는 경우). `PORT`는 `EnvironmentVariables` 인터페이스에서 `number` 타입을 가지기 때문입니다.

또한 `infer` 기능을 사용하면 도트 표기법을 사용할 때에도 중첩된 사용자 지정 구성 객체의 속성 타입을 추론할 수 있습니다.

```typescript
constructor(private configService: ConfigService<{ database: { host: string } }>) {
  const dbHost = this.configService.get('database.host', { infer: true })!;
  // typeof dbHost === "string"                                          |
  //                                                                     +--> non-null assertion operator (non-null 단언 연산자)
}
```

두 번째 제네릭은 첫 번째 제네릭에 의존하며, `strictNullChecks`가 켜져 있을 때 `ConfigService`의 메서드가 반환할 수 있는 모든 `undefined` 타입을 제거하는 타입 단언 역할을 합니다. 예를 들어:

```typescript
// ...
constructor(private configService: ConfigService<{ PORT: number }, true>) {
  //                                                               ^^^^
  const port = this.configService.get('PORT', { infer: true });
  //    ^^^ port의 타입은 'number'가 되므로 더 이상 TS 타입 단언이 필요하지 않습니다.
}
```

> info **힌트** `ConfigService#get` 메서드가 사용자 지정 구성 파일에서만 값을 검색하고 `process.env` 변수를 무시하도록 하려면, `ConfigModule`의 `forRoot()` 메서드의 옵션 객체에서 `skipProcessEnv` 옵션을 `true`로 설정하십시오.

#### 구성 네임스페이스 (Configuration namespaces)

`ConfigModule`을 사용하면 위 <a href="techniques/configuration#custom-configuration-files">사용자 지정 구성 파일</a> 섹션에서 보여준 것처럼 여러 사용자 지정 구성 파일을 정의하고 로드할 수 있습니다. 해당 섹션에서 보여준 것처럼 중첩된 구성 객체를 사용하여 복잡한 구성 객체 계층 구조를 관리할 수 있습니다. 또는 다음과 같이 `registerAs()` 함수를 사용하여 "네임스페이스화된" 구성 객체를 반환할 수 있습니다.

```typescript
@@filename(config/database.config)
export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432
}));
```

사용자 지정 구성 파일과 마찬가지로, `registerAs()` 팩토리 함수 내부에서 `process.env` 객체는 완전히 해결된 환경 변수 키/값 쌍을 포함합니다 (위 <a href="techniques/configuration#getting-started">시작하기</a>에서 설명한 것처럼 `.env` 파일 및 외부 정의 변수가 해결되고 병합됨).

> info **힌트** `registerAs` 함수는 `@nestjs/config` 패키지에서 내보냅니다.

사용자 지정 구성 파일을 로드하는 것과 같은 방식으로 `forRoot()` 메서드의 옵션 객체의 `load` 속성을 사용하여 네임스페이스화된 구성을 로드합니다.

```typescript
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
    }),
  ],
})
export class AppModule {}
```

이제 `database` 네임스페이스에서 `host` 값을 얻으려면 도트 표기법을 사용하십시오. 네임스페이스의 이름( `registerAs()` 함수의 첫 번째 인수로 전달됨)에 해당하는 `'database'`를 속성 이름의 접두사로 사용합니다.

```typescript
const dbHost = this.configService.get<string>('database.host');
```

합리적인 대안은 `database` 네임스페이스를 직접 주입하는 것입니다. 이를 통해 강한 타이핑의 이점을 얻을 수 있습니다.

```typescript
constructor(
  @Inject(databaseConfig.KEY)
  private dbConfig: ConfigType<typeof databaseConfig>,
) {}
```

> info **힌트** `ConfigType`은 `@nestjs/config` 패키지에서 내보냅니다.

#### 모듈의 네임스페이스화된 구성 (Namespaced configurations in modules)

네임스페이스화된 구성을 애플리케이션의 다른 모듈에 대한 구성 객체로 사용하려면, 구성 객체의 `.asProvider()` 메서드를 활용할 수 있습니다. 이 메서드는 네임스페이스화된 구성을 공급자로 변환하며, 이 공급자는 사용하려는 모듈의 `forRootAsync()` (또는 동등한 메서드)에 전달될 수 있습니다.

다음은 예시입니다.

```typescript
import databaseConfig from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
  ],
})
```

`.asProvider()` 메서드가 어떻게 작동하는지 이해하기 위해 반환 값을 살펴보겠습니다.

```typescript
// .asProvider() 메서드의 반환 값
{
  imports: [ConfigModule.forFeature(databaseConfig)],
  useFactory: (configuration: ConfigType<typeof databaseConfig>) => configuration,
  inject: [databaseConfig.KEY]
}
```

이 구조를 통해 네임스페이스화된 구성을 모듈에 원활하게 통합하여 상용구 코드를 반복적으로 작성하지 않고도 애플리케이션이 체계적이고 모듈식으로 유지될 수 있도록 합니다.

#### 환경 변수 캐싱 (Cache environment variables)

`process.env`에 접근하는 것은 느릴 수 있으므로, `ConfigModule.forRoot()`에 전달되는 옵션 객체의 `cache` 속성을 설정하여 `process.env`에 저장된 변수에 대한 `ConfigService#get` 메서드의 성능을 향상시킬 수 있습니다.

```typescript
ConfigModule.forRoot({
  cache: true,
});
```

#### 부분 등록 (Partial registration)

지금까지 루트 모듈(예: `AppModule`)에서 `forRoot()` 메서드를 사용하여 구성 파일을 처리했습니다. 기능별 구성 파일이 여러 다른 디렉토리에 있는 더 복잡한 프로젝트 구조를 가질 수도 있습니다. 루트 모듈에서 이 모든 파일을 로드하는 대신, `@nestjs/config` 패키지는 각 기능 모듈과 관련된 구성 파일만 참조하는 **부분 등록**이라는 기능을 제공합니다. 기능 모듈 내에서 `forFeature()` 정적 메서드를 사용하여 다음과 같이 부분 등록을 수행합니다.

```typescript
import databaseConfig from './config/database.config';

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
})
export class DatabaseModule {}
```

> info **경고** 일부 상황에서는 생성자 대신 `onModuleInit()` 훅을 사용하여 부분 등록을 통해 로드된 속성에 접근해야 할 수 있습니다. 이는 `forFeature()` 메서드가 모듈 초기화 중에 실행되고 모듈 초기화 순서가 불확정적이기 때문입니다. 다른 모듈에서 이 방식으로 로드된 값을 생성자에서 접근하면, 구성에 의존하는 모듈이 아직 초기화되지 않았을 수 있습니다. `onModuleInit()` 메서드는 의존하는 모든 모듈이 초기화된 후에만 실행되므로 이 기술은 안전합니다.

#### 스키마 유효성 검사 (Schema validation)

필수 환경 변수가 제공되지 않았거나 특정 유효성 검사 규칙을 충족하지 않는 경우 애플리케이션 시작 중에 예외를 던지는 것이 일반적인 관행입니다. `@nestjs/config` 패키지는 이를 수행하는 두 가지 다른 방법을 제공합니다.

- [Joi](https://github.com/sideway/joi) 내장 유효성 검사기. Joi를 사용하면 객체 스키마를 정의하고 이를 기준으로 JavaScript 객체의 유효성을 검사합니다.
- 환경 변수를 입력으로 받는 사용자 지정 `validate()` 함수.

Joi를 사용하려면 Joi 패키지를 설치해야 합니다.

```bash
$ npm install --save joi
```

이제 Joi 유효성 검사 스키마를 정의하고 아래와 같이 `forRoot()` 메서드의 옵션 객체에 `validationSchema` 속성을 통해 전달할 수 있습니다.

```typescript
@@filename(app.module)
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().port().default(3000),
      }),
    }),
  ],
})
export class AppModule {}
```

기본적으로 모든 스키마 키는 선택 사항으로 간주됩니다. 여기서는 `NODE_ENV`와 `PORT`에 대한 기본 값을 설정했으며, 환경(`.env` 파일 또는 프로세스 환경)에서 이러한 변수를 제공하지 않으면 이 값이 사용됩니다. 또는 `required()` 유효성 검사 메서드를 사용하여 환경(`.env` 파일 또는 프로세스 환경)에 값이 정의되어야 한다고 요구할 수 있습니다. 이 경우, 환경에서 변수를 제공하지 않으면 유효성 검사 단계에서 예외가 발생합니다. 유효성 검사 스키마를 구성하는 방법에 대한 자세한 내용은 [Joi 유효성 검사 메서드](https://joi.dev/api/?v=17.3.0#example)를 참조하십시오.

기본적으로 알 수 없는 환경 변수 (스키마에 키가 없는 환경 변수)는 허용되며 유효성 검사 예외를 발생시키지 않습니다. 기본적으로 모든 유효성 검사 오류가 보고됩니다. `forRoot()` 옵션 객체의 `validationOptions` 키를 통해 옵션 객체를 전달하여 이러한 동작을 변경할 수 있습니다. 이 옵션 객체는 [Joi 유효성 검사 옵션](https://joi.dev/api/?v=17.3.0#anyvalidatevalue-options)에서 제공하는 모든 표준 유효성 검사 옵션 속성을 포함할 수 있습니다. 예를 들어, 위 두 설정을 반전하려면 다음과 같이 옵션을 전달합니다.

```typescript
@@filename(app.module)
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().port().default(3000),
      }),
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
  ],
})
export class AppModule {}
```

`@nestjs/config` 패키지는 다음의 기본 설정을 사용합니다.

- `allowUnknown`: 환경 변수에 알 수 없는 키를 허용할지 여부를 제어합니다. 기본값은 `true`입니다.
- `abortEarly`: `true`이면 첫 번째 오류에서 유효성 검사를 중지하고, `false`이면 모든 오류를 반환합니다. 기본값은 `false`입니다.

`validationOptions` 객체를 전달하기로 결정하면 명시적으로 전달하지 않는 모든 설정은 `Joi` 표준 기본값으로 재설정됩니다 (@nestjs/config 기본값이 아님). 예를 들어, 사용자 지정 `validationOptions` 객체에서 `allowUnknowns`를 지정하지 않으면 `Joi` 기본값인 `false`가 됩니다. 따라서 사용자 지정 객체에서 이 두 설정을 **모두** 지정하는 것이 가장 안전할 것입니다.

> info **힌트** 미리 정의된 환경 변수의 유효성 검사를 비활성화하려면 `forRoot()` 메서드의 옵션 객체에서 `validatePredefined` 속성을 `false`로 설정하십시오. 미리 정의된 환경 변수는 모듈이 가져오기 전에 설정된 프로세스 변수 (`process.env` 변수)입니다. 예를 들어, `PORT=3000 node main.js`로 애플리케이션을 시작하면 `PORT`는 미리 정의된 환경 변수입니다.

#### 사용자 지정 유효성 검사 함수 (Custom validate function)

또는 환경 변수(`env` 파일 및 프로세스에서 온 변수)를 포함하는 객체를 받아 유효성이 검사된 환경 변수를 포함하는 객체를 반환하는 **동기** `validate` 함수를 지정할 수 있습니다. 필요한 경우 변수를 변환/변경할 수 있습니다. 함수가 오류를 발생시키면 애플리케이션 부트스트랩이 방지됩니다.

이 예제에서는 `class-transformer` 및 `class-validator` 패키지를 사용합니다. 먼저 다음을 정의해야 합니다.

- 유효성 검사 제약 조건을 갖는 클래스
- `plainToInstance` 및 `validateSync` 함수를 사용하는 유효성 검사 함수

```typescript
@@filename(env.validation)
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, Max, Min, validateSync } from 'class-validator';

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
  Provision = "provision",
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
```

이를 적용한 후, `validate` 함수를 `ConfigModule`의 구성 옵션으로 다음과 같이 사용합니다.

```typescript
@@filename(app.module)
import { validate } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
    }),
  ],
})
export class AppModule {}
```

#### 사용자 지정 getter 함수 (Custom getter functions)

`ConfigService`는 키로 구성 값을 검색하기 위한 일반적인 `get()` 메서드를 정의합니다. 약간 더 자연스러운 코딩 스타일을 가능하게 하기 위해 `getter` 함수를 추가할 수도 있습니다.

```typescript
@@filename()
@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isAuthEnabled(): boolean {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
@@switch
@Dependencies(ConfigService)
@Injectable()
export class ApiConfigService {
  constructor(configService) {
    this.configService = configService;
  }

  get isAuthEnabled() {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
```

이제 다음과 같이 getter 함수를 사용할 수 있습니다.

```typescript
@@filename(app.service)
@Injectable()
export class AppService {
  constructor(apiConfigService: ApiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // Authentication is enabled (인증이 활성화됨)
    }
  }
}
@@switch
@Dependencies(ApiConfigService)
@Injectable()
export class AppService {
  constructor(apiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // Authentication is enabled (인증이 활성화됨)
    }
  }
}
```

#### 환경 변수 로드 훅 (Environment variables loaded hook)

모듈 구성이 환경 변수에 의존하고 이러한 변수가 `.env` 파일에서 로드되는 경우, `ConfigModule.envVariablesLoaded` 훅을 사용하여 `process.env` 객체와 상호 작용하기 전에 파일이 로드되었는지 확인할 수 있습니다. 다음 예시를 참조하십시오.

```typescript
export async function getStorageModule() {
  await ConfigModule.envVariablesLoaded;
  return process.env.STORAGE === 'S3' ? S3StorageModule : DefaultStorageModule;
}
```

이 구조는 `ConfigModule.envVariablesLoaded` Promise가 해결된 후에 모든 구성 변수가 로드되도록 보장합니다.

#### 조건부 모듈 구성 (Conditional module configuration)

모듈을 조건부로 로드하고 환경 변수에서 조건을 지정하고 싶을 때가 있을 수 있습니다. 다행히 `@nestjs/config`는 이를 가능하게 하는 `ConditionalModule`을 제공합니다.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    ConditionalModule.registerWhen(FooModule, 'USE_FOO'),
  ],
})
export class AppModule {}
```

위 모듈은 `.env` 파일에 `USE_FOO` 환경 변수에 `false` 값이 없는 경우에만 `FooModule`을 로드합니다. 사용자 지정 조건을 직접 전달할 수도 있습니다. 이는 `process.env` 참조를 받고 `ConditionalModule`이 처리할 boolean 값을 반환해야 하는 함수입니다.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    ConditionalModule.registerWhen(
      FooBarModule,
      (env: NodeJS.ProcessEnv) => !!env['foo'] && !!env['bar'],
    ),
  ],
})
export class AppModule {}
```

`ConditionalModule`을 사용할 때는 애플리케이션에 `ConfigModule`도 로드되어 있는지 확인하는 것이 중요합니다. 그래야 `ConfigModule.envVariablesLoaded` 훅을 올바르게 참조하고 활용할 수 있습니다. 훅이 5초 이내에 또는 `registerWhen` 메서드의 세 번째 옵션 매개변수에서 사용자가 설정한 밀리초 시간 초과 내에 true로 전환되지 않으면 `ConditionalModule`이 오류를 발생시키고 Nest는 애플리케이션 시작을 중단합니다.

#### 확장 가능한 변수 (Expandable variables)

`@nestjs/config` 패키지는 환경 변수 확장을 지원합니다. 이 기술을 사용하면 하나의 변수가 다른 변수의 정의 내에서 참조되는 중첩된 환경 변수를 만들 수 있습니다. 예를 들어:

```json
APP_URL=mywebsite.com
SUPPORT_EMAIL=support@${APP_URL}
```

이 구조를 사용하면 `SUPPORT_EMAIL` 변수가 `'support@mywebsite.com'`으로 해결됩니다. `SUPPORT_EMAIL` 정의 내부에서 `APP_URL` 변수의 값을 해결하기 위해 `${{ '{' }}...{{ '}' }}` 구문이 사용된 것에 주목하십시오.

> info **힌트** 이 기능을 위해 `@nestjs/config` 패키지는 내부적으로 [dotenv-expand](https://github.com/motdotla/dotenv-expand)를 사용합니다.

아래와 같이 `ConfigModule`의 `forRoot()` 메서드에 전달되는 옵션 객체에서 `expandVariables` 속성을 사용하여 환경 변수 확장을 활성화합니다.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ConfigModule.forRoot({
      // ...
      expandVariables: true,
    }),
  ],
})
export class AppModule {}
```

#### `main.ts`에서 사용하기 (Using in the `main.ts`)

구성이 서비스에 저장되지만, `main.ts` 파일에서도 사용할 수 있습니다. 이렇게 하면 애플리케이션 포트나 CORS 호스트와 같은 변수를 저장하는 데 사용할 수 있습니다.

접근하려면 `app.get()` 메서드를 사용한 다음 서비스 참조를 사용해야 합니다.

```typescript
const configService = app.get(ConfigService);
```

그런 다음 구성 키와 함께 `get` 메서드를 호출하여 평소처럼 사용할 수 있습니다.

```typescript
const port = configService.get('PORT');
```
