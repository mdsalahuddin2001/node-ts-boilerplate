#!/usr/bin/env zx
/* eslint-disable no-console */
/* eslint-disable no-undef */

// Function to create the module structure
const createModule = async moduleName => {
  const baseDir = `src/modules/${moduleName}`;
  await $`mkdir -p ${baseDir}`;

  // Create the files
  await Promise.all([
    $`touch ${baseDir}/api.js`,
    $`touch ${baseDir}/event.js`,
    $`touch ${baseDir}/index.js`,
    $`touch ${baseDir}/request.js`,
    $`touch ${baseDir}/schema.js`,
    $`touch ${baseDir}/service.js`,
  ]);

  console.log(`✅ Module "${moduleName}" created successfully.`);
};

// Main function
const main = async () => {
  const moduleName = await question('Enter the module name: ');

  if (!moduleName) {
    console.log('❌ Module name is required!');
    process.exit(1);
  }

  console.log(`Creating module "${moduleName}"...`);
  await createModule(moduleName);
};

// Run main
main();
