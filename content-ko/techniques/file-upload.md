### 파일 업로드

파일 업로드를 처리하기 위해 Nest는 Express용 [multer](https://github.com/expressjs/multer) 미들웨어 패키지를 기반으로 하는 내장 모듈을 제공합니다. Multer는 주로 HTTP `POST` 요청을 통해 파일을 업로드하는 데 사용되는 `multipart/form-data` 형식으로 게시된 데이터를 처리합니다. 이 모듈은 완전히 구성 가능하며 애플리케이션 요구 사항에 맞게 동작을 조정할 수 있습니다.

> warning **경고** Multer는 지원되는 멀티파트 형식(`multipart/form-data`)이 아닌 데이터를 처리할 수 없습니다. 또한, 이 패키지는 `FastifyAdapter`와 호환되지 않습니다.

더 나은 타입 안전성을 위해 Multer 타입 패키지를 설치하겠습니다.

```shell
$ npm i -D @types/multer
```

이 패키지가 설치되면 이제 `Express.Multer.File` 타입을 사용할 수 있습니다 (이 타입은 다음과 같이 임포트할 수 있습니다: `import {{ '{' }} Express {{ '}' }} from 'express'`).

#### 기본 예제

단일 파일을 업로드하려면 `FileInterceptor()` 인터셉터를 라우트 핸들러에 연결하고 `@UploadedFile()` 데코레이터를 사용하여 `request`에서 `file`을 추출하기만 하면 됩니다.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  console.log(file);
}
@@switch
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
@Bind(UploadedFile())
uploadFile(file) {
  console.log(file);
}
```

> info **힌트** `FileInterceptor()` 데코레이터는 `@nestjs/platform-express` 패키지에서 익스포트됩니다. `@UploadedFile()` 데코레이터는 `@nestjs/common`에서 익스포트됩니다.

`FileInterceptor()` 데코레이터는 두 개의 인수를 가집니다:

- `fieldName`: 파일이 담긴 HTML 폼 필드의 이름을 제공하는 문자열
- `options`: `MulterOptions` 타입의 선택적 객체입니다. 이는 multer 생성자에서 사용하는 것과 동일한 객체입니다 ([여기](https://github.com/expressjs/multer#multeropts)에서 자세한 내용 확인).

> warning **경고** `FileInterceptor()`는 Google Firebase 또는 다른 제3자 클라우드 제공업체와 호환되지 않을 수 있습니다.

#### 파일 유효성 검사

종종 파일 크기나 파일 MIME 타입과 같은 들어오는 파일 메타데이터의 유효성을 검사하는 것이 유용할 수 있습니다. 이를 위해 사용자 지정 [파이프](https://docs.nestjs.com/pipes)를 생성하고 `UploadedFile` 데코레이터로 주석이 달린 매개변수에 바인딩할 수 있습니다. 아래 예시는 기본적인 파일 크기 유효성 검사 파이프가 어떻게 구현될 수 있는지 보여줍니다.

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // "value"는 파일 속성 및 메타데이터를 포함하는 객체입니다.
    const oneKb = 1000;
    return value.size < oneKb;
  }
}
```

이는 다음과 같이 `FileInterceptor`와 함께 사용할 수 있습니다.

```typescript
@Post('file')
@UseInterceptors(FileInterceptor('file'))
uploadFileAndValidate(@UploadedFile(
  new FileSizeValidationPipe(),
  // 여기에 다른 파이프를 추가할 수 있습니다
) file: Express.Multer.File, ) {
  return file;
}
```

Nest는 일반적인 사용 사례를 처리하고 새로운 유효성 검사 추가를 용이하게/표준화하기 위한 내장 파이프를 제공합니다. 이 파이프는 `ParseFilePipe`라고 하며, 다음과 같이 사용할 수 있습니다.

```typescript
@Post('file')
uploadFileAndPassValidation(
  @Body() body: SampleDto,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        // ... 여기에 파일 유효성 검사 인스턴스 집합
      ]
    })
  )
  file: Express.Multer.File,
) {
  return {
    body,
    file: file.buffer.toString(),
  };
}
```

보시다시피, `ParseFilePipe`에 의해 실행될 파일 유효성 검사 배열을 지정해야 합니다. 유효성 검사기의 인터페이스에 대해 논의하겠지만, 이 파이프는 또한 두 가지 추가 **선택적** 옵션을 가지고 있다는 점을 언급할 가치가 있습니다.

<table>
  <tr>
    <td><code>errorHttpStatusCode</code></td>
    <td><b>어떤</b> 유효성 검사기라도 실패하는 경우 발생시킬 HTTP 상태 코드입니다. 기본값은 <code>400</code> (BAD REQUEST)입니다.</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td>오류 메시지를 받아 오류를 반환하는 팩토리입니다.</td>
  </tr>
</table>

이제 `FileValidator` 인터페이스로 돌아가 보겠습니다. 이 파이프와 유효성 검사기를 통합하려면 내장된 구현을 사용하거나 사용자 정의 `FileValidator`를 제공해야 합니다. 아래 예시를 참고하세요.

```typescript
export abstract class FileValidator<TValidationOptions = Record<string, any>> {
  constructor(protected readonly validationOptions: TValidationOptions) {}

  /**
   * 생성자에서 전달된 옵션에 따라 이 파일이 유효한 것으로 간주되어야 하는지 여부를 나타냅니다.
   * @param file 요청 객체에서 가져온 파일
   */
  abstract isValid(file?: any): boolean | Promise<boolean>;

  /**
   * 유효성 검사가 실패하는 경우 오류 메시지를 빌드합니다.
   * @param file 요청 객체에서 가져온 파일
   */
  abstract buildErrorMessage(file: any): string;
}
```

> info **힌트** `FileValidator` 인터페이스는 `isValid` 함수를 통해 비동기 유효성 검사를 지원합니다. 타입 안전성을 활용하려면 express(기본값)를 드라이버로 사용하는 경우 `file` 매개변수를 `Express.Multer.File`로 타입 지정할 수도 있습니다.

`FileValidator`는 파일 객체에 접근하고 클라이언트가 제공한 옵션에 따라 유효성을 검사하는 일반 클래스입니다. Nest에는 프로젝트에서 사용할 수 있는 두 가지 내장 `FileValidator` 구현이 있습니다.

- `MaxFileSizeValidator` - 주어진 파일 크기가 제공된 값(단위는 `바이트`)보다 작은지 확인합니다.
- `FileTypeValidator` - 주어진 파일의 MIME 타입이 주어진 문자열 또는 RegExp와 일치하는지 확인합니다. 기본적으로 파일 내용의 [매직 넘버](https://www.ibm.com/support/pages/what-magic-number)를 사용하여 MIME 타입을 검사합니다.

이들이 앞에서 언급한 `ParseFilePipe`와 함께 어떻게 사용될 수 있는지 이해하기 위해, 마지막으로 제시된 예시의 수정된 스니펫을 사용하겠습니다.

```typescript
@UploadedFile(
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 1000 }),
      new FileTypeValidator({ fileType: 'image/jpeg' }),
    ],
  }),
)
file: Express.Multer.File,
```

> info **힌트** 유효성 검사기의 수가 크게 늘어나거나 옵션이 파일을 어지럽히는 경우, 이 배열을 별도의 파일에 정의하고 `fileValidators`와 같은 이름으로 이곳에 상수로 임포트할 수 있습니다.

마지막으로, 유효성 검사기를 구성하고 구성할 수 있는 특별한 `ParseFilePipeBuilder` 클래스를 사용할 수 있습니다. 아래에 표시된 대로 사용하면 각 유효성 검사기를 수동으로 인스턴스화하는 것을 피하고 옵션을 직접 전달할 수 있습니다.

```typescript
@UploadedFile(
  new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: 'jpeg',
    })
    .addMaxSizeValidator({
      maxSize: 1000
    })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
    }),
)
file: Express.Multer.File,
```

> info **힌트** 파일 존재 여부는 기본적으로 필수이지만, `build` 함수 옵션( `errorHttpStatusCode`와 같은 수준) 내에 `fileIsRequired: false` 매개변수를 추가하여 선택 사항으로 만들 수 있습니다.

#### 파일 배열

(단일 필드 이름으로 식별되는) 파일 배열을 업로드하려면 `FilesInterceptor()` 데코레이터를 사용하십시오 (데코레이터 이름에 복수형인 **Files**에 유의하십시오). 이 데코레이터는 세 가지 인수를 가집니다:

- `fieldName`: 위에서 설명한 바와 같습니다.
- `maxCount`: 허용할 파일의 최대 수를 정의하는 선택적 숫자입니다.
- `options`: 위에서 설명한 선택적 `MulterOptions` 객체입니다.

`FilesInterceptor()`를 사용할 때 `@UploadedFiles()` 데코레이터로 `request`에서 파일을 추출합니다.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
@@switch
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
@Bind(UploadedFiles())
uploadFile(files) {
  console.log(files);
}
```

> info **힌트** `FilesInterceptor()` 데코레이터는 `@nestjs/platform-express` 패키지에서 익스포트됩니다. `@UploadedFiles()` 데코레이터는 `@nestjs/common`에서 익스포트됩니다.

#### 여러 파일

(모두 다른 필드 이름 키를 가진) 여러 파일을 업로드하려면 `FileFieldsInterceptor()` 데코레이터를 사용하십시오. 이 데코레이터는 두 가지 인수를 가집니다:

- `uploadedFields`: 객체 배열로, 각 객체는 위에서 설명한 필드 이름을 지정하는 문자열 값을 가진 필수 `name` 속성과 위에서 설명한 선택적 `maxCount` 속성을 지정합니다.
- `options`: 위에서 설명한 선택적 `MulterOptions` 객체입니다.

`FileFieldsInterceptor()`를 사용할 때 `@UploadedFiles()` 데코레이터로 `request`에서 파일을 추출합니다.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(@UploadedFiles() files: { avatar?: Express.Multer.File[], background?: Express.Multer.File[] }) {
  console.log(files);
}
@@switch
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(files) {
  console.log(files);
}
```

#### 모든 파일

임의의 필드 이름 키를 가진 모든 필드를 업로드하려면 `AnyFilesInterceptor()` 데코레이터를 사용하십시오. 이 데코레이터는 위에서 설명한 선택적 `options` 객체를 인수로 받을 수 있습니다.

`AnyFilesInterceptor()`를 사용할 때 `@UploadedFiles()` 데코레이터로 `request`에서 파일을 추출합니다.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(AnyFilesInterceptor())
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
@@switch
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(AnyFilesInterceptor())
uploadFile(files) {
  console.log(files);
}
```

#### 파일 없음

`multipart/form-data`를 허용하지만 파일 업로드는 허용하지 않으려면 `NoFilesInterceptor`를 사용하십시오. 이것은 멀티파트 데이터를 요청 본문의 속성으로 설정합니다. 요청과 함께 전송된 파일은 `BadRequestException`을 발생시킵니다.

```typescript
@Post('upload')
@UseInterceptors(NoFilesInterceptor())
handleMultiPartData(@Body() body) {
  console.log(body)
}
```

#### 기본 옵션

위에서 설명한 대로 파일 인터셉터에 Multer 옵션을 지정할 수 있습니다. 기본 옵션을 설정하려면 `MulterModule`을 임포트할 때 정적 `register()` 메서드를 호출하고 지원되는 옵션을 전달하면 됩니다. [여기](https://github.com/expressjs/multer#multeropts)에 나열된 모든 옵션을 사용할 수 있습니다.

```typescript
MulterModule.register({
  dest: './upload',
});
```

> info **힌트** `MulterModule` 클래스는 `@nestjs/platform-express` 패키지에서 익스포트됩니다.

#### 비동기 설정

`MulterModule` 옵션을 정적으로 설정하는 대신 비동기적으로 설정해야 하는 경우 `registerAsync()` 메서드를 사용하십시오. 대부분의 동적 모듈과 마찬가지로 Nest는 비동기 구성을 처리하는 여러 기술을 제공합니다.

한 가지 기술은 팩토리 함수를 사용하는 것입니다:

```typescript
MulterModule.registerAsync({
  useFactory: () => ({
    dest: './upload',
  }),
});
```

다른 [팩토리 프로바이더](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory)와 마찬가지로, 우리의 팩토리 함수는 `async`일 수 있으며 `inject`를 통해 의존성을 주입받을 수 있습니다.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    dest: configService.get<string>('MULTER_DEST'),
  }),
  inject: [ConfigService],
});
```

또는 아래에 표시된 대로 팩토리 대신 클래스를 사용하여 `MulterModule`을 구성할 수 있습니다:

```typescript
MulterModule.registerAsync({
  useClass: MulterConfigService,
});
```

위 구성은 `MulterModule` 내에서 `MulterConfigService`를 인스턴스화하고, 이를 사용하여 필요한 옵션 객체를 생성합니다. 이 예제에서 `MulterConfigService`는 아래에 표시된 대로 `MulterOptionsFactory` 인터페이스를 구현해야 합니다. `MulterModule`은 제공된 클래스의 인스턴스화된 객체에서 `createMulterOptions()` 메서드를 호출합니다.

```typescript
@Injectable()
class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      dest: './upload',
    };
  }
}
```

`MulterModule` 내에 개인 복사본을 생성하는 대신 기존 옵션 프로바이더를 재사용하고 싶다면 `useExisting` 구문을 사용하십시오.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

`registerAsync()` 메서드에 이른바 `extraProviders`를 전달할 수도 있습니다. 이 프로바이더들은 모듈 프로바이더와 병합됩니다.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useClass: ConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

이는 팩토리 함수나 클래스 생성자에 추가적인 의존성을 제공하려는 경우 유용합니다.

#### 예제

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/29-file-upload)에서 확인할 수 있습니다.