import { checkBrandIsSeparateTerm, getBrandsMapping } from './src/common/brands'
import items from './pharmacyItems.json'

async function testWithSampleData() {
    console.log('🧪 Testing Brand Matching with Sample Data')
    console.log('='.repeat(50))
    
    try {
        const brandsMapping = await getBrandsMapping()
        console.log(`Loaded ${Object.keys(brandsMapping).length} brand groups`)
    } catch (error) {
        console.error('Failed to load brands mapping:', error)
        return
    }
    
    const brandsMapping = await getBrandsMapping()
    
    // Sample from your JSON data
    const sampleItems = items.slice(0, 20) // Test first 20 items
    
    console.log('\n--- Testing Sample Products ---')
    
    for (const item of sampleItems) {
        console.log(`\nProduct: ${item.title}`)
        console.log(`Current brands: [${item.meta.matchedBrands?.join(', ') || 'none'}]`)
        
        // Test our brand matching
        let detectedBrands: string[] = []
        
        for (const brandKey in brandsMapping) {
            const relatedBrands = [brandKey, ...brandsMapping[brandKey]]
            
            for (const brand of relatedBrands) {
                if (detectedBrands.some(b => b.toLowerCase() === brand.toLowerCase())) {
                    continue
                }
                
                if (checkBrandIsSeparateTerm(item.title, brand)) {
                    detectedBrands.push(brand)
                }
            }
        }
        
        if (detectedBrands.length > 0) {
            console.log(`Our detection: [${detectedBrands.join(', ')}]`)
            
            // Compare with existing
            const existing = item.meta.matchedBrands || []
            const newFinds = detectedBrands.filter(b => 
                !existing.some(e => e.toLowerCase() === b.toLowerCase())
            )
            const missed = existing.filter(e => 
                !detectedBrands.some(d => d.toLowerCase() === e.toLowerCase())
            )
            
            if (newFinds.length > 0) {
                console.log(` New finds: [${newFinds.join(', ')}]`)
            }
            if (missed.length > 0) {
                console.log(` Missed: [${missed.join(', ')}]`)
            }
        } else {
            console.log('Our detection: [none]')
            if (item.meta.matchedBrands?.length) {
                console.log(` Missed existing: [${item.meta.matchedBrands.join(', ')}]`)
            }
        }
    }
    
    // Test specific edge cases
    console.log('\n--- Testing Edge Cases ---')
    
    const edgeCases = [
        'HAPPY skincare cream',  // Should match (uppercase)
        'happy skincare cream',  // Should NOT match (lowercase, case-sensitive)
        'RICH vitamin first word', // Should match (front priority)
        'Something RICH not first', // Should NOT match (not at front)
        'HEEL second position drops', // Should match (second position allowed)
        'Product with BIO extract', // Should NOT match (ignored brand)
        'FREE from parabens ISDIN lotion', // Should match both FREE and ISDIN
    ]
    
    for (const testCase of edgeCases) {
        console.log(`\nTesting: "${testCase}"`)
        
        let matches: string[] = []
        for (const brandKey in brandsMapping) {
            const relatedBrands = [brandKey, ...brandsMapping[brandKey]]
            
            for (const brand of relatedBrands) {
                if (checkBrandIsSeparateTerm(testCase, brand)) {
                    if (!matches.some(m => m.toLowerCase() === brand.toLowerCase())) {
                        matches.push(brand)
                    }
                }
            }
        }
        
        console.log(`Matches: [${matches.join(', ')}]`)
    }
}

// Run the test
testWithSampleData().catch(console.error)
