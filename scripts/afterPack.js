const fs = require('fs-extra');
const path = require('path');

exports.default = async function(context) {
  const appPath = context.appOutDir;
  const resourcesPath = path.join(appPath, 'resources', 'app');
  
  console.log('AfterPack: Starting file copy...');
  console.log('App output dir:', appPath);
  console.log('Resources path:', resourcesPath);
  
  try {
    // Copy public folder to standalone directory for Next.js
    const publicSource = path.join(context.packager.projectDir, 'public');
    const publicDest = path.join(resourcesPath, 'public');
    
    console.log('Copying public folder...');
    console.log('From:', publicSource);
    console.log('To:', publicDest);
    
    if (fs.existsSync(publicSource)) {
      await fs.copy(publicSource, publicDest);
      console.log('Public folder copied successfully');
    } else {
      console.warn('Public folder not found at:', publicSource);
    }
    
    // Copy .next/static folder to .next/standalone/.next/static
    const staticSource = path.join(context.packager.projectDir, '.next', 'static');
    const staticDest = path.join(resourcesPath, '.next', 'standalone', '.next', 'static');
    
    console.log('Copying static folder...');
    console.log('From:', staticSource);
    console.log('To:', staticDest);
    
    if (fs.existsSync(staticSource)) {
      await fs.copy(staticSource, staticDest);
      console.log('Static folder copied successfully');
    } else {
      console.warn('Static folder not found at:', staticSource);
    }
    
    // Copy public folder to .next/standalone/public
    const publicSource2 = path.join(context.packager.projectDir, 'public');
    const publicDest2 = path.join(resourcesPath, '.next', 'standalone', 'public');
    
    console.log('Copying public folder to standalone...');
    console.log('From:', publicSource2);
    console.log('To:', publicDest2);
    
    if (fs.existsSync(publicSource2)) {
      await fs.copy(publicSource2, publicDest2);
      console.log('Public folder copied to standalone successfully');
    } else {
      console.warn('Public folder not found at:', publicSource2);
    }
    
    console.log('AfterPack: File copy completed successfully');
  } catch (error) {
    console.error('AfterPack: Error during file copy:', error);
    throw error;
  }
};
