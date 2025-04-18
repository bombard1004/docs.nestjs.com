### 확장 기능

> warning **경고** 이 챕터는 코드 우선 접근 방식에만 적용됩니다.

확장 기능은 **고급, 저수준 기능**으로, 타입 설정에서 임의의 데이터를 정의할 수 있게 합니다. 특정 필드에 사용자 정의 메타데이터를 첨부하면 더 정교하고 일반적인 솔루션을 만들 수 있습니다. 예를 들어, 확장 기능을 사용하면 특정 필드에 접근하는 데 필요한 필드 수준 역할을 정의할 수 있습니다. 이러한 역할은 런타임에 반영되어 호출자가 특정 필드를 검색할 충분한 권한이 있는지 판단할 수 있습니다.

#### 사용자 정의 메타데이터 추가

필드에 사용자 정의 메타데이터를 첨부하려면 `@nestjs/graphql` 패키지에서 익스포트된 `@Extensions()` 데코레이터를 사용합니다.

```typescript
@Field()
@Extensions({ role: Role.ADMIN })
password: string;
```

위 예제에서는 `role` 메타데이터 속성에 `Role.ADMIN` 값을 할당했습니다. `Role`은 시스템에서 사용 가능한 모든 사용자 역할을 그룹화하는 간단한 TypeScript enum입니다.

참고로, 필드에 메타데이터를 설정하는 것 외에도 `@Extensions()` 데코레이터를 클래스 레벨 및 메서드 레벨(예: 쿼리 핸들러에)에서 사용할 수 있습니다.

#### 사용자 정의 메타데이터 사용

사용자 정의 메타데이터를 활용하는 로직은 필요한 만큼 복잡할 수 있습니다. 예를 들어, 메서드 호출별 이벤트를 저장/로깅하는 간단한 인터셉터를 만들거나, 필드를 검색하는 데 필요한 역할을 호출자 권한과 일치시키는 [필드 미들웨어](/graphql/field-middleware)(필드 수준 권한 시스템)를 만들 수 있습니다.

설명을 위해, 사용자 역할(여기서는 하드코딩됨)을 대상 필드에 접근하는 데 필요한 역할과 비교하는 `checkRoleMiddleware`를 정의해 보겠습니다.

```typescript
export const checkRoleMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const { info } = ctx;
  const { extensions } = info.parentType.getFields()[info.fieldName];

  /**
   * 실제 애플리케이션에서는 "userRole" 변수가
   * 호출자(사용자)의 역할(예: "ctx.user.role")을 나타내야 합니다.
   */
  const userRole = Role.USER;
  if (userRole === extensions.role) {
    // 또는 단순히 "return null"로 무시할 수 있습니다.
    throw new ForbiddenException(
      `User does not have sufficient permissions to access "${info.fieldName}" field.`,
    );
  }
  return next();
};
```

이를 설정한 후, 다음과 같이 `password` 필드에 미들웨어를 등록할 수 있습니다.

```typescript
@Field({ middleware: [checkRoleMiddleware] })
@Extensions({ role: Role.ADMIN })
password: string;
```
