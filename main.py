from config import api_id, api_hash, group_username
from telethon import TelegramClient, events
import asyncio
import requests
import http.client
import json
import logging

# Removido o limpeza do arquivo resultadofinal.txt no início do script

def limpar_arquivos():
    arquivos = ['mensagemDousuario.txt'] # Removido 'resultadofinal.txt' da lista
    for arquivo in arquivos:
        with open(arquivo, 'w') as f:
            f.write('')

# Inicializa um conjunto para armazenar textos já processados
processed_texts = set()

def create_haste(text, access_token):
    if text in processed_texts:
        print("Texto já processado, não criando novo link.")
        return None

    url = 'https://hastebin.com/documents'
    headers = {
        'Content-Type': 'text/plain',
        'Authorization': 'Bearer ' + access_token
    }

    text = text.encode('utf-8')

    response = requests.post(url, headers=headers, data=text, allow_redirects=False)

    if response.status_code == 200:
        haste_key = response.json()['key']
        haste_url = 'https://hastebin.com/share/' + haste_key
        print("Link do Hastebin:", haste_url)
        processed_texts.add(text)
        return haste_url
    elif response.status_code == 302:
        redirect_url = response.headers['Location']
        response = requests.post(redirect_url, headers=headers, data=text)
        if response.status_code == 200:
            haste_key = response.json()['key']
            haste_url = 'https://hastebin.com/share/' + haste_key
            print("Link do Hastebin após redirecionamento:", haste_url)
            processed_texts.add(text)
            return haste_url
        else:
            print('Erro ao criar o haste após redirecionamento: ', response.content)
            return None
    else:
        print('Erro ao criar o haste: ', response.content)
        return None

def shorten(url):
    conn = http.client.HTTPSConnection("encurta.net")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
    }
    conn.request("GET", "/api?api=a76fb6522427bd7cfa5992f1b7976ca9679206a5&url=" + url, headers=headers)
    res = conn.getresponse()
    data = res.read()
    short_url = json.loads(data.decode("utf-8"))['shortenedUrl']
    print("Link do Encurtanet:", short_url)
    return short_url

async def my_event_handler(client, entity, message, idDaMensagem):
    received_response = False
    while not received_response:
        @client.on(events.NewMessage(chats=entity))
        async def handle_new_message(event):
            nonlocal received_response
            if event.message.reply_to_msg_id == message.id:
                if event.message.document:
                    await client.download_media(event.message, 'temp.txt')
                    with open('temp.txt', 'r') as file:
                        response_text = file.read()
                else:
                    response_text = event.message.text

                lines = response_text.splitlines()
                if len(lines) > 5:
                    lines = lines[:-5]
                modified_response = '\n'.join(lines)

                print('Resposta modificada')
                received_response = True
                haste_url = create_haste(modified_response, 'b4d3ce9a9c5765629c7b8e5c8e7232a59e17bd69972e5f4288a25da6b4b32056f8fc65a0eeb9ca42e5bf0e2275dcb2b4c138c93291405d95ecd15e52726457ce')
                if haste_url:
                    shortened_link = shorten(haste_url)
                    print('Link encurtado:', shortened_link)
                    # Salva o link encurtado no arquivo resultadofinal.txt
                    with open('resultadofinal.txt', 'w') as file: # Aqui o arquivo é limpo antes de escrever
                        file.write(idDaMensagem + '===' + shortened_link)
                    # Limpa o arquivo mensagemDousuario.txt após o processo
                    limpar_arquivos()
                    # Interrompe a execução do script
                    exit()
                else:
                    print('Não foi possível gerar o link do Hastebin.')
                # Desregistra o manipulador de eventos após a primeira resposta ser processada
                client.remove_event_handler(handle_new_message)

        await asyncio.sleep(1)

async def main():
    async with TelegramClient('anon', api_id, api_hash) as client:
        entity = await client.get_entity(group_username)
        try:
            # Lê a mensagem do arquivo e limpa o conteúdo do arquivo imediatamente após
            with open('mensagemDousuario.txt', 'r+') as file:
                message_content = file.read().strip()
                file.seek(0)  # Move o ponteiro de volta para o início do arquivo
                file.truncate()  # Remove o conteúdo existente
                file.write(message_content)  # Escribe a mensagem lida, efetivamente limpando o arquivo
                file.close()
        except FileNotFoundError:
            print("Arquivo 'mensagemDousuario.txt' não encontrado.")
            return
        except Exception as e:
            print(f"Erro ao ler o arquivo 'mensagemDousuario.txt': {e}")
            return

        # Dividindo a mensagem em idDaMensagem e mensagemRelevante
        idDaMensagem, mensagemRelevante = message_content.split('===', 1)

        if not mensagemRelevante:
            print("A mensagem relevante não pode estar vazia.")
            return

        message = await client.send_message(entity, mensagemRelevante)
        print('Mensagem enviada com sucesso.')

        try:
            await asyncio.wait_for(my_event_handler(client, entity, message, idDaMensagem), timeout=25)
        except asyncio.TimeoutError:
            print("Algo inesperado aconteceu, tente novamente.")

loop = asyncio.get_event_loop()
loop.run_until_complete(main())