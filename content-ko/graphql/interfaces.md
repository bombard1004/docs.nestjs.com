### 인터페이스

다른 많은 타입 시스템과 마찬가지로 GraphQL은 인터페이스를 지원합니다. **인터페이스**는 인터페이스를 구현하기 위해 타입이 포함해야 하는 특정 필드 집합을 포함하는 추상 타입입니다 ([여기](https://graphql.org/learn/schema/#interfaces)에서 자세히 읽어보세요).

#### 코드 우선(Code first)

코드 우선(Code first) 접근 방식을 사용할 때, `@nestjs/graphql`에서 내보내는 `@InterfaceType()` 데코레이터로 주석 처리된 추상 클래스를 생성하여 GraphQL 인터페이스를 정의합니다.

```typescript
import { Field, ID, InterfaceType } from '@nestjs/graphql';

@InterfaceType()
export abstract class Character {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}
```

> warning **경고** TypeScript 인터페이스는 GraphQL 인터페이스를 정의하는 데 사용할 수 없습니다.

이렇게 하면 GraphQL 스키마의 다음 부분이 SDL로 생성됩니다.

```graphql
interface Character {
  id: ID!
  name: String!
}
```

이제 `Character` 인터페이스를 구현하려면 `implements` 키를 사용하세요.

```typescript
@ObjectType({
  implements: () => [Character],
})
export class Human implements Character {
  id: string;
  name: string;
}
```

> info **힌트** `@ObjectType()` 데코레이터는 `@nestjs/graphql` 패키지에서 내보냅니다.

라이브러리에서 생성된 기본 `resolveType()` 함수는 리졸버 메서드에서 반환된 값을 기반으로 타입을 추출합니다. 이는 클래스 인스턴스를 반환해야 함을 의미합니다 (리터럴 JavaScript 객체를 반환할 수 없습니다).

사용자 정의 `resolveType()` 함수를 제공하려면 다음과 같이 `@InterfaceType()` 데코레이터에 전달되는 옵션 객체에 `resolveType` 속성을 전달하세요.

```typescript
@InterfaceType({
  resolveType(book) {
    if (book.colors) {
      return ColoringBook;
    }
    return TextBook;
  },
})
export abstract class Book {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;
}
```

#### 인터페이스 리졸버

지금까지 인터페이스를 사용하면 객체와 필드 정의만 공유할 수 있었습니다. 실제 필드 리졸버 구현도 공유하고 싶다면 다음과 같이 전용 인터페이스 리졸버를 생성할 수 있습니다.

```typescript
import { Resolver, ResolveField, Parent, Info, Args } from '@nestjs/graphql';

@Resolver((type) => Character) // 참고: Character는 인터페이스입니다.
export class CharacterInterfaceResolver {
  @ResolveField(() => [Character])
  friends(
    @Parent() character, // Character를 구현하는 해결된 객체
    @Info() { parentType }, // Character를 구현하는 객체의 타입
    @Args('search', { type: () => String }) searchTerm: string,
  ) {
    // 캐릭터 친구들 가져오기
    return [];
  }
}
```

이제 `friends` 필드 리졸버는 `Character` 인터페이스를 구현하는 모든 객체 타입에 대해 자동으로 등록됩니다.

> warning **경고** 이는 `GraphQLModule` 설정에서 `inheritResolversFromInterfaces` 속성이 true로 설정되어 있어야 합니다.

#### 스키마 우선(Schema first)

스키마 우선(Schema first) 접근 방식에서 인터페이스를 정의하려면 단순히 SDL로 GraphQL 인터페이스를 생성하세요.

```graphql
interface Character {
  id: ID!
  name: String!
}
```

그런 다음, 타입 생성 기능([빠른 시작](/graphql/quick-start) 챕터에 설명되어 있습니다)을 사용하여 해당하는 TypeScript 정의를 생성할 수 있습니다.

```typescript
export interface Character {
  id: string;
  name: string;
}
```

인터페이스는 인터페이스가 어떤 타입으로 확인(resolve)되어야 하는지 결정하기 위해 리졸버 맵에 추가적인 `__resolveType` 필드를 요구합니다. `CharactersResolver` 클래스를 생성하고 `__resolveType` 메서드를 정의해 보겠습니다.

```typescript
@Resolver('Character')
export class CharactersResolver {
  @ResolveField()
  __resolveType(value) {
    if ('age' in value) {
      return Person;
    }
    return null;
  }
}
```

> info **힌트** 모든 데코레이터는 `@nestjs/graphql` 패키지에서 내보냅니다.