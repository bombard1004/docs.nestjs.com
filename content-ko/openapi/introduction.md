### 소개

[OpenAPI](https://swagger.io/specification/) 명세는 RESTful API를 설명하는 데 사용되는 언어 독립적인 정의 형식입니다. Nest는 데코레이터를 활용하여 이러한 명세를 생성할 수 있도록 전용 [모듈](https://github.com/nestjs/swagger)을 제공합니다.

#### 설치

사용을 시작하려면 먼저 필요한 의존성을 설치합니다.

```bash
$ npm install --save @nestjs/swagger
```

#### 부트스트랩

설치 프로세스가 완료되면, `main.ts` 파일을 열고 `SwaggerModule` 클래스를 사용하여 Swagger를 초기화합니다:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> info **힌트** `SwaggerModule#createDocument()` 팩토리 메서드는 특히 요청 시 Swagger 문서를 생성하는 데 사용됩니다. 이 접근 방식은 초기화 시간을 절약하는 데 도움이 되며, 결과 문서는 [OpenAPI 문서](https://swagger.io/specification/#openapi-document) 명세를 따르는 직렬화 가능한 객체입니다. HTTP를 통해 문서를 제공하는 대신 JSON 또는 YAML 파일로 저장하고 다양한 방식으로 사용할 수도 있습니다.

`DocumentBuilder`는 OpenAPI 명세를 따르는 기본 문서를 구성하는 데 도움이 됩니다. 이는 제목, 설명, 버전 등의 속성을 설정할 수 있는 여러 메서드를 제공합니다. 모든 HTTP 경로가 정의된 전체 문서를 생성하려면 `SwaggerModule` 클래스의 `createDocument()` 메서드를 사용합니다. 이 메서드는 두 가지 인수를 받는데, 애플리케이션 인스턴스와 Swagger 옵션 객체입니다. 선택적으로 세 번째 인수를 제공할 수 있으며, 이는 `SwaggerDocumentOptions` 타입이어야 합니다. 이에 대한 자세한 내용은 [문서 옵션 섹션](/openapi/introduction#document-options)에서 확인할 수 있습니다.

문서를 생성한 후에는 `setup()` 메서드를 호출할 수 있습니다. 이 메서드는 다음을 인수로 받습니다:

1. Swagger UI를 마운트할 경로
2. 애플리케이션 인스턴스
3. 위에서 인스턴스화된 문서 객체
4. 선택적 구성 매개변수 ([여기](/openapi/introduction#setup-options)에서 자세히 읽어보세요)

이제 다음 명령어를 실행하여 HTTP 서버를 시작할 수 있습니다:

```bash
$ npm run start
```

애플리케이션이 실행되는 동안 브라우저를 열고 `http://localhost:3000/api`로 이동하세요. Swagger UI를 볼 수 있습니다.

<figure><img src="/assets/swagger1.png" /></figure>

보시다시피 `SwaggerModule`은 모든 엔드포인트를 자동으로 반영합니다.

> info **힌트** Swagger JSON 파일을 생성하고 다운로드하려면 `http://localhost:3000/api-json`으로 이동하세요 (Swagger 문서가 `http://localhost:3000/api`에서 사용 가능하다고 가정).
> 또한 `@nestjs/swagger`의 setup 메서드만 사용하여 원하는 경로에 노출하는 것도 가능합니다. 예를 들어 다음과 같이 할 수 있습니다:
>
> ```typescript
> SwaggerModule.setup('swagger', app, documentFactory, {
>   jsonDocumentUrl: 'swagger/json',
> });
> ```
>
> 이렇게 하면 `http://localhost:3000/swagger/json`에서 노출됩니다.

> warning **경고** `fastify`와 `helmet`을 사용하는 경우, [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)에 문제가 있을 수 있습니다. 이 충돌을 해결하려면 아래와 같이 CSP를 구성하십시오:
>
> ```typescript
> app.register(helmet, {
>   contentSecurityPolicy: {
>     directives: {
>       defaultSrc: [`'self'`],
>       styleSrc: [`'self'`, `'unsafe-inline'`],
>       imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
>       scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
>     },
>   },
> });
>
> // CSP를 전혀 사용하지 않으려면 다음을 사용할 수 있습니다:
> app.register(helmet, {
>   contentSecurityPolicy: false,
> });
> ```

#### 문서 옵션

문서를 생성할 때 라이브러리의 동작을 세부적으로 조정하기 위한 몇 가지 추가 옵션을 제공할 수 있습니다. 이러한 옵션은 `SwaggerDocumentOptions` 타입이어야 하며, 다음과 같습니다:

```TypeScript
export interface SwaggerDocumentOptions {
  /**
   * 명세에 포함할 모듈 목록
   */
  include?: Function[];

  /**
   * 검사하고 명세에 포함해야 하는 추가 모델들
   */
  extraModels?: Function[];

  /**
   * `true`이면, swagger는 `setGlobalPrefix()` 메서드를 통해 설정된 전역 접두사를 무시합니다.
   */
  ignoreGlobalPrefix?: boolean;

  /**
   * `true`이면, swagger는 `include` 모듈에 의해 임포트된 모듈의 경로도 로드합니다.
   */
  deepScanRoutes?: boolean;

  /**
   * `controllerKey`, `methodKey`, 및 버전을 기반으로 `operationId`를 생성하는 데 사용될 사용자 정의 operationIdFactory.
   * @default () => controllerKey_methodKey_version
   */
  operationIdFactory?: OperationIdFactory;

  /**
   * 응답의 `links` 필드에 링크 이름을 생성하는 데 사용될 사용자 정의 linkNameFactory.
   *
   * @see [Link objects](https://swagger.io/docs/specification/links/)
   *
   * @default () => `${controllerKey}_${methodKey}_from_${fieldKey}`
   */
  linkNameFactory?: (
    controllerKey: string,
    methodKey: string,
    fieldKey: string
  ) => string;

  /*
   * 컨트롤러 이름을 기반으로 자동으로 태그를 생성합니다.
   * `false`이면, `@ApiTags()` 데코레이터를 사용하여 태그를 정의해야 합니다.
   * 그렇지 않으면, 'Controller' 접미사가 없는 컨트롤러 이름이 사용됩니다.
   * @default true
   */
  autoTagControllers?: boolean;
}
```

예를 들어, 라이브러리가 `UsersController_createUser` 대신 `createUser`와 같은 오퍼레이션 이름을 생성하도록 하려면 다음과 같이 설정할 수 있습니다:

```TypeScript
const options: SwaggerDocumentOptions =  {
  operationIdFactory: (
    controllerKey: string,
    methodKey: string
  ) => methodKey
};
const documentFactory = () => SwaggerModule.createDocument(app, config, options);
```

#### 설정 옵션

`SwaggerModule#setup` 메서드의 네 번째 인수로 `SwaggerCustomOptions` 인터페이스를 만족하는 옵션 객체를 전달하여 Swagger UI를 구성할 수 있습니다.

```TypeScript
export interface SwaggerCustomOptions {
  /**
   * `true`이면, Swagger 리소스 경로는 `setGlobalPrefix()`를 통해 설정된 전역 접두사로 시작됩니다.
   * 기본값: `false`.
   * @see https://docs.nestjs.com/faq/global-prefix
   */
  useGlobalPrefix?: boolean;

  /**
   * `false`이면, Swagger UI는 제공되지 않습니다. API 정의(JSON 및 YAML)만 액세스 가능합니다 (`/{path}-json` 및 `/{path}-yaml`에서). Swagger UI와 API 정의 모두를 완전히 비활성화하려면 `raw: false`를 사용합니다.
   * 기본값: `true`.
   * @deprecated 대신 `ui`를 사용하세요.
   */
  swaggerUiEnabled?: boolean;

  /**
   * `false`이면, Swagger UI는 제공되지 않습니다. API 정의(JSON 및 YAML)만 액세스 가능합니다 (`/{path}-json` 및 `/{path}-yaml`에서). Swagger UI와 API 정의 모두를 완전히 비활성화하려면 `raw: false`를 사용합니다.
   * 기본값: `true`.
   */
  ui?: boolean;

  /**
   * `true`이면, 모든 형식의 원시 정의가 제공됩니다.
   * 또는 제공할 형식을 지정하기 위해 배열을 전달할 수 있습니다 (예: JSON 정의만 제공하려면 `raw: ['json']`).
   * 생략되거나 빈 배열로 설정되면 정의(JSON 또는 YAML)는 제공되지 않습니다.
   * 이 옵션을 사용하여 Swagger 관련 엔드포인트의 가용성을 제어합니다.
   * 기본값: `true`.
   */
  raw?: boolean | Array<'json' | 'yaml'>;

  /**
   * Swagger UI에서 로드할 API 정의를 가리키는 URL.
   */
  swaggerUrl?: string;

  /**
   * 제공할 JSON API 정의의 경로.
   * 기본값: `<path>-json`.
   */
  jsonDocumentUrl?: string;

  /**
   * 제공할 YAML API 정의의 경로.
   * 기본값: `<path>-yaml`.
   */
  yamlDocumentUrl?: string;

  /**
   * 제공되기 전에 OpenAPI 문서를 변경할 수 있는 훅.
   * 문서는 생성된 후에 호출되며, JSON 및 YAML로 제공되기 전에 실행됩니다.
   */
  patchDocumentOnRequest?: <TRequest = any, TResponse = any>(
    req: TRequest,
    res: TResponse,
    document: OpenAPIObject
  ) => OpenAPIObject;

  /**
   * `true`이면, OpenAPI 정의 선택기가 Swagger UI 인터페이스에 표시됩니다.
   * 기본값: `false`.
   */
  explorer?: boolean;

  /**
   * 추가 Swagger UI 옵션
   */
  swaggerOptions?: SwaggerUiOptions;

  /**
   * Swagger UI 페이지에 삽입할 사용자 정의 CSS 스타일.
   */
  customCss?: string;

  /**
   * Swagger UI 페이지에 로드할 사용자 정의 CSS 스타일시트의 URL(들).
   */
  customCssUrl?: string | string[];

  /**
   * Swagger UI 페이지에 로드할 사용자 정의 JavaScript 파일의 URL(들).
   */
  customJs?: string | string[];

  /**
   * Swagger UI 페이지에 로드할 사용자 정의 JavaScript 스크립트.
   */
  customJsStr?: string | string[];

  /**
   * Swagger UI 페이지의 사용자 정의 파비콘.
   */
  customfavIcon?: string;

  /**
   * Swagger UI 페이지의 사용자 정의 제목.
   */
  customSiteTitle?: string;

  /**
   * 정적 Swagger UI 자산이 포함된 파일 시스템 경로 (예: ./node_modules/swagger-ui-dist).
   */
  customSwaggerUiPath?: string;

  /**
   * @deprecated 이 속성은 효과가 없습니다.
   */
  validatorUrl?: string;

  /**
   * @deprecated 이 속성은 효과가 없습니다.
   */
  url?: string;

  /**
   * @deprecated 이 속성은 효과가 없습니다.
   */
  urls?: Record<'url' | 'name', string>[];
}
```
> info **힌트** `ui`와 `raw`는 독립적인 옵션입니다. Swagger UI 비활성화(`ui: false`)는 API 정의(JSON/YAML)를 비활성화하지 않습니다. 반대로, API 정의 비활성화(`raw: []`)는 Swagger UI를 비활성화하지 않습니다.
>
> 예를 들어, 다음 구성은 Swagger UI를 비활성화하지만 API 정의에는 계속 액세스할 수 있도록 합니다:
> ```typescript
>const options: SwaggerCustomOptions = {
>    ui: false, // Swagger UI 비활성화
>    raw: ['json'], // JSON API 정의는 계속 액세스 가능 (YAML 비활성화)
>};
>SwaggerModule.setup('api', app, options);
> ```
>
> 이 경우 http://localhost:3000/api-json은 계속 액세스 가능하지만, http://localhost:3000/api (Swagger UI)는 액세스할 수 없습니다.


#### 예제

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/11-swagger)에서 확인할 수 있습니다.
