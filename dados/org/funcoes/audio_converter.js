const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

/**
 * Sistema de conversão de áudios para formato OGG/Opus
 * Garante compatibilidade universal no WhatsApp (Android, iOS, Web)
 */

// Cache de conversões para evitar reprocessamento
const conversionCache = new Map();

/**
 * Converte áudio para formato Opus (compatível com todos os sistemas)
 * @param {string|Buffer} input - Caminho do arquivo ou Buffer do áudio
 * @param {boolean} isPtt - Se é áudio PTT (push-to-talk/gravação de voz)
 * @returns {Promise<Buffer>} Buffer do áudio convertido
 */
async function convertToOpus(input, isPtt = true) {
    return new Promise((resolve, reject) => {
        const tempInput = path.join(__dirname, `temp_input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.tmp`);
        const tempOutput = path.join(__dirname, `temp_output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.ogg`);

        try {
            // Se input for Buffer, salvar em arquivo temporário
            if (Buffer.isBuffer(input)) {
                fs.writeFileSync(tempInput, input);
                input = tempInput;
            }

            const command = ffmpeg(input);

            if (isPtt) {
                // Para áudios PTT: converter para Opus com configurações otimizadas
                command
                    .audioCodec('libopus')
                    .format('ogg')
                    .audioBitrate('48k')
                    .audioChannels(1)
                    .audioFrequency(48000);
            } else {
                // Para áudios normais: converter para Opus de alta qualidade
                command
                    .audioCodec('libopus')
                    .format('ogg')
                    .audioFrequency(48000)
                    .audioChannels(2)
                    .audioBitrate('64k');
            }

            command
                .on('end', () => {
                    try {
                        const buffer = fs.readFileSync(tempOutput);
                        
                        // Limpar arquivos temporários
                        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                        if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
                        
                        resolve(buffer);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (err) => {
                    // Limpar arquivos temporários em caso de erro
                    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                    if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
                    reject(err);
                })
                .save(tempOutput);

        } catch (error) {
            // Limpar arquivos temporários em caso de erro
            if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
            reject(error);
        }
    });
}

/**
 * Retorna o mimetype correto baseado no tipo de áudio
 * @param {boolean} isPtt - Se é áudio PTT
 * @returns {string} Mimetype correto
 */
function getAudioMimetype(isPtt = true) {
    return isPtt ? 'audio/ogg; codecs=opus' : 'audio/ogg; codecs=opus';
}

/**
 * Prepara áudio para envio no WhatsApp (converte se necessário)
 * @param {string|Buffer} audioPath - Caminho ou Buffer do áudio
 * @param {boolean} isPtt - Se é áudio PTT
 * @returns {Promise<{buffer: Buffer, mimetype: string}>}
 */
async function prepareAudioForWhatsApp(audioPath, isPtt = true) {
    try {
        let audioBuffer;
        let needsConversion = false;

        // Se for caminho de arquivo, verificar se precisa conversão
        if (typeof audioPath === 'string') {
            const ext = path.extname(audioPath).toLowerCase();
            
            // Se já for OGG, apenas ler o arquivo
            if (ext === '.ogg' || ext === '.opus') {
                audioBuffer = fs.readFileSync(audioPath);
                needsConversion = false;
            } else {
                // Se for MP3 ou outro formato, precisa converter
                audioBuffer = fs.readFileSync(audioPath);
                needsConversion = true;
            }
        } else {
            // Se for Buffer, assumir que precisa conversão
            audioBuffer = audioPath;
            needsConversion = true;
        }

        // Converter para Opus se necessário
        if (needsConversion) {
            audioBuffer = await convertToOpus(audioBuffer, isPtt);
        }

        return {
            buffer: audioBuffer,
            mimetype: getAudioMimetype(isPtt)
        };
    } catch (error) {
        console.error('❌ Erro ao preparar áudio:', error);
        throw error;
    }
}

/**
 * Converte caminho de arquivo MP3 para OGG (se existir)
 * @param {string} audioPath - Caminho do arquivo de áudio
 * @returns {string} Caminho do arquivo OGG (ou original se não existir)
 */
function convertPathToOgg(audioPath) {
    if (typeof audioPath !== 'string') return audioPath;
    
    // Se já for OGG, retornar como está
    if (audioPath.endsWith('.ogg') || audioPath.endsWith('.opus')) {
        return audioPath;
    }
    
    // Converter extensão para .ogg
    const oggPath = audioPath.replace(/\.(mp3|wav|m4a|aac)$/i, '.ogg');
    
    // Verificar se o arquivo OGG existe
    if (fs.existsSync(oggPath)) {
        return oggPath;
    }
    
    // Se não existir OGG, retornar o original
    return audioPath;
}

/**
 * Função auxiliar para enviar áudio no WhatsApp com compatibilidade universal
 * @param {Object} conn - Conexão do Baileys
 * @param {string} from - ID do chat
 * @param {string|Buffer} audioPath - Caminho ou Buffer do áudio
 * @param {Object} options - Opções adicionais (quoted, etc)
 * @param {boolean} isPtt - Se é áudio PTT (padrão: true)
 */
async function sendAudioMessage(conn, from, audioPath, options = {}, isPtt = true) {
    try {
        // Converter caminho para OGG se possível
        if (typeof audioPath === 'string') {
            audioPath = convertPathToOgg(audioPath);
        }
        
        // Preparar áudio
        const { buffer, mimetype } = await prepareAudioForWhatsApp(audioPath, isPtt);
        
        // Enviar mensagem
        return await conn.sendMessage(
            from,
            {
                audio: buffer,
                mimetype: mimetype,
                ptt: isPtt
            },
            options
        );
    } catch (error) {
        console.error('❌ Erro ao enviar áudio:', error);
        throw error;
    }
}

module.exports = {
    convertToOpus,
    getAudioMimetype,
    prepareAudioForWhatsApp,
    convertPathToOgg,
    sendAudioMessage
};
