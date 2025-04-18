### 매핑된 타입

**CRUD**(생성/읽기/업데이트/삭제)와 같은 기능을 구축할 때 기본 엔티티 타입에 대한 변형을 구성하는 것이 유용할 때가 많습니다. Nest는 이 작업을 더 편리하게 수행하기 위해 타입 변환을 수행하는 몇 가지 유틸리티 함수를 제공합니다.

#### Partial

입력 유효성 검사 타입(DTO라고도 함)을 구축할 때 동일한 타입에 대한 **생성** 및 **업데이트** 변형을 만드는 것이 유용할 때가 많습니다. 예를 들어, **생성** 변형은 모든 필드를 요구할 수 있는 반면, **업데이트** 변형은 모든 필드를 선택 사항으로 만들 수 있습니다.

Nest는 이 작업을 더 쉽게 하고 상용구 코드를 최소화하기 위해 `PartialType()` 유틸리티 함수를 제공합니다.

`PartialType()` 함수는 입력 타입의 모든 속성이 선택 사항으로 설정된 타입(클래스)을 반환합니다. 예를 들어, 다음과 같은 **생성** 타입이 있다고 가정해 보겠습니다.

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

기본적으로 이 필드들은 모두 필수입니다. 동일한 필드를 가지지만 각각이 선택 사항인 타입을 생성하려면 `PartialType()` 함수를 사용하고 클래스 참조(`CreateCatDto`)를 인수로 전달합니다.

```typescript
export class UpdateCatDto extends PartialType(CreateCatDto) {}
```

> info **힌트** `PartialType()` 함수는 `@nestjs/swagger` 패키지에서 가져옵니다.

#### Pick

`PickType()` 함수는 입력 타입에서 속성 집합을 선택하여 새로운 타입(클래스)을 구성합니다. 예를 들어, 다음과 같은 타입에서 시작한다고 가정해 보겠습니다.

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

`PickType()` 유틸리티 함수를 사용하여 이 클래스에서 속성 집합을 선택할 수 있습니다.

```typescript
export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}
```

> info **힌트** `PickType()` 함수는 `@nestjs/swagger` 패키지에서 가져옵니다.

#### Omit

`OmitType()` 함수는 입력 타입에서 모든 속성을 선택한 다음 특정 키 집합을 제거하여 타입을 구성합니다. 예를 들어, 다음과 같은 타입에서 시작한다고 가정해 보겠습니다.

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

아래에 표시된 것처럼 `name`을 **제외한** 모든 속성을 가진 파생 타입을 생성할 수 있습니다. 이 구성에서 `OmitType`의 두 번째 인수는 속성 이름 배열입니다.

```typescript
export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}
```

> info **힌트** `OmitType()` 함수는 `@nestjs/swagger` 패키지에서 가져옵니다.

#### Intersection

`IntersectionType()` 함수는 두 타입을 하나의 새로운 타입(클래스)으로 결합합니다. 예를 들어, 다음과 같은 두 타입에서 시작한다고 가정해 보겠습니다.

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  breed: string;
}

export class AdditionalCatInfo {
  @ApiProperty()
  color: string;
}
```

두 타입의 모든 속성을 결합하는 새로운 타입을 생성할 수 있습니다.

```typescript
export class UpdateCatDto extends IntersectionType(
  CreateCatDto,
  AdditionalCatInfo,
) {}
```

> info **힌트** `IntersectionType()` 함수는 `@nestjs/swagger` 패키지에서 가져옵니다.

#### 조합 (Composition)

타입 매핑 유틸리티 함수는 조합 가능합니다(composable). 예를 들어, 다음은 `CreateCatDto` 타입의 모든 속성 중에서 `name`을 제외한 속성을 가지며, 해당 속성들이 선택 사항으로 설정된 타입(클래스)을 생성합니다.

```typescript
export class UpdateCatDto extends PartialType(
  OmitType(CreateCatDto, ['name'] as const),
) {}
```