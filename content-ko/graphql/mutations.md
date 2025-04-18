### 뮤테이션

대부분의 GraphQL 논의는 데이터 페칭에 초점을 맞추지만, 모든 완전한 데이터 플랫폼은 서버 측 데이터를 수정하는 방법도 필요합니다. REST에서는 어떤 요청이든 서버에 부작용을 유발할 수 있지만, GET 요청에서는 데이터를 수정하지 않는 것이 모범 사례입니다. GraphQL도 비슷합니다 - 기술적으로 어떤 쿼리도 데이터 쓰기를 유발하도록 구현될 수 있습니다. 하지만 REST와 마찬가지로, 쓰기를 유발하는 모든 작업은 뮤테이션을 통해 명시적으로 전송해야 한다는 관례를 지키는 것이 권장됩니다 ([여기](https://graphql.org/learn/queries/#mutations)에서 더 읽어보기).

공식 [Apollo](https://www.apollographql.com/docs/graphql-tools/generate-schema.html) 문서는 `upvotePost()` 뮤테이션 예제를 사용합니다. 이 뮤테이션은 게시물의 `votes` 속성 값을 증가시키는 메서드를 구현합니다. Nest에서 동등한 뮤테이션을 생성하기 위해 `@Mutation()` 데코레이터를 사용합니다.

#### 코드 우선 방식

이전 섹션에서 사용한 `AuthorResolver`에 다른 메서드를 추가해 보겠습니다 ([리졸버](/graphql/resolvers) 참조).

```typescript
@Mutation(() => Post)
async upvotePost(@Args({ name: 'postId', type: () => Int }) postId: number) {
  return this.postsService.upvoteById({ id: postId });
}
```

> info **힌트** 모든 데코레이터(예: `@Resolver`, `@ResolveField`, `@Args` 등)는 `@nestjs/graphql` 패키지에서 내보내집니다.

이렇게 하면 SDL에서 다음 GraphQL 스키마 부분이 생성됩니다.

```graphql
type Mutation {
  upvotePost(postId: Int!): Post
}
```

`upvotePost()` 메서드는 인자로 `postId`(`Int`)를 받고 업데이트된 `Post` 엔티티를 반환합니다. [리졸버](/graphql/resolvers) 섹션에서 설명된 이유 때문에 예상 타입을 명시적으로 설정해야 합니다.

뮤테이션이 객체를 인자로 받아야 하는 경우, **입력 타입**을 생성할 수 있습니다. 입력 타입은 인자로 전달될 수 있는 특수한 종류의 객체 타입입니다 ([여기](https://graphql.org/learn/schema/#input-types)에서 더 읽어보기). 입력 타입을 선언하려면 `@InputType()` 데코레이터를 사용합니다.

```typescript
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpvotePostInput {
  @Field()
  postId: number;
}
```

> info **힌트** `@InputType()` 데코레이터는 인자로 옵션 객체를 받으므로, 예를 들어 입력 타입의 설명을 지정할 수 있습니다. TypeScript의 메타데이터 리플렉션 시스템 제한 때문에 `@Field` 데코레이터를 사용하여 타입을 수동으로 표시하거나, [CLI 플러그인](/graphql/cli-plugin)을 사용해야 합니다.

그런 다음 리졸버 클래스에서 이 타입을 사용할 수 있습니다.

```typescript
@Mutation(() => Post)
async upvotePost(
  @Args('upvotePostData') upvotePostData: UpvotePostInput,
) {}
```

#### 스키마 우선 방식

이전 섹션에서 사용한 `AuthorResolver`를 확장해 보겠습니다 ([리졸버](/graphql/resolvers) 참조).

```typescript
@Mutation()
async upvotePost(@Args('postId') postId: number) {
  return this.postsService.upvoteById({ id: postId });
}
```

위에서 비즈니스 로직이 `PostsService`로 이동했다고 가정했습니다 (게시물 쿼리 및 `votes` 속성 증가). `PostsService` 클래스 내부의 로직은 필요에 따라 간단하거나 정교할 수 있습니다. 이 예제의 핵심은 리졸버가 다른 프로바이더와 상호작용하는 방법을 보여주는 것입니다.

마지막 단계는 기존 타입 정의에 뮤테이션을 추가하는 것입니다.

```graphql
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post]
}

type Post {
  id: Int!
  title: String
  votes: Int
}

type Query {
  author(id: Int!): Author
}

type Mutation {
  upvotePost(postId: Int!): Post
}
```

이제 `upvotePost(postId: Int!): Post` 뮤테이션은 애플리케이션의 GraphQL API의 일부로서 호출될 수 있습니다.