export function toHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function toBase64(uint8Array: Uint8Array): string {
  const binaryString = String.fromCharCode(...uint8Array)
  return btoa(binaryString)
}

function stringToBytes(str: string): number[] {
  return Array.from(new TextEncoder().encode(str))
}

function rotateLeft(value: number, amount: number): number {
  return ((value << amount) | (value >>> (32 - amount))) >>> 0
}

export function md5(data: string): Uint8Array {
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

  const result = new Uint8Array(16)
  for (let i = 0; i < 4; i++) {
    const h = [h0, h1, h2, h3][i]
    result[i * 4] = (h >>> 0) & 0xff
    result[i * 4 + 1] = (h >>> 8) & 0xff
    result[i * 4 + 2] = (h >>> 16) & 0xff
    result[i * 4 + 3] = (h >>> 24) & 0xff
  }

  return result
}

export function sha1(data: string): Uint8Array {
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
  let h4 = 0xc3d2e1f0

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

  const result = new Uint8Array(20)
  for (let i = 0; i < 5; i++) {
    const h = [h0, h1, h2, h3, h4][i]
    result[i * 4] = (h >>> 24) & 0xff
    result[i * 4 + 1] = (h >>> 16) & 0xff
    result[i * 4 + 2] = (h >>> 8) & 0xff
    result[i * 4 + 3] = h & 0xff
  }

  return result
}

export function hmacSHA1(message: string, key: string): Uint8Array {
  const blockSize = 64
  const keyBytes = stringToBytes(key)

  const keyHash = keyBytes.length > blockSize ? Array.from(sha1(key)) : keyBytes

  const paddedKey = new Array(blockSize).fill(0)
  keyHash.forEach((byte, i) => {
    paddedKey[i] = byte
  })

  const innerPad = paddedKey.map((byte) => byte ^ 0x36)
  const outerPad = paddedKey.map((byte) => byte ^ 0x5c)

  const innerMessage = [...innerPad, ...stringToBytes(message)]
  const innerHash = Array.from(sha1(String.fromCharCode(...innerMessage)))

  const outerMessage = [...outerPad, ...innerHash]
  return sha1(String.fromCharCode(...outerMessage))
}
