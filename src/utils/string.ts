const REG_START_SLASHES = /^\/+/
const REG_END_SLASHES = /\/+$/
const REG_START_END_SLASHES = /^\/+|\/+$/g

export const trimSlashes = (
  str: string,
  position: 'start' | 'end' | 'both'
) => {
  switch (position) {
    case 'start':
      return str.replace(REG_START_SLASHES, '')
    case 'end':
      return str.replace(REG_END_SLASHES, '')
    case 'both':
      return str.replace(REG_START_END_SLASHES, '')
  }
}
