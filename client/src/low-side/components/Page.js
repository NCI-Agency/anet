import { animateScroll } from "react-scroll"

export function jumpToTop() {
  animateScroll.scrollToTop({
    duration: 500,
    delay: 100,
    smooth: "easeInOutQuint",
    containerId: "mini-anet-container"
  })
}
