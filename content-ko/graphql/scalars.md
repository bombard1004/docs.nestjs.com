### 스칼라

GraphQL 객체 타입은 이름과 필드를 가지지만, 어느 시점에는 해당 필드가 구체적인 데이터로 확인(resolve)되어야 합니다. 이것이 스칼라 타입이 필요한 이유입니다. 스칼라 타입은 쿼리의 리프를 나타냅니다 ([여기](https://graphql.org/learn/schema/#scalar-types)에서 자세히 알아보세요). GraphQL에는 다음과 같은 기본 타입이 포함됩니다: `Int`, `Float`, `String`, `Boolean`, `ID`. 이러한 내장 타입 외에도, 사용자 정의 원자 데이터 타입(예: `Date`)을 지원해야 할 수 있습니다.

#### 코드 우선

코드 우선 접근 방식은 5개의 스칼라를 제공하며, 그 중 3개는 기존 GraphQL 타입의 간단한 별칭입니다.

- `ID` (`GraphQLID`의 별칭) - 고유 식별자를 나타내며, 종종 객체를 다시 가져오거나 캐시의 키로 사용됩니다.
- `Int` (`GraphQLInt`의 별칭) - 부호 있는 32비트 정수입니다.
- `Float` (`GraphQLFloat`의 별칭) - 부호 있는 배정밀도 부동 소수점 값입니다.
- `GraphQLISODateTime` - UTC의 날짜-시간 문자열입니다 (`Date` 타입을 나타내는 데 기본적으로 사용됩니다).
- `GraphQLTimestamp` - 유닉스 에포크 시작 이후 밀리초 단위로 날짜 및 시간을 나타내는 부호 있는 정수입니다.

`GraphQLISODateTime` (예: `2019-12-03T09:54:33Z`)은 `Date` 타입을 나타내는 데 기본적으로 사용됩니다. 대신 `GraphQLTimestamp`를 사용하려면 다음과 같이 `buildSchemaOptions` 객체의 `dateScalarMode`를 `'timestamp'`로 설정하세요.

```typescript
GraphQLModule.forRoot({
  buildSchemaOptions: {
    dateScalarMode: 'timestamp',
  }
}),
```

마찬가지로, `GraphQLFloat`는 `number` 타입을 나타내는 데 기본적으로 사용됩니다. 대신 `GraphQLInt`를 사용하려면 다음과 같이 `buildSchemaOptions` 객체의 `numberScalarMode`를 `'integer'`로 설정하세요.

```typescript
GraphQLModule.forRoot({
  buildSchemaOptions: {
    numberScalarMode: 'integer',
  }
}),
```

또한, 사용자 정의 스칼라를 만들 수 있습니다.

#### 기본 스칼라 재정의

`Date` 스칼라에 대한 사용자 정의 구현을 만들려면 새 클래스를 생성하면 됩니다.

```typescript
import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date', () => Date)
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type';

  parseValue(value: number): Date {
    return new Date(value); // value from the client
  }

  serialize(value: Date): number {
    return value.getTime(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  }
}
```

이것을 준비했으면, `DateScalar`를 프로바이더로 등록하세요.

```typescript
@Module({
  providers: [DateScalar],
})
export class CommonModule {}
```

이제 클래스에서 `Date` 타입을 사용할 수 있습니다.

```typescript
@Field()
creationDate: Date;
```

#### 사용자 정의 스칼라 임포트

사용자 정의 스칼라를 사용하려면, 이를 임포트하고 리졸버로 등록하세요. 설명을 위해 `graphql-type-json` 패키지를 사용하겠습니다. 이 npm 패키지는 `JSON` GraphQL 스칼라 타입을 정의합니다.

패키지를 설치하는 것부터 시작하세요:

```bash
$ npm i --save graphql-type-json
```

패키지가 설치되면, `forRoot()` 메서드에 사용자 정의 리졸버를 전달합니다:

```typescript
import GraphQLJSON from 'graphql-type-json';

@Module({
  imports: [
    GraphQLModule.forRoot({
      resolvers: { JSON: GraphQLJSON },
    }),
  ],
})
export class AppModule {}
```

이제 클래스에서 `JSON` 타입을 사용할 수 있습니다.

```typescript
@Field(() => GraphQLJSON)
info: JSON;
```

유용한 스칼라 모음을 보려면, [graphql-scalars](https://www.npmjs.com/package/graphql-scalars) 패키지를 살펴보세요.

#### 사용자 정의 스칼라 생성

사용자 정의 스칼라를 정의하려면, 새 `GraphQLScalarType` 인스턴스를 생성하세요. 사용자 정의 `UUID` 스칼라를 생성하겠습니다.

```typescript
const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validate(uuid: unknown): string | never {
  if (typeof uuid !== 'string' || !regex.test(uuid)) {
    throw new Error('invalid uuid');
  }
  return uuid;
}

export const CustomUuidScalar = new GraphQLScalarType({
  name: 'UUID',
  description: 'A simple UUID parser',
  serialize: (value) => validate(value),
  parseValue: (value) => validate(value),
  parseLiteral: (ast) => validate(ast.value),
});
```

`forRoot()` 메서드에 사용자 정의 리졸버를 전달합니다:

```typescript
@Module({
  imports: [
    GraphQLModule.forRoot({
      resolvers: { UUID: CustomUuidScalar },
    }),
  ],
})
export class AppModule {}
```

이제 클래스에서 `UUID` 타입을 사용할 수 있습니다.

```typescript
@Field(() => CustomUuidScalar)
uuid: string;
```

#### 스키마 우선

사용자 정의 스칼라를 정의하려면 ([여기](https://www.apollographql.com/docs/graphql-tools/scalars.html)에서 스칼라에 대해 자세히 알아보세요), 타입 정의와 전용 리졸버를 생성하세요. 여기서는 (공식 문서에서와 같이) 설명을 위해 `graphql-type-json` 패키지를 사용하겠습니다. 이 npm 패키지는 `JSON` GraphQL 스칼라 타입을 정의합니다.

패키지를 설치하는 것부터 시작하세요:

```bash
$ npm i --save graphql-type-json
```

패키지가 설치되면, `forRoot()` 메서드에 사용자 정의 리졸버를 전달합니다:

```typescript
import GraphQLJSON from 'graphql-type-json';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
      resolvers: { JSON: GraphQLJSON },
    }),
  ],
})
export class AppModule {}
```

이제 타입 정의에서 `JSON` 스칼라를 사용할 수 있습니다:

```graphql
scalar JSON

type Foo {
  field: JSON
}
```

스칼라 타입을 정의하는 또 다른 방법은 간단한 클래스를 생성하는 것입니다. `Date` 타입으로 스키마를 확장하고 싶다고 가정해 보겠습니다.

```typescript
import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date')
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type';

  parseValue(value: number): Date {
    return new Date(value); // value from the client
  }

  serialize(value: Date): number {
    return value.getTime(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  }
}
```

이것을 준비했으면, `DateScalar`를 프로바이더로 등록하세요.

```typescript
@Module({
  providers: [DateScalar],
})
export class CommonModule {}
```

이제 타입 정의에서 `Date` 스칼라를 사용할 수 있습니다.

```graphql
scalar Date
```

기본적으로 모든 스칼라에 대해 생성되는 TypeScript 정의는 `any`이며, 이는 특히 타입 안전하지 않습니다.
하지만 타입을 생성하는 방법을 지정할 때 사용자 정의 스칼라에 대한 타이핑을 Nest가 어떻게 생성할지 구성할 수 있습니다:

```typescript
import { GraphQLDefinitionsFactory } from '@nestjs/graphql';
import { join } from 'path';

const definitionsFactory = new GraphQLDefinitionsFactory();

definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: join(process.cwd(), 'src/graphql.ts'),
  outputAs: 'class',
  defaultScalarType: 'unknown',
  customScalarTypeMapping: {
    DateTime: 'Date',
    BigNumber: '_BigNumber',
  },
  additionalHeader: "import _BigNumber from 'bignumber.js'",
});
```

> info **힌트** 또는 타입 참조를 대신 사용할 수도 있습니다. 예를 들어: `DateTime: Date`. 이 경우 `GraphQLDefinitionsFactory`는 지정된 타입의 name 속성(`Date.name`)을 추출하여 TS 정의를 생성합니다. 참고: 내장 타입이 아닌 타입(사용자 정의 타입)에 대한 임포트 구문 추가가 필요합니다.

이제 다음과 같은 GraphQL 사용자 정의 스칼라 타입이 주어졌을 때:

```graphql
scalar DateTime
scalar BigNumber
scalar Payload
```

이제 `src/graphql.ts` 파일에서 다음과 같은 생성된 TypeScript 정의를 볼 수 있습니다:

```typescript
import _BigNumber from 'bignumber.js';

export type DateTime = Date;
export type BigNumber = _BigNumber;
export type Payload = unknown;
```

여기서는 `customScalarTypeMapping` 속성을 사용하여 사용자 정의 스칼라에 대해 선언하려는 타입의 맵을 제공했습니다. 또한 이러한 타입 정의에 필요한 임포트를 추가할 수 있도록 `additionalHeader` 속성을 제공했습니다. 마지막으로, `defaultScalarType`을 `'unknown'`으로 추가하여 `customScalarTypeMapping`에 지정되지 않은 사용자 정의 스칼라가 `any` 대신 `unknown`으로 별칭이 지정되도록 했습니다 ([TypeScript는 타입 안전성을 높이기 위해 3.0부터 사용을 권장](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#new-unknown-top-type)합니다).

> info **힌트** `_BigNumber`를 `bignumber.js`에서 임포트했다는 점에 유의하세요. 이는 [순환 타입 참조](https://github.com/Microsoft/TypeScript/issues/12525#issuecomment-263166239)를 방지하기 위함입니다.