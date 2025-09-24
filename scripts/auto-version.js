#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script de versionamento automático para deploys
 * Incrementa automaticamente a versão baseada no tipo de deploy
 */

function getCurrentVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

function updateVersion(newVersion) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.version = newVersion;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Versão atualizada para: ${newVersion}`);
}

function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    // Se não estiver em um repositório git, usar timestamp
    return Date.now().toString(36).slice(-6);
  }
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch'; // patch, minor, major
  const includeHash = args.includes('--hash');
  const includeTimestamp = args.includes('--timestamp');
  
  console.log('🚀 Iniciando versionamento automático...');
  
  const currentVersion = getCurrentVersion();
  console.log(`📦 Versão atual: ${currentVersion}`);
  
  let newVersion = incrementVersion(currentVersion, versionType);
  
  // Adicionar hash do commit se solicitado
  if (includeHash) {
    const hash = getCommitHash();
    newVersion += `-${hash}`;
  }
  
  // Adicionar timestamp se solicitado
  if (includeTimestamp) {
    const timestamp = getTimestamp();
    newVersion += `-${timestamp}`;
  }
  
  // Para deploys de produção, usar versão limpa
  if (process.env.VERCEL_ENV === 'production') {
    newVersion = incrementVersion(currentVersion, versionType);
    console.log('🌟 Deploy de produção detectado - usando versão limpa');
  }
  
  updateVersion(newVersion);
  
  console.log(`🎉 Versionamento concluído!`);
  console.log(`📋 Tipo: ${versionType}`);
  console.log(`🔢 Nova versão: ${newVersion}`);
  
  return newVersion;
}

if (require.main === module) {
  main();
}

module.exports = { main, incrementVersion, getCurrentVersion, updateVersion };