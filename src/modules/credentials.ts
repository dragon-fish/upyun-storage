import { md5, hmacSHA1, toHex, toBase64 } from '../utils/hash.js'

/**
 * @see https://help.upyun.com/knowledge-base/object_storage_authorization/
 */
export class UpyunStorageCredentials {
  constructor(
    public readonly operator: string,
    public readonly secret: string
  ) {}

  // Basic Token
  basicToken() {
    return `Basic ${btoa(`${this.operator}:${this.secret}`)}`
  }

  /**
   * Signature Token
   *
   * ```
   * Authorization: UPYUN <Operator>:<Signature>
   * <Signature> = Base64(
   *   HMAC-SHA1(
   *     <Password>,
   *     <Method>&
   *     <URI>&
   *     <Date>&
   *     <Content-MD5> (Optional)
   *   )
   * )
   * ```
   */
  signatureToken(payload: {
    method: string
    uri: string
    date: string | number | Date
    contentMD5?: string
  }) {
    const password = toHex(md5(this.secret))
    const method = payload.method.toUpperCase()
    const uri = encodeURI(payload.uri)
    const date = new Date(payload.date || Date.now()).toUTCString()
    const body = [method, uri, date, payload.contentMD5]
      .filter((i) => i !== void 0 && i !== null)
      .join('&')
    const token = toBase64(hmacSHA1(body, password))
    return `UPYUN ${this.operator}:${token}`
  }
}
