const Ably = require('ably');
const fs = require('fs');
const { exec } = require('child_process');
const chokidar = require('chokidar');

const ably = new Ably.Realtime('DvEMhg.5UWyaw:adq5B_oItUhoFROoaqxVNbVXjKItiNI_me9mX3NIKQo');
const channel = ably.channels.get('cadu');

let messageQueue = [];
let isProcessing = false;

function sendMessageToAbly(message) {
  channel.publish('message', { text: message }, (err) => {
    if (err) {
      console.error('Erro ao enviar mensagem para o Ably:', err);
    } else {
      console.log('Mensagem enviada para o Ably:', message);
    }
  });
}

async function waitForProcessToEnd(processName) {
  const command = `pgrep ${processName}`;
  return new Promise((resolve) => {
    const intervalId = setInterval(() => {
      exec(command, (err, stdout, stderr) => {
        if (stdout) {
          console.log(`${processName} ainda está em execução. Verificando novamente em 1 segundo...`);
        } else {
          console.log(`${processName} não está mais em execução.`);
          clearInterval(intervalId);
          resolve();
        }
      });
    }, 1000); // Checa a cada 1 segundo
  });
}

channel.subscribe((msg) => {
  if (!msg.data || typeof msg.data !== 'string') {
    console.log('M.V.i');
    return;
  }

  console.log('Mensagem recebida:', msg.data);
  messageQueue.push(msg.data); // Adiciona todas as mensagens à fila
  
  if (!isProcessing && messageQueue.length > 0) {
    processNextMessage();
  }
});

async function processNextMessage() {
  if (isProcessing || messageQueue.length === 0) {
    return; // Se já estiver processando ou a fila estiver vazia, retorna
  }

  isProcessing = true;
  const currentMessage = messageQueue.shift(); // Remove a próxima mensagem da fila

  try {
    await waitForProcessToEnd('main.py'); // Aguarda até que main.py não esteja mais em execução

    fs.writeFile('mensagemDousuario.txt', `${currentMessage}\n`, { flags: 'a' }, (err) => {
      if (err) throw err;
      console.log('Mensagem salva no arquivo mensagemDousuario.txt');
      
      exec('python3 main.py', (err, stdout, stderr) => {
        if (err) {
          console.error(`exec error: ${err}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);

        exec('node enviar.js', (err, stdout, stderr) => {
          if (err) {
            console.error(`exec error: ${err}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);

          const watcher = chokidar.watch('resultadofinal.txt', { persistent: true });

          watcher.on('change', (path) => {
            fs.readFile(path, 'utf8', (err, data) => {
              if (err) {
                console.error('Erro ao ler o arquivo:', err);
                return;
              }
              console.log('Arquivo alterado, enviando conteúdo para o canal Ably:', data);
              sendMessageToAbly(data);
            });
          });
        });

        setTimeout(() => {
          isProcessing = false; // Finaliza o processamento da mensagem atual
          if (messageQueue.length > 0) {
            processNextMessage(); // Tenta processar a próxima mensagem na fila
          }
        }, 1000);
      });
    });
  } catch (error) {
    console.error('Erro ao processar a mensagem:', error);
    isProcessing = false; // Em caso de erro, permite que outras mensagens sejam processadas
    if (messageQueue.length > 0) {
      processNextMessage(); // Tenta processar a próxima mensagem após um erro
    }
  }
}

ably.connection.once('connected', () => {
  console.log('Conectado ao Ably e ouvindo mensagens no canal "cadu"!');
});

console.log('Tudo pronto Aguardando mensagens...');
