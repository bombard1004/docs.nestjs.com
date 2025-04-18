### CLI 플러그인

> warning **경고** 이 챕터는 코드 우선 접근 방식에만 해당됩니다.

TypeScript의 메타데이터 리플렉션 시스템에는 몇 가지 제한 사항이 있어, 예를 들어 클래스가 어떤 속성으로 구성되어 있는지 파악하거나 주어진 속성이 선택 사항인지 필수인지 인식하는 것이 불가능합니다. 그러나 이러한 제약 사항 중 일부는 컴파일 시점에 해결될 수 있습니다. Nest는 필요한 상용구 코드의 양을 줄이기 위해 TypeScript 컴파일 프로세스를 개선하는 플러그인을 제공합니다.

> info **팁** 이 플러그인은 **선택 사항**입니다. 원한다면 모든 데코레이터를 수동으로 선언하거나 필요한 특정 데코레이터만 선언할 수 있습니다.

#### 개요

GraphQL 플러그인은 자동으로 다음을 수행합니다:

- `@HideField`를 사용하지 않는 한 모든 입력 객체, 객체 타입 및 `args` 클래스 속성에 `@Field`를 추가합니다.
- 물음표(예: `name?: string`는 `nullable: true`로 설정)에 따라 `nullable` 속성을 설정합니다.
- 타입에 따라 `type` 속성을 설정합니다(배열도 지원).
- 주석에 기반하여 속성에 대한 설명을 생성합니다 (`introspectComments`가 `true`로 설정된 경우).

플러그인이 분석할 수 있도록 파일 이름은 다음 접미사 중 하나를 **반드시 가져야 합니다**: `['.input.ts', '.args.ts', '.entity.ts', '.model.ts']` (예: `author.entity.ts`). 다른 접미사를 사용하는 경우, `typeFileNameSuffix` 옵션을 지정하여 플러그인의 동작을 조정할 수 있습니다 (아래 참조).

지금까지 배운 내용을 바탕으로, 타입이 GraphQL에서 어떻게 선언되어야 하는지를 패키지에 알리기 위해 많은 코드를 중복해야 합니다. 예를 들어, 간단한 `Author` 클래스를 다음과 같이 정의할 수 있습니다:

```typescript
@@filename(authors/models/author.model)
@ObjectType()
export class Author {
  @Field(type => ID)
  id: number;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field(type => [Post])
  posts: Post[];
}
```

중규모 프로젝트에서는 큰 문제가 아니지만, 클래스 집합이 많아지면 장황해지고 유지 관리가 어려워집니다.

GraphQL 플러그인을 활성화하면 위 클래스 정의는 단순히 다음과 같이 선언될 수 있습니다:

```typescript
@@filename(authors/models/author.model)
@ObjectType()
export class Author {
  @Field(type => ID)
  id: number;
  firstName?: string;
  lastName?: string;
  posts: Post[];
}
```

이 플러그인은 **추상 구문 트리(Abstract Syntax Tree)**에 기반하여 적절한 데코레이터를 즉석에서 추가합니다. 따라서 코드 전체에 흩어져 있는 `@Field` 데코레이터와 씨름할 필요가 없습니다.

> info **팁** 플러그인은 누락된 GraphQL 속성을 자동으로 생성하지만, 이를 오버라이드해야 하는 경우 `@Field()`를 통해 명시적으로 설정하면 됩니다.

#### 주석 인트로스펙션

주석 인트로스펙션 기능을 활성화하면 CLI 플러그인은 주석에 기반하여 필드에 대한 설명을 생성합니다.

예를 들어, `roles` 속성의 예시입니다:

```typescript
/**
 * A list of user's roles
 */
@Field(() => [String], {
  description: `A list of user's roles`
})
roles: string[];
```

설명 값을 중복해야 합니다. `introspectComments`가 활성화되면 CLI 플러그인이 이러한 주석을 추출하여 속성에 대한 설명을 자동으로 제공할 수 있습니다. 이제 위의 필드는 다음과 같이 간단히 선언할 수 있습니다:

```typescript
/**
 * A list of user's roles
 */
roles: string[];
```

#### CLI 플러그인 사용

플러그인을 활성화하려면 `nest-cli.json` ([Nest CLI](/cli/overview)를 사용하는 경우)을 열고 다음 `plugins` 구성을 추가합니다:

```javascript
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": ["@nestjs/graphql"]
  }
}
```

`options` 속성을 사용하여 플러그인의 동작을 사용자 지정할 수 있습니다.

```javascript
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/graphql",
        "options": {
          "typeFileNameSuffix": [".input.ts", ".args.ts"],
          "introspectComments": true
        }
      }
    ]
  }
}

```

`options` 속성은 다음 인터페이스를 만족해야 합니다:

```typescript
export interface PluginOptions {
  typeFileNameSuffix?: string[];
  introspectComments?: boolean;
}
```

<table>
  <tr>
    <th>옵션</th>
    <th>기본값</th>
    <th>설명</th>
  </tr>
  <tr>
    <td><code>typeFileNameSuffix</code></td>
    <td><code>['.input.ts', '.args.ts', '.entity.ts', '.model.ts']</code></td>
    <td>GraphQL 타입 파일 접미사</td>
  </tr>
  <tr>
    <td><code>introspectComments</code></td>
      <td><code>false</code></td>
      <td>true로 설정하면 플러그인이 주석에 기반하여 속성 설명을 생성합니다.</td>
  </tr>
</table>

CLI를 사용하지 않고 사용자 지정 `webpack` 구성을 사용하는 경우, `ts-loader`와 함께 이 플러그인을 사용할 수 있습니다:

```javascript
getCustomTransformers: (program: any) => ({
  before: [require('@nestjs/graphql/plugin').before({}, program)]
}),
```

#### SWC 빌더

표준 설정(모노레포가 아닌 경우)에서 SWC 빌더와 함께 CLI 플러그인을 사용하려면 [여기](/recipes/swc#type-checking)에 설명된 대로 타입 검사를 활성화해야 합니다.

```bash
$ nest start -b swc --type-check
```

모노레포 설정의 경우, [여기](/recipes/swc#monorepo-and-cli-plugins)의 지침을 따르십시오.

```bash
$ npx ts-node src/generate-metadata.ts
# 또는 npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
```

이제 직렬화된 메타데이터 파일은 아래와 같이 `GraphQLModule` 메서드로 로드되어야 합니다:

```typescript
import metadata from './metadata'; // <-- "PluginMetadataGenerator"에 의해 자동 생성된 파일

GraphQLModule.forRoot<...>({
  ..., // 다른 옵션들
  metadata,
}),
```

#### `ts-jest`와의 통합 (e2e 테스트)

이 플러그인이 활성화된 상태에서 e2e 테스트를 실행하면 스키마 컴파일에 문제가 발생할 수 있습니다. 예를 들어, 가장 흔한 오류 중 하나는 다음과 같습니다:

```json
Object type <name> must define one or more fields.
```

이는 `jest` 설정에서 `@nestjs/graphql/plugin` 플러그인을 어디에서도 가져오지 않기 때문에 발생합니다.

이 문제를 해결하려면 e2e 테스트 디렉토리에 다음 파일을 생성합니다:

```javascript
const transformer = require('@nestjs/graphql/plugin');

module.exports.name = 'nestjs-graphql-transformer';
// 아래 설정을 변경할 때마다 버전 번호를 변경해야 합니다. 그렇지 않으면 jest가 변경 사항을 감지하지 못합니다.
module.exports.version = 1;

module.exports.factory = (cs) => {
  return transformer.before(
    {
      // @nestjs/graphql/plugin 옵션 (비어 있을 수 있습니다)
    },
    cs.program, // 이전 버전의 Jest (<= v27)에서는 "cs.tsCompiler.program"
  );
};
```

이 파일을 준비한 후, `jest` 설정 파일 내에서 AST 트랜스포머를 가져옵니다. 기본적으로 (스타터 애플리케이션에서) e2e 테스트 설정 파일은 `test` 폴더 아래에 있으며 `jest-e2e.json`으로 명명되어 있습니다.

```json
{
  ... // 다른 설정
  "globals": {
    "ts-jest": {
      "astTransformers": {
        "before": ["<위에서 생성한 파일의 경로>"]
      }
    }
  }
}
```

`jest@^29`를 사용하는 경우, 이전 접근 방식이 더 이상 사용되지 않으므로 아래 스니펫을 사용하십시오.

```json
{
  ... // 다른 설정
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