import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { api } from "../api.js";

export function LiveRoom() {
  const { id } = useParams();
  const user = useSelector((s) => s.auth.user);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const localRef = useRef(null);
  const remotesRef = useRef(null);
  const pcs = useRef({});
  const socketRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;
    let dead = false;
    (async () => {
      const { session: s } = await api(`/api/live/${id}`);
      if (dead) return;
      setSession(s);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const socket = io("/", { transports: ["websocket"] });
      socketRef.current = socket;

      function addRemote(socketId, remoteStream) {
        let video = remotesRef.current.querySelector(`[data-id="${socketId}"]`);
        if (!video) {
          video = document.createElement("video");
          video.autoplay = true;
          video.playsInline = true;
          video.dataset.id = socketId;
          remotesRef.current.appendChild(video);
        }
        video.srcObject = remoteStream;
      }

      async function ensurePc(peerId) {
        if (pcs.current[peerId]) return pcs.current[peerId];
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit("live:signal", { to: peerId, data: { candidate: e.candidate } });
        };
        pc.ontrack = (e) => addRemote(peerId, e.streams[0]);
        pcs.current[peerId] = pc;
        return pc;
      }

      socket.on("live:peers", async ({ peers }) => {
        for (const peerId of peers) {
          const pc = await ensurePc(peerId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("live:signal", { to: peerId, data: { sdp: pc.localDescription } });
        }
      });

      socket.on("live:peer-joined", () => {});

      socket.on("live:signal", async ({ from, data }) => {
        const pc = await ensurePc(from);
        if (data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("live:signal", { to: from, data: { sdp: pc.localDescription } });
          }
        } else if (data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      socket.on("live:peer-left", ({ socketId }) => {
        pcs.current[socketId]?.close();
        delete pcs.current[socketId];
        remotesRef.current.querySelector(`[data-id="${socketId}"]`)?.remove();
      });

      socket.on("live:chat", (msg) => setMessages((m) => [...m, msg]));
      socket.emit("live:join", { roomId: s.roomId, user: { id: user.id, name: user.name, role: user.role } });
    })();

    return () => {
      dead = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(pcs.current).forEach((pc) => pc.close());
      socketRef.current?.disconnect();
    };
  }, [id, user]);

  function sendChat(e) {
    e.preventDefault();
    socketRef.current?.emit("live:chat", { roomId: session.roomId, message: text });
    setText("");
  }

  if (!user) return <div className="page">Sign in to join the live class.</div>;
  if (!session) return <div className="page">Opening room…</div>;

  return (
    <div className="page">
      <h1>{session.title}</h1>
      <p className="meta">
        {session.course?.title} · {session.status} · WebRTC mesh + Socket.IO signaling
      </p>
      <div className="live">
        <div>
          <video ref={localRef} autoPlay muted playsInline style={{ width: "100%", borderRadius: 12, background: "#111" }} />
          <div className="videos" ref={remotesRef} />
        </div>
        <form className="card chat" onSubmit={sendChat}>
          <div className="log">
            {messages.map((m) => (
              <div className="bubble" key={m.id}>
                <b>{m.from?.name}:</b> {m.message}
              </div>
            ))}
          </div>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the room" />
        </form>
      </div>
    </div>
  );
}
