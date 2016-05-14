var WasmJS = require('./wasm.js');

var EXPECTED_WASM_VERSION = 0xb;

if (typeof Wasm !== 'undefined' && Wasm.instantiateModule &&
    Wasm.experimentalVersion === EXPECTED_WASM_VERSION) {
  return; // we have native support of Wasm.instantiateModule
}

var globalWasm = {};
globalWasm.experimentalVersion = EXPECTED_WASM_VERSION;
globalWasm.instantiateModule = function (wasmCode, libs) {
  // Using wasm.js polyfill from binaryen project.
  if (typeof WasmJS !== 'function') {
      throw new Error('WasmJS not detected - polyfill not bundled?');
  }
  console.warn('WASM interpreter is used to load the module.');
  var outside = {
      buffer: new Uint8Array(1 << 20)
  };
  var wasmJS = WasmJS({});
  wasmJS['outside'] = outside;
  wasmJS['info'] = {
    global: null,
    env: null,
    parent: outside  
  };
  wasmJS['lookupImport'] = function (mod, base) {
    return libs[mod][base];  
  };
  wasmJS['providedTotalMemory'] = outside.buffer.byteLength;
  var temp = wasmJS['_malloc'](wasmCode.length);
  wasmJS['HEAPU8'].set(wasmCode, temp);
  wasmJS['_load_binary2wasm'](temp, wasmCode.length);
  wasmJS['_free'](temp);
  wasmJS['_instantiate']();
  return {exports: wasmJS['asmExports']};
};
global.Wasm = globalWasm;

