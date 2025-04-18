### CLI 플러그인

[TypeScript](https://www.typescriptlang.org/docs/handbook/decorators.html)의 메타데이터 리플렉션 시스템은 클래스가 어떤 속성으로 구성되어 있는지 결정하거나 주어진 속성이 선택 사항인지 필수 사항인지 인식하는 것과 같은 작업을 불가능하게 만드는 몇 가지 제한 사항이 있습니다. 그러나 이러한 제약 조건 중 일부는 컴파일 시점에 해결할 수 있습니다. Nest는 필요한 상용구 코드의 양을 줄이기 위해 TypeScript 컴파일 프로세스를 향상시키는 플러그인을 제공합니다.

> info **힌트** 이 플러그인은 **옵트인(opt-in)** 방식입니다. 원한다면 모든 데코레이터를 수동으로 선언하거나 필요한 특정 데코레이터만 선언할 수 있습니다.

#### 개요

Swagger 플러그인은 자동으로 다음을 수행합니다.

- `@ApiHideProperty`가 사용되지 않는 한 모든 DTO 속성에 `@ApiProperty`를 어노테이션합니다.
- 물음표(예: `name?: string`은 `required: false`로 설정)에 따라 `required` 속성을 설정합니다.
- 타입에 따라 `type` 또는 `enum` 속성을 설정합니다(배열도 지원).
- 할당된 기본값에 따라 `default` 속성을 설정합니다.
- `class-validator` 데코레이터에 따라 여러 유효성 검사 규칙을 설정합니다 (`classValidatorShim`이 `true`로 설정된 경우).
- 적절한 상태와 `type`(응답 모델)을 가진 응답 데코레이터를 모든 엔드포인트에 추가합니다.
- 주석을 기반으로 속성 및 엔드포인트에 대한 설명을 생성합니다 (`introspectComments`가 `true`로 설정된 경우).
- 주석을 기반으로 속성에 대한 예제 값을 생성합니다 (`introspectComments`가 `true`로 설정된 경우).

플러그인에 의해 분석되려면 파일 이름에 다음 접미사 중 하나(`['.dto.ts', '.entity.ts']`)가 **반드시 포함되어야 합니다**. (예: `create-user.dto.ts`).

다른 접미사를 사용하는 경우, `dtoFileNameSuffix` 옵션을 지정하여 플러그인 동작을 조정할 수 있습니다(아래 참조).

이전에는 Swagger UI와 상호작용적인 경험을 제공하기 위해
패키지가 사양에서 모델/컴포넌트를 어떻게 선언해야 하는지 알리기 위해 많은 코드를 중복해서 작성해야 했습니다. 예를 들어, 간단한 `CreateUserDto` 클래스를 다음과 같이 정의할 수 있었습니다.

```typescript
export class CreateUserDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiProperty({ enum: RoleEnum, default: [], isArray: true })
  roles: RoleEnum[] = [];

  @ApiProperty({ required: false, default: true })
  isEnabled?: boolean = true;
}
```

중형 프로젝트에서는 큰 문제가 아니지만, 클래스 세트가 많아지면 장황해지고 유지 관리가 어려워집니다.

[Swagger 플러그인을 활성화](/openapi/cli-plugin#using-the-cli-plugin)하면 위의 클래스 정의를 간단히 다음과 같이 선언할 수 있습니다.

```typescript
export class CreateUserDto {
  email: string;
  password: string;
  roles: RoleEnum[] = [];
  isEnabled?: boolean = true;
}
```

> info **참고** Swagger 플러그인은 TypeScript 타입 및 class-validator 데코레이터에서 @ApiProperty() 어노테이션을 파생합니다. 이는 생성된 Swagger UI 문서에 대한 API를 명확하게 설명하는 데 도움이 됩니다. 그러나 런타임 시 유효성 검사는 여전히 class-validator 데코레이터에 의해 처리됩니다. 따라서 `IsEmail()`, `IsNumber()` 등과 같은 유효성 검사기를 계속 사용하는 것이 필요합니다.

따라서 문서 생성을 위한 자동 어노테이션에 의존하면서도 런타임 유효성 검사를 원한다면 class-validator 데코레이터가 여전히 필요합니다.

> info **힌트** DTO에서 [`mapped types utilities`](https://docs.nestjs.com/openapi/mapped-types) (예: `PartialType`)를 사용할 때는 플러그인이 스키마를 인식하도록 `@nestjs/mapped-types` 대신 `@nestjs/swagger`에서 가져옵니다.

플러그인은 **추상 구문 트리(Abstract Syntax Tree)**를 기반으로 적절한 데코레이터를 즉석에서 추가합니다. 따라서 코드 전체에 흩어져 있는 `@ApiProperty` 데코레이터로 고생할 필요가 없습니다.

> info **힌트** 플러그인은 누락된 모든 swagger 속성을 자동으로 생성하지만, 재정의해야 하는 경우 `@ApiProperty()`를 통해 명시적으로 설정하면 됩니다.

#### 주석 내부 탐색 (Comments introspection)

주석 내부 탐색 기능이 활성화되면 CLI 플러그인은 주석을 기반으로 속성에 대한 설명과 예제 값을 생성합니다.

예를 들어, `roles` 속성의 예시를 고려해 보겠습니다:

```typescript
/**
 * A list of user's roles
 * @example ['admin']
 */
@ApiProperty({
  description: `A list of user's roles`,
  example: ['admin'],
})
roles: RoleEnum[] = [];
```

설명과 예제 값을 모두 중복해야 합니다. `introspectComments`가 활성화되면 CLI 플러그인이 이러한 주석을 추출하여 속성에 대한 설명(및 정의된 경우 예제)을 자동으로 제공할 수 있습니다. 이제 위 속성은 단순히 다음과 같이 선언될 수 있습니다:

```typescript
/**
 * A list of user's roles
 * @example ['admin']
 */
roles: RoleEnum[] = [];
```

플러그인이 `ApiProperty` 및 `ApiOperation` 데코레이터에 값을 할당하는 방식을 사용자 정의할 수 있는 `dtoKeyOfComment` 및 `controllerKeyOfComment` 플러그인 옵션이 있습니다. 아래 예시를 참고하십시오:

```typescript
export class SomeController {
  /**
   * Create some resource
   */
  @Post()
  create() {}
}
```

이는 다음 지시사항과 동일합니다:

```typescript
@ApiOperation({ summary: "Create some resource" })
```

> info **힌트** 모델의 경우 동일한 논리가 적용되지만 `ApiProperty` 데코레이터와 함께 사용됩니다.

컨트롤러의 경우, 요약뿐만 아니라 설명(remarks), 태그(예: `@deprecated`), 응답 예제 등을 제공할 수 있습니다:

```ts
/**
 * Create a new cat
 *
 * @remarks This operation allows you to create a new cat.
 *
 * @deprecated
 * @throws {500} Something went wrong.
 * @throws {400} Bad Request.
 */
@Post()
async create(): Promise<Cat> {}
```

#### CLI 플러그인 사용하기

플러그인을 활성화하려면 `nest-cli.json`을 열고(Nest CLI를 사용하는 경우](/cli/overview)) 다음 `plugins` 구성을 추가합니다:

```javascript
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": ["@nestjs/swagger"]
  }
}
```

`options` 속성을 사용하여 플러그인의 동작을 사용자 정의할 수 있습니다.

```javascript
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": false,
          "introspectComments": true,
          "skipAutoHttpCode": true
        }
      }
    ]
  }
}
```

`options` 속성은 다음 인터페이스를 만족해야 합니다:

```typescript
export interface PluginOptions {
  dtoFileNameSuffix?: string[];
  controllerFileNameSuffix?: string[];
  classValidatorShim?: boolean;
  dtoKeyOfComment?: string;
  controllerKeyOfComment?: string;
  introspectComments?: boolean;
  skipAutoHttpCode?: boolean;
  esmCompatible?: boolean;
}
```

<table>
  <tr>
    <th>옵션</th>
    <th>기본값</th>
    <th>설명</th>
  </tr>
  <tr>
    <td><code>dtoFileNameSuffix</code></td>
    <td><code>['.dto.ts', '.entity.ts']</code></td>
    <td>DTO(Data Transfer Object) 파일 접미사</td>
  </tr>
  <tr>
    <td><code>controllerFileNameSuffix</code></td>
    <td><code>.controller.ts</code></td>
    <td>컨트롤러 파일 접미사</td>
  </tr>
  <tr>
    <td><code>classValidatorShim</code></td>
    <td><code>true</code></td>
    <td>true로 설정하면 모듈은 <code>class-validator</code> 유효성 검사 데코레이터(예: <code>@Max(10)</code>는 스키마 정의에 <code>max: 10</code> 추가)를 재사용합니다.</td>
  </tr>
  <tr>
    <td><code>dtoKeyOfComment</code></td>
    <td><code>'description'</code></td>
    <td><code>ApiProperty</code>에 주석 텍스트를 설정할 속성 키.</td>
  </tr>
  <tr>
    <td><code>controllerKeyOfComment</code></td>
    <td><code>'summary'</code></td>
    <td><code>ApiOperation</code>에 주석 텍스트를 설정할 속성 키.</td>
  </tr>
  <tr>
    <td><code>introspectComments</code></td>
    <td><code>false</code></td>
    <td>true로 설정하면 플러그인은 주석을 기반으로 속성에 대한 설명과 예제 값을 생성합니다.</td>
  </tr>
  <tr>
    <td><code>skipAutoHttpCode</code></td>
    <td><code>false</code></td>
    <td>컨트롤러에서 <code>@HttpCode()</code>의 자동 추가를 비활성화합니다.</td>
  </tr>
  <tr>
    <td><code>esmCompatible</code></td>
    <td><code>false</code></td>
    <td>true로 설정하면 ESM (<code>&#123; "type": "module" &#125;</code>) 사용 시 발생하는 구문 오류를 해결합니다.</td>
  </tr>
</table>

플러그인 옵션이 업데이트될 때마다 `/dist` 폴더를 삭제하고 애플리케이션을 다시 빌드해야 합니다.
CLI를 사용하지 않고 커스텀 `webpack` 구성을 사용하는 경우, `ts-loader`와 함께 이 플러그인을 사용할 수 있습니다:

```javascript
getCustomTransformers: (program: any) => ({
  before: [require('@nestjs/swagger/plugin').before({}, program)]
}),
```

#### SWC 빌더

표준 설정(모노레포가 아닌 경우)에서 SWC 빌더와 함께 CLI 플러그인을 사용하려면 [여기](/recipes/swc#type-checking)에 설명된 대로 타입 검사를 활성화해야 합니다.

```bash
$ nest start -b swc --type-check
```

모노레포 설정의 경우, [여기](/recipes/swc#monorepo-and-cli-plugins) 지침을 따릅니다.

```bash
$ npx ts-node src/generate-metadata.ts
# 또는 npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
```

이제 직렬화된 메타데이터 파일은 다음과 같이 `SwaggerModule#loadPluginMetadata` 메소드에 의해 로드되어야 합니다:

```typescript
import metadata from './metadata'; // <-- "PluginMetadataGenerator"에 의해 자동 생성된 파일

await SwaggerModule.loadPluginMetadata(metadata); // <-- 여기
const document = SwaggerModule.createDocument(app, config);
```

#### `ts-jest` (e2e 테스트)와의 통합

e2e 테스트를 실행하기 위해 `ts-jest`는 소스 코드 파일을 즉석에서, 메모리 상에서 컴파일합니다. 이는 Nest CLI 컴파일러를 사용하지 않으며 플러그인을 적용하거나 AST 변환을 수행하지 않음을 의미합니다.

플러그인을 활성화하려면 e2e 테스트 디렉토리에 다음 파일을 생성합니다:

```javascript
const transformer = require('@nestjs/swagger/plugin');

module.exports.name = 'nestjs-swagger-transformer';
// 아래 구성을 변경할 때마다 버전 번호를 변경해야 합니다 - 그렇지 않으면 jest가 변경 사항을 감지하지 못합니다
module.exports.version = 1;

module.exports.factory = (cs) => {
  return transformer.before(
    {
      // @nestjs/swagger/plugin 옵션 (비어 있을 수 있음)
    },
    cs.program, // 이전 버전의 Jest (<= v27)에서는 "cs.tsCompiler.program"
  );
};
```

이를 적용한 후, `jest` 구성 파일 내에서 AST 트랜스포머를 임포트합니다. 기본적으로(starter 애플리케이션에서), e2e 테스트 구성 파일은 `test` 폴더 아래에 있으며 `jest-e2e.json`이라는 이름으로 되어 있습니다.

`jest@<29`를 사용하는 경우, 아래 스니펫을 사용합니다.

```json
{
  ... // 다른 구성
  "globals": {
    "ts-jest": {
      "astTransformers": {
        "before": ["<위에서 생성한 파일의 경로>"]
      }
    }
  }
}
```

`jest@^29`를 사용하는 경우, 이전 접근 방식이 더 이상 사용되지 않으므로 아래 스니펫을 사용합니다.

```json
{
  ... // 다른 구성
  "transform": {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        "astTransformers": {
          "before": ["<위에서 생성한 파일의 경로>"]
        }
      }
    ]
  }
}
```

#### `jest` (e2e 테스트) 문제 해결

`jest`가 구성 변경을 제대로 인식하지 못하는 경우, Jest가 빌드 결과를 **캐싱**했을 가능성이 있습니다. 새 구성을 적용하려면 Jest의 캐시 디렉토리를 지워야 합니다.

캐시 디렉토리를 지우려면 NestJS 프로젝트 폴더에서 다음 명령을 실행합니다:

```bash
$ npx jest --clearCache
```

자동 캐시 정리가 실패하는 경우에도 다음 명령으로 캐시 폴더를 수동으로 제거할 수 있습니다:

```bash
# Jest 캐시 디렉토리 찾기 (보통 /tmp/jest_rs)
# NestJS 프로젝트 루트에서 다음 명령을 실행하여 찾습니다
$ npx jest --showConfig | grep cache
# 예시 결과:
#   "cache": true,
#   "cacheDirectory": "/tmp/jest_rs"

# Jest 캐시 디렉토리 제거 또는 비우기
$ rm -rf  <cacheDirectory value>
# 예시:
# rm -rf /tmp/jest_rs
```
