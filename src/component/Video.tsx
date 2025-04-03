import { Mic, Sparkles, MicOff, Camera, CameraOff } from "lucide-react";
import { useCallback, useState } from "react";
import { useDaily } from "@daily-co/daily-react";
import {
  DailyVideo,
  useMeetingState,
  DailyAudio,
  useParticipantIds,
  useAudioTrack,
  useVideoTrack,
  useLocalSessionId,
} from "@daily-co/daily-react";
import axios from "axios";

function Video() {
  const meetingState = useMeetingState();
  const [isLoading, setIsLoading] = useState(false);
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });
  const localSessionId = useLocalSessionId();
  const localVideo = useVideoTrack(localSessionId);
  const localAudio = useAudioTrack(localSessionId);
  const isCameraEnabled = !localVideo.isOff;
  const isMicEnabled = !localAudio.isOff;
  const daily = useDaily();
  const handleClick = async () => {
    setIsLoading(true);
    try {
      const createConversation = await axios.post(
        "https://tavusapi.com/v2/conversations",
        {
          // replica_id: "r3fbe3834a3e",
          persona_id: "pd9671d95e32",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "eecb0510afb8499085a9b220dc1a28d0",
          },
        }
      );
      const url = createConversation.data.conversation_url;
      await daily
        ?.join({
          url: url,
          startVideoOff: false,
          startAudioOff: true,
        })
        .then(() => {
          daily?.setLocalAudio(true);
        });
    } catch (error) {}
  };

  const handleEnd = async () => {
    await daily?.leave();
    setIsLoading(false);
  };

  const handleResize = useCallback(
    (dimensions: { width: 1280; height: 720; aspectRatio: 1.777 }) => {
      console.log("Video resized:", dimensions);
    },
    []
  );
  const toggleVideo = useCallback(() => {
    daily?.setLocalVideo(!isCameraEnabled);
  }, [daily, isCameraEnabled]);

  const toggleAudio = useCallback(() => {
    daily?.setLocalAudio(!isMicEnabled);
  }, [daily, isMicEnabled]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-4xl aspect-video bg-white rounded-3xl shadow-xl relative overflow-hidden backdrop-blur-sm bg-opacity-80">
          {/* Center Icon */}
          <div className=" h-full w-full flex justify-center items-center">
            {meetingState === "joined-meeting" ? (
              <div>
                <DailyVideo
                  className="size-full"
                  fit="contain"
                  type="video"
                  sessionId={remoteParticipantIds[0]}
                  onResize={handleResize}
                />
                <DailyVideo
                  className="absolute bottom-[79px] right-4 aspect-video h-40 w-24 overflow-hidden  lg:h-auto lg:w-52"
                  fit="contain"
                  type="video"
                  sessionId={localSessionId}
                  onResize={handleResize}
                />
              </div>
            ) : (
              <div className="w-10 h-10  sm:w-16 sm:h-16 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 sm:w-12 sm:h-12 text-white" />
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-t from-black/10 to-transparent">
            <div className="flex items-end gap-4">
              <button
                onClick={toggleAudio}
                className=" h-10 w-10 sm:h-16 sm:w-16 flex items-center justify-center bg-white/90 rounded-full hover:bg-white transition-colors"
              >
                {!isMicEnabled ? (
                  <MicOff className="size-3 sm:size-6" />
                ) : (
                  <Mic className="size-3 sm:size-6" />
                )}
              </button>
              <button
                onClick={toggleVideo}
                className="h-10 w-10 sm:h-16 sm:w-16 flex items-center justify-center bg-white/90 rounded-full hover:bg-white transition-colors"
              >
                {!isCameraEnabled ? (
                  <CameraOff className="size-3 sm:size-6" />
                ) : (
                  <Camera className="size-3 sm:size-6" />
                )}
              </button>
            </div>

            {meetingState === "joined-meeting" ? (
              <button
                onClick={handleEnd}
                className="px-2 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
              >
                <span className=" text-xs sm:text-base">End talk</span>
                <Sparkles className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleClick}
                className="px-2 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
              >
                {isLoading ? (
                  <span className=" text-[8px] sm:text-base">
                    ... connecting to Kartik Aaryan
                  </span>
                ) : (
                  <span className=" text-xs sm:text-base">
                    Talk to Kartik Aaryan
                  </span>
                )}
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div>
        {/* <button onClick={handleClick}>Start </button>
        <button onClick={handleEnd}>end </button> */}
        <DailyAudio />
      </div>
    </>
  );
}

export default Video;
