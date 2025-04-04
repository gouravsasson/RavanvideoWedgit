import React, { useState, useEffect, useCallback } from "react";
import { Mic, Sparkles, MicOff, Camera, CameraOff } from "lucide-react";
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
import * as yup from "yup";

// Define a validation schema
const validationSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  phone: yup.string().required("Phone is required"),
});

const RavanPremiumInterface = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const meetingState = useMeetingState();
  const [isLoading, setIsLoading] = useState(false);
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });
  const localSessionId = useLocalSessionId();
  const localVideo = useVideoTrack(localSessionId);
  const localAudio = useAudioTrack(localSessionId);
  const isCameraEnabled = !localVideo.isOff;
  const isMicEnabled = !localAudio.isOff;
  const agent_code = "52ea06ab-cdf8-442b-b08a-200bacfbce4c";
  const schema_name = "6af30ad4-a50c-4acc-8996-d5f562b6987f";
  const daily = useDaily();
  const handleClick = async () => {
    setIsLoading(true);
    try {
      const createConversation = await axios.post(
        "https://app.snowie.ai/api/start-avatar-call/",
        {
          // replica_id: "r3fbe3834a3e",
          agent_code: agent_code,
          schema_name: schema_name,
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const url = createConversation.data.response.conversation_url;
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

  const handleAppMessage = useCallback(async (event: any) => {
    // console.log("app-message", event.data.event_type);
    if (event.data.event_type === "conversation.tool_call") {
      if (event.data.properties.name === "insert_in_ghl") {
        console.log("tool_call", event.data.properties.arguments);
        const args = JSON.parse(event.data.properties.arguments);
        const { appointment_date } = args;
        console.log("appointment_date", appointment_date);
      }
    }
  }, []);

  // Attach the callback
  daily?.on("app-message", handleAppMessage);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    try {
      await validationSchema.validate(formData, { abortEarly: false });
      // Proceed with form submission
      console.log("Form is valid:", formData);
      await handleClick();
    } catch (validationErrors) {
      const formattedErrors = validationErrors.inner.reduce(
        (acc: any, error: any) => {
          acc[error.path] = error.message;
          return acc;
        },
        {}
      );
      setErrors(formattedErrors);
    } finally {
      setIsConnecting(false);
    }
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
  return (
    <div
      className={`m-4  md:h-[580px] md:max-w-6xl mx-auto overflow-hidden rounded-3xl shadow-2xl bg-[#fefbf3] ${
        meetingState === "joined-meeting" ? "h-[219.38px]" : "h-[600px]"
      }`}
    >
      <div className=" md:flex w-full h-full">
        {/* Avatar Video Side - Expands to full width when connected */}
        <div
          className={` relative z-10 transition-all duration-700 ease-in-out  ${
            isConnected ? "md:w-full" : "md:w-2/3"
          }`}
          style={{
            boxShadow: isConnected ? "none" : "10px 0 30px rgba(0,0,0,0.03)",
          }}
        >
          <div className="w-full h-full">
            {/* Avatar Video */}

            {meetingState === "joined-meeting" ? (
              <div>
                <DailyVideo
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  fit="contain"
                  type="video"
                  sessionId={remoteParticipantIds[0]}
                  // onResize={handleResize}
                />
                {/* <div className="absolute bottom-[79px] rounded-full right-4 overflow-hidden"> */}
                <DailyVideo
                  className="absolute bottom-[100px] right-[10px] h-20 w-20 rounded-full  overflow-hidden lg:h-40 lg:w-40"
                  fit="cover"
                  type="video"
                  sessionId={localSessionId}
                  onResize={handleResize}
                />
                {/* </div> */}
              </div>
            ) : (
              <video
                src="https://cdn.prod.website-files.com/63b2f566abde4cad39ba419f%2F67b5222642c2133d9163ce80_newmike-transcode.mp4"
                autoPlay
                muted
                loop
                playsInline
                webkit-playsinline="true"
                className="w-full h-full object-cover"
              ></video>
            )}

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

            {/* Status badge */}
            <div className="absolute top-6 left-6 z-20">
              <div
                className={`flex items-center  md:px-4 md:py-2 px-2 py-1 rounded-full shadow-lg transition-all duration-500 ${
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
                <span className="text-gray-800 text-xs md:text-sm font-medium">
                  {isConnected ? "Live Conversation" : "Ready to Connect"}
                </span>
              </div>
            </div>

            {/* Control overlay */}
            {/* {isConnecting && ( */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
              <div className="flex items-center md:space-x-3  bg-black/20 backdrop-blur-md rounded-full px-5 md:px-3  md:py-3 py-1  shadow-lg border border-white/10">
                <button
                  onClick={toggleAudio}
                  className="text-white p-2 rounded-full hover:bg-white/20 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="md:h-5 md:w-5 h-4 w-4"
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
                    className="md:h-5 md:w-5 h-4 w-4"
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

                <div className="flex items-center space-x-1 md:h-6 h-4 px-3">
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
            {/* )} */}
          </div>
        </div>

        {/* Form Side - Only visible when not connected */}
        {!isConnected && (
          <div
            className=" md-w-[500px] flex flex-col justify-center p-8 z-10 bg-white/50 backdrop-blur-sm rounded-r-3xl transition-all duration-700 ease-in-out"
            style={{
              boxShadow: "inset 0 0 20px rgba(255, 255, 255, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <div className="space-y-7">
              <div className="hidden md:block text-center space-y-2">
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
                        className="h-5 w-5 mr-2 hidden md:block"
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
      {/* {isConnected && ( */}
      {/* // <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20 animate-fadeIn"> */}
      {/* //   <div className="bg-white/20 backdrop-blur-lg text-gray-800 px-6 py-3 rounded-full shadow-lg border border-white/30 flex items-center space-x-3"> */}
      {/* //     <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div> */}

      {/* <span className="font-medium">Connected with {formData.name}</span> */}
      {/* //     <span className="h-3 w-px bg-gray-400/30"></span> */}
      {/* //     <span className="text-xs text-gray-600">00:08</span> */}
      {/* //   </div> */}
      {/* // </div> */}
      {/* // )} */}
      {/* Animation of success circle when connecting */}
      {/* {isConnecting && (
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
      )} */}
      <DailyAudio />
    </div>
  );
};

export default RavanPremiumInterface;
