import { app } from 'electron'
import path from 'path'

export const Paths = {
  get userData(): string {
    return app.getPath('userData')
  },
  get database(): string {
    return path.join(this.userData, 'noteflow.db')
  },
  get logs(): string {
    return path.join(this.userData, 'logs')
  },
  get exports(): string {
    return path.join(app.getPath('documents'), 'NoteFlow Exports')
  },
}
