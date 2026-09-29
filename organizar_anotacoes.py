import json

def validar_saida(resposta: str) -> bool:
    try:
        data = json.loads(resposta)
    except json.JSONDecodeError:
        return False
    
    required = ["resumo", "categorias", "proximos_passos", "alertas"]
    return all(key in data for key in required)