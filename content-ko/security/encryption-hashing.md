### 암호화 및 해싱

**암호화**는 정보를 인코딩하는 과정입니다. 이 과정은 정보의 원래 표현인 평문(plaintext)을 암호문(ciphertext)이라고 알려진 다른 형태로 변환합니다. 이상적으로는 권한이 있는 당사자만 암호문을 다시 평문으로 해독하여 원본 정보에 접근할 수 있습니다. 암호화 자체는 방해를 막지는 않지만, 가로채려는 사람에게 이해 가능한 내용을 제공하지 않습니다. 암호화는 양방향 함수입니다. 암호화된 내용은 올바른 키로 복호화될 수 있습니다.

**해싱**은 주어진 키를 다른 값으로 변환하는 과정입니다. 해시 함수는 수학적 알고리즘에 따라 새 값을 생성하는 데 사용됩니다. 일단 해싱이 완료되면, 출력에서 입력으로 되돌아가는 것은 불가능해야 합니다.

#### 암호화

Node.js는 문자열, 숫자, 버퍼, 스트림 등을 암호화하고 복호화하는 데 사용할 수 있는 내장 [crypto 모듈](https://nodejs.org/api/crypto.html)을 제공합니다. Nest 자체는 불필요한 추상화를 도입하는 것을 피하기 위해 이 모듈 위에 추가 패키지를 제공하지 않습니다.

예를 들어, AES(Advanced Encryption System) `'aes-256-ctr'` 알고리즘의 CTR 암호화 모드를 사용해 보겠습니다.

```typescript
import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const iv = randomBytes(16);
const password = 'Password used to generate key';

// The key length is dependent on the algorithm.
// In this case for aes256, it is 32 bytes.
const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
const cipher = createCipheriv('aes-256-ctr', key, iv);

const textToEncrypt = 'Nest';
const encryptedText = Buffer.concat([
  cipher.update(textToEncrypt),
  cipher.final(),
]);
```

이제 `encryptedText` 값을 복호화하려면:

```typescript
import { createDecipheriv } from 'crypto';

const decipher = createDecipheriv('aes-256-ctr', key, iv);
const decryptedText = Buffer.concat([
  decipher.update(encryptedText),
  decipher.final(),
]);
```

#### 해싱

해싱을 위해서는 [bcrypt](https://www.npmjs.com/package/bcrypt) 또는 [argon2](https://www.npmjs.com/package/argon2) 패키지를 사용하는 것을 권장합니다. Nest 자체는 불필요한 추상화를 도입하는 것을 피하기 위해(학습 곡선을 짧게 만들기 위해) 이러한 모듈 위에 추가 래퍼(wrapper)를 제공하지 않습니다.

예를 들어, 임의의 비밀번호를 해싱하기 위해 `bcrypt`를 사용해 보겠습니다.

먼저 필요한 패키지를 설치하세요:

```shell
$ npm i bcrypt
$ npm i -D @types/bcrypt
```

설치가 완료되면 다음과 같이 `hash` 함수를 사용할 수 있습니다:

```typescript
import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;
const password = 'random_password';
const hash = await bcrypt.hash(password, saltOrRounds);
```

솔트(salt)를 생성하려면 `genSalt` 함수를 사용하세요:

```typescript
const salt = await bcrypt.genSalt();
```

비밀번호를 비교/확인하려면 `compare` 함수를 사용하세요:

```typescript
const isMatch = await bcrypt.compare(password, hash);
```

사용 가능한 함수에 대해 더 자세히 알아보려면 [여기](https://www.npmjs.com/package/bcrypt)를 참조하세요.
