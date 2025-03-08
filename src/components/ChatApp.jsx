import React, { useState, useEffect } from "react";
import axios from "axios";
import MessageInput from "./MessageInput";

const ChatApp = () => {
    // Tablica sesji – każda sesja ma { id, messages }
    const [sessions, setSessions] = useState([]);
    // Identyfikator aktualnie aktywnej sesji
    const [activeSessionId, setActiveSessionId] = useState(null);

    // Ładowanie sesji z localStorage przy starcie
    useEffect(() => {
        const savedSessions = JSON.parse(localStorage.getItem("chatSessions")) || [];
        if (savedSessions.length === 0) {
            // Jeśli brak zapisanych sesji, utwórz nową
            const newSession = { id: Date.now(), messages: [] };
            setSessions([newSession]);
            setActiveSessionId(newSession.id);
            localStorage.setItem("chatSessions", JSON.stringify([newSession]));
        } else {
            setSessions(savedSessions);
            // Ustaw ostatnią sesję jako aktywną
            setActiveSessionId(savedSessions[savedSessions.length - 1].id);
        }
    }, []);

    // Pobieranie aktualnej (aktywnej) sesji
    const getActiveSession = () => sessions.find((s) => s.id === activeSessionId);

    // Aktualizowanie sesji w stanie oraz zapis do localStorage
    const updateSessions = (updatedSessions) => {
        setSessions(updatedSessions);
        localStorage.setItem("chatSessions", JSON.stringify(updatedSessions));
    };

    // Funkcja wysyłająca wiadomość i pobierająca odpowiedź od AI (Llama3)
    const sendMessage = async (message) => {
        const currentSession = getActiveSession();
        if (!currentSession) return;

        // Dodaj wiadomość użytkownika
        const newUserMessage = { text: message, role: "user" };
        let updatedSession = {
            ...currentSession,
            messages: [...currentSession.messages, newUserMessage],
        };

        let updatedSessions = sessions.map((s) =>
            s.id === activeSessionId ? updatedSession : s
        );
        updateSessions(updatedSessions);

        // Wywołanie API Llama3 przez Ollama
        try {
            const response = await axios.post("http://localhost:11434/api/generate", {
                model: "llama3",
                prompt: message,
                stream: false,
            });

            const aiResponseText = response.data.response;
            const newAIMessage = { text: aiResponseText, role: "ai" };

            updatedSession = {
                ...updatedSession,
                messages: [...updatedSession.messages, newAIMessage],
            };
            updatedSessions = sessions.map((s) =>
                s.id === activeSessionId ? updatedSession : s
            );
            updateSessions(updatedSessions);
        } catch (error) {
            console.error("Błąd:", error);
        }
    };

    // Usuwanie sesji
    const deleteSession = (sessionId) => {
        const updatedSessions = sessions.filter((s) => s.id !== sessionId);
        updateSessions(updatedSessions);
        if (sessionId === activeSessionId) {
            if (updatedSessions.length > 0) {
                setActiveSessionId(updatedSessions[updatedSessions.length - 1].id);
            } else {
                const newSession = { id: Date.now(), messages: [] };
                setSessions([newSession]);
                setActiveSessionId(newSession.id);
                localStorage.setItem("chatSessions", JSON.stringify([newSession]));
            }
        }
    };

    // Przełączanie aktywnej sesji
    const switchSession = (sessionId) => {
        setActiveSessionId(sessionId);
    };

    // Tworzenie nowej sesji
    const startNewSession = () => {
        const newSession = { id: Date.now(), messages: [] };
        const updatedSessions = [...sessions, newSession];
        updateSessions(updatedSessions);
        setActiveSessionId(newSession.id);
    };

    const activeSession = getActiveSession();

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            {/* Pasek sesji – lista rozmów po lewej */}
            <div
                style={{
                    width: "250px",
                    borderRight: "1px solid #ccc",
                    padding: "10px",
                    overflowY: "auto",
                }}
            >
                <h3>Chat Sessions</h3>
                <button onClick={startNewSession} style={{ marginBottom: "10px" }}>
                    Zacznij nową sesję
                </button>
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        onClick={() => switchSession(session.id)}
                        style={{
                            cursor: "pointer",
                            backgroundColor:
                                session.id === activeSessionId ? "#ddd" : "transparent",
                            padding: "5px",
                            marginBottom: "5px",
                            borderRadius: "4px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span>Session {session.id}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                            }}
                            style={{
                                background: "red",
                                color: "#fff",
                                border: "none",
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                cursor: "pointer",
                            }}
                        >
                            X
                        </button>
                    </div>
                ))}
            </div>

            {/* Obszar rozmowy – wyświetlanie wiadomości */}
            <div
                style={{
                    flex: 1,
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <h3>Messages</h3>
                <div
                    style={{
                        border: "1px solid #ccc",
                        flex: 1,
                        overflowY: "auto",
                        padding: "5px",
                        marginBottom: "10px",
                    }}
                >
                    {activeSession &&
                        activeSession.messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    textAlign: msg.role === "user" ? "right" : "left",
                                    margin: "5px 0",
                                }}
                            >
                                <span
                                    style={{
                                        backgroundColor:
                                            msg.role === "user" ? "#d1e7dd" : "#f8d7da",
                                        display: "inline-block",
                                        padding: "8px",
                                        borderRadius: "8px",
                                    }}
                                >
                                    {msg.role === "user" ? "Ty: " : "AI: "}
                                    {msg.text}
                                </span>
                            </div>
                        ))}
                </div>
                <MessageInput onSendMessage={sendMessage} />
            </div>
        </div>
    );
};

export default ChatApp;
