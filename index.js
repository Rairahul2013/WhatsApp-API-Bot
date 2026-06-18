const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_multi');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log("Connection closed. Reconnecting...");
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Bot Connected Successfully! 🎉');
        }
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = "919161277551";
        setTimeout(async () => {
            try {
                console.log("Fetching pairing code for: " + phoneNumber);
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log("CODE_START:" + code + ":CODE_END");
            } catch (err) {
                console.log("Pairing Error: " + err.message);
            }
        }, 10000);
    }

    sock.ev.on('creds.update', saveCreds);
}

startBot();
