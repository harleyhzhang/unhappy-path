// Compile untrusted generated source without access to evaluator files or host credentials.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {spawn} from 'node:child_process'

export async function buildApp(app, runtimeRoot, evaluatorRoot, timeout=180_000) {
  if (process.platform !== 'darwin') throw new Error('The isolated compiler currently requires macOS')
  if (!fs.lstatSync(app).isDirectory() || fs.lstatSync(app).isSymbolicLink()) throw new Error('App source must be an ordinary directory')
  app=fs.realpathSync(app);runtimeRoot=fs.realpathSync(runtimeRoot);evaluatorRoot=fs.realpathSync(evaluatorRoot)
  const userHome=fs.realpathSync(os.homedir())
  const parent=path.join(runtimeRoot,'grade-builds');fs.mkdirSync(parent,{recursive:true,mode:0o700})
  const work=fs.mkdtempSync(path.join(parent,'build-')), project=path.join(work,'app'), compilerHome=path.join(work,'home')
  const quote=(s)=>JSON.stringify(s)
  try {
    fs.cpSync(app,project,{recursive:true,dereference:false,verbatimSymlinks:true,mode:fs.constants.COPYFILE_FICLONE})
    fs.rmSync(path.join(project,'dist'),{recursive:true,force:true})
    fs.mkdirSync(path.join(compilerHome,'tmp'),{recursive:true,mode:0o700})
    // Terminate ancestor config discovery without changing project-owned config.
    fs.writeFileSync(path.join(work,'package.json'),JSON.stringify({private:true,postcss:{plugins:[]}}))
    const nodeRoot=path.dirname(path.dirname(process.execPath))
    const npm=path.join(nodeRoot,'lib/node_modules/npm/bin/npm-cli.js')
    if (!fs.existsSync(npm)) throw new Error('npm CLI not found beside Node runtime')
    const profile=`(version 1)
(allow default)
(deny file-read* (subpath ${quote(userHome)}) (subpath "/private/tmp") (subpath ${quote(runtimeRoot)}) (subpath ${quote(evaluatorRoot)}))
(allow file-read* (subpath ${quote(nodeRoot)}) (subpath ${quote(work)}))
(allow file-read-metadata (subpath ${quote(evaluatorRoot)}) (subpath ${quote(userHome)}) (subpath "/private/tmp") (subpath ${quote(runtimeRoot)}))
(deny file-write*)
(allow file-write* (subpath ${quote(work)}) (literal "/dev/null"))
(deny signal)
(allow signal (target self) (target children))
`
    const env={PATH:path.dirname(process.execPath)+':'+(process.env.PATH||'/usr/bin:/bin'),HOME:compilerHome,TMPDIR:path.join(compilerHome,'tmp'),LANG:process.env.LANG||'en_US.UTF-8',CI:'1'}
    await new Promise((resolve,reject)=>{
      const p=spawn('/usr/bin/sandbox-exec',['-p',profile,process.execPath,npm,'run','build'],{cwd:project,env,detached:true,stdio:['ignore','pipe','pipe']})
      let output='',finished=false
      const kill=()=>{if(p.pid)try{process.kill(-p.pid,'SIGKILL')}catch{}}
      const done=(error)=>{if(finished)return;finished=true;clearTimeout(timer);kill();if(error){error.stderr=output;reject(error)}else resolve()}
      const timer=setTimeout(()=>done(new Error('Isolated build timed out')),timeout)
      for(const s of [p.stdout,p.stderr])s.on('data',d=>{output=(output+d).slice(-100_000)})
      p.on('error',done);p.on('close',(code,signal)=>done(code===0?null:new Error(`Isolated build exited ${code ?? signal}`)))
    })
    const built=path.join(project,'dist')
    if (!fs.existsSync(built) || fs.lstatSync(built).isSymbolicLink() || !fs.lstatSync(built).isDirectory()) throw new Error('Build did not produce an ordinary dist directory')
    const dest=path.join(app,'dist')
    if (fs.existsSync(dest) && !fs.existsSync(path.join(path.dirname(app),'generation-dist')) && !fs.lstatSync(dest).isSymbolicLink()) {
      fs.cpSync(dest,path.join(path.dirname(app),'generation-dist'),{recursive:true,dereference:false,verbatimSymlinks:true,mode:fs.constants.COPYFILE_FICLONE})
    }
    fs.rmSync(dest,{recursive:true,force:true})
    fs.cpSync(built,dest,{recursive:true,dereference:false,verbatimSymlinks:true,mode:fs.constants.COPYFILE_FICLONE})
    return {isolated:true,rebuilt:true,environment:'clean'}
  } finally {fs.rmSync(work,{recursive:true,force:true})}
}
