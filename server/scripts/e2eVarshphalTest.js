// Uses global fetch (Node 18+)
const serverBase = 'http://localhost:5000/api';

async function calcAndPredict(varshphalYear) {
    const payload = {
        natalDate: '1990-01-01T00:00:00Z',
        natalLatitude: 28.6139,
        natalLongitude: 77.2090,
        varshphalYear,
    };
    console.log(`\n--- Requesting Varshphal for ${varshphalYear} ---`);
    const calcResp = await fetch(`${serverBase}/calculate-varshphal`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!calcResp.ok) {
        console.error('calculate-varshphal failed', await calcResp.text());
        return;
    }
    const varData = await calcResp.json();

    const predPayload = {
        varshphalChart: varData.varshphalChart,
        muntha: varData.muntha,
        yearLord: varData.yearLord,
        muddaDasha: varData.muddaDasha,
        kpSignificators: varData.kpSignificators,
        lang: 'hi',
        style: 'detailed',
        varshphalYear,
    };

    const predResp = await fetch(`${serverBase}/predictions/varshaphal`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(predPayload) });
    if (!predResp.ok) {
        console.error('predictions/varshaphal failed', await predResp.text());
        return;
    }
    const pred = await predResp.json();
    console.log(`\n--- Prediction for ${varshphalYear} ---\n` + pred.prediction + '\n');
}

async function run() {
    try {
        await calcAndPredict(2025);
        await calcAndPredict(2026);
    } catch (e) {
        console.error('E2E test error', e);
    }
}

run();
