import { assignBrandIfKnown, getBrandsMapping, checkBrandIsSeparateTerm } from './src/common/brands'
import { countryCodes } from './src/config/enums'
import { sources } from './src/sites/sources'
import items from './pharmacyItems.json'

// Test individual brand matching functions
async function testBrandMatching() {
    console.log('=== Testing Brand Matching Functions ===\n')
    
    // Get the brands mapping for reference
    const brandsMapping = await getBrandsMapping()
    console.log('Total brand groups loaded:', Object.keys(brandsMapping).length)
    
    // Test cases with sample product titles from the JSON
    const testCases = [
        // From the sample data
        'EUCERIN Hyaluron-Filler kremas SPF30, 50ml',
        'BIODERMA micelinis valomasis vanduo SENSIBIO H2O, 250ml',
        'HARTMANN rankų kremas MOLICARE SKIN, 200ml',
        'ALPECIN šampūnas su kofeinu nuo plaukų slinkimo C1, 250ml',
        'Brontex 15mg/5ml sirupas 100ml N1',
        'ISDIN DEO antiperspirantas ALCOHOL FREE 48H, 50ml',
        'DR.BROWNS IV lygio žindukai OPTIONS+, silikoniniai nuo 9 mėn., N2',
        'NOUGHTY šampūnas pažeistiems plaukams TO THE RESCUE, 250ml',
        'HAPPY face cream 50ml',  // Test case-sensitive brand
        'HEEL homeopathic drops 30ml',  // Test priority brand
        'RICH vitamin complex',  // Test front position priority
        'Some product with BIO extract',  // Test ignored brand
        'ULTRA moisturizer 100ml',  // Generic test
    ]
    
    console.log('\n--- Individual Brand Matching Tests ---')
    for (const title of testCases) {
        console.log(`\nTesting: "${title}"`)
        
        let matchedBrands: string[] = []
        
        // Collect all matching brands
        for (const brandKey in brandsMapping) {
            const relatedBrands = [brandKey, ...brandsMapping[brandKey]]
            
            for (const brand of relatedBrands) {
                const normalizedBrand = brand.toLowerCase()
                
                if (matchedBrands.some(mb => mb.toLowerCase() === normalizedBrand)) {
                    continue
                }
                
                const isBrandMatch = checkBrandIsSeparateTerm(title, brand)
                if (isBrandMatch) {
                    matchedBrands.push(brand)
                    console.log(`  ✓ Matched: ${brand}`)
                }
            }
        }
        
        if (matchedBrands.length === 0) {
            console.log(' No brands matched')
        }
    }
}

// Test the full brand assignment process
async function testFullBrandAssignment() {
    console.log('\n\n=== Testing Full Brand Assignment Process ===\n')
    
    try {
        // Run the full assignment process
        await assignBrandIfKnown(countryCodes.lt, sources.APO)
        console.log(' Brand assignment completed successfully')
    } catch (error) {
        console.error(' Error during brand assignment:', error)
    }
}

// Test specific brand matching edge cases
async function testEdgeCases() {
    console.log('\n\n=== Testing Edge Cases ===\n')
    
    const edgeCases = [
        {
            title: 'HAPPY face cream',
            expected: 'Should match HAPPY (case-sensitive)',
            brand: 'happy'
        },
        {
            title: 'happy face cream',
            expected: 'Should NOT match happy (case-sensitive)',
            brand: 'happy'
        },
        {
            title: 'RICH vitamin complex first position',
            expected: 'Should match RICH (front priority)',
            brand: 'rich'
        },
        {
            title: 'Something RICH not first',
            expected: 'Should NOT match RICH (not front position)',
            brand: 'rich'
        },
        {
            title: 'HEEL drops second position',
            expected: 'Should match HEEL (second priority)',
            brand: 'heel'
        },
        {
            title: 'Product with BIO extract',
            expected: 'Should NOT match BIO (ignored brand)',
            brand: 'bio'
        }
    ]
    
    for (const testCase of edgeCases) {
        console.log(`\nTesting: "${testCase.title}"`)
        console.log(`Expected: ${testCase.expected}`)
        
        const isMatch = checkBrandIsSeparateTerm(testCase.title, testCase.brand)
        console.log(`Result: ${isMatch ? '✓ MATCHED' : '✗ NOT MATCHED'}`)
    }
}

// Analyze sample data distribution
function analyzeSampleData() {
    console.log('\n\n=== Sample Data Analysis ===\n')
    
    const totalItems = items.length
    const itemsWithBrands = items.filter(item => item.meta.matchedBrands && item.meta.matchedBrands.length > 0)
    const itemsWithoutBrands = items.filter(item => !item.meta.matchedBrands || item.meta.matchedBrands.length === 0)
    
    console.log(`Total items: ${totalItems}`)
    console.log(`Items with brands: ${itemsWithBrands.length} (${(itemsWithBrands.length / totalItems * 100).toFixed(1)}%)`)
    console.log(`Items without brands: ${itemsWithoutBrands.length} (${(itemsWithoutBrands.length / totalItems * 100).toFixed(1)}%)`)
    
    // Count brand frequency
    const brandCounts: { [key: string]: number } = {}
    itemsWithBrands.forEach(item => {
        item.meta.matchedBrands.forEach((brand: string) => {
            brandCounts[brand] = (brandCounts[brand] || 0) + 1
        })
    })
    
    const sortedBrands = Object.entries(brandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    
    console.log('\nTop 10 most frequent brands:')
    sortedBrands.forEach(([brand, count], index) => {
        console.log(`${index + 1}. ${brand}: ${count} items`)
    })
    
    // Show some examples without brands for analysis
    console.log('\nSample items without brands (for analysis):')
    itemsWithoutBrands.slice(0, 10).forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`)
    })
}

// Main test runner
async function runAllTests() {
    console.log('🧪 Brand Matching Test Suite')
    console.log('=' .repeat(50))
    
    try {
        // Analyze the sample data first
        // analyzeSampleData()
        
        // Test individual functions
        // await testBrandMatching()
        
        // Test edge cases
        // await testEdgeCases()
        
        // Test full process 
        await testFullBrandAssignment()
        
        console.log('\n' + '='.repeat(50))
        console.log(' All tests completed!')
        
    } catch (error) {
        console.error(' Test suite failed:', error)
    }
}

// Run the tests
runAllTests().catch(console.error)
