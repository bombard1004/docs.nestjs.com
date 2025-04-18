### 데코레이터

사용 가능한 모든 OpenAPI 데코레이터는 핵심 데코레이터와 구분하기 위해 `Api` 접두사를 가집니다. 아래는 데코레이터가 적용될 수 있는 수준과 함께 내보내진 데코레이터의 전체 목록입니다.

|                           |                     |
| ------------------------- | ------------------- |
| `@ApiBasicAuth()`         | 메서드 / 컨트롤러 |
| `@ApiBearerAuth()`        | 메서드 / 컨트롤러 |
| `@ApiBody()`              | 메서드              |
| `@ApiConsumes()`          | 메서드 / 컨트롤러 |
| `@ApiCookieAuth()`        | 메서드 / 컨트롤러 |
| `@ApiExcludeController()` | 컨트롤러          |
| `@ApiExcludeEndpoint()`   | 메서드              |
| `@ApiExtension()`         | 메서드              |
| `@ApiExtraModels()`       | 메서드 / 컨트롤러 |
| `@ApiHeader()`            | 메서드 / 컨트롤러 |
| `@ApiHideProperty()`      | 모델               |
| `@ApiOAuth2()`            | 메서드 / 컨트롤러 |
| `@ApiOperation()`         | 메서드              |
| `@ApiParam()`             | 메서드 / 컨트롤러 |
| `@ApiProduces()`          | 메서드 / 컨트롤러 |
| `@ApiSchema()`            | 모델               |
| `@ApiProperty()`          | 모델               |
| `@ApiPropertyOptional()`  | 모델               |
| `@ApiQuery()`             | 메서드 / 컨트롤러 |
| `@ApiResponse()`          | 메서드 / 컨트롤러 |
| `@ApiSecurity()`          | 메서드 / 컨트롤러 |
| `@ApiTags()`              | 메서드 / 컨트롤러 |
| `@ApiCallbacks()`         | 메서드 / 컨트롤러 |