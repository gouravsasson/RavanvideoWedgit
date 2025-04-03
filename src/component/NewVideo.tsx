import React, { useState, useEffect } from "react";
import { Mic, Sparkles, MicOff, Camera, CameraOff } from "lucide-react";
import { useCallback } from "react";
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

const RavanPremiumInterface = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

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
            "x-api-key": "87ed3f693aae48119b61b04105f7d562",
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
      setIsConnected(true);
    } catch (error) {}
  };

  const handleEnd = async () => {
    await daily?.leave();
    setIsLoading(false);
    setIsConnected(false);
  };

  // const handleResize = useCallback(
  //   (dimensions: { width: 1280; height: 720; aspectRatio: 1.777 }) => {
  //     console.log("Video resized:", dimensions);
  //   },
  //   []
  // );
  const toggleVideo = useCallback(() => {
    daily?.setLocalVideo(!isCameraEnabled);
  }, [daily, isCameraEnabled]);

  const toggleAudio = useCallback(() => {
    daily?.setLocalAudio(!isMicEnabled);
  }, [daily, isMicEnabled]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsConnecting(true);

    // Simulate connection process - shorter for demo purposes
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 1500);
  };

  // Effect to ensure the form disappears when connected
  useEffect(() => {
    console.log("Connection state changed:", isConnected);
  }, [isConnected]);

  // Simulate varying audio levels for the visualizer
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 0.8 + 0.2); // Random value between 0.2 and 1
    }, 150);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Demo connection function if the button doesn't work
  // const forceConnect = () => {
  //   setIsConnecting(true);
  //   setTimeout(() => {
  //     setIsConnecting(false);
  //     setIsConnected(true);
  //   }, 1500);
  // };

  return (
    <div
      className="relative w-full max-w-6xl mx-auto overflow-hidden rounded-3xl shadow-2xl bg-[#fefbf3]"
      style={{ height: "600px" }}
    >
      {/* Decorative elements */}
      <div
        className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-30 blur-3xl z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,212,167,0) 70%)",
        }}
      ></div>
      <div
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-30 blur-3xl z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(255,85,0,0.2) 0%, rgba(255,212,167,0) 70%)",
        }}
      ></div>

      <div className="flex h-full">
        {/* Avatar Video Side - Expands to full width when connected */}
        <div
          className={`relative z-10 transition-all duration-700 ease-in-out ${
            isConnected ? "w-full" : "w-2/3"
          }`}
          style={{
            boxShadow: isConnected ? "none" : "10px 0 30px rgba(0,0,0,0.03)",
          }}
        >
          <div className="relative w-full h-full">
            {/* Avatar Video */}
            <div
              className={`absolute inset-0 flex items-center justify-center overflow-hidden ${
                isConnected ? "rounded-3xl" : "rounded-l-3xl"
              } transition-all duration-700`}
            >
              <div className=" h-full w-full flex justify-center items-center">
                <div>
                  <DailyVideo
                    className="size-full"
                    fit="contain"
                    type="video"
                    sessionId={remoteParticipantIds[0]}
                    // onResize={handleResize}
                  />
                  <DailyVideo
                    className="absolute bottom-[79px] right-4 aspect-video h-40 w-24 overflow-hidden  lg:h-auto lg:w-52"
                    fit="contain"
                    type="video"
                    sessionId={localSessionId}
                    // onResize={handleResize}
                  />
                </div>
              </div>

              {/* Glowing border accent */}
              <div
                className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
                  isConnected ? "rounded-3xl" : "rounded-l-3xl"
                }`}
                style={{
                  boxShadow: "inset 0 0 30px rgba(255, 85, 0, 0.15)",
                  border: "1px solid rgba(255, 85, 0, 0.1)",
                }}
              ></div>
            </div>

            {/* Status badge */}
            <div className="absolute top-6 left-6 z-20">
              <div
                className={`flex items-center px-4 py-2 rounded-full shadow-lg transition-all duration-500 ${
                  isConnected
                    ? "bg-green-500/20 backdrop-blur-md border border-green-500/30"
                    : "bg-orange-500/20 backdrop-blur-md border border-orange-500/30"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full mr-2 ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-orange-500"
                  }`}
                ></div>
                <span className="text-gray-800 text-sm font-medium">
                  {isConnected ? "Live Conversation" : "Ready to Connect"}
                </span>
              </div>
            </div>

            {/* Control overlay */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
              <div className="flex items-center space-x-3 bg-black/20 backdrop-blur-md rounded-full px-5 py-3 shadow-lg border border-white/10">
                <button
                  onClick={toggleAudio}
                  className="text-white p-2 rounded-full hover:bg-white/20 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  </svg>
                </button>

                <button
                  onClick={toggleVideo}
                  className="text-white p-2 rounded-full hover:bg-white/20 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 7l-7 5 7 5V7z"></path>
                    <rect
                      x="1"
                      y="5"
                      width="15"
                      height="14"
                      rx="2"
                      ry="2"
                    ></rect>
                  </svg>
                </button>

                <div className="flex items-center space-x-1 h-6 px-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full"
                      style={{
                        height: `${
                          5 +
                          (isConnected
                            ? Math.sin((i / 5) * Math.PI) * audioLevel * 16
                            : 0)
                        }px`,
                        backgroundColor: "#ff5500",
                        transition: "height 0.1s ease-in-out",
                        opacity: isConnected ? 1 : 0.4,
                      }}
                    ></div>
                  ))}
                </div>

                {isConnected && (
                  <button
                    onClick={handleEnd}
                    className="bg-red-500/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-medium transition shadow-lg"
                  >
                    End
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Side - Only visible when not connected */}
        {!isConnected && (
          <div
            className="w-1/3 flex flex-col justify-center p-8 z-10 bg-white/50 backdrop-blur-sm rounded-r-3xl transition-all duration-700 ease-in-out"
            style={{
              boxShadow: "inset 0 0 20px rgba(255, 255, 255, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <div className="space-y-7">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold" style={{ color: "#222" }}>
                  Let's Get Started
                </h2>
                <p className="text-gray-600">Connect with our AI assistant</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 pl-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/60 backdrop-blur-sm border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl px-4 py-3 pl-11 text-gray-900 transition outline-none"
                        placeholder="John Doe"
                        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 pl-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/60 backdrop-blur-sm border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl px-4 py-3 pl-11 text-gray-900 transition outline-none"
                        placeholder="john@example.com"
                        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 pl-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/60 backdrop-blur-sm border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl px-4 py-3 pl-11 text-gray-900 transition outline-none"
                        placeholder="+1 (555) 000-0000"
                        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isConnecting}
                  onClick={handleClick}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl text-white font-medium text-lg transition-all shadow-lg"
                  style={{
                    background: isConnecting
                      ? "#ccc"
                      : "linear-gradient(90deg, #ff5500 0%, #ff7e38 100%)",
                    boxShadow: isConnecting
                      ? "none"
                      : "0 4px 10px rgba(255, 85, 0, 0.3)",
                  }}
                >
                  {isConnecting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Connect with AI Assistant
                    </>
                  )}
                </button>
              </form>

              {/* This button is just for demo purposes - you can remove it in production */}
              {/* <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                <button
                  onClick={forceConnect}
                  className="underline hover:text-gray-600"
                >
                  Force connect (demo)
                </button>
              </div> */}
            </div>
          </div>
        )}
      </div>

      {/* Connected overlay - Only visible when connected */}
      {isConnected && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20 animate-fadeIn">
          <div className="bg-white/20 backdrop-blur-lg text-gray-800 px-6 py-3 rounded-full shadow-lg border border-white/30 flex items-center space-x-3">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Connected with {formData.name}</span>
            <span className="h-3 w-px bg-gray-400/30"></span>
            <span className="text-xs text-gray-600">00:08</span>
          </div>
        </div>
      )}

      {/* Animation of success circle when connecting */}
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                backgroundColor: "rgba(255, 85, 0, 0.2)",
              }}
            ></div>
            <div className="relative rounded-full p-8 bg-white/80 backdrop-blur-lg shadow-xl">
              <svg
                className="animate-spin h-8 w-8"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#ff5500"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="#ff5500"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      )}
      <DailyAudio />
    </div>
  );
};

export default RavanPremiumInterface;
