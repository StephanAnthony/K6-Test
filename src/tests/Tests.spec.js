import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Mantendo a métrica original, mas renomeando para refletir a mudança sem erro
export const getContactsDuration = new Trend('get_contacts', true);

// Configurando as opções de execução do teste com stages
export const options = {
  stages: [
    // Inicia com 10 VUs e aumenta até 300 VUs durante 5 minutos (300 segundos)
    { duration: '5m', target: 300 } // Aumenta para 300 VUs ao longo de 5 minutos
  ],
  thresholds: {
    // Permite até 5% de falhas nas requisições (ajustado)
    http_req_failed: ['rate<0.05'],
    // Ajustando a duração média para 8 segundos (avg<8000ms)
    http_req_duration: ['avg<8000']
  }
};

// Gerando o relatório HTML no final do teste
export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }) // Relatório gerado no mesmo local
  };
}

export default function () {
  const baseUrl = 'https://postman-echo.com/'; // Nova URL da API Postman Echo

  const params = {
    headers: {
      Accept: 'application/json' // Alterando para 'Accept' em vez de 'Content-Type'
    }
  };

  const OK = 200; // Status de sucesso esperado

  // Fazendo a requisição GET para o endpoint de echo
  const res = http.get(`${baseUrl}get`, params); // Endpoint de GET do Echo

  // Adicionando a duração da requisição à métrica original
  getContactsDuration.add(res.timings.duration);

  // Verificando se a resposta tem o status 200
  check(res, {
    'contacts - status 200': () => res.status === OK
  });

  // Pausando por 1 segundo entre as requisições
  sleep(1);
}
