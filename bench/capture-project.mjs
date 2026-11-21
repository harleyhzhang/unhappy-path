import fs from 'node:fs'
import path from 'node:path'
// Never follow an untrusted project-root symlink into evaluator or host data.
export function captureProject(source,target) {
  fs.rmSync(target,{recursive:true,force:true})
  if(!fs.existsSync(source))return false
  const st=fs.lstatSync(source)
  if(st.isSymbolicLink()||!st.isDirectory())return false
  fs.mkdirSync(path.dirname(target),{recursive:true})
  fs.cpSync(source,target,{recursive:true,dereference:false,verbatimSymlinks:true,mode:fs.constants.COPYFILE_FICLONE})
  return true
}
