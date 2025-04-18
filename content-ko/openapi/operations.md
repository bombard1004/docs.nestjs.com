### 작업

OpenAPI 용어에서 경로는 `/users` 또는 `/reports/summary`와 같이 API가 노출하는 엔드포인트(리소스)를 의미하며, 작업은 `GET`, `POST`, `DELETE`와 같이 이러한 경로를 조작하는 데 사용되는 HTTP 메서드를 의미합니다.

#### 태그

특정 태그에 컨트롤러를 연결하려면 `@ApiTags(...tags)` 데코레이터를 사용합니다.

```typescript
@ApiTags('cats')
@Controller('cats')
export class CatsController {}
```

#### 헤더

요청의 일부로 예상되는 사용자 지정 헤더를 정의하려면 `@ApiHeader()`를 사용합니다.

```typescript
@ApiHeader({
  name: 'X-MyHeader',
  description: 'Custom header',
})
@Controller('cats')
export class CatsController {}
```

#### 응답

사용자 지정 HTTP 응답을 정의하려면 `@ApiResponse()` 데코레이터를 사용합니다.

```typescript
@Post()
@ApiResponse({ status: 201, description: 'The record has been successfully created.'})
@ApiResponse({ status: 403, description: 'Forbidden.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

Nest는 `@ApiResponse` 데코레이터를 상속하는 몇 가지 약식 **API 응답** 데코레이터를 제공합니다.

- `@ApiOkResponse()`
- `@ApiCreatedResponse()`
- `@ApiAcceptedResponse()`
- `@ApiNoContentResponse()`
- `@ApiMovedPermanentlyResponse()`
- `@ApiFoundResponse()`
- `@ApiBadRequestResponse()`
- `@ApiUnauthorizedResponse()`
- `@ApiNotFoundResponse()`
- `@ApiForbiddenResponse()`
- `@ApiMethodNotAllowedResponse()`
- `@ApiNotAcceptableResponse()`
- `@ApiRequestTimeoutResponse()`
- `@ApiConflictResponse()`
- `@ApiPreconditionFailedResponse()`
- `@ApiTooManyRequestsResponse()`
- `@ApiGoneResponse()`
- `@ApiPayloadTooLargeResponse()`
- `@ApiUnsupportedMediaTypeResponse()`
- `@ApiUnprocessableEntityResponse()`
- `@ApiInternalServerErrorResponse()`
- `@ApiNotImplementedResponse()`
- `@ApiBadGatewayResponse()`
- `@ApiServiceUnavailableResponse()`
- `@ApiGatewayTimeoutResponse()`
- `@ApiDefaultResponse()`

```typescript
@Post()
@ApiCreatedResponse({ description: 'The record has been successfully created.'})
@ApiForbiddenResponse({ description: 'Forbidden.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

요청에 대한 반환 모델을 지정하려면 클래스를 만들고 모든 속성에 `@ApiProperty()` 데코레이터를 달아야 합니다.

```typescript
export class Cat {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

그런 다음 응답 데코레이터의 `type` 속성과 함께 `Cat` 모델을 사용할 수 있습니다.

```typescript
@ApiTags('cats')
@Controller('cats')
export class CatsController {
  @Post()
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: Cat,
  })
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }
}
```

브라우저를 열어 생성된 `Cat` 모델을 확인해 보겠습니다.

<figure><img src="/assets/swagger-response-type.png" /></figure>

각 엔드포인트나 컨트롤러에 개별적으로 응답을 정의하는 대신, `DocumentBuilder` 클래스를 사용하여 모든 엔드포인트에 대한 전역 응답을 정의할 수 있습니다. 이 접근 방식은 애플리케이션의 모든 엔드포인트에 대해 (예: `401 Unauthorized` 또는 `500 Internal Server Error`와 같은 오류에 대해) 전역 응답을 정의하려는 경우에 유용합니다.

```typescript
const config = new DocumentBuilder()
  .addGlobalResponse({
    status: 500,
    description: 'Internal server error',
  })
  // other configurations
  .build();
```

#### 파일 업로드

`@ApiBody` 데코레이터와 `@ApiConsumes()`를 함께 사용하여 특정 메서드에 대한 파일 업로드를 활성화할 수 있습니다. [파일 업로드](/techniques/file-upload) 기법을 사용하는 전체 예제는 다음과 같습니다.

```typescript
@UseInterceptors(FileInterceptor('file'))
@ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'List of cats',
  type: FileUploadDto,
})
uploadFile(@UploadedFile() file) {}
```

여기서 `FileUploadDto`는 다음과 같이 정의됩니다.

```typescript
class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
```

여러 파일 업로드를 처리하려면 다음과 같이 `FilesUploadDto`를 정의할 수 있습니다.

```typescript
class FilesUploadDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files: any[];
}
```

#### 확장

요청에 확장을 추가하려면 `@ApiExtension()` 데코레이터를 사용합니다. 확장 이름은 `x-` 접두사로 시작해야 합니다.

```typescript
@ApiExtension('x-foo', { hello: 'world' })
```

#### 고급: 제네릭 `ApiResponse`

[Raw 정의](/openapi/types-and-parameters#raw-definitions)를 제공할 수 있으므로 Swagger UI에 대한 제네릭 스키마를 정의할 수 있습니다. 다음 DTO가 있다고 가정합니다.

```ts
export class PaginatedDto<TData> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  results: TData[];
}
```

`results`에 대한 raw 정의를 나중에 제공할 것이기 때문에 `results`에 데코레이터를 달지 않습니다. 이제 다른 DTO를 정의하고 예를 들어 `CatDto`와 같이 이름을 지정합니다.

```ts
export class CatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

이를 통해 다음과 같이 `PaginatedDto<CatDto>` 응답을 정의할 수 있습니다.

```ts
@ApiOkResponse({
  schema: {
    allOf: [
      { $ref: getSchemaPath(PaginatedDto) },
      {
        properties: {
          results: {
            type: 'array',
            items: { $ref: getSchemaPath(CatDto) },
          },
        },
      },
    ],
  },
})
async findAll(): Promise<PaginatedDto<CatDto>> {}
```

이 예제에서는 응답이 `PaginatedDto`의 모든 요소와 `results` 속성이 `Array<CatDto>` 타입임을 지정합니다.

- `getSchemaPath()` 함수는 주어진 모델에 대한 OpenAPI Spec File 내에서 OpenAPI Schema 경로를 반환합니다.
- `allOf`는 OAS 3이 다양한 상속 관련 사용 사례를 다루기 위해 제공하는 개념입니다.

마지막으로 `PaginatedDto`가 어떤 컨트롤러에서도 직접 참조되지 않으므로 `SwaggerModule`은 아직 해당 모델 정의를 생성할 수 없습니다. 이 경우 [추가 모델](/openapi/types-and-parameters#extra-models)로 추가해야 합니다. 예를 들어 컨트롤러 레벨에서 `@ApiExtraModels()` 데코레이터를 다음과 같이 사용할 수 있습니다.

```ts
@Controller('cats')
@ApiExtraModels(PaginatedDto)
export class CatsController {}
```

이제 Swagger를 실행하면 이 특정 엔드포인트에 대해 생성된 `swagger.json`에 다음 응답이 정의되어 있어야 합니다.

```json
"responses": {
  "200": {
    "description": "",
    "content": {
      "application/json": {
        "schema": {
          "allOf": [
            {
              "$ref": "#/components/schemas/PaginatedDto"
            },
            {
              "properties": {
                "results": {
                  "$ref": "#/components/schemas/CatDto"
                }
              }
            }
          ]
        }
      }
    }
  }
}
```

재사용 가능하게 만들려면 `PaginatedDto`에 대한 사용자 지정 데코레이터를 다음과 같이 만들 수 있습니다.

```ts
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedDto) },
          {
            properties: {
              results: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
```

> info **힌트** `Type<any>` 인터페이스와 `applyDecorators` 함수는 `@nestjs/common` 패키지에서 가져옵니다.

`SwaggerModule`이 모델에 대한 정의를 생성하도록 하려면 컨트롤러에서 `PaginatedDto`로 이전에 했던 것처럼 추가 모델로 추가해야 합니다.

이를 통해 엔드포인트에 사용자 지정 `@ApiPaginatedResponse()` 데코레이터를 사용할 수 있습니다.

```ts
@ApiPaginatedResponse(CatDto)
async findAll(): Promise<PaginatedDto<CatDto>> {}
```

클라이언트 생성 도구의 경우 이 접근 방식은 클라이언트에 `PaginatedResponse<TModel>`이 생성되는 방식에 모호성을 야기합니다. 다음 스니펫은 위 `GET /` 엔드포인트에 대한 클라이언트 생성 결과의 예시입니다.

```typescript
// Angular
findAll(): Observable<{ total: number, limit: number, offset: number, results: CatDto[] }>
```

보시다시피 여기서 **반환 타입**은 모호합니다. 이 문제를 해결하기 위해 `ApiPaginatedResponse`의 `schema`에 `title` 속성을 추가할 수 있습니다.

```typescript
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        title: `PaginatedResponseOf${model.name}`,
        allOf: [
          // ...
        ],
      },
    }),
  );
};
```

이제 클라이언트 생성 도구의 결과는 다음과 같습니다.

```ts
// Angular
findAll(): Observable<PaginatedResponseOfCatDto>
```