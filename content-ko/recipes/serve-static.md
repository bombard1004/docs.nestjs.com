### 정적 파일 제공

싱글 페이지 애플리케이션(SPA)과 같은 정적 콘텐츠를 제공하기 위해 [`@nestjs/serve-static`](https://www.npmjs.com/package/@nestjs/serve-static) 패키지의 `ServeStaticModule`을 사용할 수 있습니다.

#### 설치

먼저 필요한 패키지를 설치해야 합니다:

```bash
$ npm install --save @nestjs/serve-static
```

#### 부트스트랩

설치 과정이 완료되면 루트 `AppModule`에 `ServeStaticModule`을 임포트하고 `forRoot()` 메서드에 설정 객체를 전달하여 구성할 수 있습니다.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

이렇게 설정한 후, 정적 웹사이트를 빌드하고 그 내용을 `rootPath` 속성으로 지정된 위치에 배치합니다.

#### 설정

[ServeStaticModule](https://github.com/nestjs/serve-static)는 다양한 옵션으로 동작을 사용자 정의할 수 있습니다.
정적 앱을 렌더링할 경로를 설정하거나, 제외할 경로를 지정하거나, Cache-Control 응답 헤더 설정을 활성화/비활성화하는 등 다양한 설정이 가능합니다. 전체 옵션 목록은 [여기](https://github.com/nestjs/serve-static/blob/master/lib/interfaces/serve-static-options.interface.ts)에서 확인할 수 있습니다.

> warning **주의** 정적 앱의 기본 `renderPath`는 `*` (모든 경로)이며, 모듈은 응답으로 "index.html" 파일을 전송합니다.
> 이는 SPA에 대한 클라이언트 측 라우팅을 생성할 수 있게 합니다. 컨트롤러에 지정된 경로는 서버로 폴백됩니다.
> `serveRoot`, `renderPath`를 다른 옵션들과 결합하여 이 동작을 변경할 수 있습니다.
> 추가적으로, Fastify 어댑터에는 Express의 fallthrough 동작을 모방하기 위해 `serveStaticOptions.fallthrough` 옵션이 구현되었으며, 존재하지 않는 경로에 대해 404 오류 대신 `index.html`을 보내려면 `true`로 설정해야 합니다.

#### 예제

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/24-serve-static)에서 사용할 수 있습니다.
