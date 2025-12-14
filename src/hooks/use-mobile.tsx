"use client"

import { useState, useEffect } from "react"

export function useIsMobile(query: string = "(max-width: 768px)") {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    const handleResize = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    // Set the initial state
    setIsMobile(mediaQuery.matches)

    // Add event listener
    mediaQuery.addEventListener("change", handleResize)

    // Clean up event listener on component unmount
    return () => {
      mediaQuery.removeEventListener("change", handleResize)
    }
  }, [query])

  return isMobile
}
