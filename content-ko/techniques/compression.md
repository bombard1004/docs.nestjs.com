### 압축

압축은 응답 본문의 크기를 크게 줄여 웹 앱의 속도를 높일 수 있습니다.

프로덕션 환경의 **고트래픽** 웹사이트에서는 애플리케이션 서버에서 압축을 오프로드하는 것이 강력히 권장됩니다. 일반적으로 리버스 프록시(예: Nginx)에서 수행됩니다. 이 경우 압축 미들웨어를 사용해서는 안 됩니다.

#### Express와 함께 사용 (기본값)

gzip 압축을 활성화하려면 [compression](https://github.com/expressjs/compression) 미들웨어 패키지를 사용하십시오.

먼저 필요한 패키지를 설치하십시오:

```bash
$ npm i --save compression
$ npm i --save-dev @types/compression
```

설치가 완료되면 compression 미들웨어를 전역 미들웨어로 적용하십시오.

```typescript
import * as compression from 'compression';
// somewhere in your initialization file
app.use(compression());
```

#### Fastify와 함께 사용

`FastifyAdapter`를 사용하는 경우 [fastify-compress](https://github.com/fastify/fastify-compress)를 사용하십시오:

```bash
$ npm i --save @fastify/compress
```

설치가 완료되면 `@fastify/compress` 미들웨어를 전역 미들웨어로 적용하십시오.

```typescript
import compression from '@fastify/compress';
// somewhere in your initialization file
await app.register(compression);
```

기본적으로 `@fastify/compress`는 브라우저가 인코딩 지원을 표시할 때 Brotli 압축(Node >= 11.7.0에서)을 사용합니다. Brotli는 압축률 면에서 상당히 효율적일 수 있지만, 상당히 느릴 수도 있습니다. 기본적으로 Brotli는 최대 압축 품질을 11로 설정하지만, 압축 품질 대신 압축 시간을 줄이도록 `BROTLI_PARAM_QUALITY`를 0(최소)과 11(최대) 사이에서 조정하여 조정할 수 있습니다. 이는 공간/시간 성능을 최적화하기 위해 미세 조정이 필요합니다. 품질 4의 예시는 다음과 같습니다:

```typescript
import { constants } from 'zlib';
// somewhere in your initialization file
await app.register(compression, { brotliOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } } });
```

간단하게 하려면 `fastify-compress`에게 응답 압축 시 deflate와 gzip만 사용하도록 지시할 수 있습니다. 그러면 응답 크기는 잠재적으로 더 커지지만 훨씬 빠르게 전달될 것입니다.

인코딩을 지정하려면 `app.register`에 두 번째 인수를 제공하십시오:

```typescript
await app.register(compression, { encodings: ['gzip', 'deflate'] });
```

위 내용은 `fastify-compress`에게 gzip과 deflate 인코딩만 사용하도록 지시하며, 클라이언트가 둘 다 지원하는 경우 gzip을 선호합니다.