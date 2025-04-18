### SDL 생성하기

> warning **경고** 이 챕터는 코드 우선 접근 방식에만 적용됩니다.

GraphQL SDL 스키마를 수동으로 생성하려면 (즉, 애플리케이션 실행, 데이터베이스 연결, 리졸버 연결 등 없이) `GraphQLSchemaBuilderModule`을 사용하십시오.

```typescript
async function generateSchema() {
  const app = await NestFactory.create(GraphQLSchemaBuilderModule);
  await app.init();

  const gqlSchemaFactory = app.get(GraphQLSchemaFactory);
  const schema = await gqlSchemaFactory.create([RecipesResolver]);
  console.log(printSchema(schema));
}
```

> info **팁** `GraphQLSchemaBuilderModule`과 `GraphQLSchemaFactory`는 `@nestjs/graphql` 패키지에서 가져옵니다. `printSchema` 함수는 `graphql` 패키지에서 가져옵니다.

#### 사용법

`gqlSchemaFactory.create()` 메소드는 리졸버 클래스 참조 배열을 인자로 받습니다. 예시:

```typescript
const schema = await gqlSchemaFactory.create([
  RecipesResolver,
  AuthorsResolver,
  PostsResolvers,
]);
```

또한 스칼라 클래스 배열을 포함하는 두 번째 선택적 인자를 받을 수 있습니다:

```typescript
const schema = await gqlSchemaFactory.create(
  [RecipesResolver, AuthorsResolver, PostsResolvers],
  [DurationScalar, DateScalar],
);
```

마지막으로 옵션 객체를 전달할 수 있습니다:

```typescript
const schema = await gqlSchemaFactory.create([RecipesResolver], {
  skipCheck: true,
  orphanedTypes: [],
});
```

- `skipCheck`: 스키마 유효성 검사 무시; boolean, 기본값은 `false`입니다.
- `orphanedTypes`: 명시적으로 참조되지 않은 (객체 그래프의 일부가 아닌) 생성될 클래스 목록. 일반적으로 클래스가 선언되었지만 그래프에서 달리 참조되지 않으면 생략됩니다. 속성 값은 클래스 참조의 배열입니다.