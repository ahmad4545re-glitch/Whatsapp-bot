const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
    
    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("Scan the QR code below to connect your WhatsApp:");
        }

        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log("Connection closed due to ", lastDisconnect?.error, ", reconnecting ", reason);
            if (reason !== DisconnectReason.loggedOut) {
                startBot();
            } else {
                console.log("Logged out. Please delete auth_info_baileys and scan again.");
            }
        } else if (connection === "open") {
            console.log("Bot connected successfully to WhatsApp!");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
