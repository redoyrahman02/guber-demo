import { Job } from "bullmq"
import { countryCodes, dbServers, EngineType } from "../config/enums"
import { ContextType } from "../libs/logger"
import { jsonOrStringForDb, jsonOrStringToJson, stringOrNullForDb, stringToHash } from "../utils"
import _ from "lodash"
import { sources } from "../sites/sources"
import items from "./../../pharmacyItems.json"
import connections from "./../../brandConnections.json"

type BrandsMapping = {
    [key: string]: string[]
}

const PRIORITY_FRONT = ["rich", "rff", "flex", "ultra", "gum", "beauty", "orto", "free", "112", "kin", "happy"]
const PRIORITY_SECOND = ["heel", "contour", "nero", "rsv"]
const IGNORED_BRANDS = ["bio", "neb"]
const CASE_SENSITIVE_BRANDS = ["happy"] // Must be matched in uppercase

export async function getBrandsMapping(): Promise<BrandsMapping> {
    const brandConnections = connections
    
    // Debug: Check if connections is loaded properly
    if (!brandConnections || !Array.isArray(brandConnections)) {
        console.error('brandConnections is not loaded properly:', typeof brandConnections, brandConnections?.length)
        throw new Error('Brand connections data not loaded')
    }

    // Create a map to track brand relationships
    const brandMap = new Map<string, Set<string>>()

    brandConnections.forEach(({ manufacturer_p1, manufacturers_p2 }) => {
        const brand1 = manufacturer_p1.toLowerCase()
        const brands2 = manufacturers_p2.toLowerCase()
        const brand2Array = brands2.split(";").map((b) => b.trim())
        if (!brandMap.has(brand1)) {
            brandMap.set(brand1, new Set())
        }
        brand2Array.forEach((brand2) => {
            if (!brandMap.has(brand2)) {
                brandMap.set(brand2, new Set())
            }
            brandMap.get(brand1)!.add(brand2)
            brandMap.get(brand2)!.add(brand1)
        })
    })

    // Convert the flat map to an object for easier usage
    const flatMapObject: Record<string, string[]> = {}

    brandMap.forEach((relatedBrands, brand) => {
        flatMapObject[brand] = Array.from(relatedBrands)
    })

    return flatMapObject
}

async function getPharmacyItems(countryCode: countryCodes, source: sources, versionKey: string, mustExist = true) {
    const finalProducts = items

    return finalProducts
}

function normalizeTitle(title: string): string {
    // Normalize the title
    return title.replace(/Babē/gi, "Babe").toLowerCase()
}

function checkBrandInTitle(title: string, brand: string): boolean {
    const normalizedTitle = normalizeTitle(title)
    const normalizedBrand = brand.toLowerCase()
    
    // Handle case-sensitive brands
    if (CASE_SENSITIVE_BRANDS.includes(normalizedBrand)) {
        // For HAPPY, check if it appears in uppercase in the original title
        const upperBrand = brand.toUpperCase()
        const escapedBrand = upperBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = new RegExp(`\\b${escapedBrand}\\b`)
        return regex.test(title)
    }
    
    const escapedBrand = normalizedBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escapedBrand}\\b`, "i")
    return regex.test(normalizedTitle)
}

function getCanonicalBrand(brand: string, brandMapping: BrandsMapping): string {
    const normalizedBrand = brand.toLowerCase()
    
    // Find all brands in the same group
    const brandGroup = new Set<string>()
    
    // First, find the group this brand belongs to
    for (const canonical in brandMapping) {
        const relatedBrands = brandMapping[canonical]
        if (canonical === normalizedBrand || relatedBrands.includes(normalizedBrand)) {
            // Add all brands in this group
            brandGroup.add(canonical)
            relatedBrands.forEach(b => brandGroup.add(b))
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

export function checkBrandIsSeparateTerm(input: string, brand: string): boolean {
    // First check if brand exists in title
    if (!checkBrandInTitle(input, brand)) {
        return false
    }
    
    // Then validate position requirements
    return validateBrandPosition(input, brand)
}

function validateBrandPosition(title: string, brand: string): boolean {
    const normalizedTitle = normalizeTitle(title)
    const normalizedBrand = brand.toLowerCase()
    const titleWords = normalizedTitle.split(/\s+/)
    
    // Check if brand should be ignored
    if (IGNORED_BRANDS.includes(normalizedBrand)) {
        return false
    }
    
    // Check position requirements
    if (PRIORITY_FRONT.includes(normalizedBrand)) {
        return titleWords[0] === normalizedBrand
    }
    
    if (PRIORITY_SECOND.includes(normalizedBrand)) {
        return titleWords[0] === normalizedBrand || titleWords[1] === normalizedBrand
    }
    
    return true // No specific position requirement
}

function prioritizeMatchedBrands(title: string, matchedBrands: string[]): string[] {
    if (matchedBrands.length <= 1) {
        return matchedBrands
    }
    
    const normalizedTitle = normalizeTitle(title)
    const titleWords = normalizedTitle.split(/\s+/)
    
    // Sort by priority: front position brands first, then others
    return matchedBrands.sort((a, b) => {
        const aNormalized = a.toLowerCase()
        const bNormalized = b.toLowerCase()
        
        const aIsFront = titleWords[0] === aNormalized
        const bIsFront = titleWords[0] === bNormalized
        
        if (aIsFront && !bIsFront) return -1
        if (!aIsFront && bIsFront) return 1
        
        // If both or neither are at front, maintain original order
        return 0
    })
}

export async function assignBrandIfKnown(countryCode: countryCodes, source: sources, job?: Job) {
    // const context = { scope: "assignBrandIfKnown" } as ContextType

    const brandsMapping = await getBrandsMapping()

    const versionKey = "assignBrandIfKnown"
    let products = await getPharmacyItems(countryCode, source, versionKey, false)
    let counter = 0
    
    for (let product of products) {
        counter++

        if (product.m_id) {
            // Already exists in the mapping table, probably no need to update
            continue
        }

        let matchedBrands: string[] = []
        
        // First, collect all matching brands from the mapping
        for (const brandKey in brandsMapping) {
            const relatedBrands = [brandKey, ...brandsMapping[brandKey]]
            
            for (const brand of relatedBrands) {
                const normalizedBrand = brand.toLowerCase()
                
                // Skip if already matched or ignored
                if (matchedBrands.some(mb => mb.toLowerCase() === normalizedBrand)) {
                    continue
                }
                
                const isBrandMatch = checkBrandIsSeparateTerm(product.title, brand)
                if (isBrandMatch) {
                    matchedBrands.push(brand)
                }
            }
        }
        
        // Remove duplicates and prioritize matched brands
        matchedBrands = _.uniq(matchedBrands)
        matchedBrands = prioritizeMatchedBrands(product.title, matchedBrands)
        
        // Get canonical brand (ensure consistent assignment across related brands)
        const finalBrand = matchedBrands.length > 0 
            ? getCanonicalBrand(matchedBrands[0], brandsMapping)
            : null

        console.log(`${product.title} -> ${matchedBrands} -> canonical: ${finalBrand}`)
        
        const sourceId = product.source_id
        const meta = { 
            matchedBrands: matchedBrands,
            canonicalBrand: finalBrand
        }

        const key = `${source}_${countryCode}_${sourceId}`
        const uuid = stringToHash(key)

        // Brand assignment with canonical brand ensures deduplication
        // TODO: Insert into database with finalBrand instead of matchedBrands[0]
    }
}
