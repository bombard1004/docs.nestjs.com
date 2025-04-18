### 페더레이션 (Federation)

페더레이션은 모놀리식 GraphQL 서버를 독립적인 마이크로서비스로 분할하는 방법을 제공합니다. 이는 게이트웨이와 하나 이상의 페더레이션 마이크로서비스 두 가지 구성 요소로 이루어집니다. 각 마이크로서비스는 스키마의 일부를 보유하며, 게이트웨이는 이 스키마들을 클라이언트가 사용할 수 있는 단일 스키마로 병합합니다.

[Apollo 문서](https://blog.apollographql.com/apollo-federation-f260cf525d21)를 인용하자면, 페더레이션은 다음과 같은 핵심 원칙을 가지고 설계되었습니다.

- 그래프 빌딩은 **선언적**이어야 합니다. 페더레이션을 사용하면 명령형 스키마 스티칭 코드를 작성하는 대신, 스키마 내에서 선언적으로 그래프를 구성합니다.
- 코드는 타입이 아닌 **관심사**별로 분리되어야 합니다. 종종 User 또는 Product와 같은 중요한 타입의 모든 측면을 단일 팀이 제어하지는 않으므로, 이러한 타입의 정의는 중앙 집중식으로 관리되기보다는 팀과 코드베이스 전반에 걸쳐 분산되어야 합니다.
- 그래프는 클라이언트가 사용하기에 단순해야 합니다. 페더레이션된 서비스는 클라이언트에서 사용되는 방식을 정확하게 반영하는 완전하고 제품 중심적인 그래프를 함께 구성할 수 있습니다.
- 오직 언어의 사양 준수 기능만 사용하는 **그냥 GraphQL**입니다. JavaScript뿐만 아니라 어떤 언어든 페더레이션을 구현할 수 있습니다.

> warning **경고** 페더레이션은 현재 구독(subscriptions)을 지원하지 않습니다.

다음 섹션에서는 게이트웨이와 두 개의 페더레이션 엔드포인트(Users 서비스 및 Posts 서비스)로 구성된 데모 애플리케이션을 설정해 보겠습니다.

#### Apollo를 사용한 페더레이션

필요한 의존성을 설치하는 것으로 시작합니다.

```bash
$ npm install --save @apollo/subgraph
```

#### 스키마 우선 방식 (Schema first)

"User 서비스"는 간단한 스키마를 제공합니다. `@key` 지시문에 주목하세요. 이는 `id`를 지정하면 특정 `User` 인스턴스를 가져올 수 있음을 Apollo 쿼리 플래너에게 지시합니다. 또한, `Query` 타입을 `extend`하는 것에 주목하세요.

```graphql
type User @key(fields: "id") {
  id: ID!
  name: String!
}

extend type Query {
  getUser(id: ID!): User
}
```

리졸버는 `resolveReference()`라는 추가적인 메서드를 하나 더 제공합니다. 이 메서드는 관련 리소스가 User 인스턴스를 필요로 할 때 Apollo Gateway에 의해 트리거됩니다. Posts 서비스에서 이에 대한 예시를 나중에 볼 것입니다. 메서드에는 `@ResolveReference()` 데코레이터가 붙어야 한다는 점을 유의하십시오.

```typescript
import { Args, Query, Resolver, ResolveReference } from '@nestjs/graphql';
import { UsersService } from './users.service';

@Resolver('User')
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query()
  getUser(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: string }) {
    return this.usersService.findById(reference.id);
  }
}
```

마지막으로, `GraphQLModule`을 등록하고 구성 객체에 `ApolloFederationDriver` 드라이버를 전달하여 모든 것을 연결합니다.

```typescript
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      typePaths: ['**/*.graphql'],
    }),
  ],
  providers: [UsersResolver],
})
export class AppModule {}
```

#### 코드 우선 방식 (Code first)

`User` 엔티티에 몇 가지 추가 데코레이터를 추가하는 것으로 시작합니다.

```ts
import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;
}
```

리졸버는 `resolveReference()`라는 추가적인 메서드를 하나 더 제공합니다. 이 메서드는 관련 리소스가 User 인스턴스를 필요로 할 때 Apollo Gateway에 의해 트리거됩니다. Posts 서비스에서 이에 대한 예시를 나중에 볼 것입니다. 메서드에는 `@ResolveReference()` 데코레이터가 붙어야 한다는 점을 유의하십시오.

```ts
import { Args, Query, Resolver, ResolveReference } from '@nestjs/graphql';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => User)
  getUser(@Args('id') id: number): User {
    return this.usersService.findById(id);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: number }): User {
    return this.usersService.findById(reference.id);
  }
}
```

마지막으로, `GraphQLModule`을 등록하고 구성 객체에 `ApolloFederationDriver` 드라이버를 전달하여 모든 것을 연결합니다.

```typescript
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service'; // 이 예시에는 포함되지 않음

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [UsersResolver, UsersService],
})
export class AppModule {}
```

작동하는 예시는 코드 우선 방식의 경우 [여기](https://github.com/nestjs/nest/tree/master/sample/31-graphql-federation-code-first/users-application)에서, 스키마 우선 방식의 경우 [여기](https://github.com/nestjs/nest/tree/master/sample/32-graphql-federation-schema-first/users-application)에서 확인할 수 있습니다.

#### 페더레이션 예시: Posts

Post 서비스는 `getPosts` 쿼리를 통해 집계된 게시물을 제공하는 동시에 `user.posts` 필드를 사용하여 `User` 타입을 확장하도록 되어 있습니다.

#### 스키마 우선 방식 (Schema first)

"Posts 서비스"는 `extend` 키워드를 사용하여 스키마에서 `User` 타입을 참조합니다. 또한 `User` 타입에 추가 속성(`posts`) 하나를 선언합니다. User 인스턴스를 일치시키는 데 사용되는 `@key` 지시문과 `id` 필드가 다른 곳에서 관리됨을 나타내는 `@external` 지시문에 주목하세요.

```graphql
type Post @key(fields: "id") {
  id: ID!
  title: String!
  body: String!
  user: User
}

extend type User @key(fields: "id") {
  id: ID! @external
  posts: [Post]
}

extend type Query {
  getPosts: [Post]
}
```

다음 예시에서 `PostsResolver`는 `getUser()` 메서드를 제공하며, 이 메서드는 `__typename`과 레퍼런스를 해결하는 데 애플리케이션이 필요할 수 있는 추가 속성들(이 경우 `id`)을 포함하는 레퍼런스를 반환합니다. `__typename`은 GraphQL Gateway에서 User 타입에 대한 책임을 가진 마이크로서비스를 찾아 해당 인스턴스를 검색하는 데 사용됩니다. 위에서 설명한 "Users 서비스"는 `resolveReference()` 메서드 실행 시 요청될 것입니다.

```typescript
import { Query, Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './posts.interfaces';

@Resolver('Post')
export class PostsResolver {
  constructor(private postsService: PostsService) {}

  @Query('getPosts')
  getPosts() {
    return this.postsService.findAll();
  }

  @ResolveField('user')
  getUser(@Parent() post: Post) {
    return { __typename: 'User', id: post.userId };
  }
}
```

마지막으로, "Users 서비스" 섹션에서 했던 것과 유사하게 `GraphQLModule`을 등록해야 합니다.

```typescript
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { PostsResolver } from './posts.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      typePaths: ['**/*.graphql'],
    }),
  ],
  providers: [PostsResolvers],
})
export class AppModule {}
```

#### 코드 우선 방식 (Code first)

먼저, `User` 엔티티를 나타내는 클래스를 선언해야 합니다. 엔티티 자체는 다른 서비스에 있지만, 여기서 이를 사용할 것입니다(정의를 확장). `@extends` 및 `@external` 지시문에 주목하세요.

```ts
import { Directive, ObjectType, Field, ID } from '@nestjs/graphql';
import { Post } from './post.entity';

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  @Directive('@external')
  id: number;

  @Field(() => [Post])
  posts?: Post[];
}
```

이제 다음과 같이 `User` 엔티티에 대한 확장 리졸버를 생성해 봅시다.

```ts
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { User } from './user.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly postsService: PostsService) {}

  @ResolveField(() => [Post])
  public posts(@Parent() user: User): Post[] {
    return this.postsService.forAuthor(user.id);
  }
}
```

`Post` 엔티티 클래스도 정의해야 합니다.

```ts
import { Directive, Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class Post {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field(() => Int)
  authorId: number;

  @Field(() => User)
  user?: User;
}
```

그리고 해당 리졸버입니다.

```ts
import { Query, Args, ResolveField, Resolver, Parent } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { User } from './user.entity';

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => Post)
  findPost(@Args('id') id: number): Post {
    return this.postsService.findOne(id);
  }

  @Query(() => [Post])
  getPosts(): Post[] {
    return this.postsService.all();
  }

  @ResolveField(() => User)
  user(@Parent() post: Post): any {
    return { __typename: 'User', id: post.authorId };
  }
}
```

마지막으로, 이를 모듈로 묶습니다. 스키마 빌드 옵션에서 `User`가 고립된 (외부) 타입임을 지정한 부분에 주목하세요.

```ts
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { User } from './user.entity';
import { PostsResolvers } from './posts.resolvers';
import { UsersResolvers } from './users.resolvers';
import { PostsService } from './posts.service'; // 예시에는 포함되지 않음

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
    }),
  ],
  providers: [PostsResolver, UsersResolver, PostsService],
})
export class AppModule {}
```

작동하는 예시는 코드 우선 방식의 경우 [여기](https://github.com/nestjs/nest/tree/master/sample/31-graphql-federation-code-first/posts-application)에서, 스키마 우선 방식의 경우 [여기](https://github.com/nestjs/nest/tree/master/sample/32-graphql-federation-schema-first/posts-application)에서 확인할 수 있습니다.

#### 페더레이션 예시: Gateway

필요한 의존성을 설치하는 것으로 시작합니다.

```bash
$ npm install --save @apollo/gateway
```

게이트웨이는 지정된 엔드포인트 목록을 필요로 하며, 해당 스키마를 자동으로 검색합니다. 따라서 게이트웨이 서비스의 구현은 코드 우선 방식과 스키마 우선 방식 모두 동일하게 유지됩니다.

```typescript
import { IntrospectAndCompose } from '@apollo/gateway';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        // ... Apollo 서버 옵션
        cors: true,
      },
      gateway: {
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            { name: 'users', url: 'http://user-service/graphql' },
            { name: 'posts', url: 'http://post-service/graphql' },
          ],
        }),
      },
    }),
  ],
})
export class AppModule {}
```

작동하는 예시는 코드 우선 방식의 경우 [여기](https://github.com/nestjs/nest/tree/master/sample/31-graphql-federation-code-first/gateway)에서, 스키마 우선 방식의 경우 [여기](https://github.com/nestjs/nest/tree/master/sample/32-graphql-federation-schema-first/gateway)에서 확인할 수 있습니다.

#### Mercurius를 사용한 페더레이션

필요한 의존성을 설치하는 것으로 시작합니다.

```bash
$ npm install --save @apollo/subgraph @nestjs/mercurius
```

> info **참고** `@apollo/subgraph` 패키지는 서브그래프 스키마를 빌드하기 위해 (`buildSubgraphSchema`, `printSubgraphSchema` 함수) 필요합니다.

#### 스키마 우선 방식 (Schema first)

"User 서비스"는 간단한 스키마를 제공합니다. `@key` 지시문에 주목하세요. 이는 `id`를 지정하면 특정 `User` 인스턴스를 가져올 수 있음을 Mercurius 쿼리 플래너에게 지시합니다. 또한, `Query` 타입을 `extend`하는 것에 주목하세요.

```graphql
type User @key(fields: "id") {
  id: ID!
  name: String!
}

extend type Query {
  getUser(id: ID!): User
}
```

리졸버는 `resolveReference()`라는 추가적인 메서드를 하나 더 제공합니다. 이 메서드는 관련 리소스가 User 인스턴스를 필요로 할 때 Mercurius Gateway에 의해 트리거됩니다. Posts 서비스에서 이에 대한 예시를 나중에 볼 것입니다. 메서드에는 `@ResolveReference()` 데코레이터가 붙어야 한다는 점을 유의하십시오.

```typescript
import { Args, Query, Resolver, ResolveReference } from '@nestjs/graphql';
import { UsersService } from './users.service';

@Resolver('User')
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query()
  getUser(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: string }) {
    return this.usersService.findById(reference.id);
  }
}
```

마지막으로, `GraphQLModule`을 등록하고 구성 객체에 `MercuriusFederationDriver` 드라이버를 전달하여 모든 것을 연결합니다.

```typescript
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '@nestjs/mercurius';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: ['**/*.graphql'],
      federationMetadata: true,
    }),
  ],
  providers: [UsersResolver],
})
export class AppModule {}
```

#### 코드 우선 방식 (Code first)

`User` 엔티티에 몇 가지 추가 데코레이터를 추가하는 것으로 시작합니다.

```ts
import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;
}
```

리졸버는 `resolveReference()`라는 추가적인 메서드를 하나 더 제공합니다. 이 메서드는 관련 리소스가 User 인스턴스를 필요로 할 때 Mercurius Gateway에 의해 트리거됩니다. Posts 서비스에서 이에 대한 예시를 나중에 볼 것입니다. 메서드에는 `@ResolveReference()` 데코레이터가 붙어야 한다는 점을 유의하십시오.

```ts
import { Args, Query, Resolver, ResolveReference } from '@nestjs/graphql';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => User)
  getUser(@Args('id') id: number): User {
    return this.usersService.findById(id);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: number }): User {
    return this.usersService.findById(reference.id);
  }
}
```

마지막으로, `GraphQLModule`을 등록하고 구성 객체에 `MercuriusFederationDriver` 드라이버를 전달하여 모든 것을 연결합니다.

```typescript
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '@nestjs/mercurius';
import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service'; // 이 예시에는 포함되지 않음

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      autoSchemaFile: true,
      federationMetadata: true,
    }),
  ],
  providers: [UsersResolver, UsersService],
})
export class AppModule {}
```

#### 페더레이션 예시: Posts

Post 서비스는 `getPosts` 쿼리를 통해 집계된 게시물을 제공하는 동시에 `user.posts` 필드를 사용하여 `User` 타입을 확장하도록 되어 있습니다.

#### 스키마 우선 방식 (Schema first)

"Posts 서비스"는 `extend` 키워드를 사용하여 스키마에서 `User` 타입을 참조합니다. 또한 `User` 타입에 추가 속성(`posts`) 하나를 선언합니다. User 인스턴스를 일치시키는 데 사용되는 `@key` 지시문과 `id` 필드가 다른 곳에서 관리됨을 나타내는 `@external` 지시문에 주목하세요.

```graphql
type Post @key(fields: "id") {
  id: ID!
  title: String!
  body: String!
  user: User
}

extend type User @key(fields: "id") {
  id: ID! @external
  posts: [Post]
}

extend type Query {
  getPosts: [Post]
}
```

다음 예시에서 `PostsResolver`는 `getUser()` 메서드를 제공하며, 이 메서드는 `__typename`과 레퍼런스를 해결하는 데 애플리케이션이 필요할 수 있는 추가 속성들(이 경우 `id`)을 포함하는 레퍼런스를 반환합니다. `__typename`은 GraphQL Gateway에서 User 타입에 대한 책임을 가진 마이크로서비스를 찾아 해당 인스턴스를 검색하는 데 사용됩니다. 위에서 설명한 "Users 서비스"는 `resolveReference()` 메서드 실행 시 요청될 것입니다.

```typescript
import { Query, Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './posts.interfaces';

@Resolver('Post')
export class PostsResolver {
  constructor(private postsService: PostsService) {}

  @Query('getPosts')
  getPosts() {
    return this.postsService.findAll();
  }

  @ResolveField('user')
  getUser(@Parent() post: Post) {
    return { __typename: 'User', id: post.userId };
  }
}
```

마지막으로, "Users 서비스" 섹션에서 했던 것과 유사하게 `GraphQLModule`을 등록해야 합니다.

```typescript
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '@nestjs/mercurius';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { PostsResolver } from './posts.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      federationMetadata: true,
      typePaths: ['**/*.graphql'],
    }),
  ],
  providers: [PostsResolvers],
})
export class AppModule {}
```

#### 코드 우선 방식 (Code first)

먼저, `User` 엔티티를 나타내는 클래스를 선언해야 합니다. 엔티티 자체는 다른 서비스에 있지만, 여기서 이를 사용할 것입니다(정의를 확장). `@extends` 및 `@external` 지시문에 주목하세요.

```ts
import { Directive, ObjectType, Field, ID } from '@nestjs/graphql';
import { Post } from './post.entity';

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  @Directive('@external')
  id: number;

  @Field(() => [Post])
  posts?: Post[];
}
```

이제 다음과 같이 `User` 엔티티에 대한 확장 리졸버를 생성해 봅시다.

```ts
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { User } from './user.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly postsService: PostsService) {}

  @ResolveField(() => [Post])
  public posts(@Parent() user: User): Post[] {
    return this.postsService.forAuthor(user.id);
  }
}
```

`Post` 엔티티 클래스도 정의해야 합니다.

```ts
import { Directive, Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class Post {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field(() => Int)
  authorId: number;

  @Field(() => User)
  user?: User;
}
```

그리고 해당 리졸버입니다.

```ts
import { Query, Args, ResolveField, Resolver, Parent } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { User } from './user.entity';

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => Post)
  findPost(@Args('id') id: number): Post {
    return this.postsService.findOne(id);
  }

  @Query(() => [Post])
  getPosts(): Post[] {
    return this.postsService.all();
  }

  @ResolveField(() => User)
  user(@Parent() post: Post): any {
    return { __typename: 'User', id: post.authorId };
  }
}
```

마지막으로, 이를 모듈로 묶습니다. 스키마 빌드 옵션에서 `User`가 고립된 (외부) 타입임을 지정한 부분에 주목하세요.

```ts
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '@nestjs/mercurius';
import { Module } from '@nestjs/common';
import { User } from './user.entity';
import { PostsResolvers } from './posts.resolvers';
import { UsersResolvers } from './users.resolvers';
import { PostsService } from './posts.service'; // 예시에는 포함되지 않음

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      autoSchemaFile: true,
      federationMetadata: true,
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
    }),
  ],
  providers: [PostsResolver, UsersResolver, PostsService],
})
export class AppModule {}
```

#### 페더레이션 예시: Gateway

게이트웨이는 지정된 엔드포인트 목록을 필요로 하며, 해당 스키마를 자동으로 검색합니다. 따라서 게이트웨이 서비스의 구현은 코드 우선 방식과 스키마 우선 방식 모두 동일하게 유지됩니다.

```typescript
import {
  MercuriusGatewayDriver,
  MercuriusGatewayDriverConfig,
} from '@nestjs/mercurius';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusGatewayDriverConfig>({
      driver: MercuriusGatewayDriver,
      gateway: {
        services: [
          { name: 'users', url: 'http://user-service/graphql' },
          { name: 'posts', url: 'http://post-service/graphql' },
        ],
      },
    }),
  ],
})
export class AppModule {}
```

### 페더레이션 2 (Federation 2)

[Apollo 문서](https://www.apollographql.com/docs/federation/federation-2/new-in-federation-2)를 인용하자면, 페더레이션 2는 원래 Apollo Federation(이 문서에서는 Federation 1이라고 부름)에서 개발자 경험을 개선했으며, 대부분의 원래 슈퍼그래프와 하위 호환됩니다.

> warning **경고** Mercurius는 Federation 2를 완벽하게 지원하지 않습니다. Federation 2를 지원하는 라이브러리 목록은 [여기](https://www.apollographql.com/docs/federation/supported-subgraphs#javascript--typescript)에서 확인할 수 있습니다.

다음 섹션에서는 이전 예시를 Federation 2로 업그레이드해 보겠습니다.

#### 페더레이션 예시: Users

Federation 2의 한 가지 변경 사항은 엔티티에 originating subgraph가 없으므로 더 이상 `Query`를 확장할 필요가 없다는 것입니다. 자세한 내용은 Apollo Federation 2 문서의 [엔티티 항목](https://www.apollographql.com/docs/federation/federation-2/new-in-federation-2#entities)을 참조하십시오.

#### 스키마 우선 방식 (Schema first)

스키마에서 단순히 `extend` 키워드를 제거할 수 있습니다.

```graphql
type User @key(fields: "id") {
  id: ID!
  name: String!
}

type Query {
  getUser(id: ID!): User
}
```

#### 코드 우선 방식 (Code first)

Federation 2를 사용하려면 `autoSchemaFile` 옵션에 페더레이션 버전을 명시해야 합니다.

```ts
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service'; // 이 예시에는 포함되지 않음

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
    }),
  ],
  providers: [UsersResolver, UsersService],
})
export class AppModule {}
```

#### 페더레이션 예시: Posts

위와 동일한 이유로 더 이상 `User`와 `Query`를 확장할 필요가 없습니다.

#### 스키마 우선 방식 (Schema first)

스키마에서 단순히 `extend` 및 `external` 지시문을 제거할 수 있습니다.

```graphql
type Post @key(fields: "id") {
  id: ID!
  title: String!
  body: String!
  user: User
}

type User @key(fields: "id") {
  id: ID!
  posts: [Post]
}

type Query {
  getPosts: [Post]
}
```

#### 코드 우선 방식 (Code first)

더 이상 `User` 엔티티를 확장하지 않으므로 `User`에서 `extends` 및 `external` 지시문을 단순히 제거할 수 있습니다.

```ts
import { Directive, ObjectType, Field, ID } from '@nestjs/graphql';
import { Post } from './post.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: number;

  @Field(() => [Post])
  posts?: Post[];
}
```

또한, User 서비스와 유사하게 `GraphQLModule`에 Federation 2를 사용하도록 명시해야 합니다.

```ts
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { User } from './user.entity';
import { PostsResolvers } from './posts.resolvers';
import { UsersResolvers } from './users.resolvers';
import { PostsService } from './posts.service'; // 예시에는 포함되지 않음

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
    }),
  ],
  providers: [PostsResolver, UsersResolver, PostsService],
})
export class AppModule {}
```