declare module 'postcss-pxtorem' {
  import type { Plugin } from 'postcss'
  const pxtorem: (options?: Record<string, unknown>) => Plugin
  export default pxtorem
}
