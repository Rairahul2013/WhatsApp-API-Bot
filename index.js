Const { 
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

    if (!sock.authState.creds.registered) {
        // 👇 IDHAR '91' KE AAGE APNA 10-DIGIT KA NUMBER LIKHIYE
        const phoneNumber = "919161277551"; 
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log("CODE_START:" + code + ":CODE_END");
        }, 3000);
    }

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const textMessage = msg.message.conversation  msg.message.extendedTextMessage?.text  "";
        const command = textMessage.toLowerCase().trim();

        if (command === '.ping') {
            await sock.sendMessage(remoteJid, { text: 'Pong! Bot active hai. 🚀' });
        } 
        else if (command === '.menu' || command === '.help') {
            await sock.sendMessage(remoteJid, { 
                text: '✨ *Elaina Bot Menu* ✨\n\n💬 *.ping* - Check bot status\nℹ️ *.info* - About bot' 
            });
        }
        else if (command === '.info') {
            await sock.sendMessage(remoteJid, { text: 'Main ek 24/7 online rehne wala WhatsApp Bot hoon!' });
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
