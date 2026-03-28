import type { DevrocketAPI } from './index'

declare global {
  interface Window {
    devrocket: DevrocketAPI
  }
}
