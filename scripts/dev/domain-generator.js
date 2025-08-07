#!/usr/bin/env zx
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zx_1 = require("zx");
// Function to create the domain structure
const createDomain = async (domainName) => {
    (0, zx_1.cd)(`src/domains`);
    await (0, zx_1.$) `mkdir ${domainName}`;
    // Create the files
    await Promise.all([
        (0, zx_1.$) `touch ${domainName}/api.ts`,
        (0, zx_1.$) `touch ${domainName}/event.ts`,
        (0, zx_1.$) `touch ${domainName}/index.ts`,
        (0, zx_1.$) `touch ${domainName}/request.ts`,
        (0, zx_1.$) `touch ${domainName}/schema.ts`,
        (0, zx_1.$) `touch ${domainName}/service.ts`
    ]);
};
// Main interaction loop
const main = async () => {
    console.log('Enter the domain name:');
    const domainName = (await (0, zx_1.$) `read domainName && echo $domainName`).stdout.trim();
    console.log(`Creating domain ${domainName}`);
    // Create the domain
    await createDomain(domainName);
};
// Run the main function
main();
