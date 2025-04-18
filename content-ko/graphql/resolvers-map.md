### 리졸버

리졸버는 [GraphQL](https://graphql.org/) 오퍼레이션(쿼리, 뮤테이션 또는 구독)을 데이터로 변환하는 방법을 제공합니다. 이들은 스키마에 명시한 것과 동일한 형태의 데이터를 반환합니다. 이는 동기적일 수도 있고, 해당 형태의 결과를 반환하는 프로미스일 수도 있습니다. 일반적으로 **리졸버 맵**은 수동으로 생성합니다. 반면, `@nestjs/graphql` 패키지는 클래스에 어노테이션을 달기 위해 사용하는 데코레이터가 제공하는 메타데이터를 사용하여 리졸버 맵을 자동으로 생성합니다. 패키지 기능을 사용하여 GraphQL API를 생성하는 과정을 보여주기 위해 간단한 저자 API를 만들겠습니다.

#### 코드 우선

코드 우선 방식에서는 GraphQL SDL을 직접 작성하여 GraphQL 스키마를 생성하는 일반적인 과정을 따르지 않습니다. 대신, TypeScript 데코레이터를 사용하여 TypeScript 클래스 정의로부터 SDL을 생성합니다. `@nestjs/graphql` 패키지는 데코레이터를 통해 정의된 메타데이터를 읽고 사용자를 위해 스키마를 자동으로 생성합니다.

#### 객체 타입

GraphQL 스키마의 정의 대부분은 **객체 타입**입니다. 정의하는 각 객체 타입은 애플리케이션 클라이언트가 상호 작용해야 할 수 있는 도메인 객체를 나타내야 합니다. 예를 들어, 샘플 API는 저자 목록과 그들의 게시물을 가져올 수 있어야 하므로, 이 기능을 지원하기 위해 `Author` 타입과 `Post` 타입을 정의해야 합니다.

스키마 우선 방식을 사용했다면, 다음과 같이 SDL로 스키마를 정의했을 것입니다.

```graphql
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post!]!
}
```

이 경우, 코드 우선 방식을 사용하여 TypeScript 클래스와 TypeScript 데코레이터로 해당 클래스의 필드에 어노테이션을 달아 스키마를 정의합니다. 코드 우선 방식에서 위 SDL과 동등한 것은 다음과 같습니다.

```typescript
@@filename(authors/models/author.model)
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Post } from './post';

@ObjectType()
export class Author {
  @Field(type => Int)
  id: number;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field(type => [Post])
  posts: Post[];
}
```

> info **힌트** TypeScript의 메타데이터 리플렉션 시스템에는 여러 제약이 있어, 예를 들어 클래스가 어떤 속성으로 구성되어 있는지 또는 주어진 속성이 선택적인지 필수적인지를 판단하는 것이 불가능합니다. 이러한 제약 때문에, 각 필드의 GraphQL 타입과 선택성에 대한 메타데이터를 제공하기 위해 `@Field()` 데코레이터를 스키마 정의 클래스에서 명시적으로 사용하거나, 이를 대신 생성해주는 [CLI 플러그인](/graphql/cli-plugin)을 사용해야 합니다.

`Author` 객체 타입은 어떤 클래스와 마찬가지로 필드 모음으로 구성되며, 각 필드는 타입을 선언합니다. 필드의 타입은 [GraphQL 타입](https://graphql.org/learn/schema/)에 해당합니다. 필드의 GraphQL 타입은 다른 객체 타입이거나 스칼라 타입일 수 있습니다. GraphQL 스칼라 타입은 단일 값으로 해결되는 기본 타입(예: `ID`, `String`, `Boolean`, `Int`)입니다.

> info **힌트** GraphQL에 내장된 스칼라 타입 외에도 사용자 정의 스칼라 타입을 정의할 수 있습니다([더 알아보기](/graphql/scalars)).

위 `Author` 객체 타입 정의는 Nest가 위에서 보여준 SDL을 **생성**하게 합니다.

```graphql
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post!]!
}
```

`@Field()` 데코레이터는 선택적인 타입 함수(예: `type => Int`)와 선택적인 옵션 객체를 허용합니다.

타입 함수는 TypeScript 타입 시스템과 GraphQL 타입 시스템 사이에 모호성이 발생할 가능성이 있을 때 필요합니다. 특히, `string` 및 `boolean` 타입에는 **필요하지 않지만**, `number`(GraphQL `Int` 또는 `Float`로 매핑되어야 함)에는 **필요합니다**. 타입 함수는 단순히 원하는 GraphQL 타입을 반환해야 합니다(이 장의 다양한 예제에서 보여지듯이).

옵션 객체는 다음 키/값 쌍 중 하나를 가질 수 있습니다.

- `nullable`: 필드가 null 허용인지 지정합니다 (`@nestjs/graphql`에서는 각 필드가 기본적으로 null 불가능입니다); `boolean`
- `description`: 필드 설명을 설정합니다; `string`
- `deprecationReason`: 필드를 사용 중단으로 표시합니다; `string`

예를 들어:

```typescript
@Field({ description: `Book title`, deprecationReason: 'Not useful in v2 schema' })
title: string;
```

> info **힌트** 객체 타입 전체에 설명을 추가하거나 사용 중단으로 표시할 수도 있습니다: `@ObjectType({{ '{' }} description: 'Author model' {{ '}' }})`.

필드가 배열일 때는 `Field()` 데코레이터의 타입 함수에 배열 타입을 수동으로 지정해야 합니다. 아래와 같이 표시됩니다.

```typescript
@Field(type => [Post])
posts: Post[];
```

> info **힌트** 배열 대괄호 표기법(`[ ]`)을 사용하여 배열의 깊이를 나타낼 수 있습니다. 예를 들어 `[[Int]]`를 사용하면 정수 행렬을 나타냅니다.

배열 자체(배열 항목 아님)가 null 허용임을 선언하려면 아래와 같이 `nullable` 속성을 `'items'`로 설정합니다.

```typescript
@Field(type => [Post], { nullable: 'items' })
posts: Post[];
```

> info **힌트** 배열과 항목이 모두 null 허용이면 `nullable`을 `'itemsAndList'`로 설정합니다.

이제 `Author` 객체 타입이 생성되었으니, `Post` 객체 타입을 정의해 봅시다.

```typescript
@@filename(posts/models/post.model)
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Post {
  @Field(type => Int)
  id: number;

  @Field()
  title: string;

  @Field(type => Int, { nullable: true })
  votes?: number;
}
```

`Post` 객체 타입은 SDL에서 GraphQL 스키마의 다음 부분 생성을 초래합니다.

```graphql
type Post {
  id: Int!
  title: String!
  votes: Int
}
```

#### 코드 우선 리졸버

이 시점에서 데이터 그래프에 존재할 수 있는 객체(타입 정의)를 정의했지만, 클라이언트는 아직 해당 객체와 상호 작용하는 방법을 갖고 있지 않습니다. 이를 해결하기 위해 리졸버 클래스를 생성해야 합니다. 코드 우선 방식에서 리졸버 클래스는 리졸버 함수를 정의하고 **Query 타입**을 생성합니다. 아래 예제를 살펴보면 명확해질 것입니다.

```typescript
@@filename(authors/authors.resolver)
@Resolver(() => Author)
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query(() => Author)
  async author(@Args('id', { type: () => Int }) id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField()
  async posts(@Parent() author: Author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
```

> info **힌트** 모든 데코레이터(예: `@Resolver`, `@ResolveField`, `@Args` 등)는 `@nestjs/graphql` 패키지에서 내보내집니다.

여러 리졸버 클래스를 정의할 수 있습니다. Nest는 런타임에 이들을 결합합니다. 코드 구성에 대한 자세한 내용은 아래 [모듈](/graphql/resolvers#module) 섹션을 참조하세요.

> warning **참고** `AuthorsService` 및 `PostsService` 클래스 내 로직은 필요에 따라 간단하거나 정교할 수 있습니다. 이 예제의 주요 요점은 리졸버를 구성하는 방법과 다른 제공자와 상호 작용하는 방법을 보여주는 것입니다.

위 예제에서는 하나의 쿼리 리졸버 함수와 하나의 필드 리졸버 함수를 정의하는 `AuthorsResolver`를 생성했습니다. 리졸버를 생성하려면 리졸버 함수를 메서드로 포함하고 `@Resolver()` 데코레이터로 클래스에 어노테이션을 답니다.

이 예제에서는 요청에 포함된 `id`를 기반으로 저자 객체를 가져오는 쿼리 핸들러를 정의했습니다. 메서드가 쿼리 핸들러임을 지정하려면 `@Query()` 데코레이터를 사용합니다.

`@Resolver()` 데코레이터에 전달되는 인수는 선택 사항이지만, 그래프가 복잡해질 때 사용됩니다. 이는 필드 리졸버 함수가 객체 그래프를 따라 내려갈 때 사용하는 부모 객체를 제공하는 데 사용됩니다.

우리 예제에서는 클래스가 **필드 리졸버** 함수(Author 객체 타입의 `posts` 속성용)를 포함하므로, 해당 클래스 내에 정의된 모든 필드 리졸버의 부모 타입(즉, 해당 `ObjectType` 클래스 이름)을 나타내는 값을 `@Resolver()` 데코레이터에 **반드시** 제공해야 합니다. 예제에서 명확하듯이 필드 리졸버 함수를 작성할 때 부모 객체(해결되는 필드가 속한 객체)에 접근하는 것이 필요합니다. 이 예제에서는 저자의 `id`를 인수로 받는 서비스를 호출하는 필드 리졸버를 사용하여 저자의 게시물 배열을 채웁니다. 따라서 `@Resolver()` 데코레이터에서 부모 객체를 식별해야 합니다. 필드 리졸버에서 해당 부모 객체에 대한 참조를 추출하기 위해 `@Parent()` 메서드 매개변수 데코레이터를 사용하는 해당 부분을 주목하십시오.

여러 개의 `@Query()` 리졸버 함수를 정의할 수 있으며(이 클래스 내에서든 다른 리졸버 클래스에서든), 이들은 생성된 SDL에서 단일 **Query 타입** 정의와 리졸버 맵의 해당 항목으로 집계됩니다. 이를 통해 사용하는 모델 및 서비스와 가깝게 쿼리를 정의하고 모듈에서 잘 구성할 수 있습니다.

> info **힌트** Nest CLI는 이 모든 것을 직접 하는 것을 피하고 개발 경험을 훨씬 간단하게 만드는 데 도움이 되는 **모든 기본 코드를 자동으로 생성**하는 제너레이터(스키매틱)를 제공합니다. 이 기능에 대해 [여기](/recipes/crud-generator)에서 더 읽어보세요.

#### 쿼리 타입 이름

위 예제에서 `@Query()` 데코레이터는 메서드 이름을 기반으로 GraphQL 스키마 쿼리 타입 이름을 생성합니다. 예를 들어, 위 예제에서 다음 구문을 고려해 보세요.

```typescript
@Query(() => Author)
async author(@Args('id', { type: () => Int }) id: number) {
  return this.authorsService.findOneById(id);
}
```

이는 스키마에서 저자 쿼리에 대한 다음 항목을 생성합니다 (쿼리 타입은 메서드 이름과 동일한 이름을 사용합니다):

```graphql
type Query {
  author(id: Int!): Author
}
```

> info **힌트** GraphQL 쿼리에 대해 [여기](https://graphql.org/learn/queries/)에서 자세히 알아보세요.

관례적으로 우리는 이러한 이름을 분리하는 것을 선호합니다. 예를 들어, 쿼리 핸들러 메서드에는 `getAuthor()`와 같은 이름을 사용하지만 쿼리 타입 이름에는 여전히 `author`를 사용하는 것을 선호합니다. 이는 필드 리졸버에도 동일하게 적용됩니다. `@Query()` 및 `@ResolveField()` 데코레이터의 인수로 매핑 이름을 전달하여 이를 쉽게 수행할 수 있습니다. 아래와 같이 표시됩니다.

```typescript
@@filename(authors/authors.resolver)
@Resolver(() => Author)
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query(() => Author, { name: 'author' })
  async getAuthor(@Args('id', { type: () => Int }) id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField('posts', () => [Post])
  async getPosts(@Parent() author: Author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
```

위의 `getAuthor` 핸들러 메서드는 SDL에서 GraphQL 스키마의 다음 부분 생성을 초래합니다.

```graphql
type Query {
  author(id: Int!): Author
}
```

#### 쿼리 데코레이터 옵션

`@Query()` 데코레이터의 옵션 객체(위에서 `{{ '{' }}name: 'author'{{ '}' }}`를 전달한 곳)는 여러 키/값 쌍을 허용합니다.

- `name`: 쿼리 이름; `string`
- `description`: GraphQL 스키마 문서(예: GraphQL playground)를 생성하는 데 사용될 설명; `string`
- `deprecationReason`: 쿼리를 사용 중단으로 표시하는 쿼리 메타데이터를 설정합니다(예: GraphQL playground); `string`
- `nullable`: 쿼리가 null 데이터 응답을 반환할 수 있는지 여부; `boolean` 또는 `'items'` 또는 `'itemsAndList'` ( `'items'` 및 `'itemsAndList'`에 대한 자세한 내용은 위 참조)

#### Args 데코레이터 옵션

메서드 핸들러에서 사용하기 위해 요청에서 인수를 추출하려면 `@Args()` 데코레이터를 사용합니다. 이는 [REST 경로 매개변수 인수 추출](/controllers#route-parameters)과 매우 유사한 방식으로 작동합니다.

일반적으로 `@Args()` 데코레이터는 간단하며 위 `getAuthor()` 메서드에서 볼 수 있듯이 객체 인수를 요구하지 않습니다. 예를 들어, 식별자의 타입이 문자열인 경우 다음 구문으로 충분하며, 단순히 들어오는 GraphQL 요청에서 이름이 지정된 필드를 추출하여 메서드 인수로 사용합니다.

```typescript
@Args('id') id: string
```

`getAuthor()`의 경우 `number` 타입이 사용되어 문제가 발생합니다. `number` TypeScript 타입은 예상되는 GraphQL 표현(예: `Int` 대 `Float`)에 대한 충분한 정보를 제공하지 않습니다. 따라서 타입 참조를 **명시적으로** 전달해야 합니다. 이는 `Args()` 데코레이터에 인자 옵션을 포함하는 두 번째 인수를 전달하여 수행합니다. 아래와 같이 표시됩니다.

```typescript
@Query(() => Author, { name: 'author' })
async getAuthor(@Args('id', { type: () => Int }) id: number) {
  return this.authorsService.findOneById(id);
}
```

옵션 객체를 사용하면 다음과 같은 선택적 키 값 쌍을 지정할 수 있습니다.

- `type`: GraphQL 타입을 반환하는 함수
- `defaultValue`: 기본값; `any`
- `description`: 설명 메타데이터; `string`
- `deprecationReason`: 필드를 사용 중단하고 그 이유를 설명하는 메타데이터를 제공합니다; `string`
- `nullable`: 필드가 null 허용인지 여부

쿼리 핸들러 메서드는 여러 인수를 가질 수 있습니다. `firstName` 및 `lastName`을 기반으로 저자를 가져오고 싶다고 상상해 봅시다. 이 경우 `@Args`를 두 번 호출할 수 있습니다.

```typescript
getAuthor(
  @Args('firstName', { nullable: true }) firstName?: string,
  @Args('lastName', { defaultValue: '' }) lastName?: string,
) {}
```

> info **힌트** `firstName`의 경우, 이는 GraphQL null 허용 필드이므로 이 필드의 타입에 `null` 또는 `undefined`와 같은 비값 타입을 추가할 필요가 없습니다. 다만, GraphQL null 허용 필드는 이러한 타입이 리졸버에 전달되도록 허용하므로 리졸버에서 이러한 가능한 비값 타입에 대한 타입 가드를 해야 한다는 점을 유의하십시오.

#### 전용 인수 클래스

인라인 `@Args()` 호출로는 위 예제와 같은 코드가 복잡해집니다. 대신 전용 `GetAuthorArgs` 인수 클래스를 만들고 핸들러 메서드에서 다음과 같이 액세스할 수 있습니다.

```typescript
@Args() args: GetAuthorArgs
```

아래에 표시된 대로 `@ArgsType()`를 사용하여 `GetAuthorArgs` 클래스를 생성합니다.

```typescript
@@filename(authors/dto/get-author.args)
import { MinLength } from 'class-validator';
import { Field, ArgsType } from '@nestjs/graphql';

@ArgsType()
class GetAuthorArgs {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ defaultValue: '' })
  @MinLength(3)
  lastName: string;
}
```

> info **힌트** 다시 한번, TypeScript의 메타데이터 리플렉션 시스템 제한으로 인해 타입과 선택성을 수동으로 나타내기 위해 `@Field` 데코레이터를 사용하거나 [CLI 플러그인](/graphql/cli-plugin)을 사용하는 것이 필수적입니다. 또한, GraphQL null 허용 필드인 `firstName`의 경우, 이 필드의 타입에 `null` 또는 `undefined`와 같은 비값 타입을 추가할 필요가 없습니다. GraphQL null 허용 필드는 이러한 타입이 리졸버에 전달되도록 허용하므로 리졸버에서 이러한 가능한 비값 타입에 대한 타입 가드를 해야 한다는 점을 유의하십시오.

이는 SDL에서 GraphQL 스키마의 다음 부분 생성을 초래합니다.

```graphql
type Query {
  author(firstName: String, lastName: String = ''): Author
}
```

> info **힌트** `GetAuthorArgs`와 같은 인수 클래스는 `ValidationPipe`와 매우 잘 작동합니다([더 알아보기](/techniques/validation)).

#### 클래스 상속

표준 TypeScript 클래스 상속을 사용하여 일반 유틸리티 타입 기능(필드 및 필드 속성, 유효성 검사 등)이 포함된 기본 클래스를 만들고 이를 확장할 수 있습니다. 예를 들어, 항상 표준 `offset` 및 `limit` 필드를 포함하지만 타입별 인덱스 필드도 포함하는 페이지네이션 관련 인수의 집합이 있을 수 있습니다. 아래에 표시된 대로 클래스 계층 구조를 설정할 수 있습니다.

기본 `@ArgsType()` 클래스:

```typescript
@ArgsType()
class PaginationArgs {
  @Field(() => Int)
  offset: number = 0;

  @Field(() => Int)
  limit: number = 10;
}
```

기본 `@ArgsType()` 클래스의 타입별 하위 클래스:

```typescript
@ArgsType()
class GetAuthorArgs extends PaginationArgs {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ defaultValue: '' })
  @MinLength(3)
  lastName: string;
}
```

동일한 접근 방식을 `@ObjectType()` 객체에도 적용할 수 있습니다. 기본 클래스에 일반 속성을 정의합니다.

```typescript
@ObjectType()
class Character {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;
}
```

하위 클래스에 타입별 속성을 추가합니다.

```typescript
@ObjectType()
class Warrior extends Character {
  @Field()
  level: number;
}
```

리졸버에서도 상속을 사용할 수 있습니다. 상속과 TypeScript 제네릭을 결합하여 타입 안전성을 보장할 수 있습니다. 예를 들어, 일반적인 `findAll` 쿼리가 포함된 기본 클래스를 만들려면 다음과 같은 구문을 사용합니다.

```typescript
function BaseResolver<T extends Type<unknown>>(classRef: T): any {
  @Resolver({ isAbstract: true })
  abstract class BaseResolverHost {
    @Query(() => [classRef], { name: `findAll${classRef.name}` })
    async findAll(): Promise<T[]> {
      return [];
    }
  }
  return BaseResolverHost;
}
```

다음 사항에 유의하십시오.

- 명시적 반환 타입(위의 `any`)이 필요합니다: 그렇지 않으면 TypeScript가 private 클래스 정의 사용에 대해 불평합니다. 권장: `any` 대신 인터페이스를 정의합니다.
- `Type`은 `@nestjs/common` 패키지에서 가져옵니다.
- `isAbstract: true` 속성은 이 클래스에 대해 SDL(Schema Definition Language 구문)이 생성되지 않아야 함을 나타냅니다. 다른 타입에 대해서도 이 속성을 설정하여 SDL 생성을 억제할 수 있습니다.

다음은 `BaseResolver`의 구체적인 하위 클래스를 생성하는 방법입니다.

```typescript
@Resolver(() => Recipe)
export class RecipesResolver extends BaseResolver(Recipe) {
  constructor(private recipesService: RecipesService) {
    super();
  }
}
```

이 구조는 다음 SDL을 생성합니다.

```graphql
type Query {
  findAllRecipe: [Recipe!]!
}
```

#### 제네릭

위에서 제네릭의 한 가지 사용법을 살펴보았습니다. 이 강력한 TypeScript 기능은 유용한 추상화를 만드는 데 사용할 수 있습니다. 예를 들어, [이 문서](https://graphql.org/learn/pagination/#pagination-and-edges)를 기반으로 한 샘플 커서 기반 페이지네이션 구현은 다음과 같습니다.

```typescript
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

interface IEdgeType<T> {
  cursor: string;
  node: T;
}

export interface IPaginatedType<T> {
  edges: IEdgeType<T>[];
  nodes: T[];
  totalCount: number;
  hasNextPage: boolean;
}

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
  @ObjectType(`${classRef.name}Edge`)
  abstract class EdgeType {
    @Field(() => String)
    cursor: string;

    @Field(() => classRef)
    node: T;
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements IPaginatedType<T> {
    @Field(() => [EdgeType], { nullable: true })
    edges: EdgeType[];

    @Field(() => [classRef], { nullable: true })
    nodes: T[];

    @Field(() => Int)
    totalCount: number;

    @Field()
    hasNextPage: boolean;
  }
  return PaginatedType as Type<IPaginatedType<T>>;
}
```

위에 기본 클래스가 정의되었으므로 이제 이 동작을 상속하는 특수 타입을 쉽게 만들 수 있습니다. 예를 들어:

```typescript
@ObjectType()
class PaginatedAuthor extends Paginated(Author) {}
```

#### 스키마 우선

[이전](/graphql/quick-start) 장에서 언급했듯이, 스키마 우선 방식에서는 SDL에서 스키마 타입을 수동으로 정의하는 것으로 시작합니다([더 알아보기](https://graphql.org/learn/schema/#type-language)). 다음 SDL 타입 정의를 고려해 보세요.

> info **힌트** 이 장의 편의를 위해 모든 SDL을 한 곳에 모았습니다(예: 아래에 표시된 단일 `.graphql` 파일). 실제로 코드를 모듈식으로 구성하는 것이 적절하다는 것을 알 수 있습니다. 예를 들어, 각 도메인 엔티티를 나타내는 타입 정의, 관련 서비스, 리졸버 코드 및 Nest 모듈 정의 클래스를 해당 엔티티의 전용 디렉토리에 포함하는 개별 SDL 파일을 만드는 것이 도움이 될 수 있습니다. Nest는 런타임에 모든 개별 스키마 타입 정의를 집계합니다.

```graphql
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post]
}

type Post {
  id: Int!
  title: String!
  votes: Int
}

type Query {
  author(id: Int!): Author
}
```

#### 스키마 우선 리졸버

위 스키마는 단일 쿼리인 `author(id: Int!): Author`를 노출합니다.

> info **힌트** GraphQL 쿼리에 대해 [여기](https://graphql.org/learn/queries/)에서 자세히 알아보세요.

이제 저자 쿼리를 해결하는 `AuthorsResolver` 클래스를 생성해 봅시다.

```typescript
@@filename(authors/authors.resolver)
@Resolver('Author')
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query()
  async author(@Args('id') id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField()
  async posts(@Parent() author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
```

> info **힌트** 모든 데코레이터(예: `@Resolver`, `@ResolveField`, `@Args` 등)는 `@nestjs/graphql` 패키지에서 내보내집니다.

> warning **참고** `AuthorsService` 및 `PostsService` 클래스 내 로직은 필요에 따라 간단하거나 정교할 수 있습니다. 이 예제의 주요 요점은 리졸버를 구성하는 방법과 다른 제공자와 상호 작용하는 방법을 보여주는 것입니다.

`@Resolver()` 데코레이터는 필수입니다. 클래스 이름을 포함하는 선택적 문자열 인수를 받습니다. 이 클래스 이름은 클래스가 `@ResolveField()` 데코레이터를 포함하여 Nest에게 데코레이트된 메서드가 부모 타입(현재 예제에서는 `Author` 타입)과 연관되어 있음을 알릴 때마다 필요합니다. 또는 클래스 상단에 `@Resolver()`를 설정하는 대신 각 메서드에 대해 수행할 수 있습니다.

```typescript
@Resolver('Author')
@ResolveField()
async posts(@Parent() author) {
  const { id } = author;
  return this.postsService.findAll({ authorId: id });
}
```

이 경우(메서드 레벨의 `@Resolver()` 데코레이터) 클래스 내에 여러 `@ResolveField()` 데코레이터가 있는 경우 모두에 `@Resolver()`를 추가해야 합니다. 이는 최선의 관행으로 간주되지 않습니다(추가 오버헤드를 발생시키기 때문).

> info **힌트** `@Resolver()`에 전달되는 클래스 이름 인수는 쿼리(`@Query()` 데코레이터) 또는 뮤테이션(`@Mutation()` 데코레이터)에 **영향을 미치지 않습니다**.

> warning **경고** 메서드 레벨에서 `@Resolver` 데코레이터를 사용하는 것은 **코드 우선** 방식에서는 지원되지 않습니다.

위 예제에서 `@Query()` 및 `@ResolveField()` 데코레이터는 메서드 이름을 기반으로 GraphQL 스키마 타입과 연결됩니다. 예를 들어, 위 예제에서 다음 구문을 고려해 보세요.

```typescript
@Query()
async author(@Args('id') id: number) {
  return this.authorsService.findOneById(id);
}
```

이는 스키마에서 저자 쿼리에 대한 다음 항목을 생성합니다 (쿼리 타입은 메서드 이름과 동일한 이름을 사용합니다):

```graphql
type Query {
  author(id: Int!): Author
}
```

관례적으로 우리는 이러한 이름을 분리하는 것을 선호하며, 리졸버 메서드에는 `getAuthor()` 또는 `getPosts()`와 같은 이름을 사용합니다. 데코레이터의 인수로 매핑 이름을 전달하여 이를 쉽게 수행할 수 있습니다. 아래와 같이 표시됩니다.

```typescript
@@filename(authors/authors.resolver)
@Resolver('Author')
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query('author')
  async getAuthor(@Args('id') id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField('posts')
  async getPosts(@Parent() author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
```

> info **힌트** Nest CLI는 이 모든 것을 직접 하는 것을 피하고 개발 경험을 훨씬 간단하게 만드는 데 도움이 되는 **모든 기본 코드를 자동으로 생성**하는 제너레이터(스키매틱)를 제공합니다. 이 기능에 대해 [여기](/recipes/crud-generator)에서 더 읽어보세요.

#### 타입 생성

스키마 우선 방식을 사용하고 타입 생성 기능(`outputAs: 'class'`를 [이전](/graphql/quick-start) 장에 표시된 대로 활성화한 경우), 애플리케이션을 실행하면 다음 파일이 생성됩니다(`GraphQLModule.forRoot()` 메서드에 지정한 위치에). 예를 들어, `src/graphql.ts`에 다음과 같이 생성됩니다.

```typescript
@@filename(graphql)
export (class Author {
  id: number;
  firstName?: string;
  lastName?: string;
  posts?: Post[];
})
export class Post {
  id: number;
  title: string;
  votes?: number;
}

export abstract class IQuery {
  abstract author(id: number): Author | Promise<Author>;
}
```

(기본 인터페이스 생성 기법 대신) 클래스를 생성함으로써, 스키마 우선 방식과 조합하여 선언적 유효성 검사 **데코레이터**를 사용할 수 있으며, 이는 매우 유용한 기법입니다([더 알아보기](/techniques/validation)). 예를 들어, 생성된 `CreatePostInput` 클래스에 `class-validator` 데코레이터를 추가하여 `title` 필드의 최소 및 최대 문자열 길이를 강제할 수 있습니다. 아래와 같이 표시됩니다.

```typescript
import { MinLength, MaxLength } from 'class-validator';

export class CreatePostInput {
  @MinLength(3)
  @MaxLength(50)
  title: string;
}
```

> warning **알림** 입력(및 매개변수)의 자동 유효성 검사를 활성화하려면 `ValidationPipe`를 사용하십시오. 유효성 검사에 대해 [여기](/techniques/validation)에서, 파이프에 대해 더 구체적으로 [여기](/pipes)에서 더 읽어보세요.

하지만 자동으로 생성된 파일에 직접 데코레이터를 추가하면 파일이 생성될 때마다 **덮어쓰기**됩니다. 대신 별도의 파일을 생성하고 생성된 클래스를 단순히 확장합니다.

```typescript
import { MinLength, MaxLength } from 'class-validator';
import { Post } from '../../graphql.ts';

export class CreatePostInput extends Post {
  @MinLength(3)
  @MaxLength(50)
  title: string;
}
```

#### GraphQL 인수 데코레이터

전용 데코레이터를 사용하여 표준 GraphQL 리졸버 인수에 액세스할 수 있습니다. 아래는 Nest 데코레이터와 해당 일반 Apollo 매개변수의 비교입니다.

<table>
  <tbody>
    <tr>
      <td><code>@Root()</code> 및 <code>@Parent()</code></td>
      <td><code>root</code>/<code>parent</code></td>
    </tr>
    <tr>
      <td><code>@Context(param?: string)</code></td>
      <td><code>context</code> / <code>context[param]</code></td>
    </tr>
    <tr>
      <td><code>@Info(param?: string)</code></td>
      <td><code>info</code> / <code>info[param]</code></td>
    </tr>
    <tr>
      <td><code>@Args(param?: string)</code></td>
      <td><code>args</code> / <code>args[param]</code></td>
    </tr>
  </tbody>
</table>

이 인수들은 다음과 같은 의미를 갖습니다.

- `root`: 부모 필드의 리졸버에서 반환된 결과 또는 최상위 `Query` 필드의 경우 서버 설정에서 전달된 `rootValue`를 포함하는 객체.
- `context`: 특정 쿼리의 모든 리졸버가 공유하는 객체; 일반적으로 요청별 상태를 포함하는 데 사용됩니다.
- `info`: 쿼리의 실행 상태에 대한 정보를 포함하는 객체.
- `args`: 쿼리에서 필드에 전달된 인수를 포함하는 객체.

<app-banner-devtools></app-banner-devtools>

#### 모듈

위 단계를 완료하면 리졸버 맵을 생성하는 데 필요한 모든 정보를 `GraphQLModule`에 선언적으로 지정한 것입니다. `GraphQLModule`은 리플렉션을 사용하여 데코레이터를 통해 제공된 메타데이터를 검사하고 자동으로 클래스를 올바른 리졸버 맵으로 변환합니다.

처리해야 할 유일한 다른 사항은 리졸버 클래스(`AuthorsResolver`)를 **제공**(즉, 모듈의 `provider`에 나열)하고 Nest가 이를 사용할 수 있도록 모듈(`AuthorsModule`)을 어딘가에서 가져오는 것입니다.

예를 들어, 이를 `AuthorsModule`에서 수행할 수 있으며, 이 모듈은 이 컨텍스트에서 필요한 다른 서비스도 제공할 수 있습니다. `AuthorsModule`을 어딘가에서 가져와야 합니다(예: 루트 모듈 또는 루트 모듈에 의해 가져와지는 다른 모듈).

```typescript
@@filename(authors/authors.module)
@Module({
  imports: [PostsModule],
  providers: [AuthorsService, AuthorsResolver],
})
export class AuthorsModule {}
```

> info **힌트** 코드를 소위 **도메인 모델**(REST API에서 진입점을 구성하는 방식과 유사)별로 구성하는 것이 유용합니다. 이 접근 방식에서는 모델(`ObjectType` 클래스), 리졸버 및 서비스를 해당 도메인 모델을 나타내는 Nest 모듈 내에 함께 유지합니다. 모든 구성 요소를 모듈당 단일 폴더에 유지합니다. 이렇게 하고 [Nest CLI](/cli/overview)를 사용하여 각 요소를 생성하면 Nest는 이 모든 부분을 자동으로 연결합니다(적절한 폴더에 파일 배치, `provider` 및 `imports` 배열에 항목 생성 등).
