/** One-time owner-local bridge for NAS programs installed before ordinary
 * update conversations. Reuses their SDK supervisor; no updater/state owner. */
import {realpath} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
const [action,releaseId,...flags]=process.argv.slice(2);
if(!['status','prepare','install'].includes(action)||flags.some(flag=>flag!=='--allow-forward-only'))
 throw new Error('Usage: node installed-gateway-update.mjs status | prepare <release> | install <release> [--allow-forward-only]');
const install=resolve(process.env.METAPP_GATEWAY_INSTALL_ROOT??'/data/gateway-runtime');
const program=await realpath(join(install,'current'));
if(!program.startsWith(join(install,'releases')+sep))throw new Error('Invalid installed program path');
const {GatewayUpdateSupervisorClient}=await import(pathToFileURL(join(program,'node_modules/@malink/sdk/dist/gateway.js')).href);
const supervisor=new GatewayUpdateSupervisorClient(join(install,'update.sock'));
if(action==='status'){const status=await supervisor.status();console.log(JSON.stringify(status,null,2));}
else{
 if(!releaseId||!/^metapp-gateway-0\.1\.0\.\d{4}-amd64$/.test(releaseId))throw new Error('Supply the exact published Metapp release');
 const status=action==='prepare'?await supervisor.stage(releaseId):await supervisor.scheduleApply(releaseId,flags.includes('--allow-forward-only'));
 console.log(JSON.stringify(status,null,2));
 if(action==='prepare'&&status.phase!=='staged')throw new Error('The release is not prepared. Diagnose the reported status before installation.');
}
