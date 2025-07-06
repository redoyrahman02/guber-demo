import { getBrandsMapping } from './src/common/brands'

async function testCanonicalAssignment() {
    console.log('🧪 Testing Canonical Brand Assignment')
    console.log('==================================================')
    
    const brandsMapping = await getBrandsMapping()
    
    // Test the getCanonicalBrand function
    function getCanonicalBrand(brand: string, brandMapping: any): string {
        const normalizedBrand = brand.toLowerCase()
        
        // Find all brands in the same group
        const brandGroup = new Set<string>()
        
        // First, find the group this brand belongs to
        for (const canonical in brandMapping) {
            const relatedBrands = brandMapping[canonical]
            if (canonical === normalizedBrand || relatedBrands.includes(normalizedBrand)) {
                // Add all brands in this group
                brandGroup.add(canonical)
                relatedBrands.forEach((b: string) => brandGroup.add(b))
                break
            }
        }
        
        // If brand is not in any group, return itself
        if (brandGroup.size === 0) {
            return normalizedBrand
        }
        
        // Always return the alphabetically first brand from the complete group
        const allBrandsInGroup = Array.from(brandGroup).sort()
        return allBrandsInGroup[0]
    }
    
    // Test with some known brand groups
    const testBrands = [
        'eucerin', 'beiersdorf',
        'samarin', 'livol',
        'ocutein', 'biochronoss',
        'hartmann', 'molicare',
        'isdin', 'isdin deo'
    ]
    
    console.log('Testing canonical assignment consistency:')
    console.log('---------------------------------------')
    
    for (const brand of testBrands) {
        const canonical = getCanonicalBrand(brand, brandsMapping)
        console.log(`${brand} -> ${canonical}`)
    }
    
    console.log('\nTesting that related brands map to the same canonical:')
    console.log('----------------------------------------------------')
    
    // Test pairs of related brands
    const testPairs = [
        ['eucerin', 'beiersdorf'],
        ['samarin', 'livol'],
        ['ocutein', 'biochronoss'],
        ['hartmann', 'molicare'],
        ['isdin', 'isdin deo']
    ]
    
    for (const [brand1, brand2] of testPairs) {
        const canonical1 = getCanonicalBrand(brand1, brandsMapping)
        const canonical2 = getCanonicalBrand(brand2, brandsMapping)
        const consistent = canonical1 === canonical2
        console.log(`${brand1} -> ${canonical1}`)
        console.log(`${brand2} -> ${canonical2}`)
        console.log(`Consistent: ${consistent ? '✅' : '❌'}`)
        console.log('---')
    }
}

testCanonicalAssignment().catch(console.error)
