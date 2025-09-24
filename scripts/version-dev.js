#!/usr/bin/env node

const { main } = require('./auto-version.js');

/**
 * Script específico para versionamento de desenvolvimento
 * Inclui hash do commit e timestamp para identificação única
 */

console.log('🔧 Executando versionamento para desenvolvimento...');

// Simular argumentos para incluir hash e timestamp
process.argv = [
  ...process.argv.slice(0, 2),
  'patch',
  '--hash',
  '--timestamp'
];

main();