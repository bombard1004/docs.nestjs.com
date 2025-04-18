### 파일 스트리밍

> info **참고** 이 챕터는 **HTTP 애플리케이션**에서 파일을 스트리밍하는 방법을 보여줍니다. 아래 예제는 GraphQL 또는 마이크로서비스 애플리케이션에는 적용되지 않습니다.

REST API에서 클라이언트로 파일을 다시 보내고 싶을 때가 있을 수 있습니다. Nest에서 이 작업을 하려면 일반적으로 다음과 같이 합니다.

```ts
@Controller('file')
export class FileController {
  @Get()
  getFile(@Res() res: Response) {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    file.pipe(res);
  }
}
```

하지만 이렇게 하면 컨트롤러 이후의 인터셉터 로직에 대한 액세스 권한을 잃게 됩니다. 이를 처리하기 위해 `StreamableFile` 인스턴스를 반환할 수 있으며, 내부적으로 프레임워크가 응답을 파이핑하는 것을 처리합니다.

#### Streamable File 클래스

`StreamableFile`은 반환될 스트림을 보유하는 클래스입니다. 새 `StreamableFile`을 만들려면 `StreamableFile` 생성자에 `Buffer` 또는 `Stream`을 전달할 수 있습니다.

> info **팁** `StreamableFile` 클래스는 `@nestjs/common`에서 가져올 수 있습니다.

#### 크로스 플랫폼 지원

Fastify는 기본적으로 `stream.pipe(res)`를 호출하지 않고도 파일을 전송할 수 있으므로 `StreamableFile` 클래스를 전혀 사용할 필요가 없습니다. 하지만 Nest는 두 플랫폼 유형 모두에서 `StreamableFile` 사용을 지원하므로 Express와 Fastify 사이를 전환하게 될 경우 두 엔진 간의 호환성에 대해 걱정할 필요가 없습니다.

#### 예제

`package.json`을 JSON 대신 파일로 반환하는 간단한 예제를 아래에서 찾을 수 있지만, 이 아이디어는 이미지, 문서 및 기타 파일 유형으로 자연스럽게 확장됩니다.

```ts
import { Controller, Get, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }
}
```

기본 콘텐츠 유형 (`Content-Type` HTTP 응답 헤더의 값)은 `application/octet-stream`입니다. 이 값을 사용자 정의해야 하는 경우 `StreamableFile`의 `type` 옵션을 사용하거나 `res.set` 메서드 또는 [`@Header()`](/controllers#headers) 데코레이터를 사용하여 다음과 같이 할 수 있습니다.

```ts
import { Controller, Get, StreamableFile, Res } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import type { Response } from 'express'; // Assuming that we are using the ExpressJS HTTP Adapter

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file, {
      type: 'application/json',
      disposition: 'attachment; filename="package.json"',
      // If you want to define the Content-Length value to another value instead of file's length:
      // length: 123,
    });
  }

  // Or even:
  @Get()
  getFileChangingResponseObjDirectly(@Res({ passthrough: true }) res: Response): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="package.json"',
    });
    return new StreamableFile(file);
  }

  // Or even:
  @Get()
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="package.json"')
  getFileUsingStaticValues(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }
}
```
