import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

export function useBasicLayout() {
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = breakpoints.smaller('sm')  
  const isMD = breakpoints.smaller('lg')

  return { isMobile,isMD }
}
