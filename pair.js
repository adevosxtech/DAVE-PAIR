const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require('pino');
const {
    default: Mbuvi_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require('@whiskeysockets/baileys');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Track active pairing sessions to prevent duplicates
const activeSessions = new Map();

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    // Check if already processing this number
    if (activeSessions.has(num)) {
        return res.send({ error: 'Pairing already in progress for this number' });
    }

    async function Mbuvi_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        let connectionClosed = false;
        let codeSent = false;
        
        try {
            let Pair_Code_By_Mbuvi_Tech = Mbuvi_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
                },
                version: [2,3000,1033105955],
                printQRInTerminal: false,
                logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
                browser: Browsers.windows('Edge'),
                generateHighQualityLinkPreview: false,
                syncFullHistory: false,
                markOnlineOnConnect: false
            });

            if (!Pair_Code_By_Mbuvi_Tech.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const custom = "DAVEXBOT";
                
                // Only send code once
                if (!codeSent && !res.headersSent) {
                    const code = await Pair_Code_By_Mbuvi_Tech.requestPairingCode(num, custom);
                    codeSent = true;
                    await res.send({ code });
                }
            }

            Pair_Code_By_Mbuvi_Tech.ev.on('creds.update', saveCreds);
            
            // Use a flag to prevent multiple opens
            let sessionProcessed = false;
            
            Pair_Code_By_Mbuvi_Tech.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect } = s;
                
                if (connection === 'open' && !sessionProcessed && !connectionClosed) {
                    sessionProcessed = true;
                    activeSessions.delete(num);
                    
                    await delay(5000);
                    
                    try {
                        let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                        let b64data = Buffer.from(data).toString('base64');
                        
                        // Send session only once
                        let session = await Pair_Code_By_Mbuvi_Tech.sendMessage(
                            Pair_Code_By_Mbuvi_Tech.user.id, 
                            { text: 'DAVE-X:~' + b64data }
                        );

                        let Mbuvi_MD_TEXT = `🟢 paired successfully\n✅ session active\n Type: Base64\n`;
                        
                        await Pair_Code_By_Mbuvi_Tech.newsletterFollow("120363366284524544@newsletter");
                        await Pair_Code_By_Mbuvi_Tech.sendMessage(
                            Pair_Code_By_Mbuvi_Tech.user.id, 
                            { text: Mbuvi_MD_TEXT }, 
                            { quoted: session }
                        );
                        
                        await delay(100);
                    } catch (err) {
                        console.log('Error sending session:', err);
                    } finally {
                        await Pair_Code_By_Mbuvi_Tech.ws.close();
                        await removeFile('./temp/' + id);
                    }
                    
                } else if (connection === 'close' && !sessionProcessed) {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    
                    // Don't reconnect if logged out or if session was processed
                    if (statusCode === DisconnectReason.loggedOut || 
                        statusCode === DisconnectReason.badSession) {
                        connectionClosed = true;
                        activeSessions.delete(num);
                        await removeFile('./temp/' + id);
                        return;
                    }
                    
                    // Only reconnect for certain errors and if not already closed
                    if (!connectionClosed && !sessionProcessed && 
                        (statusCode === DisconnectReason.connectionLost || 
                         statusCode === DisconnectReason.timedOut)) {
                        connectionClosed = true;
                        await delay(10000);
                        Mbuvi_MD_PAIR_CODE();
                    } else {
                        connectionClosed = true;
                        activeSessions.delete(num);
                        await removeFile('./temp/' + id);
                    }
                }
            });
            
            // Add timeout to prevent hanging
            setTimeout(() => {
                if (!sessionProcessed && !connectionClosed) {
                    connectionClosed = true;
                    activeSessions.delete(num);
                    Pair_Code_By_Mbuvi_Tech.ws?.close();
                    removeFile('./temp/' + id);
                    if (!res.headersSent) {
                        res.send({ error: 'Pairing timeout' });
                    }
                }
            }, 60000); // 60 second timeout
            
        } catch (err) {
            console.log('Service restarted:', err);
            connectionClosed = true;
            activeSessions.delete(num);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: 'Service Currently Unavailable' });
            }
        }
    }

    // Mark as active
    activeSessions.set(num, id);
    return await Mbuvi_MD_PAIR_CODE();
});

module.exports = router;