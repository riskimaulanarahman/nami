import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const getIsMobile = () => window.innerWidth < MOBILE_BREAKPOINT
    const onChange = () => setIsMobile(getIsMobile())

    setIsMobile(getIsMobile())

    if (typeof window.matchMedia !== "function") {
      return
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }

    if (typeof mql.addListener === "function") {
      mql.addListener(onChange)
      return () => mql.removeListener(onChange)
    }
  }, [])

  return !!isMobile
}
