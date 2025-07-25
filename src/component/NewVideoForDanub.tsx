import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Mic,
  Sparkles,
  MicOff,
  Camera,
  CameraOff,
  Factory,
} from "lucide-react";
import { useDaily } from "@daily-co/daily-react";
import {
  DailyVideo,
  useMeetingState,
  DailyAudio,
  useParticipantIds,
  useAudioTrack,
  useVideoTrack,
  useLocalSessionId,
  useMediaTrack,
} from "@daily-co/daily-react";
import axios from "axios";
import CountryCode from "./CountryCode";
import { useWidgetContext } from "./constexts/WidgetContext";
import * as yup from "yup";
import "react-phone-input-2/lib/bootstrap.css";
import video from "../assets/video.mp4";
import video2 from "../assets/video-VEED.mp4";
import { useRequestPermissions } from '../components/cvi/hooks/use-request-permissions';

// Define a validation schema
const validationSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  phone: yup.string().required("Phone is required"),
  // organization: yup.string().required("Organization is required"),
});

const NewVideoForDanub = () => {
  const [phone, setPhone] = useState("");
  const { agent_id, schema } = useWidgetContext();
  const [countryCode, setCountryCode] = useState("+1");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
  });

  const handleCountryCode = (data) => {
    setCountryCode(data);
  };
  const requestPermissions = useRequestPermissions();

  const meetingState = useMeetingState();
  const [isLoading, setIsLoading] = useState(false);
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });
  const localSessionId = useLocalSessionId();
  const localVideo = useVideoTrack(localSessionId);
  const localAudio = useAudioTrack(localSessionId);
  const isCameraEnabled = !localVideo.isOff;
  const isMicEnabled = !localAudio.isOff;
  // const agent_code = "74693076-7c01-4615-a127-dd7c87a9086b";
  // const schema_name = "6af30ad4-a50c-4acc-8996-d5f562b6987f";
  const agent_code = agent_id;
  const schema_name = schema;
  const [isGhlAppointmentInserted, setIsGhlAppointmentInserted] = useState("");
  const daily = useDaily();
  const isUresmuted = useMediaTrack(localSessionId, "audio");
  console.log("isUresmuted", isUresmuted.isOff);
  const handleClick = async () => {
    setIsLoading(true);
    try {
      await requestPermissions()
      const createConversation = await axios.post(
        "https://app.snowie.ai/api/start-avatar-call/",
        {
          // replica_id: "r3fbe3834a3e",
          agent_code: agent_code,
          schema_name: schema_name,
          name: formData.name,
          email: formData.email,
          phone_number: `${countryCode}${formData.phone}`,
          industry: formData.organization,
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

  const handleAppMessage = useCallback((event: any) => {
    if (event.data.event_type === "conversation.tool_call") {
      console.log("tool_call", event);

      if (event.data.properties.name === "insert_in_ghl") {
        console.log("tool_call", event.data.properties.arguments);
        const args = JSON.parse(event.data.properties.arguments);
        const { appointment_date } = args;
        setIsGhlAppointmentInserted(appointment_date);
        console.log("appointment_date", appointment_date);
      }
    }
  }, []);

  useEffect(() => {
    if (!daily) return;

    const handlerRef = handleAppMessage;

    // Check if the handler is already attached
    daily.off("app-message", handlerRef); // prevent duplicates
    daily.on("app-message", handlerRef);

    return () => {
      daily.off("app-message", handlerRef); // clean up
    };
  }, [daily, handleAppMessage]);

  const handleResize = useCallback(
    (dimensions: { width: 1280; height: 720; aspectRatio: 1.777 }) => {
      console.log("Video resized:", dimensions);
    },
    []
  );

  useEffect(() => {
    const insertGhlAppointment = async () => {
      if (isGhlAppointmentInserted) {
        const agentCode = agent_code;

        const url = `https://app.snowie.ai/api/agent/leadconnect/appointment/`;

        const ghlResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_name: formData.name,
            contact_id: `${countryCode}${formData.phone}`,
            agent_id: agentCode,
            appointment_book_ts: isGhlAppointmentInserted,
            schema_name: schema_name,
            // ip_address: ipAddress,
          }),
        });

        const ghlJson = await ghlResponse.json();
        console.log("GJHL  Response:", ghlJson);

        // Return a success response with the booking and agency notification details
        return {
          success: ghlJson.success,
          ghlJson: ghlJson,
        };
      } else {
        // If booking fails, return error
        console.log("Booking failed:");
        return { error: "Failed to book the appointment" };
      }
    };
    insertGhlAppointment();
  }, [isGhlAppointmentInserted]);

  useEffect(() => {
    console.log("isConnected", isConnected);
  }, [isConnected]);
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

  daily?.updateInputSettings({
    audio: {
      processor: {
        type: "noise-cancellation",
      },
    },
  });
  return (
    <div
      className={`m-4 h-fit  md:h-[580px] md:max-w-6xl mx-auto overflow-hidden rounded-3xl shadow-2xl bg-[#fefbf3] ${
        meetingState === "joined-meeting" ? "h-[219.38px]" : "h-[600px]"
      }`}
    >
      <div className=" md:flex w-full h-full">
        {/* Avatar Video Side - Expands to full width when connected */}
        <div
          className={` relative transition-all duration-700 ease-in-out  bg-[#fefbf3] ${
            isConnected ? "md:w-full" : "md:w-2/3"
          }`}
          style={{
            boxShadow: isConnected ? "none" : "10px 0 30px rgba(0,0,0,0.03)",
          }}
        >
          <div className="w-full h-full">
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
                />
                <DailyVideo
                  className="absolute bottom-[100px] right-[10px] h-20 w-20 rounded-full  overflow-hidden lg:h-40 lg:w-40"
                  fit="cover"
                  type="video"
                  sessionId={localSessionId}
                  onResize={handleResize}
                />
              </div>
            ) : (
              <video
                src={video2}
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
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 ">
              <div className="flex items-center md:space-x-3  bg-black/20 backdrop-blur-md rounded-full px-5 md:px-3  md:py-3 py-1  shadow-lg border border-white/10">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className="text-white p-2 rounded-full hover:bg-white/20 transition"
                >
                  {isUresmuted.isOff ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </button>

                <button
                  type="button"
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
                    type="button"
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
            className=" md-w-[500px]  flex flex-col justify-center p-8 z-10 bg-black backdrop-blur-sm md:rounded-r-3xl transition-all duration-700 ease-in-out"
            // style={{
            //   boxShadow: "inset 0 0 20px rgba(255, 255, 255, 0.5)",
            //   border: "1px solid rgba(255, 255, 255, 0.3)",
            // }}
          >
            <div className="space-y-7">
              <div className="hidden md:block text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  Let's Get Started
                </h2>
                <p className=" text-white">Connect with our AI assistant</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#e8361c] pl-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <User className="h-5 w-5 text-black" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-white backdrop-blur-sm border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl px-4 py-3 pl-11 text-gray-900 transition outline-none"
                        placeholder="John Doe"
                        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#e8361c] pl-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 z-10">
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
                        className="w-full bg-white backdrop-blur-sm border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl px-4 py-3 pl-11 text-gray-900 transition outline-none"
                        placeholder="john@example.com"
                        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#e8361c] pl-1">
                      Phone Number
                    </label>
                    <div className="relative flex">
                      <CountryCode data={handleCountryCode} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="h-[50px] w-[216px] md:w-[236px]  bg-white backdrop-blur-sm border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl rounded-l-none px-4 py-3 pl-11 text-gray-900 transition outline-none"
                        placeholder="(555) 000-0000"
                        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isConnecting}
                  className="flex items-center w-full justify-center space-x-2 py-3.5 px-6 rounded-xl text-white font-medium text-lg transition-all shadow-lg"
                  style={{
                    background: isConnecting
                      ? "#e8361c"
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
            </div>
          </div>
        )}
      </div>

      <DailyAudio />
    </div>
  );
};

export default NewVideoForDanub;
