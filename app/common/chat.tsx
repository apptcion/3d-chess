"use client";
import styles from "../../public/css/common/chat.module.css";
import { useState } from "react";
import { Socket } from "socket.io-client";

export default function Chat({ params }: { params: { socket: Socket; username: string } }) {
  const [log, setLog] = useState<Array<{ content: string; username: string }>>([]);
  const [chat, setChat] = useState<string | null>(null);
  const { socket, username } = params;

  const handleKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      socket.emit("send", { content: chat, sender: username });
      setLog((log) => [
        ...log,
        { username, content: chat as string }
      ]);
      const inputHTML = e.target as HTMLInputElement;
      inputHTML.value = "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChat(e.target.value);
  };

  // 메시지 수신 이벤트는 외부에서 설정
  if (!socket.hasListeners("receiveMsg")) {
    socket.on("receiveMsg", ({ sender, content }: { sender: string; content: string }) => {
      console.log("Received message:", sender, content);
      setLog((log) => [
        ...log,
        { username: sender, content }
      ]);
    });
  }

  return (
    <div className={styles.wrap}>
      <div id="log" className={styles.log}>
        {log.map((chatData: { username: string; content: string }, index) => (
          <div className={styles.chat} key={index}>
            <div className={styles.username}>{chatData.username}</div>
            <div className={styles.content}>{chatData.content}</div>
          </div>
        ))}
      </div>
      <input
        className={styles.input}
        onChange={handleChange}
        onKeyDown={handleKeydown}
        placeholder="message"
      />
    </div>
  );
}
