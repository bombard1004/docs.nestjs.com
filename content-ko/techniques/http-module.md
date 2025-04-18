### HTTP 모듈

[Axios](https://github.com/axios/axios)는 널리 사용되는 풍부한 기능을 갖춘 HTTP 클라이언트 패키지입니다. Nest는 Axios를 래핑하고 내장 `HttpModule`을 통해 노출합니다. `HttpModule`은 Axios 기반 메서드를 노출하여 HTTP 요청을 수행하는 `HttpService` 클래스를 익스포트합니다. 이 라이브러리는 또한 결과 HTTP 응답을 `Observables`로 변환합니다.

> info **힌트** [got](https://github.com/sindresorhus/got) 또는 [undici](https://github.com/nodejs/undici)를 포함하여 일반적인 Node.js HTTP 클라이언트 라이브러리를 직접 사용할 수도 있습니다.

#### 설치

사용을 시작하려면 먼저 필요한 의존성을 설치해야 합니다.

```bash
$ npm i --save @nestjs/axios axios
```

#### 시작하기

설치가 완료되면 `HttpService`를 사용하기 위해 먼저 `HttpModule`을 임포트합니다.

```typescript
@Module({
  imports: [HttpModule],
  providers: [CatsService],
})
export class CatsModule {}
```

다음으로, 일반적인 생성자 주입을 사용하여 `HttpService`를 주입합니다.

> info **힌트** `HttpModule` 및 `HttpService`는 `@nestjs/axios` 패키지에서 임포트됩니다.

```typescript
@@filename()
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Observable<AxiosResponse<Cat[]>> {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
@@switch
@Injectable()
@Dependencies(HttpService)
export class CatsService {
  constructor(httpService) {
    this.httpService = httpService;
  }

  findAll() {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
```

> info **힌트** `AxiosResponse`는 `axios` 패키지(`$ npm i axios`)에서 익스포트되는 인터페이스입니다.

모든 `HttpService` 메서드는 `Observable` 객체로 래핑된 `AxiosResponse`를 반환합니다.

#### 구성

[Axios](https://github.com/axios/axios)는 `HttpService`의 동작을 사용자 정의하기 위한 다양한 옵션으로 구성할 수 있습니다. 자세한 내용은 [여기](https://github.com/axios/axios#request-config)를 참조하십시오. 기본 Axios 인스턴스를 구성하려면 `HttpModule`을 임포트할 때 `register()` 메서드에 선택적 옵션 객체를 전달합니다. 이 옵션 객체는 기본 Axios 생성자로 직접 전달됩니다.

```typescript
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [CatsService],
})
export class CatsModule {}
```

#### 비동기 구성

모듈 옵션을 정적으로 전달하는 대신 비동기적으로 전달해야 할 때 `registerAsync()` 메서드를 사용하십시오. 대부분의 동적 모듈과 마찬가지로 Nest는 비동기 구성을 처리하기 위한 여러 기술을 제공합니다.

한 가지 기술은 팩토리 함수를 사용하는 것입니다:

```typescript
HttpModule.registerAsync({
  useFactory: () => ({
    timeout: 5000,
    maxRedirects: 5,
  }),
});
```

다른 팩토리 제공자처럼, 우리의 팩토리 함수는 [비동기](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory)일 수 있으며 `inject`를 통해 의존성을 주입할 수 있습니다.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    timeout: configService.get('HTTP_TIMEOUT'),
    maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
  }),
  inject: [ConfigService],
});
```

또는 아래와 같이 팩토리 대신 클래스를 사용하여 `HttpModule`을 구성할 수 있습니다.

```typescript
HttpModule.registerAsync({
  useClass: HttpConfigService,
});
```

위 구성은 `HttpModule` 내부에 `HttpConfigService` 인스턴스를 생성하고, 이를 사용하여 옵션 객체를 만듭니다. 이 예제에서 `HttpConfigService`는 아래에 표시된 `HttpModuleOptionsFactory` 인터페이스를 구현해야 합니다. `HttpModule`은 제공된 클래스의 인스턴스화된 객체에서 `createHttpOptions()` 메서드를 호출합니다.

```typescript
@Injectable()
class HttpConfigService implements HttpModuleOptionsFactory {
  createHttpOptions(): HttpModuleOptions {
    return {
      timeout: 5000,
      maxRedirects: 5,
    };
  }
}
```

`HttpModule` 내에 프라이빗 복사본을 만드는 대신 기존 옵션 제공자를 재사용하려면 `useExisting` 구문을 사용하십시오.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useExisting: HttpConfigService,
});
```

또한 `registerAsync()` 메서드에 소위 `extraProviders`를 전달할 수 있습니다. 이 제공자들은 모듈 제공자들과 병합됩니다.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useClass: HttpConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

이는 팩토리 함수나 클래스 생성자에 추가적인 의존성을 제공하려는 경우에 유용합니다.

#### Axios 직접 사용

`HttpModule.register`의 옵션이 충분하지 않다고 생각하거나 단순히 `@nestjs/axios`가 생성한 기본 Axios 인스턴스에 접근하고 싶다면 다음과 같이 `HttpService#axiosRef`를 통해 접근할 수 있습니다:

```typescript
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Promise<AxiosResponse<Cat[]>> {
    return this.httpService.axiosRef.get('http://localhost:3000/cats');
    //                      ^ AxiosInstance interface
  }
}
```

#### 전체 예제

`HttpService` 메서드의 반환 값은 Observable이므로, 요청의 데이터를 Promise 형태로 가져오기 위해 `rxjs`의 `firstValueFrom` 또는 `lastValueFrom`을 사용할 수 있습니다.

```typescript
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class CatsService {
  private readonly logger = new Logger(CatsService.name);
  constructor(private readonly httpService: HttpService) {}

  async findAll(): Promise<Cat[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<Cat[]>('http://localhost:3000/cats').pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }
}
```

> info **힌트** [`firstValueFrom`](https://rxjs.dev/api/index/function/firstValueFrom)과 [`lastValueFrom`](https://rxjs.dev/api/index/function/lastValueFrom)의 차이점에 대해서는 RxJS 문서를 참고하십시오.