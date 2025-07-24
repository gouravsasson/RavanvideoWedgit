import React, { useState, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  Camera,
  CameraOff,
  Factory,
  X,
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
  useAppMessage,
} from "@daily-co/daily-react";
import axios from "axios";
import CountryCode from "./CountryCode";
import * as yup from "yup";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";
import video2 from "../assets/video-VEED.mp4";
import fallback from "../assets/fallback.png";
import { useWidgetContext } from "./constexts/WidgetContext";
import video from "../assets/video.mp4";
// Define a validation schema
const createValidationSchema = (customFields) => {
  const schemaFields = {};
  customFields.forEach((field) => {
    let yupField = yup.string().required(`${field.label} is required`);
    if (field.type === "email") {
      yupField = yupField.email(`Invalid ${field.label.toLowerCase()} format`);
    }
    schemaFields[field.label.toLowerCase().replace(/\s+/g, "_")] = yupField;
  });
  return yup.object().shape(schemaFields);
};

const VideoForRavan = () => {
  const [phone, setPhone] = useState("");
  // const { agent_id, schema } = useWidgetContext();
  const sendAppMessage = useAppMessage();
  const [language, setLanguage] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [agent_code, setAgentCode] = useState(
    "ca9b354f-41a7-46ab-8e6d-8c56b6a1e727"
  );
  console.log(agent_code);
  const schema_name = "09483b13-47ac-47b2-95cf-4ca89b3debfa";
  const [countryCode, setCountryCode] = useState("+1");
  const [formData, setFormData] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errors, setErrors] = useState({});
  const [widgetSettings, setWidgetSettings] = useState({});
  const [validationSchema, setValidationSchema] = useState(null);

  const handleCountryCode = (data) => {
    setCountryCode(data);
  };

  const meetingState = useMeetingState();
  const [isLoading, setIsLoading] = useState(false);
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });
  const localSessionId = useLocalSessionId();
  const localVideo = useVideoTrack(localSessionId);
  const localAudio = useAudioTrack(localSessionId);
  const isCameraEnabled = !localVideo.isOff;
  const isMicEnabled = !localAudio.isOff;
  // const agent_code = agent_id;
  // const schema_name = schema;

  const [isGhlAppointmentInserted, setIsGhlAppointmentInserted] = useState("");
  const isUresmuted = useMediaTrack(localSessionId, "audio");
  const daily = useDaily();
  const [open, setOpen] = useState(false);
  console.log("open", open);

  const firstLogin = document.cookie
    .split("; ")
    .find((row) => row.startsWith("first_login="))
    ?.split("=")[1];
  console.log("First Login:", firstLogin);

  useEffect(() => {
    const video = document.querySelector("video");

    const tryPlay = () => {
      if (video && video.paused) {
        video.muted = true; // make extra sure
        video.play().catch((err) => {
          console.warn("Video play failed:", err);
        });
      }
    };

    document.addEventListener("click", tryPlay);

    return () => document.removeEventListener("click", tryPlay);
  }, []);

  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;
    setLanguage(selectedLanguage);

    // Set agent_code and schema_name based on language
    if (selectedLanguage === "english") {
      setAgentCode("ca9b354f-41a7-46ab-8e6d-8c56b6a1e727");
    } else if (selectedLanguage === "hindi") {
      setAgentCode("5b9d7ca0-547c-4c74-b07c-59df751d74c8");
    }
  };

  useEffect(() => {
    const fetchWidgetSettings = async () => {
      try {
        const response = await axios.get(
          `https://app.snowie.ai/api/avatar-widget-settings/${schema_name}/${agent_code}/`
        );
        const settings = response.data.response || {};
        setWidgetSettings(settings);

        // Initialize formData and validation schema based on custom_form_fields
        if (
          settings.custom_form_fields &&
          settings.custom_form_fields.length > 0
        ) {
          const initialFormData = {};
          settings.custom_form_fields.forEach((field) => {
            initialFormData[field.label.toLowerCase().replace(/\s+/g, "_")] =
              "";
          });
          setFormData(initialFormData);
          setValidationSchema(
            createValidationSchema(settings.custom_form_fields)
          );
        }
      } catch (error) {
        console.error("Error fetching widget settings:", error);
      }
    };

    fetchWidgetSettings();
  }, [agent_code]);

  const handleClick = async () => {
    if (firstLogin) {
      setOpen(true);
    } else {
      setIsLoading(true);
      try {
        const customFormFieldsObject = {};

        // If custom form fields exist, map the form data to field labels
        if (
          widgetSettings.custom_form_fields &&
          widgetSettings.custom_form_fields.length > 0
        ) {
          widgetSettings.custom_form_fields.forEach((field) => {
            const fieldKey = field.label.toLowerCase().replace(/\s+/g, "_");
            const fieldValue = formData[fieldKey] || "";

            // Use the original field label as the key
            customFormFieldsObject[field.label] = fieldValue;
          });
        }

        const createConversation = await axios.post(
          "https://app.snowie.ai/api/ravan-start-avatar-call/",
          {
            // replica_id: "r3fbe3834a3e",
            agent_code: agent_code,
            schema_name: schema_name,
            custom_form_fields: customFormFieldsObject, // Send as object with label as key
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
        const expires = new Date(
          Date.now() + 20 * 60 * 60 * 1000
        ).toUTCString(); // 20 hours
        document.cookie = `first_login=true; expires=${expires}; path=/`;
      } catch (error) {}
    }
  };

  const handleEnd = async () => {
    await daily?.leave();
    setIsLoading(false);
    setIsConnected(false);
    setOpen(true);
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
    const contactData = {
      schema_name: schema_name,
      name: formData.name,
      email: formData.email,
      phone: `${countryCode}${formData.phone}`,
      agent_code: agent_code,
    };
    const insertGhlAppointment = async () => {
      const contactResponse = await axios.post(
        `https://app.snowie.ai/api/create-ghl-contact/`,
        contactData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (isGhlAppointmentInserted && contactResponse.status === 201) {
        const contact_id = contactResponse.data.contactId;
        const agentCode = agent_code;

        const url = `https://app.snowie.ai/api/agent/leadconnect/appointment/`;

        const ghlResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_name: formData.name,
            contact_id: contact_id,
            agent_id: agentCode,
            appointment_book_ts: isGhlAppointmentInserted,
            schema_name: schema_name,
            // ip_address: ipAddress,
          }),
        });

        const ghlJson = await ghlResponse.json();
        console.log("GHL  Response:", ghlJson);

        // Return a success response with the booking and agency notification details
        if (
          ghlJson.status === 422 ||
          ghlJson.status === 400 ||
          ghlJson.success === false
        ) {
          const message = ghlJson;
          console.log("Sending message to all participants");
          daily?.sendAppMessage(
            {
              result: {
                success: true,
                message: "Contact created and appointment scheduled in GHL",
                contactId: contact_id,
              },
            },
            `${remoteParticipantIds}`
          );
        } else {
          return { error: "Failed to book the appointment" };
        }
      } else {
        console.log("Booking failed:");
        return { error: "Failed to book the appointment" };
      }
    };
    insertGhlAppointment();
  }, [isGhlAppointmentInserted]);

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
      if (
        widgetSettings.custom_form_fields &&
        widgetSettings.custom_form_fields.length > 0 &&
        validationSchema
      ) {
        await validationSchema.validate(formData, { abortEarly: false });
        console.log("Form is valid:", formData);
      } // Proceed with form submission
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
      className={`relative   m-4 h-fit  md:h-[580px] md:max-w-6xl mx-auto overflow-hidden rounded-3xl shadow-2xl bg-[#fefbf3] ${
        meetingState === "joined-meeting" ? "h-[219.38px]" : "h-[600px]"
      }`}
      style={{
        backgroundColor: widgetSettings.background_color || "#fefbf3",
        border: widgetSettings.border_color
          ? `1px solid ${widgetSettings.border_color}`
          : "none",
      }}
    >
      {open && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-50">
          <div className="flex justify-center w-full p-4">
            <div className="relative border border-orange-200 rounded-lg shadow-lg p-8 max-w-xl w-full bg-gradient-to-br from-amber-50 to-orange-50">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-black"
              >
                <X className="h-5 w-5 text-black" />
              </button>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-orange-900 mb-4">
                  That concludes your trial experience with our AI assistant.
                </h2>
                <p className="text-gray-700 mb-4">
                  If you'd like to see how this can be tailored for your
                  business, go ahead and book a full demo with our team — we're
                  excited to show you what's possible.
                </p>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setOpen(false);
                    window.open("https://www.ravan.ai/contact", "_blank");
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 shadow-md"
                >
                  Book a Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className=" md:flex w-full h-full">
        {/* Avatar Video Side - Expands to full width when connected */}
        <div
          className={` relative transition-all duration-700 ease-in-out  ${
            isConnected ? "md:w-full" : "md:w-2/3"
          }`}
          style={{
            boxShadow: isConnected
              ? "none"
              : widgetSettings.border_color
              ? `10px 0 30px ${widgetSettings.border_color}33`
              : "10px 0 30px rgba(0,0,0,0.03)",
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
                muted
                autoPlay
                loop
                playsInline
                webkit-playsinline="true"
                className="w-full h-full object-cover"
                // src="https://cdn.prod.website-files.com/63b2f566abde4cad39ba419f%2F67b5222642c2133d9163ce80_newmike-transcode.mp4"
                src={widgetSettings.video || video}
                poster={fallback}
              ></video>
            )}

            {/* Glowing border accent */}
            <div
              className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
                isConnected ? "rounded-3xl" : "rounded-l-3xl"
              }`}
              style={{
                boxShadow: widgetSettings.border_color
                  ? `inset 0 0 30px ${widgetSettings.border_color}26`
                  : "inset 0 0 30px rgba(255, 85, 0, 0.15)",
                border: widgetSettings.border_color
                  ? `1px solid ${widgetSettings.border_color}1A`
                  : "1px solid rgba(255, 85, 0, 0.1)",
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
                <span
                  className="text-gray-800 text-xs md:text-sm font-medium"
                  style={{ color: widgetSettings.text_color || "#333333" }}
                >
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
                        backgroundColor:
                          widgetSettings.button_color || "#ff5500",
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
            className="md-w-[500px] flex flex-col justify-center p-8 z-10 bg-white/50 backdrop-blur-sm rounded-r-3xl transition-all duration-700 ease-in-out"
            style={{
              backgroundColor: widgetSettings.background_color
                ? `${widgetSettings.background_color}80`
                : "rgba(255, 255, 255, 0.5)",
              border: widgetSettings.border_color
                ? `1px solid ${widgetSettings.border_color}4D`
                : "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <div className="space-y-7 overflow-y-auto">
              <div className="text-center space-y-2">
                {widgetSettings.bot_logo && (
                  <img
                    src={widgetSettings.bot_logo}
                    alt="Bot Logo"
                    className="mx-auto h-16 w-auto object-contain"
                  />
                )}
                <h2
                  className="text-3xl font-bold"
                  style={{ color: widgetSettings.text_color || "#222" }}
                >
                  Let's Get Started
                </h2>
                <p style={{ color: widgetSettings.text_color || "#606060" }}>
                  Connect with {widgetSettings.bot_name || "our AI assistant"}
                </p>
              </div>

              {!showForm ? (
                <div className="space-y-4">
                  <label
                    className="text-sm font-medium text-gray-700 pl-1"
                    style={{
                      color: widgetSettings.text_color || "#333333",
                    }}
                  >
                    Select Language
                  </label>
                  <select
                    value={language || ""}
                    onChange={handleLanguageChange}
                    className="w-full bg-white/60 backdrop-blur-sm border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl px-4 py-3 text-gray-900 transition outline-none"
                    style={{
                      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    }}
                  >
                    <option value="" disabled>
                      Select a language
                    </option>
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                  </select>
                  {/* --- ADDED: Next button --- */}
                  <button
                    type="button"
                    disabled={!language}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl text-lg font-medium transition-all shadow-lg"
                    style={{
                      background: !language
                        ? "#ccc"
                        : widgetSettings.button_color
                        ? widgetSettings.button_color
                        : "linear-gradient(90deg, #ff5500 0%, #ff7e38 100%)",
                      color: widgetSettings.button_text_color || "#ffffff",
                      boxShadow: !language
                        ? "none"
                        : widgetSettings.button_color
                        ? `0 4px 10px ${widgetSettings.button_color}4D`
                        : "0 4px 10px rgba(255, 85, 0, 0.3)",
                    }}
                    onClick={() => setShowForm(true)}
                    onMouseOver={(e) => {
                      if (widgetSettings.button_hover_color && language) {
                        e.currentTarget.style.background =
                          widgetSettings.button_hover_color;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (language) {
                        e.currentTarget.style.background =
                          widgetSettings.button_color
                            ? widgetSettings.button_color
                            : "linear-gradient(90deg, #ff5500 0%, #ff7e38 100%)";
                      }
                    }}
                  >
                    <span>Next</span>
                  </button>
                  {/* --- END ADDED --- */}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* --- ADDED: Back button --- */}
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-1/4 flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl text-lg font-medium transition-all shadow-lg mb-4"
                    style={{
                      background: widgetSettings.button_color
                        ? `${widgetSettings.button_color}80`
                        : "rgba(255, 85, 0, 0.5)",
                      color: widgetSettings.button_text_color || "#ffffff",
                      boxShadow: widgetSettings.button_color
                        ? `0 4px 10px ${widgetSettings.button_color}4D`
                        : "0 4px 10px rgba(255, 85, 0, 0.3)",
                    }}
                    onMouseOver={(e) => {
                      if (widgetSettings.button_hover_color) {
                        e.currentTarget.style.background =
                          widgetSettings.button_hover_color;
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background =
                        widgetSettings.button_color
                          ? `${widgetSettings.button_color}80`
                          : "rgba(255, 85, 0, 0.5)";
                    }}
                  >
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
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span>Back</span>
                  </button>
                  {/* --- END ADDED --- */}
                  {widgetSettings.custom_form_fields &&
                    widgetSettings.custom_form_fields.length > 0 && (
                      <div className="space-y-4">
                        {widgetSettings.custom_form_fields.map((field) => (
                          <div key={field.id} className="space-y-1.5">
                            <label
                              className="text-sm font-medium text-gray-700 pl-1"
                              style={{
                                color: widgetSettings.text_color || "#333333",
                              }}
                            >
                              {field.label}
                            </label>
                            <div className="relative">
                              {field.type !== "tel" && (
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                  {field.type === "text" &&
                                    field.label
                                      .toLowerCase()
                                      .includes("name") && (
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
                                    )}
                                  {field.type === "email" && (
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
                                  )}
                                  {field.type === "text" &&
                                    field.label
                                      .toLowerCase()
                                      .includes("industry") && (
                                      <Factory className="h-5 w-5" />
                                    )}
                                </div>
                              )}
                              {field.type === "tel" ? (
                                <div className="relative flex items-center">
                                  <CountryCode data={handleCountryCode} />
                                  <input
                                    type="tel"
                                    name={field.label
                                      .toLowerCase()
                                      .replace(/\s+/g, "_")}
                                    value={
                                      formData[
                                        field.label
                                          .toLowerCase()
                                          .replace(/\s+/g, "_")
                                      ]
                                    }
                                    onChange={handleChange}
                                    required
                                    className="w-full h-[50px] bg-white/60 backdrop-blur-sm border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl rounded-l-none px-4 py-3 pl-11 text-gray-900 transition outline-none"
                                    placeholder="(555) 000-0000"
                                    style={{
                                      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                                    }}
                                  />
                                </div>
                              ) : (
                                <input
                                  type={field.type}
                                  name={field.label
                                    .toLowerCase()
                                    .replace(/\s+/g, "_")}
                                  value={
                                    formData[
                                      field.label
                                        .toLowerCase()
                                        .replace(/\s+/g, "_")
                                    ]
                                  }
                                  onChange={handleChange}
                                  required
                                  className="w-full bg-white/60 backdrop-blur-sm border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl px-4 py-3 pl-11 text-gray-900 transition outline-none"
                                  placeholder={
                                    field.type === "email"
                                      ? "john@example.com"
                                      : field.label
                                  }
                                  style={{
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                                  }}
                                />
                              )}
                              {errors[
                                field.label.toLowerCase().replace(/\s+/g, "_")
                              ] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {
                                    errors[
                                      field.label
                                        .toLowerCase()
                                        .replace(/\s+/g, "_")
                                    ]
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl text-lg font-medium transition-all shadow-lg"
                    style={{
                      background: isConnecting
                        ? "#ccc"
                        : widgetSettings.button_color
                        ? widgetSettings.button_color
                        : "linear-gradient(90deg, #ff5500 0%, #ff7e38 100%)",
                      color: widgetSettings.button_text_color || "#ffffff",
                      boxShadow: isConnecting
                        ? "none"
                        : widgetSettings.button_color
                        ? `0 4px 10px ${widgetSettings.button_color}4D`
                        : "0 4px 10px rgba(255, 85, 0, 0.3)",
                    }}
                    onMouseOver={(e) => {
                      if (widgetSettings.button_hover_color && !isConnecting) {
                        e.currentTarget.style.background =
                          widgetSettings.button_hover_color;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isConnecting) {
                        e.currentTarget.style.background =
                          widgetSettings.button_color
                            ? widgetSettings.button_color
                            : "linear-gradient(90deg, #ff5500 0%, #ff7e38 100%)";
                      }
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
                        Connect with {widgetSettings.bot_name || "AI Assistant"}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      <DailyAudio />
    </div>
  );
};

export default VideoForRavan;
