import json
import unittest
from organizar_anotacoes import validar_saida

class TestValidacao(unittest.TestCase):
    def test_saida_valida(self):
        resposta = json.dumps({
            "resumo": "Resumo fictício.",
            "categorias": ["API"],
            "proximos_passos": ["Revisar JSON"],
            "alertas": [],
        })
        self.assertTrue(validar_saida(resposta))

    def test_saida_invalida(self):
        resposta = "isso nao e json"
        self.assertFalse(validar_saida(resposta))

    def test_campos_obrigatorios(self):
        resposta = json.dumps({"resumo": "OK"})
        self.assertFalse(validar_saida(resposta))

if __name__ == "__main__":
    unittest.main()