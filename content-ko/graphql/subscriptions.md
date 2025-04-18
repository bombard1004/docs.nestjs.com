### 구독

쿼리를 사용하여 데이터를 가져오고 뮤테이션을 사용하여 데이터를 수정하는 것 외에도 GraphQL 사양은 `subscription`이라고 하는 세 번째 작업 유형을 지원합니다. GraphQL 구독은 서버로부터 실시간 메시지를 수신하려는 클라이언트에게 서버에서 데이터를 푸시하는 방법입니다. 구독은 클라이언트에게 전달될 필드 집합을 지정한다는 점에서 쿼리와 유사하지만, 단일 응답을 즉시 반환하는 대신 채널이 열리고 서버에서 특정 이벤트가 발생할 때마다 결과가 클라이언트로 전송됩니다.

구독의 일반적인 사용 사례는 새로운 객체 생성, 필드 업데이트 등과 같은 특정 이벤트에 대해 클라이언트 측에 알리는 것입니다([자세히 알아보기](https://www.apollographql.com/docs/react/data/subscriptions)).

#### Apollo 드라이버로 구독 활성화

구독을 활성화하려면 `installSubscriptionHandlers` 속성을 `true`로 설정하세요.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  installSubscriptionHandlers: true,
}),
```

> warning **경고** `installSubscriptionHandlers` 구성 옵션은 Apollo 서버 최신 버전에서 제거되었으며 이 패키지에서도 곧 사용 중단될 예정입니다. 기본적으로 `installSubscriptionHandlers`는 `subscriptions-transport-ws`를 사용하도록 폴백되지만([자세히 알아보기](https://github.com/apollographql/subscriptions-transport-ws)), 대신 `graphql-ws` 라이브러리 사용을 강력히 권장합니다([자세히 알아보기](https://github.com/enisdenjo/graphql-ws)).

대신 `graphql-ws` 패키지를 사용하도록 전환하려면 다음 구성을 사용하세요.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'graphql-ws': true
  },
}),
```

> info **팁** 이전 버전과의 호환성을 위해 두 패키지(`subscriptions-transport-ws`와 `graphql-ws`)를 동시에 사용할 수도 있습니다.

#### 코드 우선 방식

코드 우선 방식으로 구독을 생성하려면 `@Subscription()` 데코레이터(`@nestjs/graphql` 패키지에서 내보냄)와 `graphql-subscriptions` 패키지의 `PubSub` 클래스를 사용합니다. `PubSub` 클래스는 간단한 **publish/subscribe API**를 제공합니다.

다음 구독 핸들러는 `PubSub#asyncIterableIterator`를 호출하여 이벤트에 **구독**하는 작업을 처리합니다. 이 메서드는 단일 인자인 `triggerName`을 받으며, 이는 이벤트 토픽 이름에 해당합니다.

```typescript
const pubSub = new PubSub();

@Resolver(() => Author)
export class AuthorResolver {
  // ...
  @Subscription(() => Comment)
  commentAdded() {
    return pubSub.asyncIterableIterator('commentAdded');
  }
}
```

> info **팁** 모든 데코레이터는 `@nestjs/graphql` 패키지에서 내보내고, `PubSub` 클래스는 `graphql-subscriptions` 패키지에서 내보냅니다.

> warning **참고** `PubSub`는 간단한 `publish` 및 `subscribe API`를 노출하는 클래스입니다. [여기](https://www.apollographql.com/docs/graphql-subscriptions/setup.html)에서 더 자세히 알아보세요. Apollo 문서는 기본 구현이 프로덕션에 적합하지 않다고 경고합니다([여기](https://github.com/apollographql/graphql-subscriptions#getting-started-with-your-first-subscription)에서 자세히 알아보세요). 프로덕션 애플리케이션은 외부 스토어에 의해 지원되는 `PubSub` 구현을 사용해야 합니다([여기](https://github.com/apollographql/graphql-subscriptions#pubsub-implementations)에서 자세히 알아보세요).

그 결과 SDL에서 GraphQL 스키마의 다음 부분이 생성됩니다.

```graphql
type Subscription {
  commentAdded(): Comment!
}
```

구독은 정의상 구독의 이름인 키를 가진 단일 최상위 속성을 가진 객체를 반환합니다. 이 이름은 구독 핸들러 메서드의 이름(예: 위의 `commentAdded`)에서 상속되거나, 아래에 표시된 것처럼 `@Subscription()` 데코레이터에 두 번째 인수로 `name` 키를 가진 옵션을 전달하여 명시적으로 제공될 수 있습니다.

```typescript
@Subscription(() => Comment, {
  name: 'commentAdded',
})
subscribeToCommentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

이 구조는 이전 코드 예제와 동일한 SDL을 생성하지만, 메서드 이름과 구독을 분리할 수 있도록 합니다.

#### 발행하기

이제 이벤트를 발행하려면 `PubSub#publish` 메서드를 사용합니다. 이는 객체 그래프의 일부가 변경되었을 때 클라이언트 측 업데이트를 트리거하기 위해 뮤테이션 내에서 자주 사용됩니다. 예시:

```typescript
@@filename(posts/posts.resolver)
@Mutation(() => Comment)
async addComment(
  @Args('postId', { type: () => Int }) postId: number,
  @Args('comment', { type: () => Comment }) comment: CommentInput,
) {
  const newComment = this.commentsService.addComment({ id: postId, comment });
  pubSub.publish('commentAdded', { commentAdded: newComment });
  return newComment;
}
```

`PubSub#publish` 메서드는 첫 번째 매개변수로 `triggerName`(다시 말해, 이벤트 토픽 이름으로 생각하세요)을 받고, 두 번째 매개변수로 이벤트 페이로드를 받습니다. 앞서 언급했듯이 구독은 정의상 값을 반환하며, 그 값은 형태를 가집니다. 우리의 `commentAdded` 구독에 대해 생성된 SDL을 다시 보세요:

```graphql
type Subscription {
  commentAdded(): Comment!
}
```

이는 구독이 `commentAdded`라는 최상위 속성 이름을 가지고 있으며, 해당 속성의 값은 `Comment` 객체여야 함을 알려줍니다. 주목해야 할 중요한 점은 `PubSub#publish` 메서드에 의해 방출된 이벤트 페이로드의 형태가 구독에서 반환될 것으로 예상되는 값의 형태와 일치해야 한다는 것입니다. 따라서 위의 예시에서 `pubSub.publish('commentAdded', {{ '{' }} commentAdded: newComment {{ '}' }})` 구문은 적절한 형태의 페이로드로 `commentAdded` 이벤트를 발행합니다. 이 형태가 일치하지 않으면 GraphQL 유효성 검사 단계에서 구독이 실패합니다.

#### 구독 필터링

특정 이벤트를 필터링하려면 `filter` 속성을 필터 함수로 설정하세요. 이 함수는 배열의 `filter`에 전달되는 함수와 유사하게 작동합니다. 이 함수는 두 가지 인자를 받습니다: 이벤트 페이로드(이벤트 발행자가 보낸)를 포함하는 `payload`와, 구독 요청 중에 전달된 모든 인자를 받는 `variables`입니다. 이 함수는 이 이벤트가 클라이언트 리스너에게 발행되어야 하는지 여부를 결정하는 불리언 값을 반환합니다.

```typescript
@Subscription(() => Comment, {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded(@Args('title') title: string) {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

#### 구독 페이로드 변형하기

발행된 이벤트 페이로드를 변형하려면 `resolve` 속성을 함수로 설정하세요. 이 함수는 이벤트 페이로드(이벤트 발행자가 보낸)를 받고 적절한 값을 반환합니다.

```typescript
@Subscription(() => Comment, {
  resolve: value => value,
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

> warning **참고** `resolve` 옵션을 사용하는 경우, 래핑되지 않은 페이로드를 반환해야 합니다 (예: 우리 예시에서는 `{{ '{' }} commentAdded: newComment {{ '}' }}` 객체가 아닌 `newComment` 객체를 직접 반환하세요).

주입된 프로바이더에 접근해야 하는 경우(예: 외부 서비스를 사용하여 데이터를 검증), 다음 구조를 사용하세요.

```typescript
@Subscription(() => Comment, {
  resolve(this: AuthorResolver, value) {
    // "this"는 "AuthorResolver" 인스턴스를 가리킵니다.
    return value;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

동일한 구조가 필터에서도 작동합니다:

```typescript
@Subscription(() => Comment, {
  filter(this: AuthorResolver, payload, variables) {
    // "this"는 "AuthorResolver" 인스턴스를 가리킵니다.
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

#### 스키마 우선 방식

Nest에서 동등한 구독을 생성하려면 `@Subscription()` 데코레이터를 사용합니다.

```typescript
const pubSub = new PubSub();

@Resolver('Author')
export class AuthorResolver {
  // ...
  @Subscription()
  commentAdded() {
    return pubSub.asyncIterableIterator('commentAdded');
  }
}
```

컨텍스트와 인수에 따라 특정 이벤트를 필터링하려면 `filter` 속성을 설정하세요.

```typescript
@Subscription('commentAdded', {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

발행된 페이로드를 변형하려면 `resolve` 함수를 사용할 수 있습니다.

```typescript
@Subscription('commentAdded', {
  resolve: value => value,
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

주입된 프로바이더에 접근해야 하는 경우(예: 외부 서비스를 사용하여 데이터를 검증), 다음 구조를 사용하세요:

```typescript
@Subscription('commentAdded', {
  resolve(this: AuthorResolver, value) {
    // "this"는 "AuthorResolver" 인스턴스를 가리킵니다.
    return value;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

동일한 구조가 필터에서도 작동합니다:

```typescript
@Subscription('commentAdded', {
  filter(this: AuthorResolver, payload, variables) {
    // "this"는 "AuthorResolver" 인스턴스를 가리킵니다.
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

마지막 단계는 타입 정의 파일을 업데이트하는 것입니다.

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

type Comment {
  id: String
  content: String
}

type Subscription {
  commentAdded(title: String!): Comment
}
```

이것으로 단일 `commentAdded(title: String!): Comment` 구독을 생성했습니다. [여기](https://github.com/nestjs/nest/blob/master/sample/12-graphql-schema-first)에서 전체 샘플 구현을 찾을 수 있습니다.

#### PubSub

위에서 로컬 `PubSub` 인스턴스를 인스턴스화했습니다. 권장되는 접근 방식은 `PubSub`를 [프로바이더](/fundamentals/custom-providers)로 정의하고 생성자를 통해 주입하는 것입니다(`@Inject()` 데코레이터 사용). 이렇게 하면 전체 애플리케이션에서 해당 인스턴스를 재사용할 수 있습니다. 예를 들어, 다음과 같이 프로바이더를 정의한 다음 필요한 곳에 `'PUB_SUB'`를 주입하세요.

```typescript
{
  provide: 'PUB_SUB',
  useValue: new PubSub(),
}
```

#### 구독 서버 사용자 정의

구독 서버를 사용자 정의하려면(예: 경로 변경) `subscriptions` 옵션 속성을 사용하세요.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'subscriptions-transport-ws': {
      path: '/graphql'
    },
  }
}),
```

구독에 `graphql-ws` 패키지를 사용하는 경우, 다음과 같이 `subscriptions-transport-ws` 키를 `graphql-ws`로 변경하세요.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'graphql-ws': {
      path: '/graphql'
    },
  }
}),
```

#### 웹소켓을 통한 인증

사용자가 인증되었는지 확인하는 작업은 `subscriptions` 옵션에 지정할 수 있는 `onConnect` 콜백 함수 내에서 수행할 수 있습니다.

`onConnect`는 첫 번째 인수로 `SubscriptionClient`에 전달된 `connectionParams`를 받습니다([자세히 알아보기](https://www.apollographql.com/docs/react/data/subscriptions/#5-authenticate-over-websocket-optional)).

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'subscriptions-transport-ws': {
      onConnect: (connectionParams) => {
        const authToken = connectionParams.authToken;
        if (!isValid(authToken)) {
          throw new Error('Token is not valid');
        }
        // 토큰에서 사용자 정보 추출
        const user = parseToken(authToken);
        // 나중에 컨텍스트에 추가하기 위해 사용자 정보 반환
        return { user };
      },
    }
  },
  context: ({ connection }) => {
    // connection.context는 "onConnect" 콜백에서 반환된 값과 동일합니다.
  },
}),
```

이 예시에서 `authToken`은 연결이 처음 설정될 때 클라이언트가 한 번만 전송합니다.
이 연결로 이루어진 모든 구독은 동일한 `authToken`을 가지므로 동일한 사용자 정보를 갖게 됩니다.

> warning **참고** `subscriptions-transport-ws`에는 연결이 `onConnect` 단계를 건너뛸 수 있도록 하는 버그가 있습니다([자세히 알아보기](https://github.com/apollographql/subscriptions-transport-ws/issues/349)). 사용자가 구독을 시작할 때 `onConnect`가 호출되었다고 가정해서는 안 되며, 항상 `context`가 채워져 있는지 확인해야 합니다.

`graphql-ws` 패키지를 사용하는 경우, `onConnect` 콜백의 시그니처가 약간 다릅니다:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'graphql-ws': {
      onConnect: (context: Context<any>) => {
        const { connectionParams, extra } = context;
        // 사용자 검증은 위 예시와 동일합니다.
        // graphql-ws와 함께 사용할 때 추가 컨텍스트 값은 extra 필드에 저장해야 합니다.
        extra.user = { user: {} };
      },
    },
  },
  context: ({ extra }) => {
    // 이제 extra 필드를 통해 추가 컨텍스트 값에 접근할 수 있습니다.
  },
});
```

#### Mercurius 드라이버로 구독 활성화

구독을 활성화하려면 `subscription` 속성을 `true`로 설정하세요.

```typescript
GraphQLModule.forRoot<MercuriusDriverConfig>({
  driver: MercuriusDriver,
  subscription: true,
}),
```

> info **팁** 옵션 객체를 전달하여 사용자 정의 이미터 설정, 수신 연결 검증 등을 수행할 수도 있습니다. [여기](https://github.com/mercurius-js/mercurius/blob/master/docs/api/options.md#plugin-options)에서 자세히 알아보세요 (`subscription` 항목 참조).

#### 코드 우선 방식

코드 우선 방식으로 구독을 생성하려면 `@Subscription()` 데코레이터(`@nestjs/graphql` 패키지에서 내보냄)와 `mercurius` 패키지의 `PubSub` 클래스를 사용합니다. `PubSub` 클래스는 간단한 **publish/subscribe API**를 제공합니다.

다음 구독 핸들러는 `pubSub.subscribe`를 호출하여 이벤트에 **구독**하는 작업을 처리합니다. 이 메서드는 단일 인자인 `triggerName`을 받으며, 이는 이벤트 토픽 이름에 해당합니다.

```typescript
@Resolver(() => Author)
export class AuthorResolver {
  // ...
  @Subscription(() => Comment)
  commentAdded(@Context('pubsub') pubSub: PubSub) {
    return pubSub.subscribe('commentAdded');
  }
}
```

> info **팁** 위 예시에서 사용된 모든 데코레이터는 `@nestjs/graphql` 패키지에서 내보내고, `PubSub` 클래스는 `mercurius` 패키지에서 내보냅니다.

> warning **참고** `PubSub`는 간단한 `publish` 및 `subscribe` API를 노출하는 클래스입니다. 사용자 정의 `PubSub` 클래스를 등록하는 방법에 대해 [이 섹션](https://github.com/mercurius-js/mercurius/blob/master/docs/subscriptions.md#subscriptions-with-custom-pubsub)을 확인하세요.

그 결과 SDL에서 GraphQL 스키마의 다음 부분이 생성됩니다.

```graphql
type Subscription {
  commentAdded(): Comment!
}
```

구독은 정의상 구독의 이름인 키를 가진 단일 최상위 속성을 가진 객체를 반환합니다. 이 이름은 구독 핸들러 메서드의 이름(예: 위의 `commentAdded`)에서 상속되거나, 아래에 표시된 것처럼 `@Subscription()` 데코레이터에 두 번째 인수로 `name` 키를 가진 옵션을 전달하여 명시적으로 제공될 수 있습니다.

```typescript
@Subscription(() => Comment, {
  name: 'commentAdded',
})
subscribeToCommentAdded(@Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
```

이 구조는 이전 코드 예제와 동일한 SDL을 생성하지만, 메서드 이름과 구독을 분리할 수 있도록 합니다.

#### 발행하기

이제 이벤트를 발행하려면 `PubSub#publish` 메서드를 사용합니다. 이는 객체 그래프의 일부가 변경되었을 때 클라이언트 측 업데이트를 트리거하기 위해 뮤테이션 내에서 자주 사용됩니다. 예시:

```typescript
@@filename(posts/posts.resolver)
@Mutation(() => Comment)
async addComment(
  @Args('postId', { type: () => Int }) postId: number,
  @Args('comment', { type: () => Comment }) comment: CommentInput,
  @Context('pubsub') pubSub: PubSub,
) {
  const newComment = this.commentsService.addComment({ id: postId, comment });
  await pubSub.publish({
    topic: 'commentAdded',
    payload: {
      commentAdded: newComment
    }
  });
  return newComment;
}
```

앞서 언급했듯이 구독은 정의상 값을 반환하며, 그 값은 형태를 가집니다. 우리의 `commentAdded` 구독에 대해 생성된 SDL을 다시 보세요:

```graphql
type Subscription {
  commentAdded(): Comment!
}
```

이는 구독이 `commentAdded`라는 최상위 속성 이름을 가지고 있으며, 해당 속성의 값은 `Comment` 객체여야 함을 알려줍니다. 주목해야 할 중요한 점은 `PubSub#publish` 메서드에 의해 방출된 이벤트 페이로드의 형태가 구독에서 반환될 것으로 예상되는 값의 형태와 일치해야 한다는 것입니다. 따라서 위의 예시에서 `pubSub.publish({{ '{' }} topic: 'commentAdded', payload: {{ '{' }} commentAdded: newComment {{ '}' }} {{ '}' }})` 구문은 적절한 형태의 페이로드로 `commentAdded` 이벤트를 발행합니다. 이 형태가 일치하지 않으면 GraphQL 유효성 검사 단계에서 구독이 실패합니다.

#### 구독 필터링

특정 이벤트를 필터링하려면 `filter` 속성을 필터 함수로 설정하세요. 이 함수는 배열의 `filter`에 전달되는 함수와 유사하게 작동합니다. 이 함수는 두 가지 인자를 받습니다: 이벤트 페이로드(이벤트 발행자가 보낸)를 포함하는 `payload`와, 구독 요청 중에 전달된 모든 인자를 받는 `variables`입니다. 이 함수는 이 이벤트가 클라이언트 리스너에게 발행되어야 하는지 여부를 결정하는 불리언 값을 반환합니다.

```typescript
@Subscription(() => Comment, {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded(@Args('title') title: string, @Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
```

주입된 프로바이더에 접근해야 하는 경우(예: 외부 서비스를 사용하여 데이터를 검증), 다음 구조를 사용하세요.

```typescript
@Subscription(() => Comment, {
  filter(this: AuthorResolver, payload, variables) {
    // "this"는 "AuthorResolver" 인스턴스를 가리킵니다.
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded(@Args('title') title: string, @Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
```

#### 스키마 우선 방식

Nest에서 동등한 구독을 생성하려면 `@Subscription()` 데코레이터를 사용합니다.

```typescript
const pubSub = new PubSub();

@Resolver('Author')
export class AuthorResolver {
  // ...
  @Subscription()
  commentAdded(@Context('pubsub') pubSub: PubSub) {
    return pubSub.subscribe('commentAdded');
  }
}
```

컨텍스트와 인수에 따라 특정 이벤트를 필터링하려면 `filter` 속성을 설정하세요.

```typescript
@Subscription('commentAdded', {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded(@Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
```

주입된 프로바이더에 접근해야 하는 경우(예: 외부 서비스를 사용하여 데이터를 검증), 다음 구조를 사용하세요:

```typescript
@Subscription('commentAdded', {
  filter(this: AuthorResolver, payload, variables) {
    // "this"는 "AuthorResolver" 인스턴스를 가리킵니다.
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded(@Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
```

마지막 단계는 타입 정의 파일을 업데이트하는 것입니다.

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

type Comment {
  id: String
  content: String
}

type Subscription {
  commentAdded(title: String!): Comment
}
```

이것으로 단일 `commentAdded(title: String!): Comment` 구독을 생성했습니다.

#### PubSub

위 예시에서는 기본 `PubSub` 이미터([mqemitter](https://github.com/mcollina/mqemitter))를 사용했습니다.
권장되는 접근 방식(프로덕션용)은 `mqemitter-redis`를 사용하는 것입니다. 또는 사용자 정의 `PubSub` 구현을 제공할 수 있습니다([여기](https://github.com/mercurius-js/mercurius/blob/master/docs/subscriptions.md)에서 자세히 알아보세요).

```typescript
GraphQLModule.forRoot<MercuriusDriverConfig>({
  driver: MercuriusDriver,
  subscription: {
    emitter: require('mqemitter-redis')({
      port: 6579,
      host: '127.0.0.1',
    }),
  },
});
```

#### 웹소켓을 통한 인증

사용자가 인증되었는지 확인하는 작업은 `subscription` 옵션에 지정할 수 있는 `verifyClient` 콜백 함수 내에서 수행할 수 있습니다.

`verifyClient`는 첫 번째 인수로 `info` 객체를 받으며, 이를 사용하여 요청의 헤더를 검색할 수 있습니다.

```typescript
GraphQLModule.forRoot<MercuriusDriverConfig>({
  driver: MercuriusDriver,
  subscription: {
    verifyClient: (info, next) => {
      const authorization = info.req.headers?.authorization as string;
      if (!authorization?.startsWith('Bearer ')) {
        return next(false);
      }
      next(true);
    },
  }
}),
```