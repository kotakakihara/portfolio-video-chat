import Vue from 'vue'
import { SkywayMediaStream } from '@/interface/types'
const vad = require('voice-activity-detection')

Vue.mixin({
  methods: {
    startVoiceDetection(
      this: any,
      stream: SkywayMediaStream,
      talkUpdate: (peerId: string | null) => void
    ) {
      const audioContext = new AudioContext()
      const vadOptions = {
        onVoiceStart() {
          talkUpdate(stream.peerId)
        },
        onVoiceStop() {
          talkUpdate(null)
        }
      }
      // streamオブジェクトの音声検出を開始
      this.vadobject = vad(audioContext, stream, vadOptions)
    },
    stopVoiceDetection(this: any) {
      if (this.vadobject) {
        // 音声検出を終了する
        this.vadobject.destroy()
      }
    }
  }
})
