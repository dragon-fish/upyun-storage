import { md5, hexToBase64, hmacSHA1 } from './hash.js'

export class UpyunCredentials {
  constructor(
    public readonly operator: string,
    public readonly secret: string
  ) {}

  // Token
  basicToken() {
    return `Basic ${btoa(`${this.operator}:${this.secret}`)}`
  }
  signatureToken(payload: {
    method: string
    uri: string
    date: string | number | Date
  }) {
    payload.date = new Date(payload.date || Date.now()).toUTCString()
    const secret = md5(this.secret)
    payload.uri = encodeURI(payload.uri)
    const params = [payload.method, payload.uri, payload.date]
      .filter((i) => i !== undefined && i !== null)
      .join('&')
    const token = hexToBase64(hmacSHA1(params, secret))
    return `UPYUN ${this.operator}:${token}`
  }
}
