### 매핑된 타입

> warning **경고** 이 챕터는 코드 우선 접근 방식에만 해당됩니다.

CRUD(생성/읽기/업데이트/삭제)와 같은 기능을 구축할 때 기본 엔티티 타입의 변형을 구성하는 것이 유용할 때가 많습니다. Nest는 이 작업을 더 편리하게 만들어주는 타입 변환을 수행하는 몇 가지 유틸리티 함수를 제공합니다.

#### Partial

입력 유효성 검사 타입(Data Transfer Object 또는 DTO라고도 함)을 구축할 때, 동일한 타입에 대한 **생성(create)** 및 **업데이트(update)** 변형을 구축하는 것이 유용할 때가 많습니다. 예를 들어, **생성** 변형은 모든 필드를 요구할 수 있지만, **업데이트** 변형은 모든 필드를 선택 사항으로 만들 수 있습니다.

Nest는 이 작업을 쉽게 하고 상용구(boilerplate) 코드를 최소화하기 위해 `PartialType()` 유틸리티 함수를 제공합니다.

`PartialType()` 함수는 입력 타입의 모든 속성이 선택 사항으로 설정된 타입(클래스)을 반환합니다. 예를 들어, 다음과 같은 **생성** 타입이 있다고 가정해 보겠습니다.

```typescript
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  firstName: string;
}
```

기본적으로 이 필드는 모두 필수입니다. 동일한 필드를 갖지만 각각이 선택 사항인 타입을 생성하려면, `PartialType()`을 사용하고 클래스 참조(`CreateUserInput`)를 인수로 전달합니다.

```typescript
@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {}
```

> info **팁** `PartialType()` 함수는 `@nestjs/graphql` 패키지에서 가져옵니다.

`PartialType()` 함수는 선택적 두 번째 인수로 데코레이터 팩토리 참조를 받습니다. 이 인수는 결과(자식) 클래스에 적용되는 데코레이터 함수를 변경하는 데 사용할 수 있습니다. 지정하지 않으면 자식 클래스는 사실상 **부모** 클래스(첫 번째 인수로 참조된 클래스)와 동일한 데코레이터를 사용합니다. 위 예제에서는 `@InputType()` 데코레이터로 주석이 달린 `CreateUserInput`을 확장하고 있습니다. `UpdateUserInput`도 `@InputType()` 데코레이터가 적용된 것처럼 취급되기를 원하므로 `InputType`을 두 번째 인수로 전달할 필요가 없었습니다. 부모와 자식 타입이 다른 경우(예: 부모가 `@ObjectType()`으로 데코레이션된 경우) `InputType`을 두 번째 인수로 전달합니다. 예:

```typescript
@InputType()
export class UpdateUserInput extends PartialType(User, InputType) {}
```

#### Pick

`PickType()` 함수는 입력 타입에서 속성 집합을 선택하여 새로운 타입(클래스)을 구성합니다. 예를 들어, 다음과 같은 타입으로 시작한다고 가정해 보겠습니다.

```typescript
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  firstName: string;
}
```

`PickType()` 유틸리티 함수를 사용하여 이 클래스에서 속성 집합을 선택할 수 있습니다.

```typescript
@InputType()
export class UpdateEmailInput extends PickType(CreateUserInput, [
  'email',
] as const) {}
```

> info **팁** `PickType()` 함수는 `@nestjs/graphql` 패키지에서 가져옵니다.

#### Omit

`OmitType()` 함수는 입력 타입에서 모든 속성을 선택한 다음 특정 키 집합을 제거하여 타입을 구성합니다. 예를 들어, 다음과 같은 타입으로 시작한다고 가정해 보겠습니다.

```typescript
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  firstName: string;
}
```

아래와 같이 `email`을 **제외한** 모든 속성을 갖는 파생 타입을 생성할 수 있습니다. 이 구조에서 `OmitType`의 두 번째 인수는 속성 이름의 배열입니다.

```typescript
@InputType()
export class UpdateUserInput extends OmitType(CreateUserInput, [
  'email',
] as const) {}
```

> info **팁** `OmitType()` 함수는 `@nestjs/graphql` 패키지에서 가져옵니다.

#### Intersection

`IntersectionType()` 함수는 두 가지 타입을 하나의 새로운 타입(클래스)으로 결합합니다. 예를 들어, 다음과 같은 두 가지 타입으로 시작한다고 가정해 보겠습니다.

```typescript
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;
}

@ObjectType()
export class AdditionalUserInfo {
  @Field()
  firstName: string;

  @Field()
  lastName: string;
}
```

두 타입의 모든 속성을 결합한 새로운 타입을 생성할 수 있습니다.

```typescript
@InputType()
export class UpdateUserInput extends IntersectionType(
  CreateUserInput,
  AdditionalUserInfo,
) {}
```

> info **팁** `IntersectionType()` 함수는 `@nestjs/graphql` 패키지에서 가져옵니다.

#### Composition

타입 매핑 유틸리티 함수는 조합 가능합니다. 예를 들어, 다음은 `CreateUserInput` 타입의 모든 속성 중에서 `email`을 제외하고 해당 속성을 선택 사항으로 설정한 타입(클래스)을 생성합니다.

```typescript
@InputType()
export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['email'] as const),
) {}
```
