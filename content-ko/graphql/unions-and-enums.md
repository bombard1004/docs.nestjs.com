### 유니온

유니온 타입은 인터페이스와 매우 유사하지만, 타입 간에 공통 필드를 지정할 수 없습니다([여기](https://graphql.org/learn/schema/#union-types)에서 자세히 읽어보세요). 유니온은 단일 필드에서 서로 다른 데이터 타입을 반환하는 데 유용합니다.

#### 코드 우선

GraphQL 유니온 타입을 정의하려면 이 유니온이 구성될 클래스를 정의해야 합니다. Apollo 문서의 [예제](https://www.apollographql.com/docs/apollo-server/schema/unions-interfaces/#union-type)에 따라 두 개의 클래스를 생성하겠습니다. 첫 번째는 `Book`:

```typescript
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Book {
  @Field()
  title: string;
}
```

그리고 `Author`:

```typescript
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Author {
  @Field()
  name: string;
}
```

이렇게 준비한 후, `@nestjs/graphql` 패키지에서 내보낸 `createUnionType` 함수를 사용하여 `ResultUnion` 유니온을 등록합니다:

```typescript
export const ResultUnion = createUnionType({
  name: 'ResultUnion',
  types: () => [Author, Book] as const,
});
```

> warning **경고** `createUnionType` 함수의 `types` 속성으로 반환되는 배열에는 const assertion이 지정되어야 합니다. const assertion이 지정되지 않으면 컴파일 시 잘못된 선언 파일이 생성되고, 다른 프로젝트에서 이를 사용할 때 오류가 발생합니다.

이제 쿼리에서 `ResultUnion`을 참조할 수 있습니다:

```typescript
@Query(() => [ResultUnion])
search(): Array<typeof ResultUnion> {
  return [new Author(), new Book()];
}
```

이렇게 하면 SDL로 다음과 같은 GraphQL 스키마의 일부가 생성됩니다:

```graphql
type Author {
  name: String!
}

type Book {
  title: String!
}

union ResultUnion = Author | Book

type Query {
  search: [ResultUnion!]!
}
```

라이브러리에서 생성되는 기본 `resolveType()` 함수는 리졸버 메서드에서 반환된 값을 기반으로 타입을 추출합니다. 즉, 리터럴 JavaScript 객체 대신 클래스 인스턴스를 반환하는 것이 필수입니다.

사용자 지정 `resolveType()` 함수를 제공하려면 다음과 같이 `createUnionType()` 함수에 전달되는 옵션 객체에 `resolveType` 속성을 전달합니다:

```typescript
export const ResultUnion = createUnionType({
  name: 'ResultUnion',
  types: () => [Author, Book] as const,
  resolveType(value) {
    if (value.name) {
      return Author;
    }
    if (value.title) {
      return Book;
    }
    return null;
  },
});
```

#### 스키마 우선

스키마 우선 접근 방식으로 유니온을 정의하려면 SDL로 GraphQL 유니온을 생성하면 됩니다.

```graphql
type Author {
  name: String!
}

type Book {
  title: String!
}

union ResultUnion = Author | Book
```

그런 다음 타이핑 생성 기능([빠른 시작](/graphql/quick-start) 챕터에 나와 있음)을 사용하여 해당 TypeScript 정의를 생성할 수 있습니다:

```typescript
export class Author {
  name: string;
}

export class Book {
  title: string;
}

export type ResultUnion = Author | Book;
```

유니온은 유니온이 어떤 타입으로 해석되어야 하는지 결정하기 위해 리졸버 맵에 추가 `__resolveType` 필드가 필요합니다. 또한, `ResultUnionResolver` 클래스는 모든 모듈에 프로바이더로 등록되어야 합니다. `ResultUnionResolver` 클래스를 생성하고 `__resolveType` 메서드를 정의해 보겠습니다.

```typescript
@Resolver('ResultUnion')
export class ResultUnionResolver {
  @ResolveField()
  __resolveType(value) {
    if (value.name) {
      return 'Author';
    }
    if (value.title) {
      return 'Book';
    }
    return null;
  }
}
```

> info **힌트** 모든 데코레이터는 `@nestjs/graphql` 패키지에서 내보내집니다.

### 열거형

열거형 타입은 허용되는 특정 값 집합으로 제한되는 특별한 종류의 스칼라입니다([여기](https://graphql.org/learn/schema/#enumeration-types)에서 자세히 읽어보세요). 이를 통해 다음을 수행할 수 있습니다:

- 이 타입의 모든 인수가 허용된 값 중 하나인지 검증
- 타입 시스템을 통해 필드가 항상 유한한 값 집합 중 하나가 될 것임을 전달

#### 코드 우선

코드 우선 접근 방식을 사용할 때는 단순히 TypeScript 열거형을 생성하여 GraphQL 열거형 타입을 정의합니다.

```typescript
export enum AllowedColor {
  RED,
  GREEN,
  BLUE,
}
```

이렇게 준비한 후, `@nestjs/graphql` 패키지에서 내보낸 `registerEnumType` 함수를 사용하여 `AllowedColor` 열거형을 등록합니다:

```typescript
registerEnumType(AllowedColor, {
  name: 'AllowedColor',
});
```

이제 타입에서 `AllowedColor`를 참조할 수 있습니다:

```typescript
@Field(type => AllowedColor)
favoriteColor: AllowedColor;
```

이렇게 하면 SDL로 다음과 같은 GraphQL 스키마의 일부가 생성됩니다:

```graphql
enum AllowedColor {
  RED
  GREEN
  BLUE
}
```

열거형에 대한 설명을 제공하려면 `registerEnumType()` 함수에 `description` 속성을 전달합니다.

```typescript
registerEnumType(AllowedColor, {
  name: 'AllowedColor',
  description: 'The supported colors.',
});
```

열거형 값에 대한 설명을 제공하거나 값을 deprecated로 표시하려면 다음과 같이 `valuesMap` 속성을 전달합니다:

```typescript
registerEnumType(AllowedColor, {
  name: 'AllowedColor',
  description: 'The supported colors.',
  valuesMap: {
    RED: {
      description: 'The default color.',
    },
    BLUE: {
      deprecationReason: 'Too blue.',
    },
  },
});
```

이렇게 하면 SDL로 다음과 같은 GraphQL 스키마가 생성됩니다:

```graphql
"""
The supported colors.
"""
enum AllowedColor {
  """
  The default color.
  """
  RED
  GREEN
  BLUE @deprecated(reason: "Too blue.")
}
```

#### 스키마 우선

스키마 우선 접근 방식으로 열거형을 정의하려면 SDL로 GraphQL 열거형을 생성하면 됩니다.

```graphql
enum AllowedColor {
  RED
  GREEN
  BLUE
}
```

그런 다음 타이핑 생성 기능([빠른 시작](/graphql/quick-start) 챕터에 나와 있음)을 사용하여 해당 TypeScript 정의를 생성할 수 있습니다:

```typescript
export enum AllowedColor {
  RED
  GREEN
  BLUE
}
```

때로는 백엔드에서 공개 API와 다르게 열거형에 대한 내부 값을 강제하는 경우가 있습니다. 이 예시에서는 API에 `RED`가 포함되어 있지만, 리졸버에서는 대신 `#f00`을 사용할 수 있습니다([여기](https://www.apollographql.com/docs/apollo-server/schema/scalars-enums/#internal-values)에서 자세히 읽어보세요). 이를 달성하기 위해 `AllowedColor` 열거형에 대한 리졸버 객체를 선언합니다:

```typescript
export const allowedColorResolver: Record<keyof typeof AllowedColor, any> = {
  RED: '#f00',
};
```

> info **힌트** 모든 데코레이터는 `@nestjs/graphql` 패키지에서 내보내집니다.

그런 다음 이 리졸버 객체를 `GraphQLModule#forRoot()` 메서드의 `resolvers` 속성과 함께 다음과 같이 사용합니다:

```typescript
GraphQLModule.forRoot({
  resolvers: {
    AllowedColor: allowedColorResolver,
  },
});
```