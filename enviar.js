const fs = require('fs');
const Ably = require('ably').Realtime;

// Substitua 'YOUR_ABLY_API_KEY' pela sua chave de API válida do Ably
const ably = new Ably('DvEMhg.dJ-rfw:3dHeDGTnKLSgP-8au04fMsV3yHepKz1BpUaaAxNZ-4s');

// Função para verificar se o conteúdo contém o sinal de três iguais "==="
function containsThreeEquals(content) {
 return content.includes('===');
}

// Função para processar o conteúdo do arquivo
async function processFileContent(content) {
 if (containsThreeEquals(content)) {
    const parts = content.split('===');
    if (parts.length === 2) {
      const canalDaMensagens = parts[0].trim();
      const mensagemRelevante = parts[1];

      // Verificar se o identificador do canal é válido
      if (canalDaMensagens!== '') {
        console.log('Mensagem formatada corretamente identificada.'); // Mensagem de log para mensagens formatadas corretamente
        // Enviar mensagem relevante para o canal especificado
        const channel = ably.channels.get(canalDaMensagens);
        try {
          await channel.publish('message', mensagemRelevante);
          console.log('Mensagem enviada com sucesso para o canal:', canalDaMensagens);
          // Limpar o arquivo após enviar a mensagem
          fs.writeFile('resultadofinal.txt', '', err => {
            if (err) {
              console.error('Erro ao limpar o arquivo:', err);
            } else {
              console.log('Arquivo limpo após enviar a mensagem.');
              // Encerra o processo após limpar o arquivo
              process.exit(0); // Encerra o processo após enviar a mensagem e limpar o arquivo
            }
          });
        } catch (err) {
          console.error('Erro ao enviar mensagem:', err);
          process.exit(1); // Encerra o processo após um erro
        }
      } else {
        console.error('Identificador do canal inválido.');
        process.exit(1); // Encerra o processo após identificar um identificador de canal inválido
      }
    } else {
      console.error('Formato de mensagem inválido.');
      process.exit(1); // Encerra o processo após identificar uma mensagem fora do formato
    }
 } else {
    console.log('O conteúdo do arquivo não contém o sinal de três iguais "===".');
    // Limpar o arquivo antes de encerrar o processo
    fs.writeFile('resultadofinal.txt', '', err => {
      if (err) {
        console.error('Erro ao limpar o arquivo:', err);
      } else {
        console.log('Arquivo limpo antes de encerrar o processo.');
        process.exit(0); // Encerra o processo após limpar o arquivo
      }
    });
 }
}

// Função para verificar periodicamente se o arquivo foi modificado
function checkFileModification() {
 let lastModifiedTime = null;

 setInterval(() => {
   fs.stat('resultadofinal.txt', (err, stats) => {
     if (err) {
       console.error('Erro ao verificar o arquivo:', err);
       return;
     }

     if (!lastModifiedTime || stats.mtimeMs!== lastModifiedTime) {
       lastModifiedTime = stats.mtimeMs;
       fs.readFile('resultadofinal.txt', 'utf8', (err, data) => {
         if (err) {
           console.error('Erro ao ler o arquivo:', err);
         } else {
           processFileContent(data).catch(console.error); // Tratar erros de forma assíncrona
         }
       });
     }
   });
 }, 1000); // Verifica a cada 1 segundo
}

console.log('Verificando modificações no arquivo resultadofinal.txt...');
checkFileModification();
