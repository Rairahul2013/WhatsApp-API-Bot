const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_multi');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state
    });

    // ---- PAIRING CODE LOGIC ----
    if (!sock.authState.creds.registered) {
        // IDHAR APNA WHATSAPP NUMBER DAALEIN (e.g., "919876543210")
        const phoneNumber = "91XXXXXXXXXX"; 
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(\n\n👉 APNA PAIRING CODE: ${code} 👈\n\n);
        }, 3000);
    }

    // ---- COMMANDS HANDLING ----
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const textMessage = msg.message.conversation  msg.message.extendedTextMessage?.text  "";
        const command = textMessage.toLowerCase().trim();

        // 1. Ping Command
        if (command === '.ping') {
            await sock.sendMessage(remoteJid, { text: 'Pong! Bot active hai. 🚀' });
        } 
        // 2. Menu Command
        else if (command === '.menu' || command === '.help') {
            await sock.sendMessage(remoteJid, { 
                text: '✨ *Elaina Bot Menu* ✨\n\n💬 *.ping* - Check bot status\nℹ️ *.info* - About bot' 
            });
        }
        // 3. Info Command
        else if (command === '.info') {
            await sock.sendMessage(remoteJid, { text: 'Main ek 24/7 online rehne wala WhatsApp Bot hoon jise Koyeb par host kiya gaya hai!' });
        }
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('WhatsApp Bot successfully connected! 🎉');
        }
    });
}
startBot();
