(async()=>{
  try{
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@leedpro.com', motDePasse: 'ChangeMe123!' })
    });
    const loginBody = await loginRes.json();
    if(!loginRes.ok){ console.error('login failed', loginBody); process.exit(1); }
    const token = loginBody.data.accessToken;
    console.log('token:', token ? token.substring(0,10)+'...' : null);

    const leadsRes = await fetch('http://localhost:5000/api/leads', { headers: { Authorization: 'Bearer ' + token } });
    const leadsBody = await leadsRes.json();
    console.log('lead count:', leadsBody.data.length);
    const leadId = leadsBody.data[0] && leadsBody.data[0].id;
    if(!leadId){ console.error('no lead'); process.exit(0); }

    const analyzeRes = await fetch('http://localhost:5000/api/ai/leads/' + leadId + '/analyze', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    console.log('analyze status:', analyzeRes.status);
    const analyzeBody = await analyzeRes.json();
    console.log('analyze body:', analyzeBody);

    const usersRes = await fetch('http://localhost:5000/api/users', { headers: { Authorization: 'Bearer ' + token } });
    const usersBody = await usersRes.json();
    const userId = usersBody.data[0] && usersBody.data[0].id;

    const taskRes = await fetch('http://localhost:5000/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ titre: 'test task from script', dateEcheance: new Date().toISOString(), leadId: leadId, statut: 'AFaire', utilisateurId: userId }) });
    console.log('create task status:', taskRes.status);
    console.log(await taskRes.json());
  }catch(e){ console.error(e); process.exit(1); }
})();
