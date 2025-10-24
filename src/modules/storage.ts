import {
  Fexios,
  type FexiosFinalContext,
  type FexiosRequestOptions,
} from 'fexios'
import { UpyunStorageCredentials } from './credentials.js'
import { trimSlashes } from '../utils/string.js'

export interface UpyunServiceOptions {
  /**
   * Bucket REST API base URL
   * @description Generally, you don't need to change this value.
   * @default "https://v0.api.upyun.com/"
   * @see https://help.upyun.com/knowledge-base/rest_api/
   */
  baseURL?: string
  bucket: string
  operator: string
  secret: string
  /**
   * CDN base URL
   * @description Required for purge caches
   */
  cdnBaseURL?: string
  /**
   * OAuth token for purge
   * @see https://api.upyun.com/doc#/api/operation/oauth/POST%20%2Foauth%2Ftokens
   */
  oAuthToken?: string
  /**
   * Admin API base URL
   * @description Generally, you don't need to change this value.
   * @default "https://api.upyun.com/"
   * @see https://api.upyun.com/doc#/api/guide/overview
   */
  adminApiBaseURL?: string
}

export interface UpyunFolderInfo {
  files: UpyunFileInfo[]
  iter: string
}
export interface UpyunFileInfo {
  etag?: string
  name: string
  type: 'folder' | string
  last_modified: number
  length: number
}
export interface UpyunPurgeUrlResult {
  url: string
  status: string
  /** @see https://api.upyun.com/doc#/api/guide/errorCode */
  code: number
  task_id: string
}
export interface UpyunPurgePatternResult {
  url: string
  status: string
  /**
   * ```
   * 1  = 刷新成功
   * 2  = 刷新规则格式错误
   * 3  = 刷新规则超过限制，在 15 天内，刷新规则超过了 1000 条
   * 4  = 该域名不属于您
   * 5  = 空间不存在
   * -1 = 未知错误
   */
  code: number
}

export enum UpyunKeywords {
  folder = 'folder',
  iter_eof = 'g2gCZAAEbmV4dGQAA2VvZg',
}

/**
 * Yet another Upyun Bucket REST API client.
 *
 * @author dragon-fish <dragon-fish@qq.com>
 * @license MIT
 * @see https://help.upyun.com/knowledge-base/rest_api/
 */
export class UpyunStorageService {
  public readonly options: UpyunServiceOptions
  readonly fetch: Fexios
  readonly credentials: UpyunStorageCredentials

  constructor(options: UpyunServiceOptions) {
    const opt = (this.options = {
      baseURL: 'https://v0.api.upyun.com/',
      adminApiBaseURL: 'https://api.upyun.com/',
      ...options,
    })
    const cred = (this.credentials = new UpyunStorageCredentials(
      opt.operator,
      opt.secret
    ))
    this.fetch = UpyunStorageService.createFetch({
      baseURL: opt.baseURL!,
      credentials: cred,
    })
    console.info(this.options, options)
  }

  static createFetch(options: {
    baseURL: string
    credentials: UpyunStorageCredentials
  }) {
    const { credentials, ...rest } = options
    const fexios = new Fexios({
      baseURL: rest.baseURL,
    })
    fexios.interceptors.request.use(async (ctx) => {
      const date = new Date().toUTCString()

      ctx.headers = (ctx.headers as Record<string, string>) || {}
      ctx.headers['x-date'] = date
      ctx.headers['accept'] = 'application/json'

      if (!ctx.headers.authorization) {
        const uri = ctx.url?.startsWith('/')
          ? ctx.url
          : new URL(ctx.url || '').pathname
        ctx.headers.authorization = await credentials.signatureToken({
          uri,
          date,
          method: ctx.method?.toUpperCase() || 'GET',
        })
      }

      return ctx
    })
    return fexios
  }

  private concatPaths(...paths: string[]) {
    if (paths.length < 2) {
      return paths[0] || ''
    }
    const startSlash = paths[0]?.startsWith('/') ? '/' : ''
    const endSlash = paths[paths.length - 1]?.endsWith('/') ? '/' : ''
    return (
      startSlash +
      paths.map((path) => trimSlashes(path, 'both')).join('/') +
      endSlash
    )
  }

  getFilePath(fileName: string) {
    return `/${this.concatPaths(this.options.bucket, fileName)}`
  }

  // Folder
  listFolder = this.listDir
  async listDir(
    path: string,
    iter?: string,
    config?: Partial<FexiosRequestOptions>
  ) {
    return this.fetch.get<UpyunFolderInfo>(this.getFilePath(path), {
      ...config,
      headers: {
        ...config?.headers,
        ...(iter ? { 'x-list-iter': iter } : {}),
      },
    })
  }
  createFolder(path: string, config?: Partial<FexiosRequestOptions>) {
    return this.fetch.post(this.getFilePath(path), null, {
      ...config,
      headers: {
        ...config?.headers,
        folder: 'true',
      },
    })
  }

  // File
  async fileInfo(path: string, config?: Partial<FexiosRequestOptions>) {
    return this.fetch
      .head(this.getFilePath(path), config)
      .then(({ headers }: { headers: Headers }) => {
        return {
          type: headers.get('x-upyun-file-type'),
          size: headers.get('x-upyun-file-size'),
          date: headers.get('x-upyun-file-date'),
          md5: headers.get('content-md5'),
        }
      })
  }
  getFile<T = any>(
    path: string,
    config?: Partial<FexiosRequestOptions>
  ): Promise<FexiosFinalContext<T>> {
    return this.fetch.get(this.getFilePath(path), config)
  }
  renameFile = this.moveFile
  moveFile(from: string, to: string, config?: Partial<FexiosRequestOptions>) {
    return this.fetch.put(this.getFilePath(to), null, {
      ...config,
      headers: {
        ...config?.headers,
        'x-upyun-move-source': this.getFilePath(from),
      },
    })
  }

  // Upload
  uploadFile(
    fileName: string,
    file: Blob | File,
    config?: Partial<FexiosRequestOptions>
  ) {
    return this.fetch.put(this.getFilePath(fileName), file, config)
  }
  uploadText(
    fileName: string,
    text: string,
    type?: string,
    config?: Partial<FexiosRequestOptions>
  ) {
    return this.uploadFile(
      fileName,
      new Blob([text.toString()], { type }),
      config
    )
  }
  uploadJSON(
    fileName: string,
    data: any,
    config?: Partial<FexiosRequestOptions>
  ) {
    return this.uploadText(
      fileName,
      JSON.stringify(data),
      'application/json',
      config
    )
  }

  // Delete
  deleteFile(fileName: string, config?: Partial<FexiosRequestOptions>) {
    return this.fetch.delete(this.getCdnUrl(fileName), null, config)
  }

  getCdnUrl(fileName: string) {
    let cdnBaseURL = this.options.cdnBaseURL
    if (typeof cdnBaseURL !== 'string') {
      console.warn('cdnBaseURL is not set, using test.upcdn.net')
      cdnBaseURL = `https://${this.options.bucket}.test.upcdn.net/`
    }
    return this.concatPaths(cdnBaseURL, fileName)
  }

  private requireOAuthToken() {
    if (!this.options.oAuthToken) {
      throw new Error('OAuth token is required')
    }
    return `Bearer ${this.options.oAuthToken.replace(/^Bearer\s+/, '')}`
  }

  purgeByFilePaths(filePaths: string[]) {
    const urls = filePaths.map((filePath) => this.getCdnUrl(filePath))
    return this.purgeByUrls(urls)
  }

  /**
   * URL 刷新
   * @see https://api.upyun.com/doc#/api/operation/cache/POST%20%2Fpurge
   * @param urls 需要批量刷新的文件 URL
   * ```
   * [
   *   'https://example.com/111.jpg',
   *   'https://example.com/222.png',
   * ]
   * ```
   */
  purgeByUrls(urls: string[], bucket = this.options.bucket) {
    const token = this.requireOAuthToken()
    return this.fetch.post<{
      result: UpyunPurgeUrlResult[]
    }>(
      new URL('purge', this.options.adminApiBaseURL),
      {
        urls: urls
          .map((str) => str.trim())
          .filter(Boolean)
          .join('\n'),
        bucket,
      },
      {
        headers: {
          Authorization: token,
        },
      }
    )
  }

  /**
   * 缓存批量刷新
   * @see https://api.upyun.com/doc#/api/operation/cache/POST%20%2Fbuckets%2Fpurge%2Fbatch
   * @param patterns 文件路径刷新规则
   * @example
   * ```
   * [
   *   'https://example.com/images/*',
   *   'https://example.com/images/!*w/120',
   * ]
   * ```
   */
  purgeByPatterns(patterns: string[], noif = false) {
    const token = this.requireOAuthToken()
    return this.fetch.post<UpyunPurgePatternResult[]>(
      new URL('buckets/purge/batch', this.options.adminApiBaseURL),
      {
        source_url: patterns
          .map((str) => str.trim())
          .filter(Boolean)
          .join('\n'),
        noif: noif ? '1' : '0',
      },
      { headers: { Authorization: token } }
    )
  }
}
