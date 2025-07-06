// Debug script to test brand loading
import * as fs from 'fs'
import * as path from 'path'

async function debugBrandLoading() {
    console.log('🔍 Debugging Brand Loading Issues')
    console.log('='.repeat(50))
    
    // Test 1: Check if files exist
    const brandConnectionsPath = path.join(__dirname, 'brandConnections.json')
    const pharmacyItemsPath = path.join(__dirname, 'pharmacyItems.json')
    const brandsMappingPath = path.join(__dirname, 'brandsMapping.json')
    
    console.log('\n--- File Existence Check ---')
    console.log(`brandConnections.json exists: ${fs.existsSync(brandConnectionsPath)}`)
    console.log(`pharmacyItems.json exists: ${fs.existsSync(pharmacyItemsPath)}`)
    console.log(`brandsMapping.json exists: ${fs.existsSync(brandsMappingPath)}`)
    
    // Test 2: Try direct file reading
    try {
        console.log('\n--- Direct File Reading Test ---')
        
        if (fs.existsSync(brandConnectionsPath)) {
            const connectionsRaw = fs.readFileSync(brandConnectionsPath, 'utf8')
            const connections = JSON.parse(connectionsRaw)
            console.log(`✓ brandConnections.json loaded: ${connections.length} entries`)
            console.log(`First entry:`, connections[0])
        }
        
        if (fs.existsSync(brandsMappingPath)) {
            const mappingRaw = fs.readFileSync(brandsMappingPath, 'utf8')
            const mapping = JSON.parse(mappingRaw)
            console.log(`✓ brandsMapping.json loaded: ${Object.keys(mapping).length} brand groups`)
        }
        
        if (fs.existsSync(pharmacyItemsPath)) {
            const itemsRaw = fs.readFileSync(pharmacyItemsPath, 'utf8')
            const items = JSON.parse(itemsRaw)
            console.log(`✓ pharmacyItems.json loaded: ${items.length} items`)
        }
        
    } catch (error) {
        console.error('✗ Error reading files:', error)
    }
    
    // Test 3: Try TypeScript imports
    try {
        console.log('\n--- TypeScript Import Test ---')
        
        // Dynamic import to catch errors
        const connectionsModule = await import('./brandConnections.json')
        console.log('✓ brandConnections import type:', typeof connectionsModule)
        console.log('✓ brandConnections default type:', typeof connectionsModule.default)
        console.log('✓ brandConnections is array:', Array.isArray(connectionsModule.default))
        
        if (connectionsModule.default && Array.isArray(connectionsModule.default)) {
            console.log(`✓ brandConnections length: ${connectionsModule.default.length}`)
        }
        
    } catch (error) {
        console.error('✗ Error with TypeScript imports:', error)
    }
    
    // Test 4: Try the actual brands function
    try {
        console.log('\n--- Brands Function Test ---')
        const { getBrandsMapping } = await import('./src/common/brands')
        const mapping = await getBrandsMapping()
        console.log(`✓ getBrandsMapping success: ${Object.keys(mapping).length} brand groups`)
        
    } catch (error) {
        console.error('✗ Error with getBrandsMapping:', error)
    }
}

debugBrandLoading().catch(console.error)
