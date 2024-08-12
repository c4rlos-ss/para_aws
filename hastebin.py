import requests

def shorten_url(url):
    api_key = "b624aed99b90aaa8f441421bb58b84b262b95eb6"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
    }
    params = {
        'api': api_key,
        'url': url
    }
    try:
        response = requests.get("https://encurta.net/api", headers=headers, params=params)
        response.raise_for_status() # Garante que a requisição foi bem-sucedida
        short_url = response.json()['shortenedUrl']
        print("Link do Encurtanet:", short_url)
        return short_url
    except requests.exceptions.HTTPError as errh:
        print("HTTP Error:", errh)
    except requests.exceptions.ConnectionError as errc:
        print("Error Connecting:", errc)
    except requests.exceptions.Timeout as errt:
        print("Timeout Error:", errt)
    except requests.exceptions.RequestException as err:
        print("Something went wrong:", err)
    return None

if __name__ == "__main__":
    # Substitua 'http://example.com' pelo URL que você deseja encurtar
    url_to_shorten = 'http://google.com'
    shorten_url(url_to_shorten)
