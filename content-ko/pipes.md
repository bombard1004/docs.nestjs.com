### 파이프

파이프는 `@Injectable()` 데코레이터로 주석이 달린 클래스이며, `PipeTransform` 인터페이스를 구현합니다.

<figure>
  <img class="illustrative-image" src="/assets/Pipe_1.png" />
</figure>

파이프에는 두 가지 일반적인 사용 사례가 있습니다:

- **변환(transformation)**: 입력 데이터를 원하는 형식으로 변환합니다 (예: 문자열을 정수로).
- **유효성 검사(validation)**: 입력 데이터를 평가하여 유효하면 변경 없이 통과시키고, 그렇지 않으면 예외를 발생시킵니다.

두 경우 모두 파이프는 <a href="controllers#route-parameters">컨트롤러 라우트 핸들러</a>에 의해 처리되는 `arguments`에 대해 작동합니다. Nest는 메서드가 호출되기 직전에 파이프를 삽입하며, 파이프는 메서드로 전달될 인수를 받아 해당 인수에 대해 작동합니다. 모든 변환 또는 유효성 검사 작업은 이때 수행되며, 그 후에 (잠재적으로) 변환된 인수로 라우트 핸들러가 호출됩니다.

Nest는 바로 사용할 수 있는 여러 내장 파이프를 제공합니다. 또한 자신만의 커스텀 파이프를 구축할 수도 있습니다. 이 장에서는 내장 파이프를 소개하고 이를 라우트 핸들러에 바인딩하는 방법을 보여드리겠습니다. 그런 다음 처음부터 어떻게 구축하는지 보여주기 위해 몇 가지 커스텀 빌드된 파이프를 살펴보겠습니다.

> info **힌트** 파이프는 예외 존(exceptions zone) 내에서 실행됩니다. 이는 파이프가 예외를 발생시킬 때 예외 레이어(글로벌 예외 필터 및 현재 컨텍스트에 적용되는 <a href="/exception-filters">예외 필터</a>)에 의해 처리된다는 것을 의미합니다. 위 내용을 고려하면, 파이프에서 예외가 발생하면 컨트롤러 메서드가 후속적으로 실행되지 않는다는 것이 명확합니다. 이는 시스템 경계에서 외부 소스로부터 애플리케이션으로 들어오는 데이터를 검증하기 위한 최적의 실무 기법을 제공합니다.

#### 내장 파이프

Nest는 바로 사용할 수 있는 몇 가지 파이프를 제공합니다:

- `ValidationPipe`
- `ParseIntPipe`
- `ParseFloatPipe`
- `ParseBoolPipe`
- `ParseArrayPipe`
- `ParseUUIDPipe`
- `ParseEnumPipe`
- `DefaultValuePipe`
- `ParseFilePipe`
- `ParseDatePipe`

이들은 `@nestjs/common` 패키지에서 내보내집니다.

`ParseIntPipe` 사용법을 간략하게 살펴보겠습니다. 이는 **변환(transformation)** 사용 사례의 예로서, 파이프가 메서드 핸들러 파라미터를 자바스크립트 정수로 변환하거나 (변환에 실패하면 예외를 발생시킵니다) 보장합니다. 이 장의 후반부에서 `ParseIntPipe`의 간단한 커스텀 구현을 보여드리겠습니다. 아래의 예제 기법은 다른 내장 변환 파이프에도 적용됩니다 (`ParseBoolPipe`, `ParseFloatPipe`, `ParseEnumPipe`, `ParseArrayPipe`, `ParseDatePipe`, `ParseUUIDPipe`이며, 이 장에서는 이를 `Parse*` 파이프라고 부르겠습니다).

#### 파이프 바인딩

파이프를 사용하려면 파이프 클래스의 인스턴스를 적절한 컨텍스트에 바인딩해야 합니다. `ParseIntPipe` 예제에서는 파이프를 특정 라우트 핸들러 메서드와 연결하고 메서드 호출 전에 실행되도록 해야 합니다. 이를 위해 다음과 같은 구성을 사용하며, 이를 메서드 파라미터 레벨에서 파이프를 바인딩한다고 부릅니다:

```typescript
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}
```

이는 다음 두 조건 중 하나가 참임을 보장합니다. `findOne()` 메서드에서 받는 파라미터가 숫자이거나 (우리가 `this.catsService.findOne()` 호출에서 예상한 대로) 라우트 핸들러가 호출되기 전에 예외가 발생합니다.

예를 들어, 라우트가 다음과 같이 호출된다고 가정해 보겠습니다:

```bash
GET localhost:3000/abc
```

Nest는 다음과 같은 예외를 발생시킵니다:

```json
{
  "statusCode": 400,
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request"
}
```

이 예외는 `findOne()` 메서드의 본문이 실행되는 것을 방지합니다.

위 예제에서 우리는 인스턴스가 아닌 클래스(`ParseIntPipe`)를 전달하며, 인스턴스화 책임은 프레임워크에 맡기고 의존성 주입을 가능하게 합니다. 파이프 및 가드와 마찬가지로, 대신 인라인 인스턴스를 전달할 수도 있습니다. 인라인 인스턴스를 전달하는 것은 옵션을 전달하여 내장 파이프의 동작을 커스터마이즈하려는 경우 유용합니다:

```typescript
@Get(':id')
async findOne(
  @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
  id: number,
) {
  return this.catsService.findOne(id);
}
```

다른 변환 파이프 (**Parse*** 파이프 전체)를 바인딩하는 것도 비슷하게 작동합니다. 이 파이프들은 모두 라우트 파라미터, 쿼리 스트링 파라미터 및 요청 바디 값의 유효성을 검사하는 컨텍스트에서 작동합니다.

예를 들어 쿼리 스트링 파라미터와 함께:

```typescript
@Get()
async findOne(@Query('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}
```

다음은 `ParseUUIDPipe`를 사용하여 문자열 파라미터를 구문 분석하고 UUID인지 유효성을 검사하는 예입니다.

```typescript
@@filename()
@Get(':uuid')
async findOne(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
  return this.catsService.findOne(uuid);
}
@@switch
@Get(':uuid')
@Bind(Param('uuid', new ParseUUIDPipe()))
async findOne(uuid) {
  return this.catsService.findOne(uuid);
}
```

> info **힌트** `ParseUUIDPipe()`를 사용할 때 버전 3, 4 또는 5의 UUID를 구문 분석합니다. 특정 버전의 UUID만 필요한 경우 파이프 옵션에 버전을 전달할 수 있습니다.

위에서 우리는 다양한 `Parse*` 계열의 내장 파이프를 바인딩하는 예제를 보았습니다. 유효성 검사 파이프를 바인딩하는 것은 약간 다릅니다. 다음 섹션에서 논의하겠습니다.

> info **힌트** 또한 유효성 검사 파이프에 대한 광범위한 예제는 [유효성 검사 기법](/techniques/validation)을 참조하십시오.

#### 커스텀 파이프

언급했듯이, 자신만의 커스텀 파이프를 구축할 수 있습니다. Nest는 강력한 내장 `ParseIntPipe` 및 `ValidationPipe`를 제공하지만, 커스텀 파이프가 어떻게 구성되는지 보기 위해 각 파이프의 간단한 커스텀 버전을 처음부터 구축해 보겠습니다.

간단한 `ValidationPipe`부터 시작하겠습니다. 처음에는 단순히 입력 값을 받아들이고 즉시 동일한 값을 반환하여 항등 함수처럼 동작하게 할 것입니다.

```typescript
@@filename(validation.pipe)
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationPipe {
  transform(value, metadata) {
    return value;
  }
}
```

> info **힌트** `PipeTransform<T, R>`은 모든 파이프가 구현해야 하는 제네릭 인터페이스입니다. 이 제네릭 인터페이스는 입력 `value`의 타입을 나타내기 위해 `T`를 사용하고, `transform()` 메서드의 반환 타입을 나타내기 위해 `R`을 사용합니다.

모든 파이프는 `PipeTransform` 인터페이스 계약을 이행하기 위해 `transform()` 메서드를 구현해야 합니다. 이 메서드는 두 가지 매개변수를 가집니다:

- `value`
- `metadata`

`value` 매개변수는 현재 처리 중인 메서드 인수이며 (라우트 핸들링 메서드에 의해 수신되기 전), `metadata`는 현재 처리 중인 메서드 인수의 메타데이터입니다. 메타데이터 객체는 다음과 같은 속성을 가집니다:

```typescript
export interface ArgumentMetadata {
  type: 'body' | 'query' | 'param' | 'custom';
  metatype?: Type<unknown>;
  data?: string;
}
```

이 속성들은 현재 처리 중인 인수를 설명합니다.

<table>
  <tr>
    <td>
      <code>type</code>
    </td>
    <td>인수가 바디 <code>@Body()</code>, 쿼리 <code>@Query()</code>, 파라미터 <code>@Param()</code> 또는 커스텀 파라미터인지 나타냅니다 (<a routerLink="/custom-decorators">여기</a>에서 자세히 알아보세요).</td>
  </tr>
  <tr>
    <td>
      <code>metatype</code>
    </td>
    <td>
      인수의 메타타입을 제공합니다. 예를 들어 <code>String</code>입니다. 참고: 라우트 핸들러 메서드 시그니처에 타입 선언을 생략하거나 바닐라 자바스크립트를 사용하는 경우 값은 <code>undefined</code>입니다.
    </td>
  </tr>
  <tr>
    <td>
      <code>data</code>
    </td>
    <td>데코레이터에 전달된 문자열입니다. 예를 들어 <code>@Body('string')</code>입니다. 데코레이터 괄호를 비워두면 <code>undefined</code>입니다.</td>
  </tr>
</table>

> warning **경고** TypeScript 인터페이스는 트랜스파일 과정에서 사라집니다. 따라서 메서드 파라미터의 타입이 클래스 대신 인터페이스로 선언되면, `metatype` 값은 `Object`가 됩니다.

#### 스키마 기반 유효성 검사

유효성 검사 파이프를 좀 더 유용하게 만들어 봅시다. `CatsController`의 `create()` 메서드를 자세히 살펴보면, 서비스 메서드를 실행하기 전에 포스트 바디 객체가 유효한지 확인하고 싶을 것입니다.

```typescript
@@filename()
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
async create(@Body() createCatDto) {
  this.catsService.create(createCatDto);
}
```

`createCatDto` 바디 파라미터에 집중해 봅시다. 이 파라미터의 타입은 `CreateCatDto`입니다:

```typescript
@@filename(create-cat.dto)
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

create 메서드로 들어오는 모든 요청이 유효한 바디를 포함하도록 보장하고 싶습니다. 따라서 `createCatDto` 객체의 세 멤버를 모두 검증해야 합니다. 이 작업을 라우트 핸들러 메서드 내에서 할 수도 있지만, 이는 **단일 책임 원칙(SRP)**을 위반하므로 이상적이지 않습니다.

또 다른 접근 방식은 **유효성 검사 클래스(validator class)**를 생성하고 거기에 작업을 위임하는 것입니다. 이 방법은 각 메서드 시작 부분에서 이 유효성 검사기를 호출해야 한다는 단점이 있습니다.

유효성 검사 미들웨어를 생성하는 것은 어떨까요? 이것도 가능하지만, 애플리케이션 전체의 모든 컨텍스트에서 사용할 수 있는 **제네릭 미들웨어**를 생성하는 것은 불가능하다는 단점이 있습니다. 이는 미들웨어가 호출될 핸들러와 그 파라미터를 포함한 **실행 컨텍스트**를 알지 못하기 때문입니다.

물론 이것이 바로 파이프가 설계된 사용 사례입니다. 자, 이제 유효성 검사 파이프를 개선해 봅시다.

<app-banner-courses></app-banner-courses>

#### 객체 스키마 유효성 검사

객체 유효성 검사를 깔끔하고 [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)한 방식으로 수행하기 위한 여러 접근 방식이 있습니다. 한 가지 일반적인 접근 방식은 **스키마 기반(schema-based)** 유효성 검사를 사용하는 것입니다. 그 접근 방식을 시도해 보겠습니다.

[Zod](https://zod.dev/) 라이브러리를 사용하면 읽기 쉬운 API로 스키마를 간결하게 생성할 수 있습니다. Zod 기반 스키마를 활용하는 유효성 검사 파이프를 구축해 보겠습니다.

필요한 패키지를 설치하는 것부터 시작하십시오:

```bash
$ npm install --save zod
```

아래 코드 샘플에서 우리는 스키마를 `constructor` 인수로 받는 간단한 클래스를 생성합니다. 그런 다음 제공된 스키마에 대해 들어오는 인수의 유효성을 검사하는 `schema.parse()` 메서드를 적용합니다.

앞서 언급했듯이, **유효성 검사 파이프**는 값을 변경 없이 반환하거나 예외를 발생시킵니다.

다음 섹션에서는 `@UsePipes()` 데코레이터를 사용하여 특정 컨트롤러 메서드에 적합한 스키마를 제공하는 방법을 볼 수 있습니다. 이렇게 하면 유효성 검사 파이프를 컨텍스트 간에 재사용할 수 있게 되어 우리가 목표했던 바를 달성할 수 있습니다.

```typescript
@@filename()
import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema  } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      throw new BadRequestException('Validation failed');
    }
  }
}
@@switch
import { BadRequestException } from '@nestjs/common';

export class ZodValidationPipe {
  constructor(private schema) {}

  transform(value, metadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      throw new BadRequestException('Validation failed');
    }
  }
}

```

#### 유효성 검사 파이프 바인딩

이전에 우리는 변환 파이프 (`ParseIntPipe` 및 다른 `Parse*` 파이프)를 바인딩하는 방법을 보았습니다.

유효성 검사 파이프를 바인딩하는 것도 매우 간단합니다.

이 경우, 메서드 호출 레벨에서 파이프를 바인딩하려고 합니다. 현재 예제에서 `ZodValidationPipe`를 사용하려면 다음 단계를 수행해야 합니다:

1. `ZodValidationPipe`의 인스턴스를 생성합니다.
2. 파이프의 클래스 생성자에 컨텍스트별 Zod 스키마를 전달합니다.
3. 파이프를 메서드에 바인딩합니다.

Zod 스키마 예제:

```typescript
import { z } from 'zod';

export const createCatSchema = z
  .object({
    name: z.string(),
    age: z.number(),
    breed: z.string(),
  })
  .required();

export type CreateCatDto = z.infer<typeof createCatSchema>;
```

아래와 같이 `@UsePipes()` 데코레이터를 사용하여 이 작업을 수행합니다:

```typescript
@@filename(cats.controller)
@Post()
@UsePipes(new ZodValidationPipe(createCatSchema))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Bind(Body())
@UsePipes(new ZodValidationPipe(createCatSchema))
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **힌트** `@UsePipes()` 데코레이터는 `@nestjs/common` 패키지에서 임포트됩니다.

> warning **경고** `zod` 라이브러리는 `tsconfig.json` 파일에 `strictNullChecks` 설정이 활성화되어 있어야 합니다.

#### 클래스 유효성 검사

> warning **경고** 이 섹션의 기법은 TypeScript가 필요하며, 앱이 바닐라 자바스크립트로 작성된 경우에는 사용할 수 없습니다.

유효성 검사 기법에 대한 대체 구현을 살펴보겠습니다.

Nest는 [class-validator](https://github.com/typestack/class-validator) 라이브러리와 잘 작동합니다. 이 강력한 라이브러리를 사용하면 데코레이터 기반 유효성 검사를 사용할 수 있습니다. 데코레이터 기반 유효성 검사는 처리된 속성의 `metatype`에 접근할 수 있기 때문에 Nest의 **파이프(Pipe)** 기능과 결합될 때 특히 강력합니다. 시작하기 전에 필요한 패키지를 설치해야 합니다:

```bash
$ npm i --save class-validator class-transformer
```

설치가 완료되면 `CreateCatDto` 클래스에 몇 가지 데코레이터를 추가할 수 있습니다. 여기서 이 기법의 상당한 이점을 볼 수 있습니다. `CreateCatDto` 클래스는 포스트 바디 객체에 대한 단일 정보 소스(single source of truth)로 유지됩니다 (별도의 유효성 검사 클래스를 생성할 필요가 없습니다).

```typescript
@@filename(create-cat.dto)
import { IsString, IsInt } from 'class-validator';

export class CreateCatDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;

  @IsString()
  breed: string;
}
```

> info **힌트** class-validator 데코레이터에 대한 자세한 내용은 [여기](https://github.com/typestack/class-validator#usage)에서 확인할 수 있습니다.

이제 이 어노테이션을 사용하는 `ValidationPipe` 클래스를 생성할 수 있습니다.

```typescript
@@filename(validation.pipe)
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

> info **힌트** 참고로, 제네릭 유효성 검사 파이프를 직접 구축할 필요는 없습니다. `ValidationPipe`는 Nest에서 기본으로 제공됩니다. 내장 `ValidationPipe`는 이 장에서 구축한 샘플보다 더 많은 옵션을 제공하며, 이는 커스텀 빌드 파이프의 메커니즘을 설명하기 위해 기본으로 유지되었습니다. 자세한 내용과 다양한 예제는 [여기](/techniques/validation)에서 확인할 수 있습니다.

> warning **주의** 위에서 우리는 [class-transformer](https://github.com/typestack/class-transformer) 라이브러리를 사용했으며, 이 라이브러리는 **class-validator** 라이브러리와 동일한 저자가 만들었기 때문에 매우 잘 호환됩니다.

이 코드를 살펴보겠습니다. 먼저 `transform()` 메서드가 `async`로 표시되어 있음을 주목하십시오. 이는 Nest가 동기 및 **비동기** 파이프를 모두 지원하기 때문에 가능합니다. 이 메서드를 `async`로 만드는 이유는 일부 class-validator 유효성 검사가 [비동기](https://github.com/typestack/class-validator#custom-validation-classes)일 수 있기 때문입니다 (Promise를 활용합니다).

다음으로, 우리는 구조분해 할당을 사용하여 `ArgumentMetadata`에서 `metatype` 필드를 추출하고 (이 멤버만 추출하여 `metatype` 매개변수로 만듭니다) 있음을 주목하십시오. 이는 전체 `ArgumentMetadata`를 가져온 후 `metatype` 변수에 할당하는 추가 문장을 사용하는 것의 단축 표현입니다.

다음으로, 헬퍼 함수 `toValidate()`를 주목하십시오. 이 함수는 현재 처리 중인 인수가 네이티브 자바스크립트 타입일 때 유효성 검사 단계를 건너뛰는 역할을 합니다 (이러한 타입에는 유효성 검사 데코레이터를 붙일 수 없으므로 유효성 검사 단계를 거칠 이유가 없습니다).

다음으로, 우리는 class-transformer 함수 `plainToInstance()`를 사용하여 일반 자바스크립트 인수 객체를 타입이 지정된 객체로 변환합니다. 이는 유효성 검사를 적용할 수 있도록 하기 위함입니다. 이 작업을 수행해야 하는 이유는 네트워크 요청에서 역직렬화될 때 들어오는 포스트 바디 객체에 **타입 정보가 전혀 없기** 때문입니다 (이는 Express와 같은 기본 플랫폼의 작동 방식입니다). Class-validator는 이전에 DTO에 대해 정의한 유효성 검사 데코레이터를 사용해야 하므로, 들어오는 바디를 단순히 일반 객체가 아닌 적절하게 데코레이터가 적용된 객체로 취급하기 위해 이 변환을 수행해야 합니다.

마지막으로, 앞서 언급했듯이 이것은 **유효성 검사 파이프**이기 때문에 값을 변경 없이 반환하거나 예외를 발생시킵니다.

마지막 단계는 `ValidationPipe`를 바인딩하는 것입니다. 파이프는 파라미터 범위, 메서드 범위, 컨트롤러 범위 또는 글로벌 범위일 수 있습니다. 이전에 Zod 기반 유효성 검사 파이프에서 메서드 레벨에서 파이프를 바인딩하는 예제를 보았습니다.
아래 예제에서는 파이프 인스턴스를 라우트 핸들러 `@Body()` 데코레이터에 바인딩하여 파이프가 포스트 바디의 유효성을 검사하도록 호출되게 합니다.

```typescript
@@filename(cats.controller)
@Post()
async create(
  @Body(new ValidationPipe()) createCatDto: CreateCatDto,
) {
  this.catsService.create(createCatDto);
}
```

파라미터 범위 파이프는 유효성 검사 로직이 하나의 지정된 파라미터에만 관련된 경우 유용합니다.

#### 글로벌 범위 파이프

`ValidationPipe`가 가능한 한 제네릭하게 생성되었으므로, 이를 애플리케이션 전체의 모든 라우트 핸들러에 적용되도록 **글로벌 범위** 파이프로 설정하여 그 유용성을 최대한 발휘할 수 있습니다.

```typescript
@@filename(main)
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> warning **주의** <a href="faq/hybrid-application">하이브리드 앱</a>의 경우 `useGlobalPipes()` 메서드는 게이트웨이 및 마이크로서비스에 대한 파이프를 설정하지 않습니다. "표준" (하이브리드가 아닌) 마이크로서비스 앱의 경우 `useGlobalPipes()`는 파이프를 전역으로 마운트합니다.

글로벌 파이프는 애플리케이션 전체, 즉 모든 컨트롤러와 모든 라우트 핸들러에 사용됩니다.

의존성 주입 측면에서 볼 때, 모듈 외부에서 등록된 글로벌 파이프(위 예제의 `useGlobalPipes()`와 같이)는 바인딩이 어떤 모듈의 컨텍스트 외부에서 이루어졌기 때문에 의존성을 주입받을 수 없습니다. 이 문제를 해결하기 위해 다음 구문을 사용하여 **어떤 모듈에서든 직접** 글로벌 파이프를 설정할 수 있습니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
```

> info **힌트** 이 접근 방식을 사용하여 파이프에 대한 의존성 주입을 수행할 때, 이 구문이 어떤 모듈에서 사용되든 관계없이 파이프는 실제로 전역입니다. 이 작업은 어디에서 수행해야 할까요? 파이프(위 예제의 `ValidationPipe`)가 정의된 모듈을 선택하십시오. 또한 `useClass`는 커스텀 프로바이더 등록을 처리하는 유일한 방법이 아닙니다. 자세한 내용은 [여기](/fundamentals/custom-providers)에서 확인할 수 있습니다.

#### 내장 ValidationPipe

참고로, 제네릭 유효성 검사 파이프를 직접 구축할 필요는 없습니다. `ValidationPipe`는 Nest에서 기본으로 제공됩니다. 내장 `ValidationPipe`는 이 장에서 구축한 샘플보다 더 많은 옵션을 제공하며, 이는 커스텀 빌드 파이프의 메커니즘을 설명하기 위해 기본으로 유지되었습니다. 자세한 내용과 다양한 예제는 [여기](/techniques/validation)에서 확인할 수 있습니다.

#### 변환 사용 사례

유효성 검사가 커스텀 파이프의 유일한 사용 사례는 아닙니다. 이 장의 시작 부분에서 파이프는 입력 데이터를 원하는 형식으로 **변환**할 수도 있다고 언급했습니다. 이는 `transform` 함수에서 반환된 값이 인수의 이전 값을 완전히 덮어쓰기 때문에 가능합니다.

언제 유용할까요? 클라이언트에서 전달된 데이터가 라우트 핸들러 메서드에 의해 제대로 처리되기 전에 문자열을 정수로 변환하는 등 변경을 거쳐야 하는 경우가 있습니다. 또한 일부 필수 데이터 필드가 누락될 수 있으며, 기본값을 적용하고 싶을 수 있습니다. **변환 파이프**는 클라이언트 요청과 요청 핸들러 사이에 처리 함수를 삽입하여 이러한 기능을 수행할 수 있습니다.

다음은 문자열을 정수 값으로 구문 분석하는 역할을 하는 간단한 `ParseIntPipe`입니다. (위에서 언급했듯이 Nest는 더 정교한 내장 `ParseIntPipe`를 제공합니다. 이것은 커스텀 변환 파이프의 간단한 예제로 포함되었습니다).

```typescript
@@filename(parse-int.pipe)
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
@@switch
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe {
  transform(value, metadata) {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
```

그런 다음 아래와 같이 선택한 파라미터에 이 파이프를 바인딩할 수 있습니다:

```typescript
@@filename()
@Get(':id')
async findOne(@Param('id', new ParseIntPipe()) id) {
  return this.catsService.findOne(id);
}
@@switch
@Get(':id')
@Bind(Param('id', new ParseIntPipe()))
async findOne(id) {
  return this.catsService.findOne(id);
}
```

또 다른 유용한 변환 사용 사례는 요청에서 제공된 ID를 사용하여 데이터베이스에서 **기존 사용자** 엔티티를 선택하는 것입니다:

```typescript
@@filename()
@Get(':id')
findOne(@Param('id', UserByIdPipe) userEntity: UserEntity) {
  return userEntity;
}
@@switch
@Get(':id')
@Bind(Param('id', UserByIdPipe))
findOne(userEntity) {
  return userEntity;
}
```

이 파이프의 구현은 독자에게 맡기지만, 다른 모든 변환 파이프와 마찬가지로 입력 값(ID)을 받아 출력 값(`UserEntity` 객체)을 반환한다는 점에 주목하십시오. 이를 통해 상용구 코드를 핸들러에서 공통 파이프로 추상화하여 코드를 더 선언적이고 [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)하게 만들 수 있습니다.

#### 기본값 제공

Parse* 파이프는 파라미터 값이 정의되어 있을 것으로 예상합니다. `null` 또는 `undefined` 값을 받으면 예외를 발생시킵니다. 누락된 쿼리스트링 파라미터 값을 엔드포인트가 처리할 수 있도록 하려면, `Parse*` 파이프가 이러한 값에 대해 작동하기 전에 주입될 기본값을 제공해야 합니다. `DefaultValuePipe`가 그 목적을 수행합니다. 아래와 같이 관련 `Parse*` 파이프 앞에 `@Query()` 데코레이터에서 `DefaultValuePipe` 인스턴스를 생성하기만 하면 됩니다:

```typescript
@@filename()
@Get()
async findAll(
  @Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe) activeOnly: boolean,
  @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
) {
  return this.catsService.findAll({ activeOnly, page });
}
```
