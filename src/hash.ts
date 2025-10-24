function stringToBytes(str: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    if (charCode < 0x80) {
      bytes.push(charCode)
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6))
      bytes.push(0x80 | (charCode & 0x3f))
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      bytes.push(0xe0 | (charCode >> 12))
      bytes.push(0x80 | ((charCode >> 6) & 0x3f))
      bytes.push(0x80 | (charCode & 0x3f))
    } else {
      i++
      const charCode2 = str.charCodeAt(i)
      const codePoint =
        0x10000 + (((charCode & 0x3ff) << 10) | (charCode2 & 0x3ff))
      bytes.push(0xf0 | (codePoint >> 18))
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f))
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f))
      bytes.push(0x80 | (codePoint & 0x3f))
    }
  }
  return bytes
}

function rotateLeft(value: number, amount: number): number {
  return ((value << amount) | (value >>> (32 - amount))) >>> 0
}

export const md5 = (data: string): string => {
  const bytes = stringToBytes(data)
  const messageLength = bytes.length

  bytes.push(0x80)
  while (bytes.length % 64 !== 56) {
    bytes.push(0)
  }

  const bitLength = messageLength * 8
  for (let i = 0; i < 8; i++) {
    bytes.push((bitLength >>> (i * 8)) & 0xff)
  }

  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476

  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    const w: number[] = []

    for (let i = 0; i < 16; i++) {
      w[i] =
        (bytes[chunk + i * 4] |
          (bytes[chunk + i * 4 + 1] << 8) |
          (bytes[chunk + i * 4 + 2] << 16) |
          (bytes[chunk + i * 4 + 3] << 24)) >>>
        0
    }

    let a = h0,
      b = h1,
      c = h2,
      d = h3

    for (let i = 0; i < 64; i++) {
      let f: number, g: number

      if (i < 16) {
        f = (b & c) | (~b & d)
        g = i
      } else if (i < 32) {
        f = (d & b) | (~d & c)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = b ^ c ^ d
        g = (3 * i + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * i) % 16
      }

      const k = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000)
      f = (f + a + k + w[g]) >>> 0
      a = d
      d = c
      c = b
      b =
        (b +
          rotateLeft(
            f,
            [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][i % 16]
          )) >>>
        0
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
  }

  return [h0, h1, h2, h3].map((h) => h.toString(16).padStart(8, '0')).join('')
}

export const sha1 = (data: string): string => {
  const bytes = stringToBytes(data)
  const messageLength = bytes.length

  bytes.push(0x80)
  while (bytes.length % 64 !== 56) {
    bytes.push(0)
  }

  const bitLength = messageLength * 8
  for (let i = 7; i >= 0; i--) {
    bytes.push((bitLength >>> (i * 8)) & 0xff)
  }

  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0

  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    const w: number[] = []

    for (let i = 0; i < 16; i++) {
      w[i] =
        ((bytes[chunk + i * 4] << 24) |
          (bytes[chunk + i * 4 + 1] << 16) |
          (bytes[chunk + i * 4 + 2] << 8) |
          bytes[chunk + i * 4 + 3]) >>>
        0
    }

    for (let i = 16; i < 80; i++) {
      w[i] = rotateLeft(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1)
    }

    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4

    for (let i = 0; i < 80; i++) {
      let f: number, k: number

      if (i < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (i < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }

      const temp = (rotateLeft(a, 5) + f + e + k + w[i]) >>> 0
      e = d
      d = c
      c = rotateLeft(b, 30)
      b = a
      a = temp
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
  }

  return [h0, h1, h2, h3, h4]
    .map((h) => h.toString(16).padStart(8, '0'))
    .join('')
}

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16))
  }
  return bytes
}

function xorBytes(a: number[], b: number[]): number[] {
  const result: number[] = []
  const maxLength = Math.max(a.length, b.length)
  for (let i = 0; i < maxLength; i++) {
    result.push((a[i] || 0) ^ (b[i] || 0))
  }
  return result
}

export const hmacSHA1 = (data: string, key: string): string => {
  const blockSize = 64
  let keyBytes = stringToBytes(key)
  if (keyBytes.length > blockSize) {
    const keyHash = sha1(key)
    keyBytes = hexToBytes(keyHash)
  }
  while (keyBytes.length < blockSize) {
    keyBytes.push(0)
  }
  const ipad = new Array(blockSize).fill(0x36)
  const opad = new Array(blockSize).fill(0x5c)
  const innerKey = xorBytes(keyBytes, ipad)
  const innerData = [...innerKey, ...stringToBytes(data)]
  const innerHash = sha1(bytesToHex(innerData))
  const outerKey = xorBytes(keyBytes, opad)
  const outerData = [...outerKey, ...hexToBytes(innerHash)]
  const outerHash = sha1(bytesToHex(outerData))

  return outerHash
}

export const hexToBase64 = (hexString: string): string => {
  const bytes = hexToBytes(hexString)
  const binaryString = bytes.map((b) => String.fromCharCode(b)).join('')
  return btoa(binaryString)
}
