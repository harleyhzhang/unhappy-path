import test from 'node:test'
import assert from 'node:assert/strict'
import {captureStatus} from './run-policy.mjs'
test('completed agent runs provide a captured artifact',()=>assert.equal(captureStatus({ok:true}), 'completed'))
test('a deadline captures code without claiming agent completion',()=>assert.equal(captureStatus({ok:false,failed:'timeout'},true),'deadline'))
test('legacy completion-only runs retain their behavior',()=>assert.equal(captureStatus({ok:false,failed:'timeout'}),null))
test('access and protocol errors are not disguised as deadline artifacts',()=>assert.equal(captureStatus({ok:false,failed:'quota'},true),null))
