### 모델 공유

> warning **경고** 이 챕터는 코드 우선(code first) 접근 방식에만 적용됩니다.

프로젝트 백엔드에 TypeScript를 사용하는 가장 큰 장점 중 하나는 공통 TypeScript 패키지를 사용하여 동일한 모델을 TypeScript 기반 프런트엔드 애플리케이션에서 재사용할 수 있다는 것입니다.

하지만 문제가 있습니다. 코드 우선 접근 방식을 사용하여 생성된 모델에는 GraphQL 관련 데코레이터가 많이 붙어 있습니다. 이러한 데코레이터는 프런트엔드에서는 관련이 없으며 성능에 부정적인 영향을 미칩니다.

#### 모델 심(shim) 사용하기

이 문제를 해결하기 위해 NestJS는 `webpack` (또는 유사한 도구) 설정을 사용하여 원래 데코레이터를 비활성 코드로 대체할 수 있는 "심(shim)"을 제공합니다.
이 심을 사용하려면 `@nestjs/graphql` 패키지와 심 사이에 별칭(alias)을 설정하세요.

예를 들어, webpack의 경우 다음과 같이 해결됩니다.

```typescript
resolve: { // see: https://webpack.js.org/configuration/resolve/
  alias: {
      "@nestjs/graphql": path.resolve(__dirname, "../node_modules/@nestjs/graphql/dist/extra/graphql-model-shim")
  }
}
```

> info **팁** [TypeORM](/techniques/database) 패키지에도 유사한 심이 있으며, [여기](https://github.com/typeorm/typeorm/blob/master/extra/typeorm-model-shim.js)에서 찾을 수 있습니다.