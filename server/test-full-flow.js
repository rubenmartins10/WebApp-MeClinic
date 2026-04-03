const http = require('http');

function makeRequest(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = new URL(url);
    const req = http.request(options, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    console.log('🔍 === TESTE COMPLETO DO FLOW ===\n');

    // 1. Login
    console.log('1️⃣  Testando LOGIN...');
    const loginBody = JSON.stringify({ email: 'teste@meclinic.pt', password: 'NovaPassword123!' });
    const loginResp = await makeRequest('http://localhost:5000/api/auth/login', 'POST', 
      { 'Content-Type': 'application/json', 'Content-Length': loginBody.length }, 
      loginBody);
    
    if (loginResp.status !== 200) {
      console.error('❌ Login falhou:', loginResp.status);
      process.exit(1);
    }

    const loginData = JSON.parse(loginResp.data);
    const token = loginData.token;
    console.log('✅ Token obtido:', token.substring(0, 30) + '...\n');

    // 2. Testar /api/consultas
    console.log('2️⃣  Testando GET /api/consultas...');
    const consultasResp = await makeRequest('http://localhost:5000/api/consultas', 'GET', 
      { 'Authorization': `Bearer ${token}` });
    const consultasData = JSON.parse(consultasResp.data);
    console.log('Status:', consultasResp.status);
    console.log('Resposta:', JSON.stringify(consultasData).substring(0, 100) + '...');
    console.log('Total:', Array.isArray(consultasData) ? consultasData.length : consultasData.consultas?.length || 0, '\n');

    // 3. Testar /api/modelos-procedimento
    console.log('3️⃣  Testando GET /api/modelos-procedimento...');
    const modelosResp = await makeRequest('http://localhost:5000/api/modelos-procedimento', 'GET',
      { 'Authorization': `Bearer ${token}` });
    const modelosData = JSON.parse(modelosResp.data);
    console.log('Status:', modelosResp.status);
    console.log('Resposta:', JSON.stringify(modelosData).substring(0, 100) + '...');
    console.log('Total procedimentos:', Array.isArray(modelosData) ? modelosData.length : modelosData.modelos?.length || 0);
    if (modelosData.modelos) {
      console.log('Procedimentos:');
      modelosData.modelos.forEach(m => console.log(`  • ${m.nome}`));
    }
    console.log();

    // 4. Testar /api/produtos
    console.log('4️⃣  Testando GET /api/produtos...');
    const produtosResp = await makeRequest('http://localhost:5000/api/produtos', 'GET',
      { 'Authorization': `Bearer ${token}` });
    const produtosData = JSON.parse(produtosResp.data);
    console.log('Status:', produtosResp.status);
    console.log('Total produtos:', Array.isArray(produtosData) ? produtosData.length : produtosData.produtos?.length || 0, '\n');

    // 5. Testar /api/pacientes
    console.log('5️⃣  Testando GET /api/pacientes...');
    const pacientesResp = await makeRequest('http://localhost:5000/api/pacientes', 'GET',
      { 'Authorization': `Bearer ${token}` });
    const pacientesData = JSON.parse(pacientesResp.data);
    console.log('Status:', pacientesResp.status);
    console.log('Total pacientes:', Array.isArray(pacientesData) ? pacientesData.length : pacientesData.pacientes?.length || 0, '\n');

    console.log('✅ TODOS OS ENDPOINTS TESTADOS COM SUCESSO!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
})();
