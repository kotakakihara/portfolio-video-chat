<template>
  <div class="skyway-video">
    <video id="local-stream"></video>
    <div>
      <button @click="mute">{{ muteText }}</button>
      <button @click="disconnect">切断</button>
    </div>
    <div id="remote-streams" class="remote-streams">
      <div
        v-for="remoteStream in remoteStreams"
        :ref="remoteStream.peerId"
        :key="remoteStream.peerId"
        :class="talkingId === remoteStream.peerId ? 'talking' : ''"
      >
        <video autoplay :srcObject.prop="remoteStream"></video>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
import Peer, { SfuRoom } from 'skyway-js'
import { SkywayMediaStream } from '@/interface/types'
interface SkywayData {
  peer: Peer | null
  room: SfuRoom | null
  localStream: MediaStream | undefined
  isMute: boolean
  remoteStreams: SkywayMediaStream[]
  talkingId: string | null
}
export default Vue.extend({
  name: 'SkywayVideo',
  props: {
    userName: {
      type: String,
      default: null
    },
    roomName: {
      type: String,
      default: null
    }
  },
  data: (): SkywayData => ({
    peer: null,
    room: null,
    localStream: undefined,
    isMute: false,
    remoteStreams: [],
    talkingId: null
  }),
  computed: {
    muteText(): string {
      return this.isMute ? 'ミュート解除' : 'ミュート'
    }
  },
  async mounted() {
    const localVideo = document.getElementById(
      'local-stream'
    ) as HTMLMediaElement

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })

    localVideo.muted = true
    localVideo.srcObject = this.localStream
    await localVideo.play()

    this.peer = await new Peer(this.userName, {
      key: '2b225ae2-6630-4e12-9536-acb3d3587446' || '',
      debug: 3
    })
    this.peer.on('open', this.connect)
  },
  methods: {
    // 接続処理
    connect() {
      if (!this.peer || !this.peer.open) {
        return
      }

      this.room = this.peer.joinRoom(this.roomName, {
        mode: 'sfu',
        stream: this.localStream
      }) as SfuRoom

      if (this.room) {
        this.room.on('stream', (stream: SkywayMediaStream): void => {
          ;(this as any).startVoiceDetection(stream, this.talkUpdate)
          this.remoteStreams.push(stream)
        })
        this.room.on('peerLeave', (peerId: string): void => {
          const audio = document.getElementById(peerId)
          if (audio) {
            audio.remove()
          }
        })
      }
    },
    // ミュート切り替え
    mute(): void {
      if (this.localStream) {
        const audioTrack = this.localStream.getAudioTracks()[0]
        this.isMute = !this.isMute
        audioTrack.enabled = !this.isMute
      }
    },
    // 切断
    disconnect(): void {
      if (this.room) {
        this.room.close()
      }
    },
    talkUpdate(peerId: string) {
      this.talkingId = peerId
    }
  }
})
</script>
<style>
.talking {
  border: 3px solid #0000ff;
  display: inline-block;
}
</style>
